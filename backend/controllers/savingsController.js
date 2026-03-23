const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');

// ─── Helper: apply balance delta to Account or User legacy fields ──────────────
async function applyBalanceDelta(userId, accountId, delta) {
    if (accountId) {
        // Preferred: update the named Account model balance
        await Account.findOneAndUpdate(
            { _id: accountId, userId },
            { $inc: { balance: delta } }
        );
    }
    // Always keep the legacy User.totalMoney in sync for the overview cards
    await User.findByIdAndUpdate(userId, { $inc: { totalMoney: delta } });
}

// ─── GET /api/savings ──────────────────────────────────────────────────────────
const getTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .sort({ date: -1 })
            .populate('accountId', 'name type color');
        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/savings ─────────────────────────────────────────────────────────
const addTransaction = async (req, res, next) => {
    try {
        const { type, amount, category, description, fromWho, toWho, purpose, lentTo, accountId, date } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
        }

        // Resolve account name for legacy label
        let accountLabel = '';
        let resolvedAccountId = accountId || null;
        if (accountId) {
            const acc = await Account.findOne({ _id: accountId, userId: req.user._id });
            if (!acc) return res.status(404).json({ success: false, message: 'Account not found.' });
            accountLabel = acc.name;
        }

        const transaction = await Transaction.create({
            user: req.user._id,
            type,
            amount: Number(amount),
            category,
            description: description || '',
            fromWho: fromWho || '',
            toWho: toWho || '',
            purpose: purpose || '',
            lentTo: lentTo || '',
            accountId: resolvedAccountId,
            account: accountLabel,
            date: date || Date.now()
        });

        // ── Balance updates ──────────────────────────────────────────────────
        let delta = 0;
        if (type === 'income') {
            delta = Number(amount);
        } else if (type === 'expense' || type === 'investment') {
            delta = -Number(amount);
        } else if (type === 'lend') {
            // Money leaves your account (reducing balance)
            delta = -Number(amount);
        }

        await applyBalanceDelta(req.user._id, resolvedAccountId, delta);

        const updatedUser = await User.findById(req.user._id);

        res.status(201).json({ success: true, data: transaction, user: updatedUser });
    } catch (error) {
        next(error);
    }
};

// ─── DELETE /api/savings/:id ──────────────────────────────────────────────────
const deleteTransaction = async (req, res, next) => {
    try {
        const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
        if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });

        // Reverse the balance effect
        let reverseDelta = 0;
        if (tx.type === 'income') reverseDelta = -tx.amount;
        else if (tx.type === 'expense' || tx.type === 'investment' || tx.type === 'lend') reverseDelta = tx.amount;

        await applyBalanceDelta(req.user._id, tx.accountId, reverseDelta);
        await Transaction.deleteOne({ _id: tx._id });

        const updatedUser = await User.findById(req.user._id);
        res.status(200).json({ success: true, data: {}, user: updatedUser });
    } catch (error) {
        next(error);
    }
};

// ─── PUT /api/savings/config ──────────────────────────────────────────────────
// Recalibration: sets the aggregate totalMoney from the sum of all accounts,
// OR falls back to manually-provided values if no accounts exist yet.
const updateSavingsConfig = async (req, res, next) => {
    try {
        const { monthlyIncome, savingsGoal } = req.body;

        // Re-compute totalMoney from real Account balances
        const accounts = await Account.find({ userId: req.user._id });
        const computedTotal = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

        const updates = { monthlyIncome: Number(monthlyIncome), savingsGoal: Number(savingsGoal) };

        // Use computed total only if user has accounts; else keep existing
        if (accounts.length > 0) {
            updates.totalMoney = computedTotal;
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

module.exports = { updateSavingsConfig, getTransactions, addTransaction, deleteTransaction };
