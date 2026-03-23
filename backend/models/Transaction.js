const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['expense', 'investment', 'income', 'lend', 'transfer'],
            required: true,
        },
        isTransfer: {
            type: Boolean,
            default: false,
        },
        transferToAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            default: null,
        },
        currency: {
            type: String,
            default: 'EGP',
        },
        originalAmount: {
            type: Number,
            default: null,
        },
        exchangeRate: {
            type: Number,
            default: 1,
        },
        account: {
            type: String, // Legacy label fallback (e.g. account name)
            default: '',
        },
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            default: null,
        },
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurringTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RecurringTransaction',
            default: null,
        },
        // Income: who sent money
        fromWho: {
            type: String,
            default: '',
        },
        // Expense: who received money
        toWho: {
            type: String,
            default: '',
        },
        // Purpose: what was it for (expense/investment)
        purpose: {
            type: String,
            default: '',
        },
        // Lending: who borrowed from you
        lentTo: {
            type: String,
            default: '',
        },
        amount: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        date: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

// Apply encryption
transactionSchema.plugin(fieldEncryption, {
    fields: ['fromWho', 'amount', 'category', 'description'],
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
transactionSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
transactionSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
