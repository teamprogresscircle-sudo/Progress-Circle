const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');

const {
    createOrder,
    handleWebhook,
    verifyPayment,
    getStatus,
    cancelSubscription,
    getPublicPricing,
} = require('../controllers/subscriptionController');

// Anti-fraud: strict rate limit on payment creation
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many payment requests. Please wait 15 minutes and try again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// PayMob webhook — no auth (PayMob calls this), HMAC verified inside controller
router.post('/webhook', handleWebhook);

// Public pricing — no auth needed
router.get('/pricing', getPublicPricing);

// Authenticated routes
router.use(protect);

router.post('/create-order', paymentLimiter, createOrder);
router.get('/verify/:orderId', verifyPayment);
router.get('/status', getStatus);
router.post('/cancel', cancelSubscription);

module.exports = router;
