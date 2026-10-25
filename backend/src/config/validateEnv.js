const truthy = (value) => value === 'true';

/** Fail fast on unsafe or incomplete production configuration. */
export function validateEnvironment(env = process.env) {
  const errors = [];
  if (!env.MONGODB_URI) errors.push('MONGODB_URI is required');
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || /replace|change-me|example/i.test(env.JWT_SECRET)) {
    errors.push('JWT_SECRET must be a unique random secret with at least 32 characters');
  }
  if (env.NODE_ENV === 'production') {
    if (!truthy(env.COOKIE_SECURE)) errors.push('COOKIE_SECURE=true is required in production');
    if (!env.CLIENT_URL || env.CLIENT_URL.includes('localhost')) errors.push('CLIENT_URL must contain the deployed frontend origin in production');
    if (env.COOKIE_SAME_SITE === 'none' && !truthy(env.COOKIE_SECURE)) errors.push('SameSite=None cookies require COOKIE_SECURE=true');
  }
  if (errors.length) {
    const error = new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
    error.code = 'INVALID_ENVIRONMENT';
    throw error;
  }
  return true;
}
