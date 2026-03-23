const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // System notifications have no sender
    type: { 
        type: String, 
        enum: [
            'battle_invite', 'battle_accepted', 'battle_rejected', 
            'synergy_orb', 'follow_request', 'friend_request',
            'room_invite', 'room_accepted',
            'task_deadline', 'streak_warning', 'nutrition_sync',
            'habit_missed', 'task_overdue', 'nutrition_deficit',
            'water_goal_missed', 'budget_exceeded', 'financial_goal_alert',
            'streak_critical', 'neural_milestone_unlocked',
            'referral_success', 'premium_reward', 'welcome'
        ],
        required: true
    }, // Added missing comma here
    status: { type: String, enum: ['pending', 'read', 'accepted', 'rejected'], default: 'pending' },
    isToasted: { type: Boolean, default: false },
    refId: { type: mongoose.Schema.Types.ObjectId }, // Link to Battle or Orb transaction
    message: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
