import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSEO } from '../hooks/useSEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, TrendingUp, Plus, Receipt, ArrowUpCircle, 
    ArrowDownCircle, Banknote, Crown, Trash2, Target, AlertTriangle, 
    ShieldCheck, Building2, ChevronRight, CheckCircle2, X,
    Edit3, Save, ArrowRightLeft, User, MessageSquare, Tag, CreditCard,
    ArrowUpRight, ArrowDownLeft, MoreHorizontal, PieChart, Layers, HandCoins, FileText, RefreshCw, Zap
} from 'lucide-react';
import { SalaryBanner } from '../components/AdvancedFinance';
import { GoalsPanel, AnalyticsPanel } from '../components/SavingsExtensions';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal, FullScreenModal } from '../components/Modal';
import { PageInsight } from '../components/PageInsight';
import { Confetti } from '../components/Confetti';
import { toast } from 'sonner';

// ─── UTILS ───────────────────────────────────────────────────────────────────
function formatCurrency(amount) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── CAROUSEL ACCOUNT CARD ───────────────────────────────────────────────────
function AccountCard({ account, onUpdate, onDelete, bgClass }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(account.balance);
    const iconMap = { cash: Banknote, bank: Building2, card: CreditCard, wallet: Wallet };
    const AccIcon = iconMap[account.type] || Wallet;

    const handleSave = async (e) => {
        e.stopPropagation();
        try {
            await onUpdate(account._id, { balance: Number(val) });
            setEditing(false); toast.success('Updated');
        } catch { toast.error('Edit failed'); }
    };

    return (
        <div className={`w-72 h-44 shrink-0 snap-center rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between text-white shadow-xl ${bgClass} transition-transform hover:-translate-y-1 group`}>
            {/* Soft decorative background circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <AccIcon size={20} className="text-white drop-shadow-sm" />
                    </div>
                    <div>
                        <p className="font-semibold tracking-wide capitalize drop-shadow-sm">{account.name}</p>
                        <p className="text-xs text-white/70 font-medium capitalize">{account.type}</p>
                    </div>
                </div>
                {!editing && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors active:scale-95">
                            <Edit3 size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete this wallet?')) onDelete(account._id); }} className="p-2 text-red-300 hover:text-red-100 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors active:scale-95">
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            <div className="relative z-10">
                {editing ? (
                    <div className="flex items-end gap-2 bg-black/20 p-2 rounded-2xl backdrop-blur-md border border-white/10" onClick={e=>e.stopPropagation()}>
                        <span className="text-white/60 font-medium text-sm mb-1 line-through opacity-0">$</span>
                        <input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-full bg-transparent text-3xl font-bold text-white outline-none -ml-5 px-5" autoFocus />
                        <button onClick={handleSave} className="w-10 h-10 rounded-full bg-emerald-500/80 hover:bg-emerald-400 text-white flex items-center justify-center shrink-0 shadow-lg"><Save size={16} /></button>
                        <button onClick={() => { setEditing(false); setVal(account.balance); }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"><X size={16} /></button>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-medium text-white/70 mb-1">Available Balance</p>
                        <p className="text-3xl font-bold tracking-tight drop-shadow-md flex items-end">
                            <span className="text-xl text-white/60 font-semibold mr-1 mb-1">$</span>
                            {formatCurrency(account.balance)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── RECENT TRANSACTION ROW ──────────────────────────────────────────────────
function TransactionRow({ tx, onDelete }) {
    const isIncome = tx.type === 'income';
    const bgIcon = isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--surface)] text-[var(--muted)]';
    const TxIcon = isIncome ? ArrowDownLeft : ArrowUpRight;
    const sign = isIncome ? '+' : '-';
    
    // Friendly name map for lent/investments avoiding dense tracking text
    let title = tx.category;
    let subtitle = new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    if (tx.type === 'income' && tx.fromWho) subtitle += ` • ${tx.fromWho}`;
    if (tx.type === 'expense' && tx.toWho) subtitle += ` • ${tx.toWho}`;
    if (tx.purpose) subtitle += ` — ${tx.purpose}`;

    return (
        <div className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0 group">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bgIcon}`}>
                    <TxIcon size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <p className="text-base font-semibold text-[var(--text)] capitalize tracking-tight mb-0.5">{title}</p>
                    <p className="text-xs font-medium text-[var(--muted)] truncate max-w-[180px] sm:max-w-xs">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <p className={`text-lg font-bold tracking-tight ${isIncome ? 'text-emerald-500' : 'text-[var(--text)]'}`}>
                    {sign}${formatCurrency(tx.amount)}
                </p>
                <button onClick={() => onDelete(tx._id)} className="opacity-0 group-hover:opacity-100 p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all shrink-0">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

// ─── MAIN SAVINGS COMPONENT ──────────────────────────────────────────────────
export function Savings() {
    const { user, setUser } = useAuth();
    useSEO('Finance', 'Friendly, simple financial management.');

    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showConfetti, setShowConfetti] = useState(false);
    const [customCategory, setCustomCategory] = useState(false);
    
    // Core Modals
    const [showTxModal, setShowTxModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    
    const CATEGORIES = ['Food & Drinks', 'Salary', 'Rent & Utilities', 'Transport', 'Shopping', 'Entertainment', 'Health & Fitness', 'Other'];
    
    // Feature Modals
    const [activeService, setActiveService] = useState(null); // 'goals' | 'analytics' | null

    // Forms
    const [txData, setTxData] = useState({ type: 'expense', amount: '', category: '', description: '', fromWho: '', toWho: '', purpose: '', lentTo: '', accountId: '' });
    const [accountData, setAccountData] = useState({ name: '', type: 'bank', balance: '' });

    const isPremium = user?.plan === 'premium';

    const fetchAll = useCallback(async () => {
        if (!isPremium) { setLoading(false); return; }
        try {
            const [txRes, goalRes, budgetRes, accountRes, insightRes] = await Promise.all([
                api.get('/savings'), api.get('/finance/goals'), api.get('/finance/budgets'), api.get('/finance/accounts'), api.get('/finance/insights'),
            ]);
            setTransactions(txRes.data.data); setGoals(goalRes.data.data); setBudgets(budgetRes.data.data);
            const fetchedAccounts = accountRes.data.data;
            setAccounts(fetchedAccounts); setInsights(insightRes.data.data);
            if (fetchedAccounts.length > 0) setTxData(prev => ({ ...prev, accountId: prev.accountId || fetchedAccounts[0]._id }));
        } catch { toast.error('Check network connection.'); }
        finally { setLoading(false); }
    }, [isPremium]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const accountsTotal = useMemo(() => accounts.reduce((sum, a) => sum + (a.balance || 0), 0), [accounts]);

    const submitAPI = async (method, path, data, onSuccess) => {
        try { await api[method](path, data); onSuccess(); } catch(e) { toast.error(e.response?.data?.message || 'Action failed.'); }
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        if (!txData.accountId && accounts.length > 0) return toast.error('Please pick an account.');
        submitAPI('post', '/savings', { ...txData, amount: Number(txData.amount) }, () => {
            setShowConfetti(true); toast.success('Transaction saved!');
            setShowTxModal(false); setTxData(prev => ({ ...prev, amount: '', category: '', purpose: '' }));
            setCustomCategory(false);
            fetchAll();
        });
    };

    const handleDeleteTransaction = async (id) => submitAPI('delete', `/savings/${id}`, null, () => { toast.success('Removed.'); fetchAll(); });

    // Background gradients for account cards
    const cardGradients = [
        'bg-gradient-to-br from-indigo-500 to-purple-600',
        'bg-gradient-to-br from-[#0f172a] to-[#1e293b]', // sleek dark
        'bg-gradient-to-br from-emerald-500 to-teal-600',
        'bg-gradient-to-br from-orange-400 to-rose-500'
    ];

    if (loading) return <LoadingSpinner />;

    if (!isPremium) {
        return (
            <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
                <div className="w-20 h-20 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mb-6"><Crown size={40} /></div>
                <h2 className="text-3xl font-bold tracking-tight text-[var(--text)] mb-3">Finance</h2>
                <p className="text-[var(--muted)] text-base font-medium leading-relaxed mb-8">Unlock easy budgeting, live wallets, and gorgeous financial insights.</p>
                <Link to="/pricing" className="w-full"><Button className="w-full h-14 rounded-2xl text-base font-bold">Upgrade Now</Button></Link>
            </div>
        );
    }

    return (
        <div className="pb-32 font-sans max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
            {/* Header / Config */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">Overview</h1>
                <div className="flex gap-2">
                    <PageInsight 
                        title="Finance Hub" 
                        intro="Your central wallet control panel. Track, send, and manage liquidity seamlessly."
                        operations={[
                            { title: 'Quick Actions', content: 'Send expenses, add income, or transfer capital instantly.' },
                            { title: 'Goal Setting', content: 'Track specific targets using your dedicated savings milestones.' },
                            { title: 'Aggregated analytics', content: 'Automatically categorize and visualize exactly where your liquidity is draining.' }
                        ]}
                        neuralTip="Routine capital tracking reduces end-of-month friction. Log expenses when they happen."
                    />
                    <button onClick={fetchAll} className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all active:scale-95"><RefreshCw size={18} /></button>
                </div>
            </div>

            <SalaryBanner accounts={accounts} onConfirmed={fetchAll} />

            {/* ── CENTRAL BALANCE HERO ── */}
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm font-medium text-[var(--muted)] mb-2">Total Balance</p>
                <div className="flex items-start justify-center">
                    <span className="text-3xl text-[var(--muted)] font-medium mt-1 mr-1.5">$</span>
                    <h2 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-[var(--text)]">
                        {formatCurrency(accountsTotal)}
                    </h2>
                </div>
                {/* Insights basic message */}
                {insights?.insight && (
                    <div className="mt-6 px-4 py-2 bg-[var(--surface2)] rounded-full border border-[var(--border)] inline-flex items-center gap-2 max-w-xs mx-auto">
                        <Zap size={14} className="text-[var(--primary)] shrink-0"/>
                        <p className="text-xs font-medium text-[var(--text)] truncate">{insights.insight}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-6 sm:gap-10 pb-4">
                <button onClick={() => { setTxData({...txData, type: 'expense'}); setShowTxModal(true); }} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface2)] border border-[var(--border)] group-hover:bg-[var(--surface)] flex items-center justify-center text-[var(--text)]"><ArrowUpRight size={24} /></div>
                    <span className="text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--text)] transition-colors">Send</span>
                </button>
                <button onClick={() => { setTxData({...txData, type: 'income'}); setShowTxModal(true); }} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 hover:scale-105 flex items-center justify-center"><Plus size={28} /></div>
                    <span className="text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--text)] transition-colors">Add</span>
                </button>
                <button onClick={() => setActiveService('goals')} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface2)] border border-[var(--border)] group-hover:bg-[var(--surface)] flex items-center justify-center text-[var(--text)]"><Target size={24} /></div>
                    <span className="text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--text)] transition-colors">Goals</span>
                </button>
                <button onClick={() => setActiveService('analytics')} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface2)] border border-[var(--border)] group-hover:bg-[var(--surface)] flex items-center justify-center text-[var(--text)]"><PieChart size={24} /></div>
                    <span className="text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--text)] transition-colors">Analytics</span>
                </button>
            </div>

            {/* ── HORIZONTAL WALLETS CAROUSEL ── */}
            <section className="space-y-4 pt-4">
                <div className="flex justify-between items-end px-2">
                    <h3 className="text-lg font-bold tracking-tight text-[var(--text)]">Wallets</h3>
                    <button onClick={() => setShowAccountModal(true)} className="text-sm font-semibold text-[var(--primary)] hover:underline">Add New</button>
                </div>
                
                <div className="flex overflow-x-auto gap-4 snap-x no-scrollbar pb-6 px-1.5 -mx-1.5 scroll-smooth">
                    {accounts.length === 0 ? (
                        <button onClick={() => setShowAccountModal(true)} className="w-72 h-44 shrink-0 snap-center rounded-[2rem] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-3 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all">
                            <div className="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center"><Plus size={24} /></div>
                            <span className="font-semibold">Create First Wallet</span>
                        </button>
                    ) : (
                        accounts.map((acc, i) => (
                            <AccountCard 
                                key={acc._id} 
                                account={acc} 
                                onUpdate={(id, d) => submitAPI('put', `/finance/accounts/${id}`, d, fetchAll)} 
                                onDelete={(id) => submitAPI('delete', `/finance/accounts/${id}`, null, fetchAll)}
                                bgClass={cardGradients[i % cardGradients.length]} 
                            />
                        ))
                    )}
                </div>
            </section>

            {/* ── RECENT ACTIVITY LIST ── */}
            <section className="bg-[var(--surface2)] rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-[var(--border)]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold tracking-tight text-[var(--text)]">Recent Activity</h3>
                    <Link to="/reports" className="text-sm font-semibold text-[var(--primary)] hover:underline">See All</Link>
                </div>
                
                <div className="flex flex-col">
                    {transactions.length === 0 ? (
                        <div className="text-center py-12"><Receipt size={32} className="mx-auto text-[var(--muted)] mb-3 opacity-50" /><p className="text-sm font-medium text-[var(--muted)]">No transactions yet.</p></div>
                    ) : (
                        transactions.map(tx => <TransactionRow key={tx._id} tx={tx} onDelete={handleDeleteTransaction} />)
                    )}
                </div>
            </section>

            {/* ── MODALS & OVERLAYS ── */}

            {/* 1. Transaction Modal (Simplified & Airy) */}
            <Modal open={showTxModal} title={txData.type === 'income' ? 'Add Income' : 'Send Money'} onClose={() => setShowTxModal(false)}>
                <form onSubmit={handleTransactionSubmit} className="space-y-6 pt-2">
                    <div className="flex bg-[var(--surface2)] p-1.5 rounded-2xl border border-[var(--border)] text-sm font-semibold">
                        <button type="button" onClick={() => setTxData({...txData, type: 'expense'})} className={`flex-1 py-3 rounded-xl transition-all ${txData.type !== 'income' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)]'}`}>Expense / Send</button>
                        <button type="button" onClick={() => setTxData({...txData, type: 'income'})} className={`flex-1 py-3 rounded-xl transition-all ${txData.type === 'income' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)]'}`}>Income</button>
                    </div>

                    <div className="flex items-end justify-center py-6">
                        <span className="text-4xl text-[var(--text)] font-medium mr-2 mb-1.5 opacity-60">$</span>
                        <input type="number" step="any" required placeholder="0" className="w-full bg-transparent text-6xl font-black tracking-tighter text-[var(--text)] text-left outline-none placeholder-[var(--surface2)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" style={{ MozAppearance: 'textfield' }} value={txData.amount} onChange={e => setTxData({ ...txData, amount: e.target.value })} autoFocus />
                    </div>

                    <div className="space-y-4">
                        <select className="pc-input w-full py-4 text-base font-medium rounded-2xl" value={txData.accountId} onChange={e => setTxData({ ...txData, accountId: e.target.value })}>
                            <option value="" disabled>Select Wallet</option>
                            {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (Available: ${formatCurrency(a.balance)})</option>)}
                        </select>
                        <select 
                            required 
                            className="pc-input w-full py-4 text-base font-medium rounded-2xl" 
                            value={customCategory ? 'Other' : txData.category} 
                            onChange={e => {
                                if (e.target.value === 'Other') {
                                    setCustomCategory(true);
                                    setTxData({ ...txData, category: '' });
                                } else {
                                    setCustomCategory(false);
                                    setTxData({ ...txData, category: e.target.value });
                                }
                            }}
                        >
                            <option value="" disabled>Select Category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {customCategory && (
                            <input 
                                type="text" 
                                required 
                                placeholder="Type custom category..." 
                                className="pc-input w-full py-4 text-base font-medium rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300" 
                                value={txData.category} 
                                onChange={e => setTxData({ ...txData, category: e.target.value })} 
                                autoFocus
                            />
                        )}
                        <input type="text" placeholder={txData.type === 'income' ? 'From Who? (Optional)' : 'To Who? (Optional)'} className="pc-input w-full py-4 text-base font-medium rounded-2xl" value={txData.type === 'income' ? txData.fromWho : txData.toWho} onChange={e => {
                            if(txData.type==='income') setTxData({...txData, fromWho:e.target.value}); else setTxData({...txData, toWho:e.target.value});
                        }} />
                    </div>

                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold shadow-lg mt-4">{txData.type === 'income' ? 'Add to Balance' : 'Confirm Amount'}</Button>
                </form>
            </Modal>

            {/* 2. New Wallet Modal */}
            <Modal open={showAccountModal} title="New Wallet" onClose={() => setShowAccountModal(false)}>
                <form onSubmit={e => submitAPI('post', '/finance/accounts', { ...accountData, balance: Number(accountData.balance) }, () => { toast.success('Wallet added!'); setShowAccountModal(false); setAccountData({ name: '', type: 'bank', balance: '' }); fetchAll(); })} className="space-y-5 pt-2">
                   <input type="text" required placeholder="Card / Wallet Name" className="pc-input w-full py-4 text-base font-medium rounded-2xl" value={accountData.name} onChange={e => setAccountData({ ...accountData, name: e.target.value })} />
                   
                   <p className="text-sm font-semibold text-[var(--text)] pl-1">Wallet Type</p>
                   <div className="grid grid-cols-4 gap-2">
                       {[{ id: 'cash', icon: Banknote }, { id: 'bank', icon: Building2 }, { id: 'card', icon: CreditCard }, { id: 'wallet', icon: Wallet }].map(t => (
                           <button key={t.id} type="button" onClick={() => setAccountData({ ...accountData, type: t.id })} className={`py-4 flex flex-col items-center gap-2 rounded-2xl border-2 transition-all ${accountData.type === t.id ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--surface)] border-transparent text-[var(--muted)] hover:bg-[var(--surface2)]'}`}><t.icon size={20} /><span className="text-xs font-semibold capitalize">{t.id}</span></button>
                       ))}
                   </div>

                   <input type="number" required placeholder="Initial Balance ($)" className="pc-input w-full py-4 text-base font-medium rounded-2xl" value={accountData.balance} onChange={e => setAccountData({ ...accountData, balance: e.target.value })} />
                   <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold mt-2">Create Wallet</Button>
                </form>
            </Modal>
            
            {/* Modal for App Features */}
            <FullScreenModal open={activeService === 'goals'} onClose={() => setActiveService(null)} title="Savings Goals">
                <div className="max-w-2xl mx-auto py-6"><GoalsPanel goals={goals} onRefresh={fetchAll} /></div>
            </FullScreenModal>
            
            <FullScreenModal open={activeService === 'analytics'} onClose={() => setActiveService(null)} title="Expense Analytics">
                <div className="max-w-2xl mx-auto py-6"><AnalyticsPanel transactions={transactions} /></div>
            </FullScreenModal>

            <Confetti active={showConfetti} theme="finance" variant="burst" onComplete={() => setShowConfetti(false)} />
        </div>
    );
}
