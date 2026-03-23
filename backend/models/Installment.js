const mongoose = require('mongoose');

const installmentPaymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' }
}, { _id: true });

const installmentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        // What is this installment for?
        name: { type: String, required: true, trim: true },
        // Total amount owed
        totalAmount: { type: Number, required: true, min: 1 },
        // Fixed monthly payment amount
        monthlyAmount: { type: Number, required: true, min: 1 },
        // Total number of months
        totalMonths: { type: Number, required: true, min: 1 },
        // When did it start
        startDate: { type: Date, default: Date.now },
        // Records of each payment made
        payments: { type: [installmentPaymentSchema], default: [] },
        // Which account payments are deducted from
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
        // Who you owe to (bank, store, person...)
        creditor: { type: String, default: '', trim: true },
        notes: { type: String, default: '' },
        isCompleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Virtual: months already paid
installmentSchema.virtual('paidMonths').get(function () {
    return this.payments.length;
});

// Virtual: amount paid so far
installmentSchema.virtual('amountPaid').get(function () {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
});

// Virtual: remaining amount
installmentSchema.virtual('amountRemaining').get(function () {
    return Math.max(0, this.totalAmount - this.payments.reduce((sum, p) => sum + p.amount, 0));
});

installmentSchema.set('toJSON', { virtuals: true });
installmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Installment', installmentSchema);
