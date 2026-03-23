const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const bodyMetricSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        weight: {
            type: Number, // optionally store in kg or lbs
        },
        bmr: {
            type: Number,
        },
        muscleMass: {
            type: Number, // Percentage or absolute
        },
        bodyFat: {
            type: Number, // Percentage
        },
        stomach: {
            type: Number, // Circumference (cm or inches)
        },
        arm: {
            type: Number,
        },
        leg: {
            type: Number,
        }
    },
    { timestamps: true }
);

// Apply encryption
bodyMetricSchema.plugin(fieldEncryption, {
    fields: ['weight', 'bmr', 'muscleMass', 'bodyFat', 'stomach', 'arm', 'leg'],
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
bodyMetricSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
bodyMetricSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('BodyMetric', bodyMetricSchema);
