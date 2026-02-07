const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  login,
  logout,
  refresh,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/refresh', authenticate, refresh);
router.post('/password-reset-request', requestPasswordReset);
router.post('/password-reset', authenticate, resetPassword);

module.exports = router;
