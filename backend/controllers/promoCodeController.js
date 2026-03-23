const PromoCode = require('../models/PromoCode');
const User = require('../models/User');

// --- ADMIN ROUTES ---

// @desc    Create a new promo code
// @route   POST /api/promocodes
// @access  Admin
exports.createPromoCode = async (req, res, next) => {
    try {
        const { code, rewardType, rewardValue, maxUses, expiresAt } = req.body;

        const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            return res.status(400).json({ success: false, message: 'Promo code already exists' });
        }

        const promoCode = await PromoCode.create({
            code: code.toUpperCase(),
            rewardType,
            rewardValue,
            maxUses: maxUses || Infinity,
            expiresAt: expiresAt || null,
        });

        res.status(201).json({ success: true, data: promoCode });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all promo codes
// @route   GET /api/promocodes
// @access  Admin
exports.getPromoCodes = async (req, res, next) => {
    try {
        const promoCodes = await PromoCode.find().sort('-createdAt');
        res.status(200).json({ success: true, data: promoCodes });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a promo code (e.g., toggle active status)
// @route   PUT /api/promocodes/:id
// @access  Admin
exports.updatePromoCode = async (req, res, next) => {
    try {
        const promoCode = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!promoCode) {
            return res.status(404).json({ success: false, message: 'Promo code not found' });
        }

        res.status(200).json({ success: true, data: promoCode });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a promo code
// @route   DELETE /api/promocodes/:id
// @access  Admin
exports.deletePromoCode = async (req, res, next) => {
    try {
        const promoCode = await PromoCode.findByIdAndDelete(req.params.id);

        if (!promoCode) {
            return res.status(404).json({ success: false, message: 'Promo code not found' });
        }

        res.status(200).json({ success: true, message: 'Promo code deleted' });
    } catch (error) {
        next(error);
    }
};

// --- USER ROUTES ---

// @desc    Redeem a promo code
// @route   POST /api/users/redeem-promo
// @access  Private
exports.redeemPromoCode = async (req, res, next) => {
    try {
        const { code } = req.body;
        const user = req.user;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Please provide a promo code' });
        }

        const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promoCode) {
            return res.status(404).json({ success: false, message: 'Invalid promo code' });
        }

        if (!promoCode.isActive) {
            return res.status(400).json({ success: false, message: 'Promo code is inactive' });
        }

        if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
            return res.status(400).json({ success: false, message: 'Promo code has expired' });
        }

        if (promoCode.usedCount >= promoCode.maxUses) {
            return res.status(400).json({ success: false, message: 'Promo code usage limit reached' });
        }

        // Check if user already redeemed this code
        if (user.redeemedPromoCodes && user.redeemedPromoCodes.includes(promoCode.code)) {
            return res.status(400).json({ success: false, message: 'You have already redeemed this promo code' });
        }

        // Build the DB update object based on reward type
        let dbUpdate = { $push: { redeemedPromoCodes: promoCode.code } };
        let rewardMessage = '';

        if (promoCode.rewardType === 'premium_days') {
            const daysToAdd = promoCode.rewardValue;
            let currentEnd = user.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd) : new Date();
            if (currentEnd < new Date()) currentEnd = new Date();
            currentEnd.setDate(currentEnd.getDate() + daysToAdd);

            dbUpdate.$set = {
                plan: 'premium',
                'subscription.status': 'active',
                'subscription.currentPeriodEnd': currentEnd,
            };
            rewardMessage = `${daysToAdd} days of Premium access added!`;

        } else if (promoCode.rewardType === 'points') {
            // Use $inc so encrypted fields are NOT touched
            dbUpdate.$inc = { points: promoCode.rewardValue };
            rewardMessage = `${promoCode.rewardValue} Neural XP added!`;

        } else if (promoCode.rewardType === 'cash') {
            // Override the next subscription payment price (in cents)
            const overrideCents = promoCode.rewardValue * 100; // e.g. 30 → 3000 cents
            dbUpdate.$set = { subscriptionPriceOverrideCents: overrideCents };
            rewardMessage = `Your next subscription payment is now ${promoCode.rewardValue} EGP!`;
        }

        // Apply reward and mark code as redeemed atomically
        const updatedUser = await User.findByIdAndUpdate(user._id, dbUpdate, { new: true });

        // Increment usage count on the promo code
        await PromoCode.findByIdAndUpdate(promoCode._id, { $inc: { usedCount: 1 } });

        res.status(200).json({ 
            success: true, 
            message: `Promo code applied successfully. ${rewardMessage}`,
            user: {
                plan: updatedUser.plan,
                points: updatedUser.points,
                subscription: updatedUser.subscription,
                subscriptionPriceOverrideCents: updatedUser.subscriptionPriceOverrideCents,
            }
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Remove an applied promo code (e.g., clear price override)
// @route   DELETE /api/users/remove-promo
// @access  Private
exports.removePromoCode = async (req, res, next) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, 
            { $unset: { subscriptionPriceOverrideCents: 1 } }, 
            { new: true }
        );

        res.status(200).json({ 
            success: true, 
            message: 'Promo code removed.',
            user: {
                subscriptionPriceOverrideCents: null
            }
        });
    } catch (error) {
        next(error);
    }
};
