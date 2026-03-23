const express = require('express');
const { updateSavingsConfig, getTransactions, addTransaction, deleteTransaction } = require('../controllers/savingsController');
const { protect } = require('../middleware/auth');
const { requirePremium } = require('../middleware/premiumMiddleware');

const router = express.Router();

router.use(protect, requirePremium);

router.route('/config').put(updateSavingsConfig);
router.route('/').get(getTransactions).post(addTransaction);
router.route('/:id').delete(deleteTransaction);

module.exports = router;
