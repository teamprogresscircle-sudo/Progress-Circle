const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { fieldEncryption } = require('mongoose-field-encryption');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Never returned in queries by default
        },
        avatar: {
            type: String,
            default: '',
        },
        avatarConfig: {
            seed: { type: String, default: 'default' },
            head: { type: String, default: 'short1' },
            face: { type: String, default: 'smile' },
            facialHair: { type: String, default: '' },
            accessories: { type: String, default: '' },
            clothingColor: { type: String, default: '8fa7df' },
            skinColor: { type: String, default: 'edb98a' },
            headContrastColor: { type: String, default: '2c1b18' },
            backgroundColor: { type: String, default: 'transparent' },
            farmTheme: { type: String, default: 'classic' },
            
            // Premium Identity Aesthetics
            title: { type: String, default: 'Novice' },
            avatarAura: { type: String, default: 'none' },
            operationalMode: { type: String, default: 'none' },
            
            // Productivity Utilities & Companions
            ambientTrack: { type: String, default: 'none' },
            companionPet: { type: String, default: 'none' }
        },
        inventory: {
            type: [String],
            default: [],
        },
        powerups: {
            streakFreezes: { type: Number, default: 0 },
            doubleXpUntil: { type: Date, default: null }
        },
        trees: {
            type: [
                {
                    type: { type: String },
                    date: { type: Date },
                },
            ],
            default: [],
        },
        points: {
            type: Number,
            default: 0,
        },
        totalScore: {
            type: Number,
            default: 0,
        },
        xp: { // Alias for points for the Squad XP system
            type: Number,
            default: 0,
        },
        totalFocusTime: {
            type: Number,
            default: 0,
        },
        streak: {
            type: Number,
            default: 0,
        },
        lastTaskCompletionDate: {
            type: Date,
            default: null
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        savingsEnabled: {
            type: Boolean,
            default: false,
        },
        fitnessEnabled: {
            type: Boolean,
            default: false,
        },
        nutritionEnabled: {
            type: Boolean,
            default: false,
        },
        synergyEnabled: {
            type: Boolean,
            default: false,
        },
        habitsEnabled: {
            type: Boolean,
            default: true,
        },
        totalMoney: {
            type: Number,
            default: 0,
        },
        cashBalance: {
            type: Number,
            default: 0,
        },
        creditBalance: {
            type: Number,
            default: 0,
        },
        monthlyIncome: {
            type: Number,
            default: 0,
        },
        salaryDay: {
            type: Number,
            default: 1,
            min: 1,
            max: 31,
        },
        savingsGoal: {
            type: Number,
            default: 50000,
        },
        gender: {
            type: String,
            enum: ['male', 'female', ''],
            default: '',
        },
        themePreferences: {
            primaryColor: { type: String, default: '#6366f1' },
            accentColor: { type: String, default: '#8b5cf6' },
            bg: { type: String, default: '' },
            surface: { type: String, default: '' },
            mode: { type: String, default: 'dark' },
            glassmorphism: { type: Boolean, default: true },
        },
        musicPreferences: {
            platform: { type: String, default: '' },
            playlistUrl: { type: String, default: '' },
        },
        linkedAccounts: {
            spotify: { type: Boolean, default: false },
            anghami: { type: Boolean, default: false },
            apple: { type: Boolean, default: false },
        },
        streakHistory: {
            type: [Date],
            default: [],
        },
        streakFreezes: {
            type: Number,
            default: 0,
        },
        plan: {
            type: String,
            enum: ['free', 'premium'],
            default: 'free',
        },
        subscription: {
            status: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'inactive' },
            billingCycle: { type: String, enum: ['monthly', 'yearly', ''], default: '' },
            currentPeriodEnd: { type: Date, default: null },
            paymobOrderId: { type: String, default: '' },
            paymobTransactionId: { type: String, default: '' }
        },
        friends: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        friendRequests: [{
            sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['pending'], default: 'pending' },
            createdAt: { type: Date, default: Date.now }
        }],
        socialStats: {
            battlesWon: { type: Number, default: 0 },
            squadPoints: { type: Number, default: 0 },
            roomsJoined: { type: Number, default: 0 },
            dailyPoints: [{
                date: { type: Date },
                points: { type: Number }
            }]
        },
        redeemedPromoCodes: {
            type: [String],
            default: []
        },
        subscriptionPriceOverrideCents: {
            type: Number,
            default: null  // When set, next subscription payment uses this price (in cents)
        },
        referralToken: {
            type: String,
            unique: true,
            sparse: true // Only index if present
        },
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        referralsCount: {
            type: Number,
            default: 0
        },
        pushSubscriptions: [
            {
                endpoint: { type: String, required: true },
                keys: {
                    p256dh: { type: String, required: true },
                    auth: { type: String, required: true }
                }
            }
        ],
        totalScore: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Hash password before saving, generate referral token, and calculate total score
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }

    // Neural Logic: Generate unique referral token if not exists
    if (!this.referralToken) {
        this.referralToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    // Score is now completely separate from points.
    // Score based on streaks + time of deep focus + milestones + squad activity.
    const streakBonus = (this.streak || 0) * 100;
    const focusScore = this.totalFocusTime || 0;
    const squadScore = this.socialStats?.squadPoints || 0;

    // Estimate milestones based on available data:
    // - Every 7 days of streak is a milestone (approx)
    // - Every 5000 points is a milestone
    // - Trees are awarded for focus milestones
    const milestoneCount = Math.floor((this.streak || 0) / 7)
        + Math.floor((this.points || 0) / 5000)
        + (this.trees?.length || 0);

    this.totalScore = streakBonus + focusScore + squadScore + (milestoneCount * 500);

    next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Apply encryption
userSchema.plugin(fieldEncryption, {
    fields: [
        'totalMoney',
        'cashBalance',
        'creditBalance',
        'monthlyIncome',
        'savingsGoal',
        'inventory',
    ],
    secret: process.env.DATABASE_ENCRYPTION_KEY,
    saltGenerator: (secret) => secret.slice(0, 16),
});

// Decrypt fields after retrieval
userSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
userSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('User', userSchema);

// Decrypt fields after retrieval
userSchema.post('init', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

// Decrypt fields after save
userSchema.post('save', (doc) => {
    try {
        doc.decryptFieldsSync();
    } catch (err) {
        // Already decrypted or failed
    }
});

module.exports = mongoose.model('User', userSchema);
