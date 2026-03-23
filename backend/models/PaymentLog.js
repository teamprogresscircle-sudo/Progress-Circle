const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        orderId: {
            type: String,
            required: true,
        },
        transactionId: {
            type: String,
            default: '',
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'EGP',
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed', 'voided', 'refunded'],
            required: true,
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'yearly', ''],
            default: '',
        },
        source: {
            type: String,
            enum: ['checkout', 'webhook', 'verification', 'cron'],
            default: 'webhook',
        },
        rawPaymobResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PaymentLog', paymentLogSchema);
