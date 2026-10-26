import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function clearSession(res) {
  res.clearCookie('securetrack_session', {
    httpOnly: true,
    secure:
      process.env.COOKIE_SECURE === 'true' ||
      (process.env.NODE_ENV === 'production' &&
        process.env.COOKIE_SECURE !== 'false'),
    sameSite: (process.env.COOKIE_SAME_SITE ||
      (process.env.NODE_ENV === 'production' ? 'none' : 'lax')).toLowerCase(),
    path: '/',
  });
}

async function resolveUser(req) {
  const token = req.cookies?.securetrack_session;

  if (!token) return null;

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Authentication is not configured');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'securetrack',
  });

  const user = await User.findById(decoded.sub).select('-password');

  return user?.isActive ? user : null;
}

// For endpoints that require a session. Never expose token or verification details.
export async function protect(req, res, next) {
  try {
    const user = await resolveUser(req);

    if (!user) {
      clearSession(res);

      return res.status(401).json({
        success: false,
        message: 'Please sign in to continue',
      });
    }

    req.user = user;
    return next();
  } catch {
    clearSession(res);

    return res.status(401).json({
      success: false,
      message: 'Your session is invalid or has expired',
    });
  }
}

// Session introspection is intentionally optional: a signed-out visitor receives
// { user: null } instead of a noisy 401 during the initial app boot.
export async function optionalAuth(req, res, next) {
  try {
    req.user = await resolveUser(req);

    if (req.cookies?.securetrack_session && !req.user) {
      clearSession(res);
    }

    return next();
  } catch {
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
    message: 'Administrator access required',
  });
}