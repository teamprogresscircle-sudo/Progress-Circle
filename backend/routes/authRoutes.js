const express = require('express');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

router.get('/me', protect, getMe);

module.exports = router;
