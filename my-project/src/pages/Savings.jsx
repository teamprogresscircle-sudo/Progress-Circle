import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSEO } from '../hooks/useSEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, TrendingUp, Plus, DollarSign, Settings,
    Receipt, ArrowUpCircle, ArrowDownCircle, BarChart3, CreditCard,
    Banknote, Crown, Trash2, Target, Zap, AlertTriangle, ShieldCheck,
    PiggyBank, RefreshCw, Building2, ChevronRight, CheckCircle2, X,
    HandCoins, Edit3, Save, ArrowRightLeft
} from 'lucide-react';
import { 
    BorrowPanel, InstallmentsPanel, BillsPanel, SalaryBanner, 
    InvestmentPanel, TransferModal 
} from '../components/AdvancedFinance';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { Confetti } from '../components/Confetti';
import { toast } from 'sonner';
import { PageInsight } from '../components/PageInsight';

// ─── Health Score Ring ──────────────────────────────────────────────────────
function HealthScoreRing({ score }) {
    const radius = 36;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;
    const color = score >= 75 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={radius} fill="none" stroke="#ffffff08" strokeWidth="8" />
                <motion.circle cx="45" cy="45" r={radius} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'circOut' }} strokeLinecap="round" transform="rotate(-90 45 45)"
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
                <text x="45" y="50" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">{score}</text>
            </svg>
            <p className="text-[9px] font-black uppercase tracking-widest text-pc-muted">Health Score</p>
        </div>
    );
}

// ─── Goal Card ───────────────────────────────────────────────────────────────
function GoalCard({ goal, onUpdate, onDelete }) {
    const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    const completed = pct >= 100;
    const colorMap = { indigo: '#6366f1', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', blue: '#3b82f6', purple: '#a855f7' };
    const color = colorMap[goal.color] || '#6366f1';
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`relative p-5 rounded-2xl border transition-all group ${completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 hover:border-white/10 bg-white/[0.02]'}`}>
            {completed && <div className="absolute top-3 right-3"><CheckCircle2 size={16} className="text-emerald-400" /></div>}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="text-xs font-black text-white uppercase tracking-wide">{goal.name}</p>
                    <p className="text-[10px] text-pc-muted mt-0.5">EGP {goal.currentAmount.toLocaleString()} / EGP {goal.targetAmount.toLocaleString()}</p>
                </div>
                <button onClick={() => onDelete(goal._id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'circOut' }}
                    className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}60` }} />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black" style={{ color }}>{pct}%</span>
                <button onClick={() => onUpdate(goal)} className="text-[9px] font-black uppercase tracking-widest text-pc-muted hover:text-white transition-colors flex items-center gap-1">
                    Add Funds <ChevronRight size={10} />
                </button>
            </div>
        </motion.div>
    );
}

// ─── Budget Bar ──────────────────────────────────────────────────────────────
function BudgetBar({ budget, spent, onDelete }) {
    const pct = Math.min(100, Math.round((spent / budget.monthlyLimit) * 100));
    const exceeded = pct >= 100;
    const warning = pct >= 80;
    return (
        <div className="space-y-1.5 group">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white uppercase tracking-wide">{budget.category}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black ${exceeded ? 'text-red-400' : warning ? 'text-amber-400' : 'text-pc-muted'}`}>
                        ${spent.toLocaleString()} / ${budget.monthlyLimit.toLocaleString()}
                    </span>
                    <button onClick={() => onDelete(budget._id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"><X size={11} /></button>
                </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'circOut' }}
                    className={`h-full rounded-full ${exceeded ? 'bg-red-500' : warning ? 'bg-amber-400' : 'bg-indigo-500'}`}
                    style={exceeded ? { boxShadow: '0 0 8px rgba(239,68,68,0.5)' } : {}} />
            </div>
            {exceeded && <p className="text-[9px] text-red-400 font-bold">⚠ Over by ${(spent - budget.monthlyLimit).toLocaleString()}</p>}
        </div>
    );
}

// ─── Account Row (inline editable balance) ───────────────────────────────────
function AccountRow({ account, onUpdate }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(account.balance);
    const iconMap = { cash: Banknote, bank: Building2, card: CreditCard, wallet: Wallet };
    const AccIcon = iconMap[account.type] || Wallet;

    const handleSave = async () => {
        try {
            await onUpdate(account._id, { balance: Number(val) });
            setEditing(false);
            toast.success(`${account.name} balance updated`);
        } catch {
            toast.error('Failed to update balance');
        }
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-indigo-500/20 transition-all">
            <div className="flex items-center gap-2.5">
                <AccIcon size={14} className="text-indigo-400" />
                <div>
                    <p className="text-xs font-bold text-white">{account.name}</p>
                    <p className="text-[9px] text-muted uppercase">{account.type}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {editing ? (
                    <>
                        <input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-24 bg-white/5 border border-indigo-500/40 rounded-lg px-2 py-1 text-xs text-white font-bold text-right outline-none" autoFocus />
                        <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Save size={13} /></button>
                        <button onClick={() => { setEditing(false); setVal(account.balance); }} className="text-white/20 hover:text-white transition-colors"><X size={13} /></button>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-black text-white">EGP {account.balance.toLocaleString()}</p>
                        <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-indigo-400 transition-all"><Edit3 size={12} /></button>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function Savings() {
    const { user, setUser } = useAuth();
    useSEO('Finance', 'Smart financial tracking with goals, budgets, and personalized insights.');

    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiConfig, setConfettiConfig] = useState({ theme: 'finance', variant: 'burst' });

    // Config modal
    const [showConfig, setShowConfig] = useState(false);
    const [configData, setConfigData] = useState({ monthlyIncome: user?.monthlyIncome || 0, savingsGoal: user?.savingsGoal || 50000 });

    // Modals
    const [showTxModal, setShowTxModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [fundGoal, setFundGoal] = useState(null);

    // Transaction form — smart fields
    const [txData, setTxData] = useState({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        fromWho: '',   // income only
        toWho: '',     // expense only
        purpose: '',   // expense / investment / lend
        lentTo: '',    // lend only
        accountId: '',
    });
    const [goalData, setGoalData] = useState({ name: '', targetAmount: '', color: 'indigo' });
    const [budgetData, setBudgetData] = useState({ category: '', monthlyLimit: '' });
    const [accountData, setAccountData] = useState({ name: '', type: 'bank', balance: '' });
    const [fundAmount, setFundAmount] = useState('');

    const isPremium = user?.plan === 'premium';

    const fetchAll = useCallback(async () => {
        if (!isPremium) { setLoading(false); return; }
        setLoading(true);
        try {
            const [txRes, goalRes, budgetRes, accountRes, insightRes] = await Promise.all([
                api.get('/savings'),
                api.get('/finance/goals'),
                api.get('/finance/budgets'),
                api.get('/finance/accounts'),
                api.get('/finance/insights'),
            ]);
            setTransactions(txRes.data.data);
            setGoals(goalRes.data.data);
            setBudgets(budgetRes.data.data);
            const fetchedAccounts = accountRes.data.data;
            setAccounts(fetchedAccounts);
            setInsights(insightRes.data.data);

            // Auto-set first account as default in tx form
            if (fetchedAccounts.length > 0) {
                setTxData(prev => ({ ...prev, accountId: prev.accountId || fetchedAccounts[0]._id }));
            }
        } catch {
            toast.error('Failed to load finance data');
        } finally {
            setLoading(false);
        }
    }, [isPremium]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const dashboardStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyTx = transactions.filter(t => new Date(t.date) >= startOfMonth);
        const monthlyIncome = monthlyTx.filter(t => t.type === 'income').reduce((acc, cur) => acc + cur.amount, 0);
        const monthlyExpenses = monthlyTx.filter(t => t.type === 'expense').reduce((acc, cur) => acc + cur.amount, 0);
        const monthlyInvestments = monthlyTx.filter(t => t.type === 'investment').reduce((acc, cur) => acc + cur.amount, 0);
        const monthlyLent = monthlyTx.filter(t => t.type === 'lend').reduce((acc, cur) => acc + cur.amount, 0);
        return { monthlyIncome, monthlyExpenses, monthlyInvestments, monthlyLent, netCashflow: monthlyIncome - monthlyExpenses - monthlyInvestments };
    }, [transactions]);

    const categorySpending = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const map = {};
        transactions.filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
            .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
        return map;
    }, [transactions]);

    const alerts = useMemo(() => {
        const sal = user?.monthlyIncome || 0;
        const result = [];
        if (sal > 0 && dashboardStats.monthlyExpenses > sal * 0.8)
            result.push({ msg: `You've spent ${Math.round((dashboardStats.monthlyExpenses / sal) * 100)}% of your base salary this month.`, color: 'red' });
        if (dashboardStats.netCashflow > 0)
            result.push({ msg: `Great! You saved $${dashboardStats.netCashflow.toLocaleString()} this month.`, color: 'green' });
        if (dashboardStats.monthlyLent > 0)
            result.push({ msg: `You have $${dashboardStats.monthlyLent.toLocaleString()} lent out this month.`, color: 'amber' });
        return result;
    }, [dashboardStats, user]);

    // ── Computed total from real accounts ──────────────────────────────────
    const accountsTotal = useMemo(() => accounts.reduce((sum, a) => sum + (a.balance || 0), 0), [accounts]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleConfigSave = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/savings/config', { monthlyIncome: Number(configData.monthlyIncome), savingsGoal: Number(configData.savingsGoal) });
            setUser(res.data.data);
            toast.success('Finance settings saved!');
            setShowConfig(false);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        }
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        if (!txData.accountId && accounts.length > 0) {
            toast.error('Please select an account');
            return;
        }
        try {
            const res = await api.post('/savings', { ...txData, amount: Number(txData.amount) });
            setUser(res.data.user);
            const configs = {
                income: { theme: 'income', variant: 'rain' },
                expense: { theme: 'expense', variant: 'spiral' },
                investment: { theme: 'investment', variant: 'fountain' },
                lend: { theme: 'finance', variant: 'burst' },
            };
            setConfettiConfig(configs[txData.type] || { theme: 'finance', variant: 'burst' });
            setShowConfetti(true);
            toast.success('Transaction logged!');
            setShowTxModal(false);
            setTxData(prev => ({ type: 'expense', amount: '', category: '', description: '', fromWho: '', toWho: '', purpose: '', lentTo: '', accountId: prev.accountId }));
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log transaction');
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            const res = await api.delete(`/savings/${id}`);
            if (res.data.user) setUser(res.data.user);
            toast.success('Transaction removed & balance restored');
            fetchAll();
        } catch {
            toast.error('Failed to remove transaction');
        }
    };

    const handleGoalCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/goals', { ...goalData, targetAmount: Number(goalData.targetAmount) });
            toast.success('Goal created!');
            setShowGoalModal(false);
            setGoalData({ name: '', targetAmount: '', color: 'indigo' });
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleGoalFund = async (e) => {
        e.preventDefault();
        try {
            const newAmount = fundGoal.currentAmount + Number(fundAmount);
            const completed = newAmount >= fundGoal.targetAmount;
            await api.put(`/finance/goals/${fundGoal._id}`, { currentAmount: Math.min(newAmount, fundGoal.targetAmount), isCompleted: completed });
            if (completed) { setConfettiConfig({ theme: 'income', variant: 'fountain' }); setShowConfetti(true); toast.success('🎉 Goal completed!'); }
            else toast.success('Funds added!');
            setFundGoal(null); setFundAmount(''); fetchAll();
        } catch { toast.error('Failed'); }
    };

    const handleGoalDelete = async (id) => {
        try { await api.delete(`/finance/goals/${id}`); toast.success('Goal removed'); fetchAll(); }
        catch { toast.error('Failed to remove goal'); }
    };

    const handleBudgetCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/budgets', { ...budgetData, monthlyLimit: Number(budgetData.monthlyLimit) });
            toast.success('Budget set!'); setShowBudgetModal(false); setBudgetData({ category: '', monthlyLimit: '' }); fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleBudgetDelete = async (id) => {
        try { await api.delete(`/finance/budgets/${id}`); toast.success('Budget removed'); fetchAll(); }
        catch { toast.error('Failed'); }
    };

    const handleAccountCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/accounts', { ...accountData, balance: Number(accountData.balance) });
            toast.success('Account added!'); setShowAccountModal(false); setAccountData({ name: '', type: 'bank', balance: '' }); fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleAccountUpdate = async (id, data) => {
        const res = await api.put(`/finance/accounts/${id}`, data);
        if (res.data.success) { fetchAll(); }
    };

    // ── Smart transaction label helpers ────────────────────────────────────
    const txLabels = {
        income: { who: 'From Who', whoPlaceholder: 'e.g. Client, Employer...', showPurpose: false },
        expense: { who: 'Paid To', whoPlaceholder: 'e.g. Amazon, Supermarket...', showPurpose: true, purposeLabel: 'For What', purposePlaceholder: 'e.g. Groceries, Subscription...' },
        investment: { who: 'Platform / Broker', whoPlaceholder: 'e.g. Binance, Stock App...', showPurpose: true, purposeLabel: 'Investment Target', purposePlaceholder: 'e.g. BTC, S&P500...' },
        lend: { who: 'Lent To', whoPlaceholder: 'e.g. Friend name, Family...', showPurpose: true, purposeLabel: 'Reason / Note', purposePlaceholder: 'e.g. Medical, travel help...' },
    };
    const currentLabels = txLabels[txData.type] || txLabels.expense;

    if (loading) return <LoadingSpinner />;

    if (!isPremium) {
        return (
            <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl">
                <div className="absolute inset-0 opacity-20 blur-xl pointer-events-none select-none grayscale">
                    <div className="p-10 space-y-8">
                        <div className="h-32 bg-white/10 rounded-3xl" />
                        <div className="grid grid-cols-3 gap-4"><div className="h-24 bg-white/10 rounded-2xl" /><div className="h-24 bg-white/10 rounded-2xl" /><div className="h-24 bg-white/10 rounded-2xl" /></div>
                    </div>
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 max-w-md w-full p-8 text-center bg-surface/80 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><Crown size={40} className="text-white" /></div>
                    <h2 className="text-2xl font-black text-white mb-3">Finance is PRO</h2>
                    <p className="text-muted text-sm leading-relaxed mb-6">Unlock Goals, Budgets, Smart Accounts, Health Score, and Insights.</p>
                    <Link to="/pricing"><Button className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-black uppercase tracking-widest text-sm border-none">Unlock Finance</Button></Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl relative">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.07)_0%,transparent_50%)] pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold font-manrope text-white mb-1">Finance</h1>
                        <PageInsight
                            title="Smart Finance System"
                            intro="Account-driven financial tracking. Transactions update real account balances automatically."
                            operations={[
                                { title: 'Accounts', content: 'All transactions are tied to specific accounts. Balances update in real-time on every log.' },
                                { title: 'Smart Fields', content: 'Income asks "From Who". Expenses ask "Paid To" and "For What". Lending tracks who owes you.' },
                                { title: 'Delete = Rollback', content: 'Deleting a transaction automatically reverses its balance impact.' },
                            ]}
                            neuralTip="Segment money into separate accounts by purpose — one for bills, one for savings, one for play money. This makes budget tracking effortless."
                        />
                    </div>
                    <p className="text-muted text-sm">Real-time account-driven tracking</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchAll} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted hover:text-white"><RefreshCw size={16} /></button>
                    <Button variant="secondary" onClick={() => setShowConfig(true)}><Settings size={16} className="mr-2" />Settings</Button>
                </div>
            </div>

            <SalaryBanner accounts={accounts} onConfirmed={fetchAll} />

            {/* Smart Alerts */}
            <AnimatePresence>
                {alerts.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-bold ${a.color === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-400' : a.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        {a.color === 'green' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}{a.msg}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* TOP: Net Worth + Health + Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="relative overflow-hidden bg-surface-2 border border-white/5 group min-h-[160px] flex flex-col p-8 hover:border-indigo-500/30 transition-all md:col-span-2">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-indigo-400/80 font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />Total Wealth</p>
                            <p className="text-5xl font-black text-white tracking-tighter"><span className="text-indigo-500 mr-1">$</span>{accountsTotal.toLocaleString()}</p>
                            <p className="text-[10px] text-muted/60 font-bold uppercase tracking-widest pt-2">Target: ${(user?.savingsGoal || 0).toLocaleString()}</p>
                        </div>
                        {insights && <HealthScoreRing score={insights.healthScore} />}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (accountsTotal / (user?.savingsGoal || 50000)) * 100)}%` }} transition={{ duration: 2, ease: 'circOut' }} className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    </div>
                </Card>

                {/* Accounts Panel */}
                <Card className="p-5 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted">Accounts</h3>
                        <button onClick={() => setShowAccountModal(true)} className="text-indigo-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"><Plus size={16} /></button>
                    </div>
                    {accounts.length === 0 ? (
                        <button onClick={() => setShowAccountModal(true)} className="w-full py-8 border-2 border-dashed border-white/5 rounded-2xl text-pc-muted text-xs flex flex-col items-center gap-2 hover:border-indigo-500/30 transition-all">
                            <Building2 size={20} className="opacity-40" />Add your first account
                        </button>
                    ) : (
                        <div className="space-y-2">
                            {accounts.map(acc => <AccountRow key={acc._id} account={acc} onUpdate={handleAccountUpdate} />)}
                        </div>
                    )}
                </Card>
            </div>

            {/* CASHFLOW ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Monthly In', value: `+$${dashboardStats.monthlyIncome.toLocaleString()}`, color: 'text-emerald-400', icon: ArrowUpCircle, bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                    { label: 'Monthly Burn', value: `-$${dashboardStats.monthlyExpenses.toLocaleString()}`, color: 'text-red-400', icon: ArrowDownCircle, bg: 'bg-red-500/5', border: 'border-red-500/10' },
                    { label: 'Net Saved', value: `${dashboardStats.netCashflow >= 0 ? '+' : ''}$${dashboardStats.netCashflow.toLocaleString()}`, color: dashboardStats.netCashflow >= 0 ? 'text-indigo-400' : 'text-red-400', icon: TrendingUp, bg: 'bg-indigo-500/5', border: 'border-indigo-500/10' },
                    { label: 'Invested', value: `$${dashboardStats.monthlyInvestments.toLocaleString()}`, color: 'text-white', icon: BarChart3, bg: 'bg-white/[0.02]', border: 'border-white/5' },
                ].map((s, i) => (
                    <Card key={i} className={`p-6 min-h-[120px] flex flex-col justify-center relative overflow-hidden group ${s.bg} border ${s.border}`}>
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><s.icon size={50} /></div>
                        <p className="text-[9px] font-black text-muted/60 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color} group-hover:scale-105 transition-transform origin-left`}>{s.value} EGP</p>
                    </Card>
                ))}
            </div>

            {/* MIDDLE: Goals + Budgets + Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goals */}
                <Card>
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-base font-black text-white flex items-center gap-2"><Target size={16} className="text-indigo-400" />Savings Goals</h2>
                        <Button onClick={() => setShowGoalModal(true)} className="rounded-full !py-1.5 !px-4 text-xs"><Plus size={14} className="mr-1" />New</Button>
                    </div>
                    {goals.length === 0 ? (
                        <div className="py-12 flex flex-col items-center gap-3 border-2 border-dashed border-white/5 rounded-2xl">
                            <PiggyBank size={32} className="text-muted opacity-20" />
                            <p className="text-muted text-xs">No goals yet. Create your first target!</p>
                        </div>
                    ) : <div className="space-y-3">{goals.map(g => <GoalCard key={g._id} goal={g} onUpdate={(g) => { setFundGoal(g); setFundAmount(''); }} onDelete={handleGoalDelete} />)}</div>}
                </Card>

                {/* Budgets & Analytics */}
                <div className="space-y-5">
                    <Card>
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-base font-black text-white flex items-center gap-2"><Wallet size={16} className="text-amber-400" />Budgets</h2>
                            <Button onClick={() => setShowBudgetModal(true)} variant="secondary" className="rounded-full !py-1.5 !px-4 text-xs"><Plus size={14} className="mr-1" />Add</Button>
                        </div>
                        {budgets.length === 0 ? (
                            <div className="py-8 flex flex-col items-center gap-2 border-2 border-dashed border-white/5 rounded-2xl">
                                <Wallet size={28} className="text-muted opacity-20" />
                                <p className="text-muted text-xs">Set monthly spending limits.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">{budgets.map(b => <BudgetBar key={b._id} budget={b} spent={categorySpending[b.category] || 0} onDelete={handleBudgetDelete} />)}</div>
                        )}
                    </Card>

                    {insights && Object.keys(insights.categoryAnalytics).length > 0 && (
                        <Card className="bg-white/[0.02]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Spend Breakdown</h3>
                            <div className="space-y-2">
                                {Object.entries(insights.categoryAnalytics).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, amt]) => {
                                    const total = Object.values(insights.categoryAnalytics).reduce((a, b) => a + b, 0);
                                    const pct = Math.round((amt / total) * 100);
                                    return (
                                        <div key={cat} className="flex items-center gap-3">
                                            <span className="text-[10px] w-20 font-bold text-white truncate uppercase">{cat}</span>
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-indigo-500 rounded-full" transition={{ duration: 1 }} />
                                            </div>
                                            <span className="text-[9px] font-black text-pc-muted w-8 text-right">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {insights?.insight && (
                        <div className="p-4 rounded-2xl bg-indigo-600/5 border border-indigo-500/20 flex items-start gap-3">
                            <Zap size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-zinc-300 leading-relaxed italic">"{insights.insight}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ADVANCED FINANCE SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <BorrowPanel accounts={accounts} />
                    <InstallmentsPanel accounts={accounts} />
                </div>
                <div className="space-y-6">
                    <BillsPanel accounts={accounts} />
                    <InvestmentPanel accounts={accounts} />
                </div>
            </div>

            {/* BOTTOM: History */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Receipt size={20} className="text-indigo-400" />History</h2>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setShowTransferModal(true)} variant="secondary" className="rounded-full"><ArrowRightLeft size={16} className="mr-2" />Transfer</Button>
                        <Button onClick={() => setShowTxModal(true)} className="rounded-full"><Plus size={18} className="mr-2" />Log Transaction</Button>
                    </div>
                </div>
                <div className="space-y-2">
                    {transactions.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                            <DollarSign size={48} className="mx-auto text-muted mb-4 opacity-20" />
                            <p className="text-muted font-medium text-sm">No transactions yet.</p>
                        </div>
                    ) : (
                        transactions.map(tx => {
                            const typeConfig = {
                                income: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: ArrowUpCircle, sign: '+' },
                                expense: { color: 'text-red-400', bg: 'bg-red-500/10', icon: ArrowDownCircle, sign: '-' },
                                investment: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: TrendingUp, sign: '-' },
                                lend: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: HandCoins, sign: '-' },
                            }[tx.type] || {};
                            const TypeIcon = typeConfig.icon || DollarSign;
                            // Determine the "who" label smartly
                            const whoLine = tx.type === 'income' ? tx.fromWho :
                                tx.type === 'lend' ? tx.lentTo :
                                    tx.toWho;
                            const purposeLine = tx.purpose || tx.description;

                            return (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={tx._id}
                                    className="flex justify-between items-center p-4 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all bg-surface hover:bg-surface-2 group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${typeConfig.bg} ${typeConfig.color}`}>
                                            <TypeIcon size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-white text-sm uppercase tracking-tight">{tx.category}</p>
                                                {tx.account && <span className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase bg-white/5 text-pc-muted">{tx.account}</span>}
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${typeConfig.bg} ${typeConfig.color}`}>{tx.type}</span>
                                            </div>
                                            <p className="text-[10px] text-muted font-bold mt-0.5">
                                                {new Date(tx.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                {whoLine && <span className="text-white/50 ml-2">• {whoLine}</span>}
                                                {purposeLine && <span className="text-white/30 ml-2">— {purposeLine}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className={`text-lg font-black font-mono ${typeConfig.color}`}>{typeConfig.sign}EGP {tx.amount.toLocaleString()}</p>
                                        <button onClick={() => handleDeleteTransaction(tx._id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 p-1 rounded-lg hover:bg-white/5">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* ─── MODALS ─────────────────────────────────────────────────────────── */}

            {/* Config Modal */}
            <Modal open={showConfig} title="Finance Settings" onClose={() => setShowConfig(false)}>
                <form onSubmit={handleConfigSave} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                        <p className="text-xs font-black text-indigo-300 uppercase tracking-widest">Account Balances</p>
                        <p className="text-[11px] text-muted">Edit account balances directly by hovering any account in the Accounts panel and clicking ✏.</p>
                        <p className="text-xs font-black text-white">Total: EGP {accountsTotal.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Monthly Salary (EGP)</label><input type="number" required className="pc-input w-full" value={configData.monthlyIncome} onChange={e => setConfigData({ ...configData, monthlyIncome: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Salary Day (1-31)</label><input type="number" min="1" max="31" required className="pc-input w-full" value={configData.salaryDay || user?.salaryDay || 1} onChange={e => setConfigData({ ...configData, salaryDay: e.target.value })} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Wealth Target (EGP)</label><input type="number" required className="pc-input w-full border-indigo-500/20" value={configData.savingsGoal} onChange={e => setConfigData({ ...configData, savingsGoal: e.target.value })} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowConfig(false)}>Cancel</Button><Button type="submit">Save</Button></div>
                </form>
            </Modal>

            {/* Transaction Modal */}
            <Modal open={showTxModal} title="Log Transaction" onClose={() => setShowTxModal(false)}>
                <form onSubmit={handleTransactionSubmit} className="space-y-5">
                    {/* Account Selector */}
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-2">Account</label>
                        {accounts.length === 0 ? (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-2">
                                <AlertTriangle size={14} />No accounts yet — <button type="button" onClick={() => { setShowTxModal(false); setShowAccountModal(true); }} className="underline">Add one first</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {accounts.map(acc => {
                                    const iconMap = { cash: Banknote, bank: Building2, card: CreditCard, wallet: Wallet };
                                    const AccIcon = iconMap[acc.type] || Wallet;
                                    return (
                                        <button key={acc._id} type="button" onClick={() => setTxData({ ...txData, accountId: acc._id })}
                                            className={`flex items-center gap-2 py-3 px-4 rounded-2xl border transition-all text-xs font-black ${txData.accountId === acc._id ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-surface-2 border-white/5 text-muted hover:border-white/10'}`}>
                                            <AccIcon size={14} /><span className="truncate">{acc.name}</span>
                                            <span className="ml-auto text-[9px] font-bold opacity-60">EGP {acc.balance.toLocaleString()}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-2">Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'income', label: 'Income', color: 'bg-emerald-500 border-emerald-500' },
                                { id: 'expense', label: 'Expense', color: 'bg-red-500 border-red-500' },
                                { id: 'investment', label: 'Invest', color: 'bg-indigo-500 border-indigo-500' },
                                { id: 'lend', label: 'Lend', color: 'bg-amber-500 border-amber-500' },
                            ].map(t => (
                                <button key={t.id} type="button" onClick={() => setTxData({ ...txData, type: t.id })}
                                    className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${txData.type === t.id ? t.color + ' text-white' : 'bg-surface-2 border-white/5 text-muted'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount + Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Amount (EGP)</label><input type="number" required placeholder="0.00" className="pc-input w-full" value={txData.amount} onChange={e => setTxData({ ...txData, amount: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Category</label><input type="text" required placeholder="e.g. Food, Salary..." className="pc-input w-full" value={txData.category} onChange={e => setTxData({ ...txData, category: e.target.value })} /></div>
                    </div>

                    {/* Smart Who field */}
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-2">{currentLabels.who}</label>
                        <input type="text" placeholder={currentLabels.whoPlaceholder} className="pc-input w-full"
                            value={txData.type === 'income' ? txData.fromWho : txData.type === 'lend' ? txData.lentTo : txData.toWho}
                            onChange={e => {
                                if (txData.type === 'income') setTxData({ ...txData, fromWho: e.target.value });
                                else if (txData.type === 'lend') setTxData({ ...txData, lentTo: e.target.value });
                                else setTxData({ ...txData, toWho: e.target.value });
                            }} />
                    </div>

                    {/* Smart Purpose field */}
                    {currentLabels.showPurpose && (
                        <div>
                            <label className="block text-xs font-bold text-muted uppercase mb-2">{currentLabels.purposeLabel}</label>
                            <input type="text" placeholder={currentLabels.purposePlaceholder} className="pc-input w-full" value={txData.purpose} onChange={e => setTxData({ ...txData, purpose: e.target.value })} />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Button type="button" variant="secondary" onClick={() => setShowTxModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={accounts.length === 0}>Log It</Button>
                    </div>
                </form>
            </Modal>

            {/* Goal Modal */}
            <Modal open={showGoalModal} title="New Savings Goal" onClose={() => setShowGoalModal(false)}>
                <form onSubmit={handleGoalCreate} className="space-y-4">
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Goal Name</label><input type="text" required placeholder="e.g. Laptop, Emergency Fund..." className="pc-input w-full" value={goalData.name} onChange={e => setGoalData({ ...goalData, name: e.target.value })} /></div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Target Amount ($)</label><input type="number" required placeholder="e.g. 30000" className="pc-input w-full" value={goalData.targetAmount} onChange={e => setGoalData({ ...goalData, targetAmount: e.target.value })} /></div>
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-2">Color</label>
                        <div className="flex gap-2">
                            {['indigo', 'emerald', 'amber', 'rose', 'blue', 'purple'].map(c => {
                                const map = { indigo: 'bg-indigo-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500', blue: 'bg-blue-500', purple: 'bg-purple-500' };
                                return <button type="button" key={c} onClick={() => setGoalData({ ...goalData, color: c })} className={`w-8 h-8 rounded-full ${map[c]} transition-all ${goalData.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-60'}`} />;
                            })}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowGoalModal(false)}>Cancel</Button><Button type="submit">Create Goal</Button></div>
                </form>
            </Modal>

            {/* Fund Goal Modal */}
            <Modal open={!!fundGoal} title={`Fund: ${fundGoal?.name}`} onClose={() => setFundGoal(null)}>
                <form onSubmit={handleGoalFund} className="space-y-4">
                    <p className="text-xs text-muted">Progress: <strong className="text-white">${fundGoal?.currentAmount?.toLocaleString()}</strong> of ${fundGoal?.targetAmount?.toLocaleString()}</p>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Amount to Add ($)</label><input type="number" required placeholder="0.00" className="pc-input w-full" value={fundAmount} onChange={e => setFundAmount(e.target.value)} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setFundGoal(null)}>Cancel</Button><Button type="submit">Add Funds</Button></div>
                </form>
            </Modal>

            {/* Budget Modal */}
            <Modal open={showBudgetModal} title="Set Budget" onClose={() => setShowBudgetModal(false)}>
                <form onSubmit={handleBudgetCreate} className="space-y-4">
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Category</label><input type="text" required placeholder="e.g. Food, Rent, Tech..." className="pc-input w-full" value={budgetData.category} onChange={e => setBudgetData({ ...budgetData, category: e.target.value })} /></div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Monthly Limit ($)</label><input type="number" required placeholder="e.g. 3000" className="pc-input w-full" value={budgetData.monthlyLimit} onChange={e => setBudgetData({ ...budgetData, monthlyLimit: e.target.value })} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowBudgetModal(false)}>Cancel</Button><Button type="submit">Set Budget</Button></div>
                </form>
            </Modal>

            {/* Add Account Modal */}
            <Modal open={showAccountModal} title="Add Account" onClose={() => setShowAccountModal(false)}>
                <form onSubmit={handleAccountCreate} className="space-y-4">
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Account Name</label><input type="text" required placeholder="e.g. Main Bank, Wallet..." className="pc-input w-full" value={accountData.name} onChange={e => setAccountData({ ...accountData, name: e.target.value })} /></div>
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-2">Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[{ id: 'cash', icon: Banknote }, { id: 'bank', icon: Building2 }, { id: 'card', icon: CreditCard }, { id: 'wallet', icon: Wallet }].map(t => (
                                <button key={t.id} type="button" onClick={() => setAccountData({ ...accountData, type: t.id })} className={`py-3 flex flex-col items-center gap-1 rounded-2xl border text-[9px] font-black uppercase transition-all ${accountData.type === t.id ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-surface-2 border-white/5 text-muted'}`}>
                                    <t.icon size={16} />{t.id}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Current Balance ($)</label><input type="number" required placeholder="0.00" className="pc-input w-full" value={accountData.balance} onChange={e => setAccountData({ ...accountData, balance: e.target.value })} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowAccountModal(false)}>Cancel</Button><Button type="submit">Add Account</Button></div>
                </form>
            </Modal>

            <TransferModal open={showTransferModal} onClose={() => setShowTransferModal(false)} accounts={accounts} onTransferSuccess={fetchAll} />
            <Confetti active={showConfetti} theme={confettiConfig.theme} variant={confettiConfig.variant} onComplete={() => setShowConfetti(false)} />
        </div>
    );
}
