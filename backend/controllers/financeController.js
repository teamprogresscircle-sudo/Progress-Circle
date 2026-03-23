const FinancialGoal = require('../models/FinancialGoal');
const Budget = require('../models/Budget');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// --- ACCOUNTS ---
exports.getAccounts = async (req, res, next) => {
    try {
        const accounts = await Account.find({ userId: req.user._id });
        res.status(200).json({ success: true, count: accounts.length, data: accounts });
    } catch (error) {
        next(error);
    }
};

exports.createAccount = async (req, res, next) => {
    try {
        const payload = { ...req.body, userId: req.user._id };
        const account = await Account.create(payload);
        res.status(201).json({ success: true, data: account });
    } catch (error) {
        next(error);
    }
};

exports.updateAccount = async (req, res, next) => {
    try {
        const account = await Account.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

        // Recompute totalMoney as sum of all account balances
        const allAccounts = await Account.find({ userId: req.user._id });
        const newTotal = allAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
        await User.findByIdAndUpdate(req.user._id, { totalMoney: newTotal });

        res.status(200).json({ success: true, data: account });
    } catch (error) {
        next(error);
    }
};

// --- GOALS ---
exports.getGoals = async (req, res, next) => {
    try {
        const goals = await FinancialGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: goals.length, data: goals });
    } catch (error) {
        next(error);
    }
};

exports.createGoal = async (req, res, next) => {
    try {
        const payload = { ...req.body, userId: req.user._id };
        const goal = await FinancialGoal.create(payload);
        res.status(201).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

exports.updateGoal = async (req, res, next) => {
    try {
        const goal = await FinancialGoal.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
        
        // Award points if goal newly completed
        if (req.body.status === 'completed' && goal.status !== 'completed') {
            await User.findByIdAndUpdate(req.user._id, { $inc: { points: 50 } });
        }

        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

exports.deleteGoal = async (req, res, next) => {
    try {
        const goal = await FinancialGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// --- BUDGETS ---
exports.getBudgets = async (req, res, next) => {
    try {
        const budgets = await Budget.find({ userId: req.user._id });
        res.status(200).json({ success: true, count: budgets.length, data: budgets });
    } catch (error) {
        next(error);
    }
};

exports.createBudget = async (req, res, next) => {
    try {
        const payload = { ...req.body, userId: req.user._id };
        const budget = await Budget.create(payload);
        
        // Award points for creating a budget
        await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });

        res.status(201).json({ success: true, data: budget });
    } catch (error) {
        next(error);
    }
};

exports.updateBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
        res.status(200).json({ success: true, data: budget });
    } catch (error) {
        next(error);
    }
};

exports.deleteBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// --- INSIGHTS & ANALYTICS ---
exports.getFinanceInsights = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthTx = await Transaction.find({ user: userId, date: { $gte: startOfMonth } });
        const lastMonthTx = await Transaction.find({ user: userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } });

        // Category breakdown for current month expenses
        const categories = {};
        currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        // Calculate dynamic insight
        const currentBurn = currentMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const salary = req.user.monthlyIncome || 0;
        let healthScore = 100;
        let insight = "Your financial trajectory is optimal.";

        if (salary > 0) {
            const burnRatio = currentBurn / salary;
            if (burnRatio > 0.8) {
                insight = `Warning: You have spent ${(burnRatio * 100).toFixed(0)}% of your base salary this month.`;
                healthScore -= 30;

                // Budget Alert
                const { createSystemNotification } = require('./notificationController');
                const Notification = require('../models/Notification');
                const existing = await Notification.findOne({
                    recipient: userId,
                    type: 'budget_exceeded',
                    createdAt: { $gt: new Date(now.getTime() - (24 * 60 * 60 * 1000)) }
                });
                if (!existing) {
                    await createSystemNotification(
                        userId, 'budget_exceeded',
                        `FINANCIAL CRITICAL: Monthly burn has exceeded 80% threshold. Immediate budget recalibration required.`
                    );
                }
            } else if (burnRatio < 0.5) {
                insight = "You are saving over 50% of your income! Excellent capital retention.";
                healthScore += 10;
            }
        }

        // Return everything
        res.status(200).json({
            success: true,
            data: {
                categoryAnalytics: categories,
                healthScore: Math.min(100, Math.max(0, healthScore)),
                insight
            }
        });
    } catch (error) {
        next(error);
    }
};
