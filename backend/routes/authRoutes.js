const express = require('express');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { register, login, getMe, verifyEmail, resendVerificationCode } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/verify', verifyEmail);
router.post('/resend-code', resendVerificationCode);
router.post('/login', loginValidation, login);

router.get('/me', protect, getMe);

module.exports = router;
