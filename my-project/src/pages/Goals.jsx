import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Pencil, Trash2, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';

export function Goals() {
    const { goals, addGoal, updateGoal, deleteGoal } = useData();
    const [modalOpen, setModalOpen] = useState(false);
    const [editGoal, setEditGoal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', targetDate: '', progress: 0, status: 'active' });

    if (!goals) return <LoadingSpinner />;

    const openEdit = (g) => {
        setEditGoal(g);
        setForm({ title: g.title, description: g.description || '', targetDate: g.targetDate || '', progress: g.progress, status: g.status });
        setModalOpen(true);
    };

    const openCreate = () => {
        setEditGoal(null);
        setForm({ title: '', description: '', targetDate: '', progress: 0, status: 'active' });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return toast.error('Title is required');
        setSaving(true);
        try {
            if (editGoal) {
                await updateGoal(editGoal.id, form);
                toast.success('Goal updated');
            } else {
                await addGoal(form);
                toast.success('Goal established');
            }
            setModalOpen(false);
        } catch { toast.error('Failed to save goal'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Abandon this objective?')) return;
        try { await deleteGoal(id); toast.success('Goal removed'); }
        catch { toast.error('Failed to delete goal'); }
    };

    const active = goals.filter((g) => g.status === 'active');
    const completed = goals.filter((g) => g.status === 'completed');

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-32">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h1 className="font-extrabold pc-gradient-text tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1.6rem, 6vw, 2.25rem)' }}>Strategic Goals</h1>
                    <p className="text-xs text-muted font-medium mt-1 uppercase tracking-[0.2em]">{active.length} active · {completed.length} achieved</p>
                </div>
                {/* Desktop button */}
                <div className="hidden sm:block">
                    <Button size="lg" icon={Plus} onClick={openCreate}>New Objective</Button>
                </div>
            </div>

            {goals.length === 0 ? (
                <EmptyState icon={Target} title="No active objectives" description="Define your next major milestone to begin tracking." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {goals.map((goal, i) => (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="pc-card group relative p-6 border border-white/5 overflow-hidden"
                            >
                                {goal.progress === 100 && (
                                    <div className="absolute top-0 right-0 p-3 bg-green-500/10 text-green-500 rounded-bl-2xl">
                                        <Trophy size={16} />
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="font-bold text-xl mb-1 tracking-tight" style={{ color: 'var(--color-text)', fontFamily: 'Manrope, sans-serif' }}>
                                            {goal.title}
                                        </h3>
                                        {goal.description && <p className="text-sm text-pc-muted line-clamp-2">{goal.description}</p>}
                                    </div>
                                    <StatusBadge status={goal.status} />
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                                        <span>Completion</span>
                                        <span className="text-indigo-400">{goal.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${goal.progress}%` }}
                                            className={`h-full ${goal.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    {goal.targetDate ? (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                            <Calendar size={12} /> {dayjs(goal.targetDate).format('MMM D, YYYY')}
                                        </span>
                                    ) : <div />}

                                    {/* always visible on touch */}
                                    <div className="flex gap-1 touch-always-visible opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <button onClick={() => openEdit(goal)} className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 transition-colors">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(goal.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Mobile floating add button */}
            <button
                onClick={openCreate}
                className="sm:hidden fixed bottom-20 left-5 z-40 flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-lg text-xs font-black uppercase tracking-widest"
                style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}
            >
                <Plus size={16} /> New Goal
            </button>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editGoal ? "Review Objective" : "Define Objective"}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2">Goal Title</label>
                        <input className="pc-input text-lg font-bold" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Run a Marathon" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2">Strategy Description</label>
                        <textarea className="pc-input resize-none min-h-[100px]" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Outline your steps for success..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2">Timeline</label>
                            <input className="pc-input" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2">Status</label>
                            <select className="pc-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Active Pursuit</option>
                                <option value="paused">On Hold</option>
                                <option value="completed">Concluded</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-[11px] font-black text-muted uppercase tracking-widest">Progress Metrics</label>
                            <span className="text-sm font-black text-indigo-500">{form.progress}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1 h-12" loading={saving} onClick={handleSave}>{editGoal ? 'Update Strategy' : 'Initialize Goal'}</Button>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Dismiss</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
