const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const taskSchema = new mongoose.Schema(
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
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending',
        },
        deadline: {
            type: Date,
            default: null,
        },
        estimatedTime: {
            type: Number, // in minutes
            default: 0,
        },
        actualTimeSpent: {
            type: Number, // in minutes
            default: 0,
        },
        isBigTask: {
            type: Boolean,
            default: false,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
        totalWork: {
            type: Number, // e.g., 10 lessons
            default: 0,
        },
        completedWork: {
            type: Number, // e.g., 3 lessons finished
            default: 0,
        },
        alertsEnabled: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        isSynergyTask: {
            type: Boolean,
            default: false,
        },
        collaborators: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
    },
    { timestamps: true }
);

// Apply encryption
taskSchema.plugin(fieldEncryption, {
    fields: ['title', 'description', 'notes'],
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
taskSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
taskSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('Task', taskSchema);
