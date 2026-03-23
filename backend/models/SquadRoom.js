const mongoose = require('mongoose');

const squadRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        maxlength: 30
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['working', 'idle', 'away', 'focusing'], default: 'idle' },
        lastActive: { type: Date, default: Date.now },
        totalFocusTime: { type: Number, default: 0 }
    }],
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    activeSession: {
        startTime: { type: Date },
        durationMinutes: { type: Number },
        type: { type: String, enum: ['focus', 'battle', 'project'], default: 'focus' },
        isActive: { type: Boolean, default: false }
    },
    activeBattle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
    isPrivate: {
        type: Boolean,
        default: true
    },
    squadXP: { type: Number, default: 0 },
    squadPoints: { type: Number, default: 0 }, // keeping for compatibility, will sync to squadXP
    squadLevel: { type: Number, default: 1 },
    league: { type: String, default: 'Bronze' },
    lastLeagueUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SquadRoom', squadRoomSchema);
