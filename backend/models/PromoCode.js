const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Promo code is required'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        rewardType: {
            type: String,
            required: [true, 'Reward type is required'],
            enum: ['premium_days', 'points', 'cash'], // Add more if needed later
        },
        rewardValue: {
            type: Number,
            required: [true, 'Reward value is required'],
        },
        maxUses: {
            type: Number,
            default: Infinity, // Or a large number
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        expiresAt: {
            type: Date,
            default: null, // No expiration by default
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
