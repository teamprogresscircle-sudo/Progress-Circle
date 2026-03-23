const express = require('express');
const router = express.Router();
const { resolveUrl } = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');

router.get('/resolve-url', protect, resolveUrl);

module.exports = router;
