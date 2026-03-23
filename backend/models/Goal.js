const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const goalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Goal title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        targetDate: {
            type: String, // stored as YYYY-MM-DD string
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'paused'],
            default: 'active',
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Apply encryption
goalSchema.plugin(fieldEncryption, {
    fields: ['title', 'description'],
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
goalSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
goalSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('Goal', goalSchema);
