const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
        },
        type: {
            type: String,
            enum: ['income', 'expense', 'investment'],
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly'],
            default: 'monthly',
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        lastProcessedDate: {
            type: Date,
            default: null,
        },
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            default: null,
        },
        fromWho: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);
