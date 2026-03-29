import { useState, useMemo } from 'react';
import { Target, Plus, PieChart, TrendingUp, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { PageInsight } from './PageInsight';
import api from '../api/client';
import { toast } from 'sonner';

const H2_STYLE = "text-xl font-black bg-gradient-to-br from-[var(--text)] to-[var(--muted)] bg-clip-text text-transparent flex items-center gap-3 uppercase tracking-tighter";
const SUBTITLE_STYLE = "text-xs font-bold text-[var(--muted)] mt-1 ml-11";
const GLASS_CARD = "p-6 rounded-[2rem] bg-[var(--surface2)] border border-[var(--border)] shadow-sm";

function formatCurrency(amount) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function GoalsPanel({ goals, onRefresh }) {
    const [showModal, setShowModal] = useState(false);
    const [fundModal, setFundModal] = useState({ show: false, goal: null, amount: '' });
    const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/goals', { ...newGoal, targetAmount: Number(newGoal.targetAmount) });
            toast.success('Goal created successfully.');
            setNewGoal({ name: '', targetAmount: '' });
            setShowModal(false);
            onRefresh();
        } catch (err) { toast.error('Failed to create goal.'); }
    };

    const handleFund = async (e) => {
        e.preventDefault();
        if (!fundModal.goal) return;
        try {
            const added = Number(fundModal.amount);
            const newTotal = (fundModal.goal.currentAmount || 0) + added;
            const isCompleted = newTotal >= fundModal.goal.targetAmount;
            
            await api.put(`/finance/goals/${fundModal.goal._id}`, { 
                currentAmount: newTotal,
                status: isCompleted ? 'completed' : 'active'
            });
            toast.success(`Added $${formatCurrency(added)} to goal!`);
            setFundModal({ show: false, goal: null, amount: '' });
            onRefresh();
        } catch (err) { toast.error('Failed to fund goal.'); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/finance/goals/${id}`);
            toast.success('Goal removed.');
            onRefresh();
        } catch (err) { toast.error('Failed to delete goal.'); }
    };

    return (
        <div className={GLASS_CARD}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <div>
                    <h2 className={H2_STYLE}><div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Target size={14} /></div> Savings Goals</h2>
                    <p className={SUBTITLE_STYLE}>Track targets and build wealth</p>
                </div>
                <div className="flex items-center gap-3">
                    <PageInsight 
                        title="Savings Targets" 
                        intro="Allocate capital efficiently by defining exact milestones."
                        operations={[
                            { title: 'Create Goal', content: 'Define what you are saving for and set a specific target amount.' },
                            { title: 'Fund & Track', content: 'Manually top up your goals. We track the remaining deficit dynamically.' }
                        ]}
                    />
                    <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/20"><Plus size={12} className="inline mr-1" /> New Goal</button>
                </div>
            </div>

            {goals.length === 0 ? (
                <div className="text-center py-12">
                    <Target size={32} className="mx-auto text-[var(--muted)] mb-3 opacity-50" />
                    <p className="text-sm font-medium text-[var(--muted)]">No active savings goals.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {goals.map(g => {
                        const pct = Math.min(100, Math.round(((g.currentAmount || 0) / g.targetAmount) * 100));
                        const isDone = pct >= 100;
                        return (
                            <div key={g._id} className="p-5 rounded-[1.5rem] bg-[var(--surface)] border border-[var(--border)] group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-base font-bold text-[var(--text)] capitalize flex items-center gap-2">
                                            {g.name}
                                            {isDone && <ShieldCheck size={14} className="text-emerald-500" />}
                                        </h4>
                                        <p className="text-xs font-medium text-[var(--muted)] mt-0.5">
                                            ${formatCurrency(g.currentAmount || 0)} saved of ${formatCurrency(g.targetAmount)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!isDone && (
                                            <button onClick={() => setFundModal({ show: true, goal: g, amount: '' })} className="text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 px-2 py-1 rounded">Fund</button>
                                        )}
                                        <button onClick={() => handleDelete(g._id)} className="text-xs font-bold text-red-500 hover:bg-red-500/10 px-2 py-1 rounded">Delete</button>
                                    </div>
                                </div>
                                <div className="h-2.5 w-full bg-[var(--surface2)] rounded-full overflow-hidden relative">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} title="New Goal">
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                    <input type="text" required placeholder="Goal Title (e.g. Vacation, Emergency Fund)" className="pc-input w-full py-4 text-sm font-medium rounded-2xl" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
                    <input type="number" required placeholder="Target Amount ($)" className="pc-input w-full py-4 text-sm font-medium rounded-2xl" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} />
                    <Button type="submit" className="w-full py-4 rounded-xl font-bold mt-2">Initialize Goal</Button>
                </form>
            </Modal>

            <Modal open={fundModal.show} onClose={() => setFundModal({ show: false, goal: null, amount: '' })} title="Fund Goal">
                <form onSubmit={handleFund} className="space-y-4 pt-4">
                    <p className="text-sm text-[var(--muted)] font-medium mb-4">Adding funds to <strong>{fundModal.goal?.name}</strong>.</p>
                    <input type="number" required placeholder="Amount to Add ($)" className="pc-input w-full py-4 text-sm font-medium rounded-2xl" value={fundModal.amount} onChange={e => setFundModal({ ...fundModal, amount: e.target.value })} autoFocus />
                    <Button type="submit" className="w-full py-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 mt-2">Confirm Funding</Button>
                </form>
            </Modal>
        </div>
    );
}

export function AnalyticsPanel({ transactions }) {
    
    // Calculate grouped expenses
    const { categoryData, totalExpenses } = useMemo(() => {
        let total = 0;
        const categories = {};
        
        transactions.forEach(tx => {
            if (tx.type === 'expense') {
                const amount = Number(tx.amount) || 0;
                total += amount;
                const cat = (tx.category || 'Uncategorized').toLowerCase();
                categories[cat] = (categories[cat] || 0) + amount;
            }
        });

        // Convert to array and sort by highest spending
        const dataArr = Object.entries(categories)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        return { categoryData: dataArr, totalExpenses: total };
    }, [transactions]);

    const maxCategoryAmount = categoryData.length > 0 ? categoryData[0].amount : 0;

    return (
        <div className={GLASS_CARD}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <div>
                    <h2 className={H2_STYLE}><div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center"><PieChart size={14} /></div> Expense Analytics</h2>
                    {totalExpenses > 0 && <p className={SUBTITLE_STYLE}>Total Spent: ${formatCurrency(totalExpenses)}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <PageInsight 
                        title="Categorical Insight" 
                        intro="Identify exactly where your capital is leaking."
                        operations={[
                            { title: 'Automatic Logging', content: 'Every expense logged on the dashboard is tallied here instantly.' },
                            { title: 'Highest Cost Analysis', content: 'Items are automatically sorted by volume so you can cut the most expensive habits first.' }
                        ]}
                    />
                </div>
            </div>

            {categoryData.length === 0 ? (
                <div className="text-center py-12">
                    <TrendingUp size={32} className="mx-auto text-[var(--muted)] mb-3 opacity-50" />
                    <p className="text-sm font-medium text-[var(--muted)]">No expense data found.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {categoryData.map((cat, idx) => {
                        const pctOfMax = (cat.amount / maxCategoryAmount) * 100;
                        const pctOfTotal = (cat.amount / totalExpenses) * 100;
                        return (
                            <div key={idx} className="relative group">
                                <div className="flex justify-between items-end mb-1.5">
                                    <p className="text-sm font-bold text-[var(--text)] capitalize tracking-tight">{cat.name}</p>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-[var(--text)]">${formatCurrency(cat.amount)}</p>
                                        <p className="text-[10px] font-bold text-[var(--muted)]">{pctOfTotal.toFixed(1)}% of total</p>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-[var(--surface)] rounded-md overflow-hidden flex">
                                    <div 
                                        className="h-full rounded-md transition-all duration-1000 bg-violet-500"
                                        style={{ width: `${pctOfMax}%` }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
