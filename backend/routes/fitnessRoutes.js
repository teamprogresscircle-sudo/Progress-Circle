const express = require('express');
const { setupCycle, getCycle, getCycleHistory, logDailyFitness, addBodyMetric, getBodyMetrics, deleteFitnessLog, deleteBodyMetric } = require('../controllers/fitnessController');
const { protect } = require('../middleware/auth');
const { requirePremium } = require('../middleware/premiumMiddleware');

const router = express.Router();

router.use(protect); // Temporarily enabled for all users to verify Apex Elite V2 redesign

router.route('/cycle').get(getCycle).post(setupCycle);
router.route('/cycle/history').get(getCycleHistory);
router.route('/log').post(logDailyFitness);
router.route('/log/:logId').delete(deleteFitnessLog);
router.route('/metrics').get(getBodyMetrics).post(addBodyMetric);
router.route('/metrics/:id').delete(deleteBodyMetric);

module.exports = router;
