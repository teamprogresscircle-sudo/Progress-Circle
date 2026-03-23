const Borrow = require('../models/Borrow');
const Installment = require('../models/Installment');
const Bill = require('../models/Bill');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const User = require('../models/User');

// ─── Helper: Recompute Total Money ───────────────────────────────────────────
async function recomputeTotalMoney(userId) {
    const accounts = await Account.find({ userId });
    const total = accounts.reduce((sum, acc) => sum + (acc.balance * (acc.exchangeRate || 1)), 0);
    await User.findByIdAndUpdate(userId, { totalMoney: total });
    return total;
}

// ─── Helper: apply balance delta ──────────────────────────────────────────────
async function applyDelta(userId, accountId, delta) {
    if (accountId) {
        await Account.findOneAndUpdate({ _id: accountId, userId }, { $inc: { balance: delta } });
    }
    await recomputeTotalMoney(userId);
}

// ─── Helper: award transaction points with daily cap ──────────────────────────
async function awardTransactionPoints(userId) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    // Count transactions created today by this user
    const todayCount = await Transaction.countDocuments({ 
        user: userId, 
        createdAt: { $gte: startOfToday } 
    });
    
    if (todayCount < 5) {
        await User.findByIdAndUpdate(userId, { $inc: { points: 2 } });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BORROW
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/finance/borrows
exports.getBorrows = async (req, res, next) => {
    try {
        const borrows = await Borrow.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: borrows });
    } catch (err) { next(err); }
};

// POST /api/finance/borrows
// When money is borrowed it ADDS to the account balance
exports.createBorrow = async (req, res, next) => {
    try {
        const { fromWho, amount, dueDate, accountId, notes, category } = req.body;
        const borrow = await Borrow.create({
            userId: req.user._id, fromWho, amount: Number(amount),
            dueDate: dueDate || null, accountId: accountId || null,
            notes: notes ? [{ text: notes }] : [],
            category: category || 'Borrow'
        });

        // Borrowed money goes INTO your account
        await applyDelta(req.user._id, accountId, Number(amount));

        // Also log it as a transaction
        await Transaction.create({
            user: req.user._id, type: 'income', amount: Number(amount),
            category: 'Borrow', fromWho, accountId: accountId || null,
            account: '', purpose: `Borrowed from ${fromWho}`
        });

        await awardTransactionPoints(req.user._id);

        res.status(201).json({ success: true, data: borrow });
    } catch (err) { next(err); }
};

// POST /api/finance/borrows/:id/return — record a partial or full return
exports.recordReturn = async (req, res, next) => {
    try {
        const { amount, note, accountId } = req.body;
        const borrow = await Borrow.findOne({ _id: req.params.id, userId: req.user._id });
        if (!borrow) return res.status(404).json({ success: false, message: 'Borrow record not found.' });

        const returnAmt = Number(amount);
        if (returnAmt <= 0) return res.status(400).json({ success: false, message: 'Return amount must be positive.' });

        borrow.amountReturned = (borrow.amountReturned || 0) + returnAmt;
        if (note) borrow.notes.push({ text: `Returned $${returnAmt}: ${note}` });

        if (borrow.amountReturned >= borrow.amount) {
            borrow.isReturned = true;
            borrow.returnedDate = new Date();
        }

        await borrow.save();

        // Deduct the returned amount from account (you're paying back)
        const deductFrom = accountId || borrow.accountId;
        await applyDelta(req.user._id, deductFrom, -returnAmt);

        // Log as a transaction
        await Transaction.create({
            user: req.user._id, type: 'expense', amount: returnAmt,
            category: 'Borrow Return', toWho: borrow.fromWho,
            accountId: deductFrom || null, account: '',
            purpose: `Returning borrowed money to ${borrow.fromWho}`
        });

        await awardTransactionPoints(req.user._id);

        res.status(200).json({ success: true, data: borrow });
    } catch (err) { next(err); }
};

// POST /api/finance/borrows/:id/note — add a note
exports.addBorrowNote = async (req, res, next) => {
    try {
        const borrow = await Borrow.findOne({ _id: req.params.id, userId: req.user._id });
        if (!borrow) return res.status(404).json({ success: false, message: 'Not found.' });
        borrow.notes.push({ text: req.body.text });
        await borrow.save();
        res.status(200).json({ success: true, data: borrow });
    } catch (err) { next(err); }
};

// DELETE /api/finance/borrows/:id
exports.deleteBorrow = async (req, res, next) => {
    try {
        const borrow = await Borrow.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!borrow) return res.status(404).json({ success: false, message: 'Not found.' });
        res.status(200).json({ success: true, data: {} });
    } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/finance/installments
exports.getInstallments = async (req, res, next) => {
    try {
        const installments = await Installment.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: installments });
    } catch (err) { next(err); }
};

// POST /api/finance/installments
exports.createInstallment = async (req, res, next) => {
    try {
        const { name, totalAmount, monthlyAmount, totalMonths, startDate, accountId, creditor, notes } = req.body;
        const inst = await Installment.create({
            userId: req.user._id, name,
            totalAmount: Number(totalAmount),
            monthlyAmount: Number(monthlyAmount),
            totalMonths: Number(totalMonths),
            startDate: startDate || Date.now(),
            accountId: accountId || null,
            creditor: creditor || '', notes: notes || ''
        });
        res.status(201).json({ success: true, data: inst });
    } catch (err) { next(err); }
};

// POST /api/finance/installments/:id/pay — pay one installment
exports.payInstallment = async (req, res, next) => {
    try {
        const { amount, note } = req.body;
        const inst = await Installment.findOne({ _id: req.params.id, userId: req.user._id });
        if (!inst) return res.status(404).json({ success: false, message: 'Installment not found.' });
        if (inst.isCompleted) return res.status(400).json({ success: false, message: 'Already completed.' });

        const payAmt = Number(amount) || inst.monthlyAmount;
        inst.payments.push({ amount: payAmt, note: note || '' });

        const totalPaid = inst.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid >= inst.totalAmount || inst.payments.length >= inst.totalMonths) {
            inst.isCompleted = true;
        }
        await inst.save();

        // Deduct from account
        await applyDelta(req.user._id, inst.accountId, -payAmt);

        // Log as transaction
        await Transaction.create({
            user: req.user._id, type: 'expense', amount: payAmt,
            category: 'Installment', toWho: inst.creditor || inst.name,
            accountId: inst.accountId || null, account: '',
            purpose: `Installment payment: ${inst.name} (Month ${inst.payments.length}/${inst.totalMonths})`
        });

        await awardTransactionPoints(req.user._id);

        res.status(200).json({ success: true, data: inst });
    } catch (err) { next(err); }
};

// DELETE /api/finance/installments/:id
exports.deleteInstallment = async (req, res, next) => {
    try {
        await Installment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.status(200).json({ success: true, data: {} });
    } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BILLS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/finance/bills
exports.getBills = async (req, res, next) => {
    try {
        const bills = await Bill.find({ userId: req.user._id, isActive: true }).sort({ dueDay: 1 });
        res.status(200).json({ success: true, data: bills });
    } catch (err) { next(err); }
};

// POST /api/finance/bills
exports.createBill = async (req, res, next) => {
    try {
        const { name, amount, dueDay, category, accountId, notes } = req.body;
        const bill = await Bill.create({
            userId: req.user._id, name,
            amount: Number(amount),
            dueDay: Number(dueDay),
            category: category || 'Bill',
            accountId: accountId || null,
            notes: notes || ''
        });
        res.status(201).json({ success: true, data: bill });
    } catch (err) { next(err); }
};

// POST /api/finance/bills/:id/pay — mark this month's bill as paid
exports.payBill = async (req, res, next) => {
    try {
        const { note } = req.body;
        const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id });
        if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });

        const now = new Date();
        const alreadyPaid = bill.payments.some(p => p.month === now.getMonth() && p.year === now.getFullYear());
        if (alreadyPaid) return res.status(400).json({ success: false, message: 'Already paid this month.' });

        bill.payments.push({ amount: bill.amount, month: now.getMonth(), year: now.getFullYear(), note: note || '' });
        await bill.save();

        // Deduct from account
        await applyDelta(req.user._id, bill.accountId, -bill.amount);

        // Log as transaction
        await Transaction.create({
            user: req.user._id, type: 'expense', amount: bill.amount,
            category: bill.category || 'Bill', toWho: bill.name,
            accountId: bill.accountId || null, account: '',
            purpose: `Bill paid: ${bill.name}`
        });

        await awardTransactionPoints(req.user._id);

        res.status(200).json({ success: true, data: bill });
    } catch (err) { next(err); }
};

// DELETE /api/finance/bills/:id
exports.deleteBill = async (req, res, next) => {
    try {
        await Bill.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.status(200).json({ success: true, data: {} });
    } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SALARY CONFIRMATION
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/finance/salary-status — returns whether salary is due
exports.getSalaryStatus = async (req, res, next) => {
    try {
        const user = req.user;
        const now = new Date();
        const today = now.getDate();
        const salaryDay = user.salaryDay || 1;
        const amount = user.monthlyIncome || 0;

        // Check if salary was already logged this month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const existingSalaryTx = await Transaction.findOne({
            user: user._id, type: 'income', category: 'Salary',
            date: { $gte: startOfMonth }
        });

        const isDue = Math.abs(today - salaryDay) <= 3; // within 3 days of salary day

        res.status(200).json({
            success: true,
            data: {
                isDue,
                alreadyReceived: !!existingSalaryTx,
                salaryDay,
                amount,
                today,
                message: isDue && !existingSalaryTx ? `Your salary day (${salaryDay}) is near. Did you receive it?` : null
            }
        });
    } catch (err) { next(err); }
};

// POST /api/finance/salary-confirm — user confirms receiving salary
exports.confirmSalary = async (req, res, next) => {
    try {
        const { amount, date, accountId, note } = req.body;
        const salaryAmt = Number(amount) || req.user.monthlyIncome;

        if (!salaryAmt || salaryAmt <= 0) {
            return res.status(400).json({ success: false, message: 'Please set your monthly income in Finance Settings first.' });
        }

        // Add to account balance
        await applyDelta(req.user._id, accountId || null, salaryAmt);

        // Log the transaction
        const tx = await Transaction.create({
            user: req.user._id, type: 'income', amount: salaryAmt,
            category: 'Salary', fromWho: 'Employer',
            accountId: accountId || null, account: '',
            description: note || '',
            date: date ? new Date(date) : new Date(),
            purpose: 'Monthly salary received'
        });

        await awardTransactionPoints(req.user._id);

        const updatedUser = await User.findById(req.user._id);
        res.status(201).json({ success: true, data: tx, user: updatedUser });
    } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFERS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/finance/transfer
exports.transferMoney = async (req, res, next) => {
    try {
        const { fromAccountId, toAccountId, amount, note, exchangeRate } = req.body;
        const userId = req.user._id;

        const fromAcc = await Account.findOne({ _id: fromAccountId, userId });
        const toAcc = await Account.findOne({ _id: toAccountId, userId });

        if (!fromAcc || !toAcc) return res.status(404).json({ success: false, message: 'Account not found.' });
        if (fromAcc.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance.' });

        // Deduct from source
        fromAcc.balance -= Number(amount);
        await fromAcc.save();

        // Calculate destination amount (handle currency diff)
        // If user provides an explicit custom rate for this transfer
        const rate = exchangeRate || 1;
        const convertedAmount = Number(amount) * rate;

        toAcc.balance += convertedAmount;
        await toAcc.save();

        // Log the transfer transaction
        await Transaction.create({
            user: userId, type: 'transfer', amount: Number(amount),
            category: 'Transfer', fromWho: fromAcc.name, toWho: toAcc.name,
            accountId: fromAccountId, transferToAccountId: toAccountId,
            purpose: note || `Transfer from ${fromAcc.name} to ${toAcc.name}`,
            isTransfer: true, originalAmount: Number(amount),
            currency: fromAcc.currency
        });

        await recomputeTotalMoney(userId);
        res.status(200).json({ success: true, message: 'Transfer successful' });
    } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/finance/investments
exports.getInvestments = async (req, res, next) => {
    try {
        const investments = await Investment.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: investments });
    } catch (err) { next(err); }
};

// POST /api/finance/investments/buy
exports.buyInvestment = async (req, res, next) => {
    try {
        const { name, quantity, purchasePrice, accountId, notes, currency } = req.body;
        const totalCost = Number(quantity) * Number(purchasePrice);

        // Check balance
        const acc = await Account.findOne({ _id: accountId, userId: req.user._id });
        if (!acc) return res.status(404).json({ success: false, message: 'Account not found.' });
        if (acc.balance < totalCost) return res.status(400).json({ success: false, message: 'Insufficient balance.' });

        const investment = await Investment.create({
            userId: req.user._id, name, quantity: Number(quantity),
            purchasePrice: Number(purchasePrice), purchaseCurrency: currency || acc.currency,
            accountId, notes: notes || ''
        });

        // Deduct from account
        await applyDelta(req.user._id, accountId, -totalCost);

        // Log transaction
        await Transaction.create({
            user: req.user._id, type: 'investment', amount: totalCost,
            category: 'Investment', toWho: name, accountId,
            purpose: `Bought ${quantity} of ${name}`, currency: currency || acc.currency
        });

        await awardTransactionPoints(req.user._id);

        res.status(201).json({ success: true, data: investment });
    } catch (err) { next(err); }
};

// POST /api/finance/investments/:id/sell
exports.sellInvestment = async (req, res, next) => {
    try {
        const { quantity, sellPrice, accountId, note } = req.body;
        const inv = await Investment.findOne({ _id: req.params.id, userId: req.user._id });
        if (!inv) return res.status(404).json({ success: false, message: 'Investment not found.' });

        const qtyToSell = Number(quantity);
        if (qtyToSell > inv.quantity) return res.status(400).json({ success: false, message: 'Not enough quantity to sell.' });

        const totalProceeds = qtyToSell * Number(sellPrice);
        const costBasis = qtyToSell * inv.purchasePrice;
        const pnl = totalProceeds - costBasis;

        inv.quantity -= qtyToSell;
        inv.sellHistory.push({
            amount: totalProceeds, quantity: qtyToSell, pnl, date: new Date()
        });

        if (inv.quantity === 0) {
            inv.status = 'sold';
        } else {
            inv.status = 'partially_sold';
        }

        await inv.save();

        // Add proceeds to account
        await applyDelta(req.user._id, accountId || inv.accountId, totalProceeds);

        // Log transaction
        await Transaction.create({
            user: req.user._id, type: 'income', amount: totalProceeds,
            category: 'Investment Sell', fromWho: inv.name, accountId: accountId || inv.accountId,
            purpose: `Sold ${qtyToSell} of ${inv.name}. P&L: ${pnl >= 0 ? '+' : ''}${pnl}`,
            currency: inv.purchaseCurrency
        });

        await awardTransactionPoints(req.user._id);

        res.status(200).json({ success: true, data: inv, pnl });
    } catch (err) { next(err); }
};

