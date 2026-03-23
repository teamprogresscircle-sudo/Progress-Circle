const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const categorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            maxlength: [50, 'Category name cannot exceed 50 characters'],
        },
        color: {
            type: String,
            default: '#4f46e5', // Indigo default
        },
        icon: {
            type: String,
            default: 'Tag',
        },
    },
    { timestamps: true }
);

// Apply encryption
categorySchema.plugin(fieldEncryption, {
    fields: ['name'],
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
categorySchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
categorySchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('Category', categorySchema);
