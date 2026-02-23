/**
 * Backend API Server — Thin orchestrator
 * Route logic lives in routes/, middleware in middleware/, shared code in lib/
 */

import './env.js';
import express from 'express';
import cors from 'cors';

// Middleware
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';

// Route modules
import convertRoutes from './routes/convert.js';
import jobRoutes from './routes/jobs.js';
import aiRoutes from './routes/ai.js';
import billingRoutes from './routes/billing.js';
import templateRoutes from './routes/templates.js';
import templateVersionRoutes from './routes/template-versions.js';
import pressPackRoutes from './routes/press-packs.js';
import releaseRoutes from './routes/releases.js';
import importRoutes from './routes/import.js';
import metricsRoutes from './routes/metrics.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS ---
const ALLOWED_ORIGINS = [
  'https://carbonac.com',
  'https://www.carbonac.com',
  /--carbonac\.netlify\.app$/,
];
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push(/^http:\/\/localhost(:\d+)?$/);
}
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = ALLOWED_ORIGINS.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin,
      );
      cb(null, allowed ? origin : false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400,
  }),
);

// --- Body parsing ---
app.use(express.json({ limit: '5mb' }));

// --- Request ID + metrics logging ---
app.use(requestIdMiddleware);

// --- Route mounting ---
app.use('/api/convert', convertRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/template-versions', templateVersionRoutes);
app.use('/api/press-packs', pressPackRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/import', importRoutes);
app.use('/api', metricsRoutes);

// --- Error handler ---
app.use(errorHandler);

// --- Start ---
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

process.on('unhandledRejection', (reason) => {
  console.error(
    JSON.stringify({
      event: 'unhandled_rejection',
      message: reason?.message || String(reason),
      stack: reason?.stack || null,
    })
  );
});

process.on('uncaughtException', (error) => {
  console.error(
    JSON.stringify({
      event: 'uncaught_exception',
      message: error.message,
      stack: error.stack,
    })
  );
  process.exit(1);
});

export default app;
