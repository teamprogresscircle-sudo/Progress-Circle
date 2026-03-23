const express = require('express');
const router = express.Router();
const { getAstraAnalysis } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All AI routes require authentication
router.use(protect);

// GET /api/ai/analyze - Generates personalized productivity analysis
router.get('/analyze', getAstraAnalysis);

module.exports = router;
