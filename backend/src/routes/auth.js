const express = require('express');
const router = express.Router();
const {
  login, refresh, logout, me,
  forgotPassword, resetPassword, resetPasswordWithCode, changePassword,
  createUser, resendInvite, listUsers, updateUser,
} = require('../controllers/auth.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimit');

// Públicas (con rate limiting)
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/reset-password-with-code', passwordResetLimiter, resetPasswordWithCode);

// Autenticadas (cualquier rol)
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, changePassword);

// Admin — gestión de usuarios
router.get('/users', requireAuth, requireRole('admin'), listUsers);
router.post('/users', requireAuth, requireRole('admin'), createUser);
router.patch('/users/:id', requireAuth, requireRole('admin'), updateUser);
router.post('/users/:id/resend-invite', requireAuth, requireRole('admin'), resendInvite);

module.exports = router;
