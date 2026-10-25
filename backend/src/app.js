import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resources.js';
import aiRoutes from './routes/aiRoutes.js';
import { protect } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
app.disable('x-powered-by');
// Only enable this when the deployment topology has exactly one trusted proxy.
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb', strict: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ success: false, message: 'Origin not allowed', requestId: req.requestId });
    }
  }
  return next();
});

// Liveness says the process is running; readiness also checks MongoDB connectivity.
app.get('/health', (req, res) => res.json({ success: true, status: 'ok', requestId: req.requestId }));
app.get('/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? 'ready' : 'database_unavailable',
    requestId: req.requestId,
  });
});

app.use('/api/v1/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: 'Too many authentication requests. Please retry later.', requestId: req.requestId }),
}), authRoutes);
app.use('/api/v1/ai', rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, code: 'AI_RATE_LIMIT', message: 'AI request limit reached. Please retry shortly.', requestId: req.requestId }),
}), protect, aiRoutes);

app.use('/api/v1', protect, rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: 'API request limit reached. Please retry shortly.', requestId: req.requestId }),
}), resourceRoutes);

const openapi = {
  openapi: '3.0.3',
  info: { title: 'SecureTrack API', version: '1.1.0', description: 'Website security posture monitoring API' },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/auth/login': { post: { summary: 'Sign in', responses: { 200: { description: 'Session created' }, 401: { description: 'Invalid credentials' }, 429: { description: 'Rate limit exceeded' } } } },
    '/websites': { get: { summary: 'List owned websites', responses: { 200: { description: 'Website list' } } }, post: { summary: 'Create a website', responses: { 201: { description: 'Website created' } } } },
    '/scans': { get: { summary: 'List scans', responses: { 200: { description: 'Scan list' } } }, post: { summary: 'Queue a passive scan', responses: { 202: { description: 'Scan accepted' } } } },
    '/ai/chat': { post: { summary: 'Ask SecureTrack AI using account-scoped monitoring records', responses: { 200: { description: 'AI response with source references' }, 429: { description: 'AI request limit exceeded' }, 503: { description: 'AI provider is not configured' } } } },
    '/dashboard/summary': { get: { summary: 'Get account-scoped dashboard metrics', responses: { 200: { description: 'Dashboard summary' } } } },
  },
  components: { securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'securetrack_session' } } },
  security: [{ cookieAuth: [] }],
};
app.get('/openapi.json', (req, res) => res.json(openapi));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

// The production container serves the built SPA from backend/public. In local
// development this directory is absent, so Vite remains the frontend server.
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
app.use(express.static(publicDir, { index: false, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health' || req.path === '/ready' || req.path === '/openapi.json' || req.path.startsWith('/api-docs')) return next();
  return res.sendFile(path.join(publicDir, 'index.html'), (error) => { if (error) next(); });
});
app.use(notFound);
app.use(errorHandler);
export default app;
