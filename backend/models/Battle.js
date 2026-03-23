const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        pointsEarned: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 },
        battleTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
    }],
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'SquadRoom' },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled', 'paused'],
        default: 'pending'
    },
    isMultiday: { type: Boolean, default: false },
    paused: { type: Boolean, default: false },
    breakSessions: [{
        start: { type: Date },
        end: { type: Date }
    }],
    startTime: { type: Date },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 25 },
    logs: [{
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stake: { type: Number, default: 100 }, // Synergy points at stake
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Battle', battleSchema);
