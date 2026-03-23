const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePremium } = require('../middleware/premiumMiddleware');
const {
    getAccounts, createAccount, updateAccount,
    getGoals, createGoal, updateGoal, deleteGoal,
    getBudgets, createBudget, updateBudget, deleteBudget,
    getFinanceInsights
} = require('../controllers/financeController');
const {
    getBorrows, createBorrow, recordReturn, addBorrowNote, deleteBorrow,
    getInstallments, createInstallment, payInstallment, deleteInstallment,
    getBills, createBill, payBill, deleteBill,
    getSalaryStatus, confirmSalary,
    transferMoney, getInvestments, buyInvestment, sellInvestment
} = require('../controllers/advancedFinanceController');

router.use(protect, requirePremium);

// ── Accounts ──────────────────────────────────────────────────────────────────
router.route('/accounts').get(getAccounts).post(createAccount);
router.route('/accounts/:id').put(updateAccount);

// ── Goals ─────────────────────────────────────────────────────────────────────
router.route('/goals').get(getGoals).post(createGoal);
router.route('/goals/:id').put(updateGoal).delete(deleteGoal);

// ── Budgets ───────────────────────────────────────────────────────────────────
router.route('/budgets').get(getBudgets).post(createBudget);
router.route('/budgets/:id').put(updateBudget).delete(deleteBudget);

// ── Insights ──────────────────────────────────────────────────────────────────
router.route('/insights').get(getFinanceInsights);

// ── Borrows ───────────────────────────────────────────────────────────────────
router.route('/borrows').get(getBorrows).post(createBorrow);
router.route('/borrows/:id/return').post(recordReturn);
router.route('/borrows/:id/note').post(addBorrowNote);
router.route('/borrows/:id').delete(deleteBorrow);

// ── Installments ──────────────────────────────────────────────────────────────
router.route('/installments').get(getInstallments).post(createInstallment);
router.route('/installments/:id/pay').post(payInstallment);
router.route('/installments/:id').delete(deleteInstallment);

// ── Bills ─────────────────────────────────────────────────────────────────────
router.route('/bills').get(getBills).post(createBill);
router.route('/bills/:id/pay').post(payBill);
router.route('/bills/:id').delete(deleteBill);

// ── Salary ────────────────────────────────────────────────────────────────────
router.route('/salary-status').get(getSalaryStatus);
router.route('/salary-confirm').post(confirmSalary);

// ── Transfers ─────────────────────────────────────────────────────────────────
router.route('/transfer').post(transferMoney);

// ── Investments ───────────────────────────────────────────────────────────────
router.route('/investments').get(getInvestments);
router.route('/investments/buy').post(buyInvestment);
router.route('/investments/:id/sell').post(sellInvestment);

module.exports = router;
