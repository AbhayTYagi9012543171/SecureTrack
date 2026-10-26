
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_NAME = 'securetrack_session';

function sessionCookieOptions() {
  const production = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'lax' : 'lax',
    path: '/',
  };
}

export function clearSession(res) {
  res.clearCookie(COOKIE_NAME, sessionCookieOptions());
}

async function resolveUser(req) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) return null;

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is not configured correctly');
  }

  const decoded = jwt.verify(token, secret, {
    issuer: 'securetrack',
    audience: 'securetrack-web',
    algorithms: ['HS256'],
  });

  if (!decoded.sub) return null;

  const user = await User.findById(decoded.sub).select('-password');

  if (!user || !user.isActive) return null;

  return user;
}

export async function protect(req, res, next) {
  try {
    const user = await resolveUser(req);

    if (!user) {
      clearSession(res);

      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Please sign in to continue.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('[AUTH VERIFICATION FAILED]', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      reason: error.name || 'AuthenticationError',
    });

    clearSession(res);

    return res.status(401).json({
      success: false,
      code: 'INVALID_SESSION',
      message: 'Your session is invalid or has expired.',
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    req.user = await resolveUser(req);

    if (req.cookies?.[COOKIE_NAME] && !req.user) {
      clearSession(res);
    }

    return next();
  } catch (error) {
    console.warn('[OPTIONAL AUTH FAILED]', {
      requestId: req.requestId,
      reason: error.name || 'AuthenticationError',
    });

    clearSession(res);
    req.user = null;

    return next();
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Administrator access required.',
  });
}
