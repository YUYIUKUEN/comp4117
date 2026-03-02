const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  login,
  logout,
  refresh,
  requestPasswordReset,
  resetPassword,
  register,
  getMe,
} = require('../controllers/authController');

const router = express.Router();

router.get('/me', authenticate, getMe);
router.post('/login', login);
router.post('/register', register);
router.post('/logout', authenticate, logout);
router.post('/refresh', authenticate, refresh);
router.post('/password-reset-request', requestPasswordReset);
router.post('/forgot-password', requestPasswordReset);
router.post('/password-reset', authenticate, resetPassword);

module.exports = router;
