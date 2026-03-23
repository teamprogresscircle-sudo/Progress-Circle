const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
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
        type: {
            type: String,
            enum: ['cash', 'bank', 'card', 'wallet'],
            default: 'bank',
        },
        balance: {
            type: Number,
            default: 0,
        },
        color: {
            type: String,
            default: 'indigo',
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        currency: {
            type: String,
            default: 'EGP',
        },
        exchangeRate: {
            type: Number,
            default: 1,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);
