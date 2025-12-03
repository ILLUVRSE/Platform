import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'password',
    bucket: process.env.MINIO_BUCKET || 'storysphere-media',
  },
  db: {
    url: process.env.DATABASE_URL,
  },
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
  },
  comfyui: {
    host: process.env.COMFYUI_HOST || 'http://localhost:8188',
  },
  eleven: {
    apiKey: process.env.ELEVEN_API_KEY || "",
    voiceId: process.env.ELEVEN_VOICE_ID || "alloy",
    host: process.env.ELEVEN_HOST || "https://api.elevenlabs.io"
  }
};
