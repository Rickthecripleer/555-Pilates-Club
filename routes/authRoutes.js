const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register (público)
router.post('/register', authController.register);

// POST /api/auth/login (público)
router.post('/login', authController.login);

// POST /api/auth/forgot-password (público)
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password (público)
router.post('/reset-password', authController.resetPassword);

// GET /api/auth/me (requiere autenticación)
router.get('/me', authenticate, authController.getMe);

module.exports = router;

