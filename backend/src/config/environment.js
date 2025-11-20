import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  psnApiBase: process.env.PSN_API_BASE || 'https://psn-api.achievements.app/api',
  openaiApiBase: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
  psnNpssoToken: process.env.PSN_NPSSO_TOKEN || "IIP9qft9FIBWhMcwy8dKTBQCTwPFXUsNTrHxhoMn92FAWbYKxHhrtsy6XlRNj92G",
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  isVercel: process.env.VERCEL === '1'
};
