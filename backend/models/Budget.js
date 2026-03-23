const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        monthlyLimit: {
            type: Number,
            required: true,
            min: 1,
        },
        color: {
            type: String, // visual indicator matching transactions
            default: 'blue',
        }
    },
    { timestamps: true }
);

// Ensure unique budget categories per user
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
