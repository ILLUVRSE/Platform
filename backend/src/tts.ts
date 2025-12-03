import axios from "axios";
import { config } from "./config";
import { putObject } from "./storage";

export async function generateAudioForJob(jobId: string, scriptObj: any): Promise<string> {
  // Build text: join title + all scene.description + scene.dialog (join arrays)
  const parts: string[] = [];
  if (scriptObj.title) parts.push(scriptObj.title);
  (scriptObj.scenes || []).forEach((s: any) => {
    if (s.description) parts.push(s.description);
    if (Array.isArray(s.dialog)) parts.push(...s.dialog);
  });
  const text = parts.join("\n\n").slice(0, 40000); // safe limit

  // If no API key, produce a mock silent audio buffer and store it
  if (!config.eleven.apiKey) {
    console.log(`[TTS] No ElevenLabs API key, using fallback silent audio for job ${jobId}`);
    // Minimal silent MP3 frame
    const silent = Buffer.from("//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", "base64");
    const key = `audio/${jobId}.mp3`;
    await putObject(key, silent);
    return key;
  }

  // Call ElevenLabs
  try {
    const url = `${config.eleven.host}/v1/text-to-speech/${config.eleven.voiceId}`;
    console.log(`[TTS] Calling ElevenLabs for job ${jobId} (${text.length} chars)`);
    const resp = await axios.post(url, {
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }, {
      headers: {
        "xi-api-key": config.eleven.apiKey,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer",
      timeout: 120000
    });

    const audioBuf = Buffer.from(resp.data);
    const key = `audio/${jobId}.mp3`;
    await putObject(key, audioBuf);
    console.log(`[TTS] Generated and stored audio at ${key}`);
    return key;
  } catch (err: any) {
    console.error(`[TTS] ElevenLabs call failed: ${err.message}`);
    if (err.response) {
      console.error(`[TTS] Response data:`, err.response.data?.toString());
    }

    // Fallback on error so we don't break the job
    console.log(`[TTS] Using fallback audio due to error.`);
    const silent = Buffer.from("//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", "base64");
    const key = `audio/${jobId}.mp3`;
    await putObject(key, silent);
    return key;
  }
}
