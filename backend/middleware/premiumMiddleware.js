/**
 * premiumMiddleware.js
 * Protects routes that require an active Premium subscription.
 * Checks plan === 'premium' AND subscription.currentPeriodEnd is in the future.
 */

const requirePremium = async (req, res, next) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    let isPremium = user.isAdmin || user.plan === 'premium';

    // Verify expiration if they are premium
    if (isPremium && !user.isAdmin) {
        const periodEnd = user.subscription?.currentPeriodEnd;
        if (periodEnd && new Date(periodEnd) < new Date()) {
            isPremium = false;
            user.plan = 'free';
            if (user.subscription) user.subscription.status = 'expired';
            await user.save();
        } else if (!periodEnd && user.plan === 'premium') {
            // Fix existing bug where premium was granted but no expiration saved
            user.subscription = { status: 'active', currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000) };
            await user.save();
        }
    }

    if (!isPremium) {
        return res.status(403).json({
            success: false,
            message: 'This feature requires a Premium subscription.',
            upgradeUrl: '/pricing',
        });
    }

    next();
};

module.exports = { requirePremium };
