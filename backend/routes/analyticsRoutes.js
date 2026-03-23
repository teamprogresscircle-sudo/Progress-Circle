const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../controllers/adminController');
const User = require('../models/User');
const PaymentLog = require('../models/PaymentLog');

router.use(protect, requireAdmin);


// GET /api/admin/analytics/subscriptions
// Returns: total premium users, MRR, yearly revenue, churn rate, plan breakdown
router.get('/subscriptions', async (req, res) => {
    try {
        const now = new Date();

        const [totalUsers, premiumUsers, cancelledUsers, expiredUsers] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ plan: 'premium', 'subscription.status': 'active', 'subscription.currentPeriodEnd': { $gt: now } }),
            User.countDocuments({ 'subscription.status': 'cancelled' }),
            User.countDocuments({ 'subscription.status': 'expired' }),
        ]);

        const freeUsers = totalUsers - premiumUsers;

        // MRR calculation from PaymentLog (last 30 days successful payments)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentPayments = await PaymentLog.find({
            status: 'success',
            createdAt: { $gt: thirtyDaysAgo },
        });

        const mrrCents = recentPayments.reduce((sum, p) => {
            // Normalize yearly to monthly for MRR
            if (p.billingCycle === 'yearly') return sum + Math.round(p.amount / 12);
            return sum + p.amount;
        }, 0);

        // Billing cycle breakdown for active premium users
        const monthlyCount = await User.countDocuments({ plan: 'premium', 'subscription.billingCycle': 'monthly', 'subscription.status': 'active' });
        const yearlyCount = await User.countDocuments({ plan: 'premium', 'subscription.billingCycle': 'yearly', 'subscription.status': 'active' });

        res.json({
            success: true,
            data: {
                totalUsers,
                premiumUsers,
                freeUsers,
                cancelledUsers,
                expiredUsers,
                mrrEGP: (mrrCents / 100).toFixed(2),
                planBreakdown: { monthly: monthlyCount, yearly: yearlyCount },
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/admin/analytics/payments?limit=50&status=success
// Returns paginated payment log
router.get('/payments', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const page = parseInt(req.query.page) || 1;
        const statusFilter = req.query.status ? { status: req.query.status } : {};

        const [logs, total] = await Promise.all([
            PaymentLog.find(statusFilter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('userId', 'name email plan'),
            PaymentLog.countDocuments(statusFilter),
        ]);

        res.json({ success: true, total, page, limit, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
