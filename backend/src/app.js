
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
import {
  notFound,
  errorHandler,
} from './middleware/errors.js';

const app = express();

app.disable('x-powered-by');

/**
 * Reverse proxy configuration.
 *
 * For Render, set TRUST_PROXY=true.
 * For local development, leave it false.
 */
app.set(
  'trust proxy',
  process.env.TRUST_PROXY === 'true' ? 1 : false
);

/**
 * Normalize frontend origins.
 */
function normalizeOrigin(value) {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)
);

/**
 * Request metadata.
 */
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();

  res.setHeader(
    'X-Request-Id',
    req.requestId
  );

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  next();
});

/**
 * Security headers.
 */
app.use(helmet());

/**
 * Explicit CORS origin validation.
 */
app.use((req, res, next) => {
  const origin = req.get('origin');

  // Requests without Origin are generally server-to-server
  // or same-origin non-CORS requests.
  if (!origin) {
    return next();
  }

  const normalized = normalizeOrigin(origin);

  if (!normalized || !allowedOrigins.has(normalized)) {
    console.warn(
      `[CORS BLOCKED] ${origin} ${req.method} ${req.path}`
    );

    return res.status(403).json({
      success: false,
      message: 'This frontend origin is not allowed.',
      requestId: req.requestId,
    });
  }

  next();
});

/**
 * CORS configuration.
 */
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, false);
      }

      const normalized = normalizeOrigin(origin);

      return callback(
        null,
        Boolean(normalized && allowedOrigins.has(normalized))
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],

    optionsSuccessStatus: 204,
  })
);

/**
 * Body parsing.
 */
app.use(
  express.json({
    limit: '100kb',
    strict: true,
  })
);

app.use(express.urlencoded({
  extended: false,
  limit: '100kb',
}));

app.use(cookieParser());

/**
 * Liveness endpoint.
 * Checks whether the server process is running.
 */
app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'ok',
    service: 'SecureTrack API',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

/**
 * Readiness endpoint.
 * Checks MongoDB connectivity.
 */
app.get('/ready', (req, res) => {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  return res.status(
    databaseConnected ? 200 : 503
  ).json({
    success: databaseConnected,
    status: databaseConnected
      ? 'ready'
      : 'database_unavailable',

    database: databaseConnected
      ? 'connected'
      : 'disconnected',

    requestId: req.requestId,
  });
});

/**
 * API information.
 */
app.get('/api/v1/status', (req, res) => {
  return res.json({
    success: true,
    name: 'SecureTrack',
    version: '1.0.0',
    api: '/api/v1',
    status: 'operational',
  });
});

/**
 * Authentication rate limiter.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication requests. Please retry later.',
      requestId: req.requestId,
    });
  },
});

/**
 * AI rate limiter.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      code: 'AI_RATE_LIMIT',
      message: 'AI request limit reached. Please retry shortly.',
      requestId: req.requestId,
    });
  },
});

/**
 * General API rate limiter.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'API request limit reached. Please retry shortly.',
      requestId: req.requestId,
    });
  },
});

/**
 * Authentication routes.
 *
 * /api/v1/auth/login
 * /api/v1/auth/register
 * /api/v1/auth/logout
 * /api/v1/auth/me
 */
app.use(
  '/api/v1/auth',
  authLimiter,
  authRoutes
);

/**
 * AI routes.
 */
app.use(
  '/api/v1/ai',
  aiLimiter,
  protect,
  aiRoutes
);

/**
 * Protected application resources.
 */
app.use(
  '/api/v1',
  protect,
  apiLimiter,
  resourceRoutes
);

/**
 * OpenAPI documentation.
 */
const openapi = {
  openapi: '3.0.3',

  info: {
    title: 'SecureTrack API',
    version: '1.1.0',
    description:
      'Website Security Posture Monitoring API',
  },

  servers: [
    {
      url: '/api/v1',
    },
  ],

  paths: {
    '/auth/login': {
      post: {
        summary: 'Sign in',
        responses: {
          200: { description: 'Session created' },
          401: { description: 'Invalid credentials' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },

    '/websites': {
      get: {
        summary: 'List websites',
        responses: {
          200: { description: 'Website list' },
        },
      },

      post: {
        summary: 'Create website',
        responses: {
          201: { description: 'Website created' },
        },
      },
    },

    '/scans': {
      get: {
        summary: 'List scans',
        responses: {
          200: { description: 'Scan list' },
        },
      },

      post: {
        summary: 'Create scan',
        responses: {
          202: { description: 'Scan accepted' },
        },
      },
    },

    '/dashboard/summary': {
      get: {
        summary: 'Dashboard metrics',
        responses: {
          200: { description: 'Dashboard summary' },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'securetrack_session',
      },
    },
  },

  security: [
    {
      cookieAuth: [],
    },
  ],
};

app.get('/openapi.json', (req, res) => {
  return res.json(openapi);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi)
);

/**
 * Production frontend static files.
 */
const publicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public'
);

app.use(
  express.static(publicDir, {
    index: false,
    maxAge:
      process.env.NODE_ENV === 'production'
        ? '1h'
        : 0,
  })
);

/**
 * SPA fallback.
 */
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api/') ||
    req.path === '/health' ||
    req.path === '/ready' ||
    req.path === '/openapi.json' ||
    req.path.startsWith('/api-docs')
  ) {
    return next();
  }

  return res.sendFile(
    path.join(publicDir, 'index.html'),
    (error) => {
      if (error) next();
    }
  );
});

/**
 * 404 handler.
 */
app.use(notFound);

/**
 * Global error handler.
 */
app.use(errorHandler);

export default app;
