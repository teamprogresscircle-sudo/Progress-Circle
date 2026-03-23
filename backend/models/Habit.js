const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const habitSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        name: {
            type: String,
            required: [true, 'Habit name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, 'Description cannot exceed 300 characters'],
            default: '',
        },
        streak: {
            type: Number,
            default: 0,
        },
        frequency: {
            type: Number,
            required: [true, 'Frequency (times per week) is required'],
            min: [1, 'Frequency must be at least 1'],
            max: [7, 'Frequency cannot exceed 7'],
        },
        duration: {
            type: Number, // In weeks
            required: [true, 'Duration (weeks) is required'],
            min: [1, 'Duration must be at least 1 week'],
        },
        completedDates: {
            type: [String], // Array of YYYY-MM-DD strings
            default: [],
        },
    },
    { timestamps: true }
);

// Apply encryption
habitSchema.plugin(fieldEncryption, {
    fields: ['name', 'description'],
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
habitSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save to ensure response has plain text
habitSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('Habit', habitSchema);
