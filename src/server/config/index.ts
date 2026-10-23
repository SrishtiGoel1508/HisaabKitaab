import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appOrigin: process.env.APP_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR || './data/uploads'),
  demoBusinessId: process.env.DEMO_BUSINESS_ID || 'demo-kirana-store-001',
  demoBusinessName: process.env.DEMO_BUSINESS_NAME || 'Gupta Kirana & General Store',
};
