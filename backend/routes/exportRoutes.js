const express = require('express');
const { exportPDF, exportCSV, exportJSON } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');
const { requirePremium } = require('../middleware/premiumMiddleware');

const router = express.Router();

// Route requires authentication and premium plan
router.get('/pdf', protect, requirePremium, exportPDF);
router.get('/csv', protect, requirePremium, exportCSV);
router.get('/json', protect, requirePremium, exportJSON);

router.get('/pdf', exportPDF);

module.exports = router;
