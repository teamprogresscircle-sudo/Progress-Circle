const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
        purchasePrice: {
            type: Number,
            required: true,
        },
        purchaseCurrency: {
            type: String,
            default: 'EGP',
        },
        currentPrice: {
            type: Number,
            default: 0,
        },
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'sold', 'partially_sold'],
            default: 'active',
        },
        sellHistory: [
            {
                amount: Number,
                quantity: Number,
                date: { type: Date, default: Date.now },
                pnl: Number,
            }
        ],
        notes: {
            type: String,
            default: '',
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Investment', investmentSchema);
