const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Goal = require('../models/Goal');
const GlobalSettings = require('../models/GlobalSettings');
const AuditLog = require('../models/AuditLog');

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res, next) => {
    try {
        const [totalUsers, totalTasks, totalHabits, totalGoals, premiumUsers] = await Promise.all([
            User.countDocuments(),
            Task.countDocuments(),
            Habit.countDocuments(),
            Goal.countDocuments(),
            User.countDocuments({ plan: 'premium' }),
        ]);

        // Community stats (total trees)
        const treeStats = await User.aggregate([
            { $project: { treeCount: { $size: { $ifNull: ['$trees', []] } } } },
            { $group: { _id: null, totalTrees: { $sum: '$treeCount' } } },
        ]);
        const totalTrees = treeStats[0]?.totalTrees ?? 0;

        res.status(200).json({ 
            success: true, 
            data: { 
                totalUsers, 
                totalTasks, 
                totalHabits, 
                totalGoals, 
                premiumUsers,
                totalTrees,
                growthRate: '+12%' // Placeholder for now
            } 
        });
    } catch (error) { next(error); }
};

// @desc    Update any user field
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { 
            new: true, 
            runValidators: true 
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        await AuditLog.create({
            adminId: req.user._id,
            actionType: 'UPDATE_USER',
            targetUserId: user._id,
            details: { updatedFields: Object.keys(req.body) },
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'User updated successfully', data: user });
    } catch (error) { next(error); }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: users });
    } catch (error) { next(error); }
};

// @desc    Reset a user's points to 0
// @route   PUT /api/admin/users/:id/reset-points
// @access  Admin
const resetPoints = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { points: 0 }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await AuditLog.create({
            adminId: req.user._id,
            actionType: 'RESET_POINTS',
            targetUserId: user._id,
            details: { reason: 'Admin reset' },
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'Points reset', data: user });
    } catch (error) { next(error); }
};

// @desc    Delete a user and all their data
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await Promise.all([
            User.findByIdAndDelete(id),
            Task.deleteMany({ userId: id }),
            Habit.deleteMany({ userId: id }),
            Goal.deleteMany({ userId: id }),
        ]);

        await AuditLog.create({
            adminId: req.user._id,
            actionType: 'DELETE_USER',
            targetUserId: id,
            details: { deletedUserEmail: user.email },
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'User and all associated data deleted' });
    } catch (error) { next(error); }
};

// @desc    Reward all users with points
// @route   POST /api/admin/reward-all
// @access  Admin
const rewardAll = async (req, res, next) => {
    try {
        const { points, reason } = req.body;
        if (!points || points <= 0) return res.status(400).json({ success: false, message: 'Valid point amount required' });

        await User.updateMany({}, { $inc: { points } });
        
        await AuditLog.create({
            adminId: req.user._id,
            actionType: 'REWARD_ALL',
            details: { points, reason: reason || 'System Bonus' },
            ipAddress: req.ip
        });

        res.status(200).json({ 
            success: true, 
            message: `Global Injection Success: ${points} points granted to all biologicals for: ${reason || 'System Bonus'}.` 
        });
    } catch (error) { next(error); }
};

// @desc    Get global settings
// @route   GET /api/admin/settings
// @access  Admin
const getSettings = async (req, res, next) => {
    try {
        const settings = await GlobalSettings.getSettings();
        res.status(200).json({ success: true, data: settings });
    } catch (error) { next(error); }
};

// @desc    Update global settings
// @route   PUT /api/admin/settings
// @access  Admin
const updateSettings = async (req, res, next) => {
    try {
        const settings = await GlobalSettings.findOneAndUpdate({}, { $set: req.body }, { 
            new: true, 
            upsert: true 
        });

        await AuditLog.create({
            adminId: req.user._id,
            actionType: 'UPDATE_SETTINGS',
            details: { updatedFields: Object.keys(req.body) },
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'Global protocols updated', data: settings });
    } catch (error) { next(error); }
};

// @desc    Grant a user premium access for X days (admin only)
// @route   POST /api/admin/users/:id/grant-subscription
// @access  Admin
const grantSubscription = async (req, res, next) => {
    try {
        const { days } = req.body;
        if (!days || days <= 0) {
            return res.status(400).json({ success: false, message: 'Please provide a valid number of days.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // If already premium and not expired, extend from current end; otherwise from today
        let base = (user.subscription?.currentPeriodEnd && new Date(user.subscription.currentPeriodEnd) > new Date())
            ? new Date(user.subscription.currentPeriodEnd)
            : new Date();

        base.setDate(base.getDate() + parseInt(days));

        await User.findByIdAndUpdate(req.params.id, {
            plan: 'premium',
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': base,
        });

        await AuditLog.create({
            adminId: req.user._id,
            actionType: 'GRANT_SUBSCRIPTION',
            targetUserId: user._id,
            details: { daysGranted: days, newExpiry: base },
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            message: `Granted ${days} days of Premium to ${user.name}. Access until ${base.toLocaleDateString()}.`,
        });
    } catch (error) { next(error); }
};

// @desc    Get subscription pricing
// @route   GET /api/admin/pricing
// @access  Admin
const getSubscriptionPricing = async (req, res, next) => {
    try {
        const settings = await GlobalSettings.getSettings();
        res.status(200).json({
            success: true,
            data: {
                monthlyPriceCents: settings.monthlyPriceCents,
                yearlyPriceCents: settings.yearlyPriceCents,
            }
        });
    } catch (error) { next(error); }
};

// @desc    Update subscription pricing
// @route   PUT /api/admin/pricing
// @access  Admin
const updateSubscriptionPricing = async (req, res, next) => {
    try {
        const { monthlyPriceCents, yearlyPriceCents } = req.body;
        const update = {};
        if (monthlyPriceCents !== undefined) update.monthlyPriceCents = monthlyPriceCents;
        if (yearlyPriceCents !== undefined) update.yearlyPriceCents = yearlyPriceCents;

        const settings = await GlobalSettings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });

        await AuditLog.create({
            adminId: req.user._id,
            actionType: 'UPDATE_PRICING',
            details: { monthlyPriceCents, yearlyPriceCents },
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'Pricing updated.', data: settings });
    } catch (error) { next(error); }
};

// @desc    Get user deep dive data
// @route   GET /api/admin/users/:id/deep-dive
// @access  Admin
const getDeepDiveUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const PaymentLog = require('../models/PaymentLog'); // requiring here to avoid circular dep issues if any

        const [user, tasks, habits, payments] = await Promise.all([
            User.findById(id).lean(),
            Task.find({ userId: id }).sort({ createdAt: -1 }).limit(50).lean(),
            Habit.find({ userId: id }).sort({ createdAt: -1 }).limit(50).lean(),
            PaymentLog.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean()
        ]);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({
            success: true,
            data: { user, tasks, habits, payments }
        });
    } catch (error) { next(error); }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Admin
const getAuditLogs = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const page = parseInt(req.query.page) || 1;

        const [logs, total] = await Promise.all([
            AuditLog.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('adminId', 'name email')
                .populate('targetUserId', 'name email'),
            AuditLog.countDocuments()
        ]);

        res.json({ success: true, total, page, limit, data: logs });
    } catch (err) { next(err); }
};

// @desc    Get public system status
// @route   GET /api/admin/status
// @access  Public
// @desc    Recalculate scores for all users
// @route   POST /api/admin/sync-scores
// @access  Admin
const recalculateScores = async (req, res, next) => {
    try {
        const users = await User.find({});
        let successes = 0;
        let failures = 0;

        for (const user of users) {
            try {
                await user.save();
                successes++;
            } catch (err) {
                console.error(`Failed to sync score for user ${user._id}:`, err.message);
                failures++;
            }
        }

        await AuditLog.create({
            adminId: req.user._id,
            actionType: 'SYNC_SCORES',
            details: { userCount: users.length, successes, failures },
            ipAddress: req.ip
        });

        res.status(200).json({ 
            success: true, 
            message: `Neural Rank Synchronization: ${successes} successful, ${failures} failed out of ${users.length} biological signatures.` 
        });
    } catch (error) { next(error); }
};

const getStatus = async (req, res, next) => {
    try {
        const settings = await GlobalSettings.getSettings();
        res.status(200).json({ 
            success: true, 
            data: { 
                maintenanceMode: settings.maintenanceMode,
                broadcastMessage: settings.broadcastMessage
            } 
        });
    } catch (error) { next(error); }
};

module.exports = { getStatus, requireAdmin, getStats, getUsers, resetPoints, deleteUser, updateUser, rewardAll, getSettings, updateSettings, grantSubscription, getSubscriptionPricing, updateSubscriptionPricing, getDeepDiveUser, getAuditLogs, recalculateScores };
