const mongoose = require('mongoose');

const squadActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['task_completed', 'room_joined', 'battle_won', 'rank_up'],
        required: true
    },
    details: {
        type: String
    },
    time: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('SquadActivity', squadActivitySchema);
