const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
}, { _id: true });

const borrowSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        // Who lent you money
        fromWho: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 1 },
        // When you borrowed it
        borrowedDate: { type: Date, default: Date.now },
        // When you need to return it (optional)
        dueDate: { type: Date, default: null },
        // Has the full amount been returned?
        isReturned: { type: Boolean, default: false },
        returnedDate: { type: Date, default: null },
        // Amount returned so far (partial returns)
        amountReturned: { type: Number, default: 0 },
        // Which account the borrowed money went into
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
        // Notes log (timestamped)
        notes: { type: [noteSchema], default: [] },
        category: { type: String, default: 'Borrow' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Borrow', borrowSchema);
