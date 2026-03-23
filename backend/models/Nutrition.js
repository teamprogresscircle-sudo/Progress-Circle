const mongoose = require('mongoose');
const { fieldEncryption } = require('mongoose-field-encryption');

const nutritionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: String, // format YYYY-MM-DD for easy daily lookup
            required: true,
        },
        meals: [
            {
                name: { type: String, required: true },
                calories: { type: Number, default: 0 },
                protein: { type: Number, default: 0 },
                carbs: { type: Number, default: 0 },
                fats: { type: Number, default: 0 },
                time: { type: String }, // e.g. "08:30"
            }
        ],
        waterIntake: {
            type: Number, // in ml
            default: 0,
        },
        dailyTargetCalories: {
            type: Number,
            default: 2000,
        },
    },
    { timestamps: true }
);

// Index for fast daily retrieval per user
nutritionSchema.index({ userId: 1, date: 1 }, { unique: true });

// Apply encryption to sensitive content if needed
nutritionSchema.plugin(fieldEncryption, {
    fields: ['meals'],
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
nutritionSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
nutritionSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('Nutrition', nutritionSchema);
