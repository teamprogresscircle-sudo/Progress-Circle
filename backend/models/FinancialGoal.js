const mongoose = require('mongoose');

const financialGoalSchema = new mongoose.Schema(
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
            maxlength: 50,
        },
        targetAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        currentAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        color: {
            type: String,
            default: 'indigo',
        },
        icon: {
            type: String,
            default: 'Target',
        },
        deadline: {
            type: Date,
            default: null, // Optional deadline
        },
        isCompleted: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('FinancialGoal', financialGoalSchema);
