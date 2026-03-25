const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { createSystemNotification } = require('./notificationController');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        const { name, email, password, gender, ref } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Handle referral logic
        let referredBy = null;
        if (ref) {
            const referrer = await User.findOne({ referralToken: ref });
            if (referrer) {
                referredBy = referrer._id;
            }
        }

        const user = await User.create({ 
            name, email, password, 
            gender: gender || '',
            referredBy,
            verificationCode,
            verificationCodeExpires
        });

        // Send Verification Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify your Progress Circle account',
                message: `Your verification code is: ${verificationCode}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
                        <h2 style="color: #6366f1;">Welcome to the Circle!</h2>
                        <p>Please enter the following code to verify your account:</p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
                            ${verificationCode}
                        </div>
                        <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">This code expires in 10 minutes.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Email could not be sent', emailError);
            // Fallback: print to console for development
            console.log(`VERIFICATION CODE FOR ${user.email}: ${verificationCode}`);
        }

        res.status(201).json({
            success: true,
            message: 'Verification code sent to email',
            data: { email: user.email }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify
// @access  Public
const verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ 
            email, 
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;

        // Trigger referral rewards if applicable
        if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
                referrer.referralsCount += 1;
                
                // Notify Referrer
                await createSystemNotification(
                    referrer._id, 
                    'referral_success', 
                    `Neural Link Established! ${user.name} joined via your link. (+1 point)`
                );
                
                // Reward: Every 3 referrals = +30 days premium
                if (referrer.referralsCount % 3 === 0) {
                    const currentEnd = (referrer.plan === 'premium' && referrer.subscription?.currentPeriodEnd) 
                        ? new Date(referrer.subscription.currentPeriodEnd) 
                        : new Date();
                    
                    const newEnd = new Date(currentEnd);
                    newEnd.setDate(newEnd.getDate() + 30);
                    
                    referrer.plan = 'premium';
                    referrer.subscription = {
                        status: 'active',
                        currentPeriodEnd: newEnd,
                        billingCycle: 'monthly'
                    };

                    await createSystemNotification(
                        referrer._id,
                        'premium_reward',
                        `Premium Bridge Extended! You've successfully recruited 3 operatives. +30 days added.`,
                        null
                    );
                }
                await referrer.save();
            }
        }

        await user.save();

        const token = generateToken(user._id);

        // Send Welcome Notification
        await createSystemNotification(
            user._id,
            'welcome',
            `Welcome to the Circle, ${user.name}. Your neural interface is now active. Focus well.`
        );

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    avatarConfig: user.avatarConfig,
                    points: user.points,
                    totalScore: user.totalScore,
                    streak: user.streak,
                    streakHistory: user.streakHistory,
                    streakFreezes: user.streakFreezes,
                    isAdmin: user.isAdmin,
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
                    subscriptionPriceOverrideCents: user.subscriptionPriceOverrideCents || null,
                    gender: user.gender || '',
                    referralToken: user.referralToken,
                    referralsCount: user.referralsCount,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
// @access  Public
const resendVerificationCode = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Account already verified' });
        }

        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = Date.now() + 10 * 60 * 1000;

        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;
        await user.save();

        // Send Verification Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'New verification code - Progress Circle',
                message: `Your new verification code is: ${verificationCode}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
                        <h2 style="color: #6366f1;">New Verification Code</h2>
                        <p>Here is your new verification code:</p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
                            ${verificationCode}
                        </div>
                        <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">This code expires in 10 minutes.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Email could not be sent', emailError);
            console.log(`RESENT VERIFICATION CODE FOR ${user.email}: ${verificationCode}`);
        }

        res.status(200).json({
            success: true,
            message: 'New verification code sent'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid password or email' });
        }

        if (!user.isVerified) {
            // Generate and send a new verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.verificationCode = verificationCode;
            user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
            await user.save();

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify your Progress Circle account',
                    message: `Your verification code is: ${verificationCode}. It expires in 10 minutes.`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
                            <h2 style="color: #6366f1;">Welcome to the Circle!</h2>
                            <p>Please enter the following code to verify your account:</p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
                                ${verificationCode}
                            </div>
                            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">This code expires in 10 minutes.</p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Email could not be sent', emailError);
                console.log(`VERIFICATION CODE FOR ${user.email}: ${verificationCode}`);
            }

            return res.status(403).json({ 
                success: false, 
                message: 'Account not verified. A new code has been sent to your email.',
                requiresVerification: true,
                data: { email: user.email }
            });
        }

        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    avatarConfig: user.avatarConfig,
                    points: user.points,
                    totalScore: user.totalScore,
                    streak: user.streak,
                    streakHistory: user.streakHistory,
                    streakFreezes: user.streakFreezes,
                    isAdmin: user.isAdmin,
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
                    subscriptionPriceOverrideCents: user.subscriptionPriceOverrideCents || null,
                    gender: user.gender || '',
                    referralToken: user.referralToken,
                    referralsCount: user.referralsCount,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    let user = req.user;

    // Verify expiration and auto-downgrade or fix bug
    if (user.plan === 'premium' && !user.isAdmin) {
        const periodEnd = user.subscription?.currentPeriodEnd;
        if (periodEnd && new Date(periodEnd) < new Date()) {
            user.plan = 'free';
            if (user.subscription) user.subscription.status = 'expired';
            await user.save();
        } else if (!periodEnd) {
            user.subscription = { status: 'active', currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000) };
            await user.save();
        }
    }

    res.status(200).json({
        success: true,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            avatarConfig: user.avatarConfig,
            points: user.points,
            totalScore: user.totalScore || 0,
            streak: user.streak,
            streakHistory: user.streakHistory,
            streakFreezes: user.streakFreezes,
            isAdmin: user.isAdmin,
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
            subscriptionPriceOverrideCents: user.subscriptionPriceOverrideCents || null,
            gender: user.gender || '',
            referralToken: user.referralToken,
            referralsCount: user.referralsCount,
        },
    });
};

module.exports = { register, login, getMe, verifyEmail, resendVerificationCode };
