import { ZodError } from 'zod';

export function notFound(req, res) {
  return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof ZodError || err?.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Please check the submitted data',
      errors: (err.issues || []).map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: Object.values(err.errors).map((e) => e.message) });
  }
  if (err?.code === 11000) return res.status(409).json({ success: false, message: 'A record with these details already exists' });
  if (err?.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid resource identifier' });
  if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongooseServerSelectionError') {
    return res.status(503).json({ success: false, message: 'Database is temporarily unavailable' });
  }
  const status = Number(err?.statusCode || err?.status || 500);
  if (status >= 500) console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  const body = {
    success: false,
    message: status >= 500 ? 'An unexpected server error occurred' : (err.message || 'Request failed'),
  };
  if (typeof err?.code === 'string' && err.code.startsWith('AI_')) body.code = err.code;
  if (typeof err?.providerCode === 'string') body.providerCode = err.providerCode;
  if (typeof err?.retryAfter === 'string') body.retryAfter = err.retryAfter;
  if (req.requestId) body.requestId = req.requestId;
  return res.status(status).json(body);
}
