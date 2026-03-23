const mongoose = require('mongoose');

const billPaymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    month: { type: Number, required: true },  // 0-11 (JS month)
    year: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' }
}, { _id: true });

const billSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 1 },
        // Day of month the bill is due (1-31)
        dueDay: { type: Number, required: true, min: 1, max: 31 },
        category: { type: String, default: 'Bill' },
        // Which account is auto-deducted from
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
        notes: { type: String, default: '' },
        // History of all past payments
        payments: { type: [billPaymentSchema], default: [] },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
