
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { audit } from '../utils/audit.js';

const COOKIE_NAME = 'securetrack_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(100),
});

const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    preferences: z
      .object({
        theme: z.enum(['dark', 'light']).optional(),
        emailNotifications: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
  })
  .strict();

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  preferences: user.preferences,
});

/**
 * Cookie settings.
 *
 * Production default: SameSite=Lax.
 * This is recommended when the frontend and backend share
 * the same origin (for example, backend serves backend/public).
 *
 * If you intentionally use separate cross-site frontend/backend
 * domains, configure COOKIE_SAME_SITE=none and COOKIE_SECURE=true.
 */
function getCookieOptions(includeMaxAge = true) {
  const isProduction = process.env.NODE_ENV === 'production';

  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    (isProduction && process.env.COOKIE_SECURE !== 'false');

  const sameSite = (
    process.env.COOKIE_SAME_SITE ||
    (isProduction ? 'lax' : 'lax')
  ).toLowerCase();

  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };

  if (includeMaxAge) {
    options.maxAge = SESSION_MAX_AGE;
  }

  return options;
}

/**
 * Validate JWT configuration before creating a session.
 */
function validateJwtConfiguration() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    const error = new Error(
      'Authentication is not configured correctly. JWT_SECRET must contain at least 32 characters.'
    );

    error.statusCode = 500;
    throw error;
  }

  return secret;
}

/**
 * Create and attach an authenticated session cookie.
 */
function createSession(res, user) {
  const secret = validateJwtConfiguration();

  const token = jwt.sign(
    {
      sub: user._id.toString(),
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'securetrack',
      audience: 'securetrack-web',
      algorithm: 'HS256',
    }
  );

  res.cookie(COOKIE_NAME, token, getCookieOptions());

  return token;
}

/**
 * Register a new user.
 */
export async function register(req, res) {
  const input = registerSchema.parse(req.body);
  const email = input.email.toLowerCase();

  const existingUser = await User.exists({ email });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'An account with this email already exists.',
    });
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    name: input.name,
    email,
    password: hashedPassword,
  });

  createSession(res, user);

  await audit(req, 'auth.register', 'user', user._id, {}, user);

  return res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: {
      user: publicUser(user),
    },
  });
}

/**
 * Authenticate an existing user.
 */
export async function login(req, res) {
  const input = credentialsSchema.parse(req.body);
  const email = input.email.toLowerCase();

  const user = await User.findOne({ email }).select('+password');

  if (
    !user ||
    !user.isActive ||
    !user.password ||
    !(await bcrypt.compare(input.password, user.password))
  ) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
  }

  createSession(res, user);

  await audit(req, 'auth.login', 'user', user._id, {}, user);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      user: publicUser(user),
    },
  });
}

/**
 * Log out and clear the authentication cookie.
 *
 * Cookie clearing options must match the original cookie's
 * path, domain (if configured), secure and sameSite settings.
 */
export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, getCookieOptions(false));

  return res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
}

/**
 * Return the currently authenticated user.
 *
 * The auth middleware should set req.user.
 * If optionalAuth is used, an unauthenticated request returns user: null.
 */
export function me(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user ? publicUser(req.user) : null,
    },
  });
}

/**
 * Update the authenticated user's profile.
 */
export async function updateProfile(req, res) {
  const input = profileSchema.parse(req.body);

  if (input.name !== undefined) {
    req.user.name = input.name;
  }

  if (input.preferences?.theme !== undefined) {
    req.user.set('preferences.theme', input.preferences.theme);
  }

  if (input.preferences?.emailNotifications !== undefined) {
    req.user.set(
      'preferences.emailNotifications',
      input.preferences.emailNotifications
    );
  }

  await req.user.save();

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user: publicUser(req.user),
    },
  });
}

/**
 * Update the authenticated user's password.
 */
export async function updatePassword(req, res) {
  const input = passwordSchema.parse(req.body);

  const user = await User.findById(req.user._id).select('+password');

  if (!user || !user.password) {
    return res.status(404).json({
      success: false,
      code: 'USER_NOT_FOUND',
      message: 'User account could not be found.',
    });
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    input.currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      code: 'INCORRECT_CURRENT_PASSWORD',
      message: 'Current password is incorrect.',
    });
  }

  const isSamePassword = await bcrypt.compare(
    input.newPassword,
    user.password
  );

  if (isSamePassword) {
    return res.status(400).json({
      success: false,
      code: 'PASSWORD_UNCHANGED',
      message: 'Your new password must be different from your current password.',
    });
  }

  user.password = await bcrypt.hash(input.newPassword, 12);

  await user.save();

  await audit(req, 'auth.password.update', 'user', user._id, {}, user);

  return res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
  });
}
