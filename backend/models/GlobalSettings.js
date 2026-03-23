const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    globalMultiplier: {
        type: Number,
        default: 1.0
    },
    broadcastMessage: {
        type: String,
        default: ''
    },
    lastBackup: {
        type: Date,
        default: Date.now
    },
    monthlyPriceCents: {
        type: Number,
        default: 14900  // 149 EGP
    },
    yearlyPriceCents: {
        type: Number,
        default: 129900  // 1299 EGP
    },
    features: [{
        label: { type: String, required: true },
        free: { type: mongoose.Schema.Types.Mixed, default: false },
        premium: { type: mongoose.Schema.Types.Mixed, default: true }
    }]
}, { timestamps: true });

const DEFAULT_FEATURES = [
    { label: 'Daily Progress Circle', free: true, premium: true },
    { label: 'Task Management', free: 'Basic', premium: 'Advanced' },
    { label: 'Neural Immersion (Video)', free: false, premium: 'Full Ecosystem' },
    { label: 'Focus Clock Protocols', free: 'Pomodoro & Flow', premium: 'All Advanced Protocols' },
    { label: 'Streak Tracking', free: 'Basic', premium: 'Advanced analytics' },
    { label: 'Habit Tracking', free: '5 habits max', premium: 'Unlimited habits' },
    { label: 'Habit Categories', free: false, premium: true },
    { label: 'Progress Statistics', free: 'Basic', premium: 'Detailed charts' },
    { label: 'Reminders', free: false, premium: 'Smart reminders' },
    { label: 'Data Export (PDF)', free: false, premium: true },
    { label: 'Themes / Customization', free: false, premium: true },
    { label: 'AI Habit Insights', free: false, premium: true },
    { label: 'Premium Profile Badge', free: false, premium: true },
    { label: 'Priority Support', free: false, premium: true },
    { label: 'Ads', free: 'Google AdSense ads', premium: 'No ads' },
];

// Ensure only one settings document exists
globalSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ features: DEFAULT_FEATURES });
    } else if (!settings.features || settings.features.length === 0) {
        settings.features = DEFAULT_FEATURES;
        await settings.save();
    }
    return settings;
};

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
