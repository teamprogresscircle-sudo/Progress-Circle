import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HandCoins, AlertTriangle, CheckCircle2, Clock, Trash2, Plus,
    ChevronDown, ChevronUp, FileText, CreditCard, Banknote, Building2,
    Wallet, RotateCcw, DollarSign, Calendar, MessageSquare, X, RefreshCw,
    TrendingUp, TrendingDown, Layers, ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';

// ─── Helper: days until due ───────────────────────────────────────────────────
function daysUntil(date) {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── BORROW PANEL ─────────────────────────────────────────────────────────────
export function BorrowPanel({ accounts }) {
    const [borrows, setBorrows] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [returnModal, setReturnModal] = useState(null);
    const [noteModal, setNoteModal] = useState(null);
    const [expanded, setExpanded] = useState({});
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
            toast.success('Borrow recorded & balance updated!');
            setShowModal(false);
            setForm({ fromWho: '', amount: '', dueDate: '', accountId: '', notes: '', category: 'Borrow' });
            fetchBorrows();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleReturn = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/finance/borrows/${returnModal._id}/return`, returnForm);
            toast.success('Return recorded!');
            setReturnModal(null);
            setReturnForm({ amount: '', note: '', accountId: '' });
            fetchBorrows();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleAddNote = async (e, id) => {
        e.preventDefault();
        try {
            await api.post(`/finance/borrows/${id}/note`, { text: noteModal.text });
            toast.success('Note added');
            setNoteModal(null);
            fetchBorrows();
        } catch { toast.error('Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this borrow record?')) return;
        try { await api.delete(`/finance/borrows/${id}`); toast.success('Removed'); fetchBorrows(); }
        catch { toast.error('Failed'); }
    };

    const totalOwed = borrows.filter(b => !b.isReturned).reduce((sum, b) => sum + (b.amount - (b.amountReturned || 0)), 0);

    return (
        <Card>
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                        <HandCoins size={16} className="text-amber-400" />Borrowed Money
                    </h2>
                    {totalOwed > 0 && <p className="text-[10px] text-amber-400 font-bold mt-0.5">Total outstanding: EGP {totalOwed.toLocaleString()}</p>}
                </div>
                <Button onClick={() => setShowModal(true)} className="rounded-full !py-1.5 !px-4 text-xs bg-amber-500 hover:bg-amber-600 border-none">
                    <Plus size={14} className="mr-1" />Borrow
                </Button>
            </div>

            {borrows.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 border-2 border-dashed border-white/5 rounded-2xl">
                    <HandCoins size={28} className="text-muted opacity-20" />
                    <p className="text-muted text-xs">No active borrows. Good financial health!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {borrows.map(b => {
                        const remaining = b.amount - (b.amountReturned || 0);
                        const pct = Math.min(100, Math.round(((b.amountReturned || 0) / b.amount) * 100));
                        const due = daysUntil(b.dueDate);
                        const isOverdue = due !== null && due < 0 && !b.isReturned;
                        return (
                            <motion.div key={b._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`rounded-2xl border p-4 transition-all ${b.isReturned ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60' : isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {b.isReturned ? <CheckCircle2 size={14} className="text-emerald-400" /> : isOverdue ? <AlertTriangle size={14} className="text-red-400" /> : <Clock size={14} className="text-amber-400" />}
                                        <div>
                                            <p className="text-xs font-black text-white">{b.fromWho}</p>
                                            <p className="text-[9px] text-muted">{new Date(b.borrowedDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-amber-400">EGP {b.amount.toLocaleString()}</p>
                                        {!b.isReturned && b.amountReturned > 0 && <p className="text-[9px] text-muted">Returned: EGP {b.amountReturned.toLocaleString()}</p>}
                                    </div>
                                </div>

                                {!b.isReturned && (
                                    <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-amber-400 rounded-full" />
                                    </div>
                                )}

                                {b.dueDate && !b.isReturned && (
                                    <p className={`text-[9px] font-bold mt-1 ${isOverdue ? 'text-red-400' : 'text-muted'}`}>
                                        {isOverdue ? `Overdue by ${Math.abs(due)} days` : `Due in ${due} days`}
                                    </p>
                                )}

                                {b.isReturned && <p className="text-[9px] text-emerald-400 font-bold mt-1">✓ Fully returned {b.returnedDate ? `on ${new Date(b.returnedDate).toLocaleDateString()}` : ''}</p>}

                                {/* Expand notes */}
                                <button onClick={() => setExpanded(prev => ({ ...prev, [b._id]: !prev[b._id] }))}
                                    className="text-[9px] text-muted hover:text-white mt-2 flex items-center gap-1 transition-colors">
                                    <FileText size={10} /> {b.notes.length} note{b.notes.length !== 1 ? 's' : ''} {expanded[b._id] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </button>
                                <AnimatePresence>
                                    {expanded[b._id] && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 space-y-1 overflow-hidden">
                                            {b.notes.map(n => (
                                                <div key={n._id} className="flex gap-2 text-[9px] text-zinc-400 bg-white/5 rounded-xl px-3 py-2">
                                                    <span className="text-muted">{new Date(n.date).toLocaleDateString()}</span>
                                                    <span>—</span><span>{n.text}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Actions */}
                                {!b.isReturned && (
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => { setReturnModal(b); setReturnForm({ amount: remaining, note: '', accountId: accounts[0]?._id || '' }); }}
                                            className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1">
                                            <RotateCcw size={11} />Return
                                        </button>
                                        <button onClick={() => setNoteModal({ id: b._id, text: '' })}
                                            className="flex-1 py-1.5 rounded-xl bg-white/5 text-muted text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-1">
                                            <MessageSquare size={11} />Note
                                        </button>
                                        <button onClick={() => handleDelete(b._id)} className="py-1.5 px-3 rounded-xl hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                                    </div>
                                )}
                                {b.isReturned && <button onClick={() => handleDelete(b._id)} className="mt-2 text-[9px] text-white/20 hover:text-red-400 transition-colors">Remove record</button>}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Borrow Modal */}
            <Modal open={showModal} title="Record Borrowing" onClose={() => setShowModal(false)}>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                        💡 Recording this will <strong>add</strong> the amount to your selected account balance.
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Borrowed From</label><input required type="text" placeholder="Name of person or bank..." className="pc-input w-full" value={form.fromWho} onChange={e => setForm({ ...form, fromWho: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Amount ($)</label><input required type="number" placeholder="0.00" className="pc-input w-full" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Due Date (Optional)</label><input type="date" className="pc-input w-full" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Add to Account</label>
                        <select className="pc-input w-full" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>
                            <option value="">No specific account</option>
                            {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                        </select>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Initial Note (Optional)</label><textarea className="pc-input w-full resize-none" rows={2} placeholder="Any context..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Record Borrow</Button></div>
                </form>
            </Modal>

            {/* Return Modal */}
            <Modal open={!!returnModal} title={`Return — ${returnModal?.fromWho}`} onClose={() => setReturnModal(null)}>
                <form onSubmit={handleReturn} className="space-y-4">
                    <p className="text-xs text-muted">Remaining: <strong className="text-white">EGP {(returnModal?.amount - (returnModal?.amountReturned || 0)).toLocaleString()}</strong></p>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Amount Returning ($)</label><input required type="number" className="pc-input w-full" value={returnForm.amount} onChange={e => setReturnForm({ ...returnForm, amount: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Deduct From Account</label>
                            <select className="pc-input w-full" value={returnForm.accountId} onChange={e => setReturnForm({ ...returnForm, accountId: e.target.value })}>
                                <option value="">None</option>
                                {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Note (Optional)</label><input type="text" placeholder="e.g. Paid half..." className="pc-input w-full" value={returnForm.note} onChange={e => setReturnForm({ ...returnForm, note: e.target.value })} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setReturnModal(null)}>Cancel</Button><Button type="submit">Record Return</Button></div>
                </form>
            </Modal>

            {/* Note Modal */}
            <Modal open={!!noteModal} title="Add Note" onClose={() => setNoteModal(null)}>
                <form onSubmit={(e) => handleAddNote(e, noteModal?.id)} className="space-y-4">
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Note</label><textarea required className="pc-input w-full resize-none" rows={3} placeholder="Add context, reminder..." value={noteModal?.text || ''} onChange={e => setNoteModal(prev => ({ ...prev, text: e.target.value }))} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setNoteModal(null)}>Cancel</Button><Button type="submit">Add Note</Button></div>
                </form>
            </Modal>
        </Card>
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

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/installments', { ...form, totalAmount: Number(form.totalAmount), monthlyAmount: Number(form.monthlyAmount), totalMonths: Number(form.totalMonths) });
            toast.success('Installment plan created!');
            setShowModal(false);
            setForm({ name: '', totalAmount: '', monthlyAmount: '', totalMonths: '', startDate: '', accountId: '', creditor: '', notes: '' });
            fetchInstallments();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/finance/installments/${payModal._id}/pay`, { note: payNote });
            toast.success('Payment logged & balance deducted!');
            setPayModal(null); setPayNote(''); fetchInstallments();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                    <CreditCard size={16} className="text-blue-400" />Installments
                </h2>
                <Button onClick={() => setShowModal(true)} variant="secondary" className="rounded-full !py-1.5 !px-4 text-xs">
                    <Plus size={14} className="mr-1" />New Plan
                </Button>
            </div>

            {installments.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 border-2 border-dashed border-white/5 rounded-2xl">
                    <CreditCard size={28} className="text-muted opacity-20" />
                    <p className="text-muted text-xs">No installment plans. Add a monthly payment plan.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {installments.map(inst => {
                        const paidAmt = inst.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                        const pct = Math.min(100, Math.round((paidAmt / inst.totalAmount) * 100));
                        const paidMonths = inst.payments?.length || 0;
                        const remaining = inst.totalMonths - paidMonths;
                        return (
                            <motion.div key={inst._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-2xl border group ${inst.isCompleted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02] hover:border-blue-500/20'} transition-all`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-black text-white">{inst.name}</p>
                                            {inst.isCompleted && <CheckCircle2 size={12} className="text-emerald-400" />}
                                        </div>
                                        {inst.creditor && <p className="text-[9px] text-muted">To: {inst.creditor}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-blue-400">EGP {paidAmt.toLocaleString()} / EGP {inst.totalAmount.toLocaleString()}</p>
                                        <p className="text-[9px] text-muted">{paidMonths}/{inst.totalMonths} months</p>
                                    </div>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${inst.isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} transition={{ duration: 1 }} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-muted">{remaining > 0 ? `${remaining} months left • $${inst.monthlyAmount.toLocaleString()}/mo` : 'Completed'}</span>
                                    {!inst.isCompleted && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setPayModal(inst); setPayNote(''); }}
                                                className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1">
                                                <DollarSign size={10} />Pay Month
                                            </button>
                                            <button onClick={async () => { await api.delete(`/finance/installments/${inst._id}`); toast.success('Plan removed'); fetchInstallments(); }}
                                                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1"><Trash2 size={12} /></button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            <Modal open={showModal} title="New Installment Plan" onClose={() => setShowModal(false)}>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><label className="block text-xs font-bold text-muted uppercase mb-2">Plan Name</label><input required type="text" placeholder="e.g. Car, Laptop, Phone..." className="pc-input w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Total Amount ($)</label><input required type="number" placeholder="e.g. 12000" className="pc-input w-full" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Monthly Payment ($)</label><input required type="number" placeholder="e.g. 1000" className="pc-input w-full" value={form.monthlyAmount} onChange={e => setForm({ ...form, monthlyAmount: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Duration (Months)</label><input required type="number" placeholder="e.g. 12" className="pc-input w-full" value={form.totalMonths} onChange={e => setForm({ ...form, totalMonths: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Creditor / Owed To</label><input type="text" placeholder="e.g. Bank, Store..." className="pc-input w-full" value={form.creditor} onChange={e => setForm({ ...form, creditor: e.target.value })} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Deduct From Account</label>
                        <select className="pc-input w-full" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>
                            <option value="">No account linked</option>
                            {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Create Plan</Button></div>
                </form>
            </Modal>

            {/* Pay Modal */}
            <Modal open={!!payModal} title={`Pay: ${payModal?.name}`} onClose={() => setPayModal(null)}>
                <form onSubmit={handlePay} className="space-y-4">
                    <p className="text-xs text-muted">Monthly amount: <strong className="text-white">${payModal?.monthlyAmount?.toLocaleString()}</strong> will be deducted from <em className="text-indigo-300">{accounts.find(a => a._id === payModal?.accountId)?.name || 'linked account'}</em>.</p>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Note (Optional)</label><input type="text" placeholder="e.g. Paid on time..." className="pc-input w-full" value={payNote} onChange={e => setPayNote(e.target.value)} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button><Button type="submit">Confirm Payment</Button></div>
                </form>
            </Modal>
        </Card>
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

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/bills', { ...form, amount: Number(form.amount), dueDay: Number(form.dueDay) });
            toast.success('Bill added!');
            setShowModal(false);
            setForm({ name: '', amount: '', dueDay: '', category: 'Bill', accountId: '', notes: '' });
            fetchBills();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handlePay = async (billId) => {
        try {
            await api.post(`/finance/bills/${billId}/pay`, { note: payNote[billId] || '' });
            toast.success('Bill paid & balance deducted!');
            setPayNote(prev => ({ ...prev, [billId]: '' }));
            fetchBills();
        } catch (err) { toast.error(err.response?.data?.message || 'Already paid this month'); }
    };

    const today = new Date().getDate();

    return (
        <Card>
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                    <FileText size={16} className="text-rose-400" />Bills
                </h2>
                <Button onClick={() => setShowModal(true)} variant="secondary" className="rounded-full !py-1.5 !px-4 text-xs">
                    <Plus size={14} className="mr-1" />Add Bill
                </Button>
            </div>

            {bills.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 border-2 border-dashed border-white/5 rounded-2xl">
                    <FileText size={28} className="text-muted opacity-20" />
                    <p className="text-muted text-xs">No recurring bills tracked yet.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {bills.map(bill => {
                        const now = new Date();
                        const paidThisMonth = bill.payments?.some(p => p.month === now.getMonth() && p.year === now.getFullYear());
                        const daysUntilDue = bill.dueDay - today;
                        const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;
                        const isOverdue = daysUntilDue < 0 && !paidThisMonth;
                        return (
                            <motion.div key={bill._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 group transition-all ${paidThisMonth ? 'border-emerald-500/10 bg-emerald-500/5 opacity-60' : isOverdue ? 'border-red-500/30 bg-red-500/5' : isDueSoon ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-black text-white">{bill.name}</p>
                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${isOverdue ? 'bg-red-500/20 text-red-400' : isDueSoon && !paidThisMonth ? 'bg-amber-500/20 text-amber-400' : paidThisMonth ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-muted'}`}>
                                            {paidThisMonth ? '✓ Paid' : isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : `Day ${bill.dueDay}`}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-muted mt-0.5">{bill.category} • Due every {bill.dueDay}{['st','nd','rd'][bill.dueDay - 1] || 'th'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-black text-rose-400">EGP {bill.amount.toLocaleString()}</p>
                                    {!paidThisMonth && (
                                        <button onClick={() => handlePay(bill._id)}
                                            className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1">
                                            <DollarSign size={10} />Pay
                                        </button>
                                    )}
                                    <button onClick={async () => { await api.delete(`/finance/bills/${bill._id}`); toast.success('Bill removed'); fetchBills(); }}
                                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <Modal open={showModal} title="Add Recurring Bill" onClose={() => setShowModal(false)}>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Bill Name</label><input required type="text" placeholder="e.g. Rent, Internet, Netflix..." className="pc-input w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Amount ($)</label><input required type="number" placeholder="0.00" className="pc-input w-full" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Due Day (1-31)</label><input required type="number" min="1" max="31" placeholder="e.g. 15" className="pc-input w-full" value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Category</label><input type="text" placeholder="e.g. Utilities, Rent..." className="pc-input w-full" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Account</label>
                            <select className="pc-input w-full" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>
                                <option value="">No account</option>
                                {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Add Bill</Button></div>
                </form>
            </Modal>
        </Card>
    );
}

// ─── SALARY BANNER ────────────────────────────────────────────────────────────
export function SalaryBanner({ accounts, onConfirmed }) {
    const { user } = useAuth();
    const [salaryStatus, setSalaryStatus] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [form, setForm] = useState({ amount: user?.monthlyIncome || '', date: new Date().toISOString().split('T')[0], accountId: '', note: '' });

    useEffect(() => {
        if (user?.plan !== 'premium') return;
        api.get('/finance/salary-status').then(r => setSalaryStatus(r.data.data)).catch(() => { });
    }, [user]);

    const handleConfirm = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/salary-confirm', { ...form, amount: Number(form.amount) });
            toast.success('Salary added successfully!');
            setShowModal(false);
            setSalaryStatus(prev => ({ ...prev, alreadyReceived: true }));
            if (onConfirmed) onConfirmed();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    if (!salaryStatus?.isDue || salaryStatus?.alreadyReceived || dismissed) return null;

    return (
        <>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center"><DollarSign size={18} className="text-indigo-400" /></div>
                    <div>
                        <p className="text-sm font-black text-white">Salary Day is Near 💰</p>
                        <p className="text-[10px] text-muted">Day {salaryStatus.salaryDay} — Did you receive your salary?</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button onClick={() => { setForm({ ...form, amount: user?.monthlyIncome || '', accountId: accounts[0]?._id || '' }); setShowModal(true); }} className="!py-2 !px-4 text-xs rounded-xl">Yes, Add It</Button>
                    <button onClick={() => setDismissed(true)} className="text-muted hover:text-white transition-colors p-1"><X size={16} /></button>
                </div>
            </motion.div>

            <Modal open={showModal} title="Confirm Salary Receipt" onClose={() => setShowModal(false)}>
                <form onSubmit={handleConfirm} className="space-y-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/10 text-indigo-300 text-xs">
                        You can adjust the date if you received it early or it was delayed.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Amount ($)</label><input required type="number" className="pc-input w-full" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Date Received</label><input type="date" className="pc-input w-full" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Add to Account</label>
                        <select className="pc-input w-full" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>
                            <option value="">No specific account</option>
                            {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                        </select>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Note (Optional)</label><input type="text" placeholder="e.g. Received early / Had deductions..." className="pc-input w-full" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Confirm & Add</Button></div>
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

    const handleBuy = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/investments/buy', buyForm);
            toast.success('Investment recorded!');
            setShowBuyModal(false);
            setBuyForm({ name: '', quantity: '1', purchasePrice: '', accountId: '', currency: 'EGP', notes: '' });
            fetchInvestments();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleSell = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/finance/investments/${sellModal._id}/sell`, sellForm);
            toast.success('Sale recorded & profit/loss added to account!');
            setSellModal(null);
            setSellForm({ quantity: '', sellPrice: '', accountId: '', note: '' });
            fetchInvestments();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const activeInvestments = investments.filter(inv => inv.status !== 'sold');
    const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);

    return (
        <Card>
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                        <Layers size={16} className="text-indigo-400" />Investments
                    </h2>
                    {totalInvested > 0 && <p className="text-[10px] text-indigo-400 font-bold mt-0.5">Active Capital: EGP {totalInvested.toLocaleString()}</p>}
                </div>
                <Button onClick={() => setShowBuyModal(true)} variant="secondary" className="rounded-full !py-1.5 !px-4 text-xs">
                    <Plus size={14} className="mr-1" />Buy New
                </Button>
            </div>

            {investments.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 border-2 border-dashed border-white/5 rounded-2xl">
                    <Layers size={28} className="text-muted opacity-20" />
                    <p className="text-muted text-xs">No investments yet. Track Gold, Stocks, or Crypto.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {investments.map(inv => {
                        const historyPnl = inv.sellHistory?.reduce((sum, h) => sum + (h.pnl || 0), 0) || 0;
                        const isSold = inv.status === 'sold';
                        return (
                            <motion.div key={inv._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-2xl border transition-all ${isSold ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60' : 'border-white/5 bg-white/[0.02]'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSold ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                            <Building2 size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white">{inv.name}</p>
                                            <p className="text-[9px] text-muted">{inv.quantity} units @ {inv.purchasePrice} {inv.purchaseCurrency}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-white">Value: EGP {(inv.quantity * inv.purchasePrice).toLocaleString()}</p>
                                        {historyPnl !== 0 && (
                                            <p className={`text-[9px] font-bold ${historyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                Realized P&L: {historyPnl >= 0 ? '+' : ''}{historyPnl.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {!isSold && (
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => { setSellModal(inv); setSellForm({ quantity: inv.quantity, sellPrice: inv.purchasePrice, accountId: inv.accountId, note: '' }); }}
                                            className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase hover:bg-emerald-500/20 transition-all">
                                            Sell Asset
                                        </button>
                                        <button onClick={async () => { if(window.confirm('Delete record?')) { await api.delete(`/finance/investments/${inv._id}`); fetchInvestments(); } }}
                                            className="px-3 rounded-xl hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Buy Modal */}
            <Modal open={showBuyModal} title="Record Investment Purchase" onClose={() => setShowBuyModal(false)}>
                <form onSubmit={handleBuy} className="space-y-4">
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Asset Name</label><input required type="text" placeholder="e.g. BTC, Apple Stock, Gold..." className="pc-input w-full" value={buyForm.name} onChange={e => setBuyForm({ ...buyForm, name: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Quantity</label><input required type="number" step="any" placeholder="1.00" className="pc-input w-full" value={buyForm.quantity} onChange={e => setBuyForm({ ...buyForm, quantity: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Buy Price (per unit)</label><input required type="number" step="any" placeholder="0.00" className="pc-input w-full" value={buyForm.purchasePrice} onChange={e => setBuyForm({ ...buyForm, purchasePrice: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Currency</label>
                            <select className="pc-input w-full" value={buyForm.currency} onChange={e => setBuyForm({ ...buyForm, currency: e.target.value })}>
                                <option value="EGP">EGP (Egyptian Pound)</option>
                                <option value="USD">USD (US Dollar)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="SAR">SAR (Saudi Riyal)</option>
                                <option value="AED">AED (UAE Dirham)</option>
                            </select>
                        </div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Deduct From</label>
                            <select required className="pc-input w-full" value={buyForm.accountId} onChange={e => setBuyForm({ ...buyForm, accountId: e.target.value })}>
                                <option value="">Select Account</option>
                                {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setShowBuyModal(false)}>Cancel</Button><Button type="submit">Log Investment</Button></div>
                </form>
            </Modal>

            {/* Sell Modal */}
            <Modal open={!!sellModal} title={`Sell ${sellModal?.name}`} onClose={() => setSellModal(null)}>
                <form onSubmit={handleSell} className="space-y-4">
                    <p className="text-xs text-muted">Owned: <strong className="text-white">{sellModal?.quantity} units</strong> bought @ {sellModal?.purchasePrice} {sellModal?.purchaseCurrency}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Quantity to Sell</label><input required type="number" step="any" className="pc-input w-full" value={sellForm.quantity} onChange={e => setSellForm({ ...sellForm, quantity: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-muted uppercase mb-2">Sell Price (per unit)</label><input required type="number" step="any" className="pc-input w-full" value={sellForm.sellPrice} onChange={e => setSellForm({ ...sellForm, sellPrice: e.target.value })} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-muted uppercase mb-2">Add Proceeds To</label>
                        <select required className="pc-input w-full" value={sellForm.accountId} onChange={e => setSellForm({ ...sellForm, accountId: e.target.value })}>
                            {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button type="button" variant="secondary" onClick={() => setSellModal(null)}>Cancel</Button><Button type="submit">Confirm Sale</Button></div>
                </form>
            </Modal>
        </Card>
    );
}

// ─── TRANSFER MODAL ───────────────────────────────────────────────────────────
export function TransferModal({ open, onClose, accounts, onTransferSuccess }) {
    const [form, setForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', note: '', exchangeRate: '1' });
    const [loading, setLoading] = useState(false);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/finance/transfer', { ...form, amount: Number(form.amount), exchangeRate: Number(form.exchangeRate) });
            toast.success('Funds transferred successfully!');
            onTransferSuccess();
            onClose();
            setForm({ fromAccountId: '', toAccountId: '', amount: '', note: '', exchangeRate: '1' });
        } catch (err) { toast.error(err.response?.data?.message || 'Transfer failed'); }
        finally { setLoading(false); }
    };

    const fromAcc = accounts.find(a => a._id === form.fromAccountId);
    const toAcc = accounts.find(a => a._id === form.toAccountId);
    const isCurrencyDiff = fromAcc && toAcc && fromAcc.currency !== toAcc.currency;

    return (
        <Modal open={open} title="Transfer Funds" onClose={onClose}>
            <form onSubmit={handleTransfer} className="space-y-4">
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-muted uppercase mb-1">From</label>
                        <select required className="bg-transparent text-sm font-bold text-white w-full outline-none" value={form.fromAccountId} onChange={e => setForm({ ...form, fromAccountId: e.target.value })}>
                            <option value="" className="bg-zinc-900">Choose...</option>
                            {accounts.map(a => <option key={a._id} value={a._id} className="bg-zinc-900">{a.name} ({a.balance} {a.currency})</option>)}
                        </select>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0"><ArrowRightLeft size={14} className="text-muted" /></div>
                    <div className="flex-1 text-right">
                        <label className="block text-[10px] font-black text-muted uppercase mb-1">To</label>
                        <select required className="bg-transparent text-sm font-bold text-white w-full outline-none text-right" value={form.toAccountId} onChange={e => setForm({ ...form, toAccountId: e.target.value })}>
                            <option value="" className="bg-zinc-900">Choose...</option>
                            {accounts.map(a => <option key={a._id} value={a._id} className="bg-zinc-900" disabled={a._id === form.fromAccountId}>{a.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-2">Amount to Transfer</label>
                    <div className="relative">
                        <input required type="number" placeholder="0.00" className="pc-input w-full pl-10" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    </div>
                </div>

                {isCurrencyDiff && (
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase">Currency Exchange required</p>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted">1 {fromAcc.currency} = </span>
                            <input type="number" step="any" className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white max-w-[80px]" value={form.exchangeRate} onChange={e => setForm({ ...form, exchangeRate: e.target.value })} />
                            <span className="text-xs text-muted">{toAcc.currency}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 italic">Target will receive: { (Number(form.amount) * Number(form.exchangeRate)).toLocaleString() } {toAcc.currency}</p>
                    </div>
                )}

                <div><label className="block text-xs font-bold text-muted uppercase mb-2">Description (Optional)</label><input type="text" placeholder="e.g. Move to wallet for groceries..." className="pc-input w-full" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Transferring...' : 'Confirm Transfer'}</Button>
                </div>
            </form>
        </Modal>
    );
}

