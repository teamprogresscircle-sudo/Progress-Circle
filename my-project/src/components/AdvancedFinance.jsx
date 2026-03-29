import { useState, useEffect, useCallback } from 'react';
import {
    HandCoins, AlertTriangle, CheckCircle2, Clock, Trash2, Plus,
    FileText, CreditCard, Banknote, Building2,
    Wallet, DollarSign, X,
    TrendingUp, Layers, ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Modal } from './Modal';
import { PageInsight } from './PageInsight';

// ─── Helper: days until due ───────────────────────────────────────────────────
function daysUntil(date) {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── OPTIMIZED COMMON TOKENS ──────────────────────────────────────────────────
// Removes heavy borders so the component natively sits inside the FullScreenModal
const GLASS_CARD = "w-full max-w-4xl mx-auto";
const GLASS_ROW = "p-4 md:p-5 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 bg-[var(--surface)] hover:bg-[var(--surface2)] transition-colors group";
const INPUT_STYLE = "pc-input w-full"; // Reduced from massive hardcoded classes
const H2_STYLE = "text-sm font-black text-[var(--text)] uppercase tracking-widest flex items-center gap-3";
const SUBTITLE_STYLE = "text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest mt-1";

// ─── BORROW PANEL ─────────────────────────────────────────────────────────────
export function BorrowPanel({ accounts }) {
    const [borrows, setBorrows] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [returnModal, setReturnModal] = useState(null);
    const [noteModal, setNoteModal] = useState(null);
    const [form, setForm] = useState({ fromWho: '', amount: '', dueDate: '', accountId: '', notes: '', category: 'Borrow' });
    const [returnForm, setReturnForm] = useState({ amount: '', note: '', accountId: '' });

    const fetchBorrows = useCallback(async () => {
        try { const r = await api.get('/finance/borrows'); setBorrows(r.data.data); } catch { }
    }, []);

    useEffect(() => { fetchBorrows(); }, [fetchBorrows]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/borrows', { ...form, amount: Number(form.amount) });
            toast.success('Funds injected.');
            setShowModal(false); setForm({ fromWho: '', amount: '', dueDate: '', accountId: '', notes: '', category: 'Borrow' });
            fetchBorrows();
        } catch (err) { toast.error('Failed'); }
    };

    const handleReturn = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/finance/borrows/${returnModal._id}/return`, returnForm);
            setReturnModal(null); setReturnForm({ amount: '', note: '', accountId: '' });
            fetchBorrows();
        } catch (err) { toast.error('Failed'); }
    };

    const handleAddNote = async (e, id) => {
        e.preventDefault();
        try { await api.post(`/finance/borrows/${id}/note`, { text: noteModal.text }); setNoteModal(null); fetchBorrows(); } 
        catch { toast.error('Failed'); }
    };

    const handleDelete = async (id) => {
        try { await api.delete(`/finance/borrows/${id}`); fetchBorrows(); }
        catch { toast.error('Failed'); }
    };

    const totalOwed = borrows.filter(b => !b.isReturned).reduce((sum, b) => sum + (b.amount - (b.amountReturned || 0)), 0);

    return (
        <div className={GLASS_CARD}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <div>
                    <h2 className={H2_STYLE}>
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center"><HandCoins size={14} /></div> Active Borrowing
                    </h2>
                    {totalOwed > 0 && <p className={SUBTITLE_STYLE}>Outstanding Deficit: EGP {totalOwed.toLocaleString()}</p>}
                </div>
                <div className="flex gap-3 items-center">
                    <PageInsight 
                        title="Active Borrowing" 
                        intro="Comprehensive debt tracking. Keep relational and financial vectors transparent."
                        operations={[
                            { title: 'Liability Directives', content: 'Assign exactly who, how much, and when the countdown expires.' },
                            { title: 'Settle Deficits', content: 'Partially or completely cover deficits and log settlement contexts.' }
                        ]}
                    />
                    <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest hover:bg-amber-500/20"><Plus size={12} className="inline mr-1" /> Request</button>
                </div>
            </div>

            {borrows.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-3 text-[var(--muted)] border-2 border-dashed border-[var(--border)] rounded-2xl">
                    <HandCoins size={28} className="opacity-50" />
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Zero liabilities detected.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {borrows.map(b => {
                        const remaining = b.amount - (b.amountReturned || 0);
                        const pct = Math.min(100, Math.round(((b.amountReturned || 0) / b.amount) * 100));
                        const due = daysUntil(b.dueDate);
                        const isOverdue = due !== null && due < 0 && !b.isReturned;
                        
                        return (
                            <div key={b._id} className={`${GLASS_ROW} ${b.isReturned ? '!border-emerald-500/20 !bg-emerald-500/5 opacity-60' : isOverdue ? '!border-red-500/30 !bg-red-500/5' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${b.isReturned ? 'bg-emerald-500/10 text-emerald-500' : isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {b.isReturned ? <CheckCircle2 size={16} /> : isOverdue ? <AlertTriangle size={16} /> : <Clock size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)] tracking-tight">{b.fromWho}</p>
                                            <p className="text-[9px] text-[var(--muted)] font-mono tracking-widest uppercase">{new Date(b.borrowedDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-black text-amber-500 font-mono">EGP {b.amount.toLocaleString()}</p>
                                        {!b.isReturned && b.amountReturned > 0 && <p className="text-[10px] text-[var(--muted)] tracking-widest mt-0.5">COVERED: EGP {b.amountReturned.toLocaleString()}</p>}
                                    </div>
                                </div>

                                {!b.isReturned && (
                                    <div className="h-1 bg-[var(--surface2)] border border-[var(--border)] rounded-full overflow-hidden mt-4">
                                        <div className="h-full bg-amber-500 transition-all duration-300 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                )}

                                {b.dueDate && !b.isReturned && (
                                    <div className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1">
                                        <span className={isOverdue ? 'text-red-500' : 'text-[var(--muted)]'}>
                                            {isOverdue ? `CRITICAL: Overdue by ${Math.abs(due)} days` : `Countdown: ${due} days`}
                                        </span>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-3">
                                    {!b.isReturned ? (
                                        <>
                                            <button onClick={() => { setReturnModal(b); setReturnForm({ amount: remaining, note: '', accountId: accounts[0]?._id||'' }); }} className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500/20 active:scale-95 transition-all">Settle Default</button>
                                            <button onClick={() => setNoteModal({ id: b._id, text: '' })} className="flex-1 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all">Context</button>
                                        </>
                                    ) : <button onClick={() => handleDelete(b._id)} className="text-[9px] text-[var(--muted)] hover:text-red-500 transition-colors uppercase font-black tracking-widest">Wipe Record</button>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal open={showModal} title="Liability Directives" onClose={() => setShowModal(false)}>
                <form onSubmit={handleCreate} className="space-y-4">
                    <input required type="text" placeholder="Entity Name" className={INPUT_STYLE} value={form.fromWho} onChange={e => setForm({...form, fromWho: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                        <input required type="number" placeholder="Capital ($)" className={INPUT_STYLE} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                        <input type="date" className={INPUT_STYLE} value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                    </div>
                    <select className={INPUT_STYLE} value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})}>
                        <option value="">Unassigned Node</option>
                        {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                    <textarea className={`${INPUT_STYLE} resize-none`} rows={2} placeholder="Optional Context..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                    <div className="pt-2"><Button type="submit" className="w-full h-12">Execute Liability</Button></div>
                </form>
            </Modal>
            
            <Modal open={!!returnModal} title="Settle Liability" onClose={() => setReturnModal(null)}>
                <form onSubmit={handleReturn} className="space-y-4">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-black">Deficit Remaining: <span className="text-[var(--text)]">EGP {(returnModal?.amount - (returnModal?.amountReturned||0)).toLocaleString()}</span></p>
                    <input required type="number" placeholder="Return Amount" className={INPUT_STYLE} value={returnForm.amount} onChange={e => setReturnForm({...returnForm, amount: e.target.value})} />
                    <select className={INPUT_STYLE} value={returnForm.accountId} onChange={e => setReturnForm({...returnForm, accountId: e.target.value})}>
                        <option value="">Bypass Tracking</option>
                        {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                    <input type="text" placeholder="Settlement Notes" className={INPUT_STYLE} value={returnForm.note} onChange={e => setReturnForm({...returnForm, note: e.target.value})} />
                    <div className="pt-2"><Button type="submit" className="w-full h-12 bg-emerald-500 hover:bg-emerald-600">Settle</Button></div>
                </form>
            </Modal>

            <Modal open={!!noteModal} title="Attach Context" onClose={() => setNoteModal(null)}>
                <form onSubmit={e => handleAddNote(e, noteModal?.id)} className="space-y-4">
                    <textarea required className={`${INPUT_STYLE} resize-none`} rows={3} placeholder="Intelligence..." value={noteModal?.text || ''} onChange={e => setNoteModal(prev => ({...prev, text: e.target.value}))} />
                    <Button type="submit" className="w-full h-12 uppercase tracking-widest font-bold">Commit</Button>
                </form>
            </Modal>
        </div>
    );
}

// ─── INSTALLMENTS PANEL ───────────────────────────────────────────────────────
export function InstallmentsPanel({ accounts }) {
    const [installments, setInstallments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [payModal, setPayModal] = useState(null);
    const [form, setForm] = useState({ name: '', totalAmount: '', monthlyAmount: '', totalMonths: '', startDate: '', accountId: '', creditor: '', notes: '' });
    const [payNote, setPayNote] = useState('');

    const fetchInstallments = useCallback(async () => {
        try { const r = await api.get('/finance/installments'); setInstallments(r.data.data); } catch { }
    }, []);

    useEffect(() => { fetchInstallments(); }, [fetchInstallments]);

    const handleCreate = async (e) => { e.preventDefault(); try { await api.post('/finance/installments', { ...form, totalAmount: Number(form.totalAmount), monthlyAmount: Number(form.monthlyAmount), totalMonths: Number(form.totalMonths) }); setShowModal(false); fetchInstallments(); } catch {} };
    const handlePay = async (e) => { e.preventDefault(); try { await api.post(`/finance/installments/${payModal._id}/pay`, { note: payNote }); setPayModal(null); setPayNote(''); fetchInstallments(); } catch {} };

    return (
        <div className={GLASS_CARD}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <h2 className={H2_STYLE}><div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><CreditCard size={14} /></div> Fixed Payments</h2>
                <div className="flex gap-3 items-center">
                    <PageInsight 
                        title="Fixed Payments" 
                        intro="Structured multi-cycle payment architecture."
                        operations={[
                            { title: 'Payment Setup', content: 'Set net limits, cycle size, and the amount of months required for fulfillment.' },
                            { title: 'Fulfill Cycle', content: 'Instantly deduct funds to step closer to settling fixed payment structures.' }
                        ]}
                    />
                    <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-widest hover:bg-blue-500/20"><Plus size={12} className="inline mr-1" /> Plan</button>
                </div>
            </div>

            {installments.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-3 text-[var(--muted)] border-2 border-dashed border-[var(--border)] rounded-2xl">
                    <CreditCard size={28} className="opacity-50" />
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-50">No structural plans.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {installments.map(inst => {
                        const paidAmt = inst.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                        const pct = Math.min(100, Math.round((paidAmt / inst.totalAmount) * 100));
                        const paidMonths = inst.payments?.length || 0;
                        const remaining = inst.totalMonths - paidMonths;
                        
                        return (
                            <div key={inst._id} className={`${GLASS_ROW} ${inst.isCompleted ? '!border-emerald-500/20 !bg-emerald-500/5' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-[var(--text)] tracking-tight">{inst.name}</p>
                                            {inst.isCompleted && <CheckCircle2 size={14} className="text-emerald-500" />}
                                        </div>
                                        {inst.creditor && <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest mt-0.5">Vector: {inst.creditor}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-blue-500 tracking-widest">EGP {paidAmt.toLocaleString()} <span className="opacity-50">/ {inst.totalAmount.toLocaleString()}</span></p>
                                        <p className="text-[9px] text-[var(--muted)] font-mono tracking-widest uppercase mt-0.5">Cycle {paidMonths} of {inst.totalMonths}</p>
                                    </div>
                                </div>
                                
                                <div className="h-1 bg-[var(--surface2)] border border-[var(--border)] rounded-full overflow-hidden mb-3">
                                    <div className={`h-full rounded-full ${inst.isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%`, transition: 'width 0.3s' }} />
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-[var(--muted)] tracking-widest font-black uppercase">{remaining > 0 ? `${remaining} cycles remaining • $${inst.monthlyAmount.toLocaleString()}/mo` : 'Settled'}</span>
                                    {!inst.isCompleted && (
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => { setPayModal(inst); setPayNote(''); }} className="text-[9px] font-black uppercase tracking-[0.2em] bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg"><DollarSign size={12} className="inline mr-1 -mt-0.5" /> Fulfill Cycle</button>
                                            <button onClick={async () => { await api.delete(`/finance/installments/${inst._id}`); fetchInstallments(); }} className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-500 transition-all p-1"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal open={showModal} title="Establish Structure" onClose={() => setShowModal(false)}>
                <form onSubmit={handleCreate} className="space-y-4">
                    <input required type="text" placeholder="Designation" className={INPUT_STYLE} value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                        <input required type="number" placeholder="Net Limit ($)" className={INPUT_STYLE} value={form.totalAmount} onChange={e => setForm({...form, totalAmount:e.target.value})} />
                        <input required type="number" placeholder="Cycle Size ($)" className={INPUT_STYLE} value={form.monthlyAmount} onChange={e => setForm({...form, monthlyAmount:e.target.value})} />
                        <input required type="number" placeholder="Cycles" className={INPUT_STYLE} value={form.totalMonths} onChange={e => setForm({...form, totalMonths:e.target.value})} />
                        <input type="text" placeholder="Creditor" className={INPUT_STYLE} value={form.creditor} onChange={e => setForm({...form, creditor:e.target.value})} />
                    </div>
                    <select className={INPUT_STYLE} value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})}>
                        <option value="">Unassigned Node</option>
                        {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                    <div className="pt-2"><Button type="submit" className="w-full h-12">Assemble</Button></div>
                </form>
            </Modal>

            <Modal open={!!payModal} title={`Fulfill: ${payModal?.name}`} onClose={() => setPayModal(null)}>
                <form onSubmit={handlePay} className="space-y-4">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-black">Deducting <span className="text-[var(--text)]">${payModal?.monthlyAmount?.toLocaleString()}</span></p>
                    <input type="text" placeholder="Transaction Context..." className={INPUT_STYLE} value={payNote} onChange={e => setPayNote(e.target.value)} />
                    <Button type="submit" className="w-full h-12 uppercase">Authorize</Button>
                </form>
            </Modal>
        </div>
    );
}

// ─── BILLS PANEL ──────────────────────────────────────────────────────────────
export function BillsPanel({ accounts }) {
    const [bills, setBills] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [payNote, setPayNote] = useState({});
    const [form, setForm] = useState({ name: '', amount: '', dueDay: '', category: 'Bill', accountId: '', notes: '' });

    const fetchBills = useCallback(async () => {
        try { const r = await api.get('/finance/bills'); setBills(r.data.data); } catch { }
    }, []);
    useEffect(() => { fetchBills(); }, [fetchBills]);

    const handleCreate = async (e) => { e.preventDefault(); try { await api.post('/finance/bills', { ...form, amount: Number(form.amount), dueDay: Number(form.dueDay) }); setShowModal(false); fetchBills(); } catch {} };
    const handlePay = async (billId) => { try { await api.post(`/finance/bills/${billId}/pay`, { note: payNote[billId] || '' }); fetchBills(); } catch(e) { toast.error('Check status'); } };

    const today = new Date().getDate();

    return (
        <div className={GLASS_CARD}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <h2 className={H2_STYLE}><div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center"><FileText size={14} /></div> Mandatory Bills</h2>
                <div className="flex gap-3 items-center">
                    <PageInsight 
                        title="Mandatory Bills" 
                        intro="Automated cycle tracking for recurring liabilities."
                        operations={[
                            { title: 'Register Liability', content: 'Input specific amounts and exact cycle dates (e.g., day 15).' },
                            { title: 'Status Tracking', content: 'System automatically flags CRITICAL when dates are missed and SECURED when completely paid.' }
                        ]}
                        neuralTip="Automate bill transfers immediately after your salary deposits to lock in mandatory liquidity."
                    />
                    <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-bold uppercase tracking-widest hover:bg-rose-500/20"><Plus size={12} className="inline mr-1" /> Add</button>
                </div>
            </div>

            {bills.length === 0 ? (
                 <div className="py-8 flex flex-col items-center gap-3 text-[var(--muted)] border-2 border-dashed border-[var(--border)] rounded-2xl">
                     <FileText size={28} className="opacity-50" />
                     <p className="text-[10px] uppercase font-black tracking-widest opacity-50">System cleared.</p>
                 </div>
            ) : (
                <div className="space-y-3">
                    {bills.map(bill => {
                        const now = new Date();
                        const paidThisMonth = bill.payments?.some(p => p.month === now.getMonth() && p.year === now.getFullYear());
                        const daysUntilDue = bill.dueDay - today;
                        const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;
                        const isOverdue = daysUntilDue < 0 && !paidThisMonth;
                        
                        return (
                            <div key={bill._id} className={`${GLASS_ROW} ${paidThisMonth ? '!border-emerald-500/20 !bg-emerald-500/5 opacity-60' : isOverdue ? '!border-red-500/30 !bg-red-500/5' : isDueSoon ? '!border-amber-500/20 !bg-amber-500/5' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="text-sm font-bold text-[var(--text)] tracking-tight">{bill.name}</p>
                                            <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${isOverdue ? 'bg-red-500/20 text-red-500' : isDueSoon && !paidThisMonth ? 'bg-amber-500/20 text-amber-500' : paidThisMonth ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[var(--surface2)] text-[var(--muted)] border border-[var(--border)]'}`}>
                                                {paidThisMonth ? 'SECURED' : isOverdue ? 'CRITICAL' : isDueSoon ? 'WARNING' : `D-${daysUntilDue > 0 ? daysUntilDue : bill.dueDay}`}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-[var(--muted)] font-black uppercase tracking-widest">Cycle: Day {bill.dueDay}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <p className="text-sm font-black text-rose-500 font-mono tracking-tighter">EGP {bill.amount.toLocaleString()}</p>
                                        {!paidThisMonth && (
                                            <button onClick={() => handlePay(bill._id)} className="text-[9px] font-black uppercase tracking-[0.2em] bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg">Clear</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal open={showModal} title="Register Bill" onClose={() => setShowModal(false)}>
                <form onSubmit={handleCreate} className="space-y-4">
                    <input required type="text" placeholder="Designation" className={INPUT_STYLE} value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                        <input required type="number" placeholder="Output ($)" className={INPUT_STYLE} value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
                        <input required type="number" min="1" max="31" placeholder="Cycle Trigger" className={INPUT_STYLE} value={form.dueDay} onChange={e => setForm({...form, dueDay:e.target.value})} />
                        <input type="text" placeholder="Category" className={INPUT_STYLE} value={form.category} onChange={e => setForm({...form, category:e.target.value})} />
                        <select className={INPUT_STYLE} value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})}>
                            <option value="">Unassigned Node</option>
                            {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div className="pt-2"><Button type="submit" className="w-full h-12 uppercase tracking-widest bg-rose-500 hover:bg-rose-600">Inject</Button></div>
                </form>
            </Modal>
        </div>
    );
}

// ─── SALARY BANNER ────────────────────────────────────────────────────────────
export function SalaryBanner({ accounts, onConfirmed }) {
    const { user } = useAuth();
    const [salaryStatus, setSalaryStatus] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [form, setForm] = useState({ amount: user?.monthlyIncome || '', date: new Date().toISOString().split('T')[0], accountId: '', note: '' });

    useEffect(() => { if (user?.plan === 'premium') api.get('/finance/salary-status').then(r => setSalaryStatus(r.data.data)).catch(() => {}); }, [user]);

    if (!salaryStatus?.isDue || salaryStatus?.alreadyReceived || dismissed) return null;

    return (
        <>
            <div className="p-4 rounded-[1.5rem] bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]"><Banknote size={18} /></div>
                    <div>
                        <p className="text-sm font-black text-[var(--text)] tracking-widest uppercase">Inbound Capital Cycle Expected</p>
                        <p className="text-[10px] text-[var(--muted)] tracking-widest mt-0.5">Has the payload cleared?</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button onClick={() => { setForm({ ...form, amount: user?.monthlyIncome || '', accountId: accounts[0]?._id || '' }); setShowModal(true); }} className="flex-1 sm:flex-none h-10 px-4 text-xs tracking-widest uppercase">Confirm</Button>
                    <button onClick={() => setDismissed(true)} className="p-2 text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] rounded-lg"><X size={14} /></button>
                </div>
            </div>

            <Modal open={showModal} title="Confirm Ingress" onClose={() => setShowModal(false)}>
                <form onSubmit={async (e) => { e.preventDefault(); await api.post('/finance/salary-confirm', { ...form, amount: Number(form.amount) }); setShowModal(false); onConfirmed(); }} className="space-y-4">
                    <input required type="number" placeholder="Payload ($)" className={INPUT_STYLE} value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
                    <input type="date" className={INPUT_STYLE} value={form.date} onChange={e => setForm({...form, date:e.target.value})} />
                    <select className={INPUT_STYLE} value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})}>
                        {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                    <Button type="submit" className="w-full h-12">Log Capital</Button>
                </form>
            </Modal>
        </>
    );
}

// ─── INVESTMENTS PANEL ────────────────────────────────────────────────────────
export function InvestmentPanel({ accounts }) {
    const [investments, setInvestments] = useState([]);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [sellModal, setSellModal] = useState(null);
    const [buyForm, setBuyForm] = useState({ name: '', quantity: '1', purchasePrice: '', accountId: '', currency: 'EGP', notes: '' });
    const [sellForm, setSellForm] = useState({ quantity: '', sellPrice: '', accountId: '', note: '' });

    const fetchInvestments = useCallback(async () => {
        try { const r = await api.get('/finance/investments'); setInvestments(r.data.data); } catch { }
    }, []);
    useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

    const activeInvestments = investments.filter(inv => inv.status !== 'sold');
    const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);

    return (
        <div className={GLASS_CARD}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <div>
                    <h2 className={H2_STYLE}><div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Layers size={14} /></div> Asset Protocol</h2>
                    {totalInvested > 0 && <p className={SUBTITLE_STYLE}>Deployed Assets: EGP {totalInvested.toLocaleString()}</p>}
                </div>
                <div className="flex gap-3 items-center">
                    <PageInsight 
                        title="Asset Protocol" 
                        intro="Deployed asset tracking for long-term equity evaluation."
                        operations={[
                            { title: 'Deploy Capital', content: 'Purchase assets tracking volume and entry price per unit.' },
                            { title: 'Liquidate', content: 'Sell assets to compute historical P&L automatically.' }
                        ]}
                    />
                    <button onClick={() => setShowBuyModal(true)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/20"><Plus size={12} className="inline mr-1" /> Acquire</button>
                </div>
            </div>

            {investments.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-3 text-[var(--muted)] border-2 border-dashed border-[var(--border)] rounded-2xl">
                    <Layers size={28} className="opacity-50" />
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Capital undeployed.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {investments.map(inv => {
                        const historyPnl = inv.sellHistory?.reduce((sum, h) => sum + (h.pnl || 0), 0) || 0;
                        const isSold = inv.status === 'sold';
                        return (
                            <div key={inv._id} className={`${GLASS_ROW} ${isSold ? 'opacity-50' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isSold ? 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)]' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                            <Building2 size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)] tracking-tight">{inv.name}</p>
                                            <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest font-mono mt-0.5">{inv.quantity} UNI • {inv.purchasePrice} {inv.purchaseCurrency}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-[var(--text)] font-mono tracking-tighter">EGP {(inv.quantity * inv.purchasePrice).toLocaleString()}</p>
                                        {historyPnl !== 0 && (
                                            <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${historyPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                P&L: {historyPnl >= 0 ? '+' : ''}{historyPnl.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {!isSold && (
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => { setSellModal(inv); setSellForm({ quantity: inv.quantity, sellPrice: inv.purchasePrice, accountId: inv.accountId, note: '' }); }} className="flex-1 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] transition-colors text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text)]">Liquidate</button>
                                        <button onClick={async () => { if(window.confirm('Delete node?')) { await api.delete(`/finance/investments/${inv._id}`); fetchInvestments(); } }} className="px-2 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal open={showBuyModal} title="Asset Acquisition" onClose={() => setShowBuyModal(false)}>
                <form onSubmit={async (e) => { e.preventDefault(); await api.post('/finance/investments/buy', buyForm); setShowBuyModal(false); fetchInvestments(); setBuyForm({...buyForm, name:'', quantity:'1', purchasePrice:'' }) }} className="space-y-4">
                    <input required type="text" placeholder="Entity (e.g. BTC)" className={INPUT_STYLE} value={buyForm.name} onChange={e => setBuyForm({...buyForm, name:e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                        <input required type="number" step="any" placeholder="Volume" className={INPUT_STYLE} value={buyForm.quantity} onChange={e => setBuyForm({...buyForm, quantity:e.target.value})} />
                        <input required type="number" step="any" placeholder="Entry $" className={INPUT_STYLE} value={buyForm.purchasePrice} onChange={e => setBuyForm({...buyForm, purchasePrice:e.target.value})} />
                    </div>
                    <select required className={INPUT_STYLE} value={buyForm.accountId} onChange={e => setBuyForm({...buyForm, accountId:e.target.value})}>
                        <option value="">Origin Account</option>
                        {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                    <div className="pt-2"><Button type="submit" className="w-full h-12">Deploy Capital</Button></div>
                </form>
            </Modal>

            <Modal open={!!sellModal} title="Action: Liquidate" onClose={() => setSellModal(null)}>
                <form onSubmit={async (e) => { e.preventDefault(); await api.post(`/finance/investments/${sellModal._id}/sell`, sellForm); setSellModal(null); fetchInvestments(); }} className="space-y-4">
                    <p className="text-[10px] text-[var(--muted)] uppercase font-black tracking-widest">Secured: <span className="text-[var(--text)]">{sellModal?.quantity}</span> @ {sellModal?.purchasePrice}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <input required type="number" step="any" placeholder="Vol to dump" className={INPUT_STYLE} value={sellForm.quantity} onChange={e => setSellForm({...sellForm, quantity:e.target.value})} />
                        <input required type="number" step="any" placeholder="Exit Price/Unit" className={INPUT_STYLE} value={sellForm.sellPrice} onChange={e => setSellForm({...sellForm, sellPrice:e.target.value})} />
                    </div>
                    <select required className={INPUT_STYLE} value={sellForm.accountId} onChange={e => setSellForm({...sellForm, accountId:e.target.value})}>
                        {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                    <div className="pt-2"><Button type="submit" className="w-full h-12 bg-white text-black hover:bg-white/80">Authorize Sale</Button></div>
                </form>
            </Modal>
        </div>
    );
}

// ─── TRANSFER MODAL ───────────────────────────────────────────────────────────
export function TransferModal({ open, onClose, accounts, onTransferSuccess }) {
    const [form, setForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', note: '', exchangeRate: '1' });

    return (
        <Modal open={open} title="Capital Reallocation" onClose={onClose}>
            <form onSubmit={async (e) => { e.preventDefault(); await api.post('/finance/transfer', {...form, amount:Number(form.amount), exchangeRate:Number(form.exchangeRate)}); onTransferSuccess(); onClose(); }} className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <select required className="bg-transparent text-sm font-bold text-[var(--text)] w-full outline-none" value={form.fromAccountId} onChange={e => setForm({...form, fromAccountId: e.target.value})}>
                        <option value="">Origin Node</option>
                        {accounts.map(a => <option key={a._id} value={a._id}>{a.name} ({a.balance})</option>)}
                    </select>
                    <ArrowRightLeft size={16} className="text-[var(--muted)]" />
                    <select required className="bg-transparent text-sm font-bold text-[var(--text)] w-full outline-none text-right" value={form.toAccountId} onChange={e => setForm({...form, toAccountId: e.target.value})}>
                        <option value="">Dest Node</option>
                        {accounts.map(a => <option key={a._id} value={a._id} disabled={a._id === form.fromAccountId}>{a.name}</option>)}
                    </select>
                </div>
                <input required type="number" placeholder="Payload Volume ($)" className={INPUT_STYLE} value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
                <Button type="submit" className="w-full h-12 uppercase tracking-widest">Reallocate</Button>
            </form>
        </Modal>
    );
}
