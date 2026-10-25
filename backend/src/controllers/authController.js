import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { audit } from '../utils/audit.js';

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(100),
});

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  preferences: user.preferences,
});

const cookieOptions = () => ({
  httpOnly: true,
  secure:
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.NODE_ENV === 'production' &&
      process.env.COOKIE_SECURE !== 'false'),
  sameSite:
    process.env.COOKIE_SAME_SITE ||
    (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

function createSession(res, user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    const error = new Error(
      'Authentication is not configured. Set JWT_SECRET to at least 32 characters.'
    );
    error.statusCode = 500;
    throw error;
  }

  const token = jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'securetrack',
      audience: 'securetrack-web',
    }
  );

  res.cookie('securetrack_session', token, cookieOptions());
}

export async function register(req, res) {
  const input = registerSchema.parse(req.body);
  const email = input.email.toLowerCase();

  if (await User.exists({ email })) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists',
    });
  }

  const user = await User.create({
    name: input.name,
    email,
    password: await bcrypt.hash(input.password, 12),
  });

  createSession(res, user);

  await audit({ ...req, user }, 'auth.register', 'user', user._id);

  return res.status(201).json({
    success: true,
    data: { user: publicUser(user) },
  });
}

export async function login(req, res) {
  const input = credentialsSchema.parse(req.body);

  const user = await User.findOne({
    email: input.email.toLowerCase(),
  }).select('+password');

  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(input.password, user.password))
  ) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  createSession(res, user);

  await audit({ ...req, user }, 'auth.login', 'user', user._id);

  return res.json({
    success: true,
    data: { user: publicUser(user) },
  });
}

export function logout(req, res) {
  res.clearCookie('securetrack_session', {
    httpOnly: true,
    secure:
      process.env.COOKIE_SECURE === 'true' ||
      (process.env.NODE_ENV === 'production' &&
        process.env.COOKIE_SECURE !== 'false'),
    sameSite:
      process.env.COOKIE_SAME_SITE ||
      (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    path: '/',
  });

  return res.json({
    success: true,
    message: 'Signed out',
  });
}

export function me(req, res) {
  return res.json({
    success: true,
    data: { user: req.user ? publicUser(req.user) : null },
  });
}

export async function updateProfile(req, res) {
  const input = z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      preferences: z
        .object({
          theme: z.enum(['dark', 'light']).optional(),
          emailNotifications: z.boolean().optional(),
        })
        .optional(),
    })
    .strict()
    .parse(req.body);

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

  return res.json({
    success: true,
    data: { user: publicUser(req.user) },
  });
}

export async function updatePassword(req, res) {
  const input = z
    .object({
      currentPassword: z.string().min(1).max(128),
      newPassword: z.string().min(8).max(128),
    })
    .strict()
    .parse(req.body);

  const user = await User.findById(req.user._id).select('+password');

  if (
    !user ||
    !(await bcrypt.compare(input.currentPassword, user.password))
  ) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  user.password = await bcrypt.hash(input.newPassword, 12);
  await user.save();

  return res.json({
    success: true,
    message: 'Password updated successfully',
  });
}