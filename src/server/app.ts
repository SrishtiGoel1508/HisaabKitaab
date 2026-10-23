import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { prisma } from './utils/prisma.js';
import { categoryRepository } from './repositories/categoryRepository.js';
import { receiptRoutes } from './routes/receiptRoutes.js';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { categoryRoutes } from './routes/categoryRoutes.js';
import { exportRoutes } from './routes/exportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Security and CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // In development or when origin matches, allow
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Hisaab Kitaab API',
    model: config.geminiModel,
  });
});

// Mount versioned REST API routes under /api/v1
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/export', exportRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Serve frontend in production
const clientBuildPath = path.resolve(__dirname, '../../dist/client');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

/**
 * Initializes the demo business and seed categories if they don't already exist.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const business = await prisma.business.upsert({
      where: { id: config.demoBusinessId },
      update: { name: config.demoBusinessName },
      create: {
        id: config.demoBusinessId,
        name: config.demoBusinessName,
        currencyCode: 'INR',
      },
    });

    await categoryRepository.seedDefaultCategories(business.id);
    console.log(`Initialized database with business: ${business.name} (${business.id})`);
  } catch (err) {
    console.error('Failed to initialize business in database:', err);
  }
}

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase().then(() => {
    app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(` Hisaab Kitaab Backend Server Running          `);
      console.log(` Port: ${config.port}                          `);
      console.log(` API Base: http://localhost:${config.port}/api/v1 `);
      console.log(` Environment: ${config.nodeEnv}                `);
      console.log(`===============================================`);
    });
  });
}
