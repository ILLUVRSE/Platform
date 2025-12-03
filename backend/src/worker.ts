import { Worker, Job } from 'bullmq';
import { config } from './config';
import { generateScript } from "./ollama";
import { putJson, putObject, getObjectBuffer } from "./storage";
import { logForJob } from "./logging";
import { generateAudioForJob } from "./tts";
import fs from 'fs/promises';
import { execFileSync } from 'child_process';
import path from 'path';

interface GenerationJobData {
  prompt: string;
  title: string;
  style: string;
  voice: string;
  language: string;
  duration_target: number;
  produce_preview: boolean;
}

console.log('Starting StorySphere Worker...');

const tmpDir = '/tmp/storysphere';
async function ensureTmp() {
  try { await fs.mkdir(tmpDir, { recursive: true }); } catch {}
}

const worker = new Worker<GenerationJobData>(
  'generation-queue',
  async (job: Job) => {
    console.log(`[Job ${job.id}] Processing started: ${job.data.title}`);
    await job.updateProgress(0);

    await ensureTmp();

    try {
      // Step 1: Script Generation (Ollama)
      await logForJob(job.id!, "Step 1: Generating script with Ollama...");
      await job.updateProgress(5);
      const script = await generateScript(job.data.prompt);

      // Upload the script to MinIO for later retrieval
      const scriptKey = `scripts/${job.id}.json`;
      try {
        await putJson(scriptKey, script);
        await logForJob(job.id!, `Script uploaded to ${config.minio.bucket}/${scriptKey}`);
      } catch (e: any) {
        await logForJob(job.id!, `Warning: failed to upload script to MinIO: ${e?.message || e}`);
      }
      await job.updateProgress(15);

      // Step 2: TTS
      await logForJob(job.id!, "Step 2: Generating Audio...");
      await job.updateProgress(30);
      const audioKey = await generateAudioForJob(job.id!.toString(), script);
      await logForJob(job.id!, `Audio generated at ${audioKey}`);
      await job.updateProgress(50);

      // Download audio from MinIO to tmp
      const audioBuf = await getObjectBuffer(audioKey);
      const audioPath = path.join(tmpDir, `audio-${job.id}.mp3`);
      await fs.writeFile(audioPath, audioBuf);

      // Step 3: Visual Generation (simple local ffmpeg placeholder)
      await logForJob(job.id!, "Step 3: Generating visuals (local ffmpeg placeholder)...");
      await job.updateProgress(65);
      const duration = Math.max(1, Math.round(job.data.duration_target || 8));
      const videoPath = path.join(tmpDir, `video-${job.id}.mp4`);
      // Create a black video of requested duration
      execFileSync('ffmpeg', [
        '-y',
        '-f', 'lavfi',
        '-i', `color=size=1280x720:duration=${duration}:rate=25:color=black`,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        videoPath
      ], { stdio: 'ignore' });

      // Step 4: Assemble audio+video
      await logForJob(job.id!, "Step 4: Assembling media with ffmpeg...");
      await job.updateProgress(85);
      const previewPath = path.join(tmpDir, `preview-${job.id}.mp4`);
      execFileSync('ffmpeg', [
        '-y',
        '-i', videoPath,
        '-i', audioPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        previewPath
      ], { stdio: 'ignore' });

      // Upload preview to MinIO at key "<jobId>/preview.mp4"
      const previewKey = `${job.id}/preview.mp4`;
      const previewBuf = await fs.readFile(previewPath);
      await putObject(previewKey, previewBuf);
      await logForJob(job.id!, `Preview uploaded to ${config.minio.bucket}/${previewKey}`);
      await job.updateProgress(100);

      console.log(`[Job ${job.id}] Completed successfully.`);
      return {
        preview_url: `http://${config.minio.endPoint}:${config.minio.port}/${config.minio.bucket}/${job.id}/preview.mp4`,
        audio_url: `/api/v1/jobs/${job.id}/audio`,
        status: 'completed'
      };

    } catch (error: any) {
      console.error(`[Job ${job.id}] Failed:`, error);
      throw error;
    }
  },
  {
    connection: config.redis,
    concurrency: 2
  }
);

worker.on('completed', (job) => {
  console.log(`[Job ${job.id}] Finished!`);
});

worker.on('failed', (job, err) => {
  console.log(`[Job ${job?.id}] Failed with ${err?.message}`);
});

console.log('Worker is ready to accept jobs.');

