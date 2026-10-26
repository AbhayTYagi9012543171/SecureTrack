
const isTrue = (value) => value === 'true';

export function validateEnvironment(env = process.env) {
  const errors = [];

  if (!env.MONGODB_URI) {
    errors.push('MONGODB_URI is required.');
  }

  if (
    !env.JWT_SECRET ||
    env.JWT_SECRET.length < 32 ||
    /replace|change-me|example/i.test(env.JWT_SECRET)
  ) {
    errors.push(
      'JWT_SECRET must be a unique secret with at least 32 characters.'
    );
  }

  if (
    env.COOKIE_SAME_SITE &&
    !['lax', 'strict', 'none'].includes(
      env.COOKIE_SAME_SITE.toLowerCase()
    )
  ) {
    errors.push(
      'COOKIE_SAME_SITE must be lax, strict or none.'
    );
  }

  if (env.NODE_ENV === 'production') {
    if (!isTrue(env.COOKIE_SECURE)) {
      errors.push(
        'COOKIE_SECURE=true is required in production.'
      );
    }

    if (!env.CLIENT_URL) {
      errors.push(
        'CLIENT_URL is required in production.'
      );
    }

    const origins = (env.CLIENT_URL || '')
      .split(',')
      .map((value) => value.trim());

    for (const origin of origins) {
      try {
        const parsed = new URL(origin);

        if (parsed.protocol !== 'https:') {
          errors.push(
            `Production frontend origin must use HTTPS: ${origin}`
          );
        }
      } catch {
        errors.push(
          `Invalid CLIENT_URL origin: ${origin}`
        );
      }
    }

    if (
      env.COOKIE_SAME_SITE?.toLowerCase() === 'none' &&
      !isTrue(env.COOKIE_SECURE)
    ) {
      errors.push(
        'SameSite=None requires COOKIE_SECURE=true.'
      );
    }
  }

  if (errors.length > 0) {
    const error = new Error(
      `Invalid environment configuration:\n${errors
        .map((item) => `- ${item}`)
        .join('\n')}`
    );

    error.code = 'INVALID_ENVIRONMENT';

    throw error;
  }

  return true;
}
