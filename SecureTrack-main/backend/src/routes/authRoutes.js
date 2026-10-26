import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler.js';
import { optionalAuth, protect } from '../middleware/auth.js';
import { register, login, logout, me, updateProfile, updatePassword } from '../controllers/authController.js';

const router = Router();
const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Please try again later.' },
});
const registrationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
router.post('/register', registrationLimiter, asyncHandler(register));
router.post('/login', signInLimiter, asyncHandler(login));
router.post('/logout', logout);
router.get('/me', optionalAuth, me);
router.patch('/profile', protect, asyncHandler(updateProfile));
router.patch('/password', protect, asyncHandler(updatePassword));
export default router;
