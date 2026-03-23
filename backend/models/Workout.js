const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const dailyFitnessLogSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    isRestDay: {
        type: Boolean,
        default: false,
    },
    workoutCompleted: {
        type: Boolean,
        default: false,
    },
    routineDone: {
        type: String, // Explicit exact workout performed
        default: '',
    },
    weight: {
        type: Number, // Ability to log weight directly in the fitness log
    },
    meals: [{
        mealName: String, // e.g. "Breakfast", "Lunch", "Pre-workout"
        items: String     // e.g. "Chicken, rice, 3 eggs"
    }],
    notes: {
        type: String,
        default: '',
    }
});

const fitnessCycleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cycleType: {
        type: String,
        // e.g., "Push/Pull/Legs", "Customized", "Bro Split"
        default: 'Customized'
    },
    daysCount: {
        type: Number,
        default: 7, // Default 7 day cycle
    },
    daysConfig: [{
        dayNumber: Number,
        routine: String, // e.g. "Chest Day", "Pull Day", "Active Recovery"
    }],
    active: {
        type: Boolean,
        default: true
    },
    logs: [dailyFitnessLogSchema]
}, { timestamps: true });

// Apply encryption
fitnessCycleSchema.plugin(fieldEncryption, {
    fields: ['cycleType', 'daysConfig', 'logs'], // Encrypt the whole arrays for log/config
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
fitnessCycleSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
fitnessCycleSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('FitnessCycle', fitnessCycleSchema);
