// authRoutes.js
const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authmiddleware');

const router = express.Router();

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Verify email
router.get('/verify-email', authController.verifyEmail);

// Resend verification
router.post('/resend-verification', authController.resendVerification);

// Get profile (protected route)
router.get('/profile', authMiddleware, authController.getProfile);

// Get user (protected route)
router.get('/me', authMiddleware, authController.getCurrentUser);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
  authController.googleSuccess
);

router.get('/google/failure', authController.googleFailure);

module.exports = router;