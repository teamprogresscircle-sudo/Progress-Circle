const express = require('express');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../controllers/adminController');
const {
    createPromoCode,
    getPromoCodes,
    updatePromoCode,
    deletePromoCode
} = require('../controllers/promoCodeController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Require admin for all promo code management routes
router.use(requireAdmin);

router.route('/')
    .get(getPromoCodes)
    .post(createPromoCode);

router.route('/:id')
    .put(updatePromoCode)
    .delete(deletePromoCode);

module.exports = router;
