const express = require('express');
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { redeemPromoCode, removePromoCode } = require('../controllers/promoCodeController');

const { updateProfileValidation } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // All user routes require auth

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);
router.post('/redeem-promo', redeemPromoCode);
router.delete('/remove-promo', removePromoCode);

module.exports = router;
