const User = require('../models/User');

// @desc    Get logged-in user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            avatarConfig: user.avatarConfig,
            points: user.points,
            streak: user.streak,
            streakHistory: user.streakHistory,
            streakFreezes: user.streakFreezes,
            joinedAt: user.createdAt,
            savingsEnabled: user.savingsEnabled,
            fitnessEnabled: user.fitnessEnabled,
            nutritionEnabled: user.nutritionEnabled,
            habitsEnabled: user.habitsEnabled,
            themePreferences: user.themePreferences,
            musicPreferences: user.musicPreferences,
            linkedAccounts: user.linkedAccounts,
            plan: user.plan,
            subscription: user.subscription,
            synergyEnabled: user.synergyEnabled,
        },
    });
};

// @desc    Update logged-in user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { 
            name, avatar, savingsEnabled, fitnessEnabled, 
            nutritionEnabled, habitsEnabled, themePreferences,
            musicPreferences, linkedAccounts, avatarConfig, synergyEnabled
        } = req.body;

        // Neural Firewall: Explicit Whitelisting (Mass Assignment Lockdown)
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (avatarConfig !== undefined) updateData.avatarConfig = avatarConfig;
        if (savingsEnabled !== undefined) updateData.savingsEnabled = savingsEnabled;
        if (fitnessEnabled !== undefined) updateData.fitnessEnabled = fitnessEnabled;
        if (nutritionEnabled !== undefined) updateData.nutritionEnabled = nutritionEnabled;
        if (habitsEnabled !== undefined) updateData.habitsEnabled = habitsEnabled;
        if (synergyEnabled !== undefined) updateData.synergyEnabled = synergyEnabled;
        
        // Deep verification for theme/music objects to prevent nested injection
        if (themePreferences) {
            updateData.themePreferences = {
                primaryColor: themePreferences.primaryColor,
                accentColor: themePreferences.accentColor,
                mode: themePreferences.mode,
                glassmorphism: themePreferences.glassmorphism
            };
        }
        if (musicPreferences) {
            updateData.musicPreferences = {
                platform: musicPreferences.platform,
                playlistUrl: musicPreferences.playlistUrl
            };
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                avatarConfig: user.avatarConfig,
                points: user.points,
                streak: user.streak,
                streakHistory: user.streakHistory,
                streakFreezes: user.streakFreezes,
                joinedAt: user.createdAt,
                savingsEnabled: user.savingsEnabled,
                fitnessEnabled: user.fitnessEnabled,
                nutritionEnabled: user.nutritionEnabled,
                habitsEnabled: user.habitsEnabled,
                themePreferences: user.themePreferences,
                musicPreferences: user.musicPreferences,
                linkedAccounts: user.linkedAccounts,
                plan: user.plan,
                subscription: user.subscription,
                synergyEnabled: user.synergyEnabled,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile, updateProfile };
