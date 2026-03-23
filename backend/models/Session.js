const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['focus', 'break', 'sleep', 'technique'],
            default: 'focus',
        },
        classification: {
            type: String,
            required: false, // Made optional for V2
            default: 'Universal',
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            default: null,
        },
        technique: {
            type: String, // Pomodoro, 50/10, etc.
            default: 'Flow',
        },
        totalCycles: {
            type: Number,
            default: 1,
        },
        completedCycles: {
            type: Number,
            default: 0,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            default: null,
        },
        duration: {
            type: Number, // in minutes
            default: 0,
        },
        notes: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Apply encryption
sessionSchema.plugin(fieldEncryption, {
    fields: ['notes'], // Removed classification from encryption as it's often a system default now
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Helper to sanitize legacy encrypted classifications
const sanitizeClassification = (doc) => {
    if (doc.classification && doc.classification.length > 30 && doc.classification.includes(':')) {
        doc.classification = 'Universal';
    }
};

// Decrypt fields after retrieval
sessionSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
    sanitizeClassification(doc);
});

// Decrypt fields after save
sessionSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
    sanitizeClassification(doc);
});

module.exports = mongoose.model('Session', sessionSchema);
