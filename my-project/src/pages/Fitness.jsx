/* ─── NEURAL FITNESS — ELITE PROFESSIONAL REDESIGN ──────────────────────────
   Compact, data-dense, fully responsive. Integrates theme variables.
   Version: 5.1 — Spacing & Spacing Improvements
──────────────────────────────────────────────────────────────────────────── */
import { useState, useEffect, useMemo } from 'react';
import { useSEO } from '../hooks/useSEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Dumbbell, TrendingUp, Scale,
    ChevronRight, Trash2, Calendar,
    Zap, Target, Layers, Edit2, Clock, X, Plus,
    BarChart2, Award, Moon, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { toast } from 'sonner';
import { Confetti } from '../components/Confetti';
import { PageInsight } from '../components/PageInsight';
import { useTheme } from '../context/ThemeContext';

// ── TREND CHART ────────────────────────────────────────────────────────────
function TrendChart({ data = [], valueKey = 'weight', color = 'var(--primary)', height = 80 }) {
    const values = data.map(d => d[valueKey]).filter(v => v != null && !isNaN(v));
    if (values.length < 2) return (
        <div style={{ height }} className="flex items-center justify-center w-full">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--muted)] opacity-50">No Data</span>
        </div>
    );
    const W = 300, H = height, P = 8;
    const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
    const pts = values.map((v, i) => {
        const x = ((i / (values.length - 1)) * (W - P * 2) + P).toFixed(2);
        const y = (H - ((v - min) / range) * (H - P * 2) - P).toFixed(2);
        return `${x},${y}`;
    });
    const pathD = `M ${pts.join(' L ')}`;
    const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${(W - P).toFixed(2)},${H} L ${P},${H} Z`;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
            <defs>
                <linearGradient id={`g_${valueKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={areaD} fill={`url(#g_${valueKey})`} />
            <motion.path
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
            />
            {values.map((v, i) => {
                const x = ((i / (values.length - 1)) * (W - P * 2) + P).toFixed(2);
                const y = (H - ((v - min) / range) * (H - P * 2) - P).toFixed(2);
                return <circle key={i} cx={x} cy={y} r={i === values.length - 1 ? 4 : 3}
                    fill={i === values.length - 1 ? color : 'var(--surface)'}
                    stroke={color} strokeWidth="2" />;
            })}
        </svg>
    );
}

// ── STAT PILL ──────────────────────────────────────────────────────────────
function Pill({ label, value, unit = '', color = 'indigo', icon: Icon }) {
    const colors = {
        indigo: 'bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
        orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
        sky: 'bg-sky-500/10 border-sky-500/20 text-sky-500',
    };
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${colors[color]} transition-all duration-300`}>
            {Icon && <Icon size={14} className="shrink-0" />}
            <div className="min-w-0">
                <div className="text-[8px] font-black uppercase tracking-[0.25em] opacity-60 truncate">{label}</div>
                <div className="text-sm font-black leading-none mt-0.5 font-outfit">
                    {value}<span className="text-[10px] font-bold ml-0.5 opacity-60">{unit}</span>
                </div>
            </div>
        </div>
    );
}

// ── SECTION HEADER ─────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, badge, action }) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl text-[var(--primary)]">
                    <Icon size={16} />
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text)] font-outfit leading-none">{title}</h2>
                    {badge && <span className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">{badge}</span>}
                </div>
            </div>
            {action}
        </div>
    );
}

// ── FIELD ──────────────────────────────────────────────────────────────────
function Field({ label, children }) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.3em] block pl-1">{label}</label>
            {children}
        </div>
    );
}

// ── TOGGLE CARD ────────────────────────────────────────────────────────────
function ToggleCard({ checked, onChange, icon: Icon, label, sublabel, activeColor = 'var(--primary)', activeClass = 'border-[var(--primary)]/30 bg-[var(--primary)]/5' }) {
    return (
        <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${checked ? activeClass : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10'}`}>
            <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 ${checked ? `border-white/20 shadow-[0_0_12px_${activeColor}40]` : 'border-white/10 bg-white/5'}`}
                style={checked ? { background: activeColor } : {}}>
                <Icon size={15} className={checked ? 'text-white' : 'text-[var(--muted)]'} />
            </div>
            <div>
                <div className={`text-[11px] font-black uppercase tracking-wider ${checked ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>{label}</div>
                {sublabel && <div className="text-[8px] text-[var(--muted)] uppercase tracking-widest mt-0.5">{sublabel}</div>}
            </div>
        </label>
    );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export function Fitness() {
    const { user } = useAuth();
    const { dark } = useTheme();
    useSEO('Neural Fitness | ProgressCircle', 'Track workout cycles, log body metrics, and optimize your biological performance.');

    const [cycle, setCycle] = useState(null);
    const [cycleHistory, setCycleHistory] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiVariant, setConfettiVariant] = useState('pulse');
    const [activeTab, setActiveTab] = useState('log');
    const [showSetup, setShowSetup] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [setupData, setSetupData] = useState({ cycleType: 'Hypertrophy Phase 1', daysCount: 4, daysConfig: [] });

    const [logData, setLogData] = useState({
        date: new Date().toISOString().split('T')[0],
        isRestDay: false,
        workoutCompleted: false,
        routineDone: '',
        weight: '',
        notes: ''
    });

    const [metricData, setMetricData] = useState({
        date: new Date().toISOString().split('T')[0],
        weight: '', bmr: '', muscleMass: '', bodyFat: '', stomach: '', arm: '', leg: ''
    });

    const fetchData = async () => {
        try {
            const [cycleRes, historyRes, metricRes] = await Promise.all([
                api.get('/fitness/cycle'),
                api.get('/fitness/cycle/history'),
                api.get('/fitness/metrics')
            ]);
            setCycle(cycleRes.data.data);
            setCycleHistory(historyRes.data.data);
            setMetrics(metricRes.data.data);
        } catch {
            console.error('Failed to load fitness data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const latestM = metrics[metrics.length - 1] || {};
    const prevM = metrics[metrics.length - 2] || {};
    const weightTrend = latestM.weight && prevM.weight ? +(latestM.weight - prevM.weight).toFixed(1) : 0;
    const completedLogs = cycle?.logs?.filter(l => l.workoutCompleted).length || 0;
    const totalLogs = cycle?.logs?.length || 0;
    const weeklyAvg = useMemo(() => {
        if (!metrics.length) return null;
        const now = new Date();
        const cutoff = new Date(now.setDate(now.getDate() - 7));
        const recent = metrics.filter(m => new Date(m.date) >= cutoff);
        if (!recent.length) return latestM.weight;
        return (recent.reduce((a, m) => a + m.weight, 0) / recent.length).toFixed(1);
    }, [metrics]);

    const handleSetupNext = () => {
        if (!setupData.cycleType || setupData.daysCount < 1) return toast.error('Invalid cycle details');
        setSetupData({ ...setupData, daysConfig: Array.from({ length: setupData.daysCount }, (_, i) => ({ dayNumber: i + 1, routine: '' })) });
        setSetupStep(2);
    };

    const handleSetupSubmit = async () => {
        try {
            await api.post('/fitness/cycle', setupData);
            setShowConfetti(true); setConfettiVariant('fountain');
            toast.success('Protocol synchronized.'); setShowSetup(false); fetchData();
        } catch { toast.error('Sync failed.'); }
    };

    const handleLogSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fitness/log', logData);
            setShowConfetti(true); setConfettiVariant('pulse');
            toast.success('Session archived.');
            setLogData(p => ({ ...p, routineDone: '', workoutCompleted: false, notes: '' }));
            fetchData();
        } catch (err) {
            toast.error(err.response?.status === 404 ? 'Set up a protocol first.' : 'Log failed.');
        }
    };

    const handleMetricSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {};
            Object.entries(metricData).forEach(([k, v]) => { if (v !== '') payload[k] = k === 'date' ? v : +v; });
            await api.post('/fitness/metrics', payload);
            setShowConfetti(true); setConfettiVariant('fountain');
            toast.success('Biometrics updated.');
            setMetricData(p => ({ ...p, weight: '', bodyFat: '', stomach: '', arm: '', leg: '' }));
            fetchData();
        } catch { toast.error('Update failed.'); }
    };

    const handleDeleteLog = async (id) => {
        if (!confirm('Delete this session?')) return;
        try { await api.delete(`/fitness/log/${id}`); toast.success('Removed.'); fetchData(); }
        catch { toast.error('Failed.'); }
    };

    const handleDeleteMetric = async (id) => {
        if (!confirm('Delete this snapshot?')) return;
        try { await api.delete(`/fitness/metrics/${id}`); toast.success('Removed.'); fetchData(); }
        catch { toast.error('Failed.'); }
    };

    const handleEditLog = (log) => {
        setLogData({ date: new Date(log.date).toISOString().split('T')[0], isRestDay: log.isRestDay, workoutCompleted: log.workoutCompleted, routineDone: log.routineDone || '', weight: log.weight || '', notes: log.notes || '' });
        setActiveTab('log');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.info('Session loaded for editing.');
    };

    const TABS = [
        { id: 'log', label: 'Log Session', icon: Dumbbell },
        { id: 'metrics', label: 'Biometrics', icon: Scale },
        { id: 'history', label: 'History', icon: BarChart2 },
        { id: 'cycles', label: 'Protocols', icon: Award },
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5">
            <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--primary)]/20 animate-spin border-t-[var(--primary)]" />
                <div className="absolute inset-2 rounded-full border border-[var(--primary)]/10" />
            </div>
            <div className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] animate-pulse">Syncing Neural Feed</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-8">

                {/* ── PAGE HEADER ──────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[var(--border)]/50">
                    <div>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl flex items-center justify-center text-[var(--primary)]">
                                    <Activity size={18} />
                                </div>
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--bg)] animate-pulse" />
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-[var(--primary)] uppercase tracking-[0.4em]">Biometric Engine</div>
                                <div className="text-[7px] font-bold text-[var(--muted)] uppercase tracking-widest">v5.1 · Active</div>
                            </div>
                            <PageInsight
                                title="Neural Fitness System"
                                intro="Track workouts, biometrics, and protocols in one data-dense interface."
                                operations={[
                                    { title: 'Log Session', content: 'Archive daily exertion and recovery nodes.' },
                                    { title: 'Biometrics', content: 'Synchronize weight, body composition, and measurements.' },
                                    { title: 'Protocols', content: 'Manage workout splits and cycle archives.' }
                                ]}
                                neuralTip="Log consistently for 7 days to unlock trend analysis."
                            />
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase font-outfit leading-none pc-gradient-text">Neural Fitness</h1>
                        <p className="text-xs text-[var(--muted)] font-medium mt-2 max-w-md">
                            Biological structural optimization through rigorous performance telemetry.
                        </p>
                    </div>

                    {/* Protocol Status */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className={`px-4 py-3 rounded-2xl border text-right ${cycle ? 'border-[var(--primary)]/20 bg-[var(--primary)]/5' : 'border-[var(--border)] bg-[var(--surface2)]'}`}>
                            <div className="text-[8px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">Active Protocol</div>
                            <div className="text-sm font-black font-outfit mt-0.5 truncate max-w-[160px]">{cycle?.cycleType || 'Not configured'}</div>
                            {cycle && <div className="text-[8px] font-bold text-[var(--primary)] uppercase tracking-wider mt-0.5">
                                Day {(cycle.logs.length % cycle.daysConfig.length) + 1} / {cycle.daysConfig.length}
                            </div>}
                        </div>
                        <button onClick={() => setShowSetup(true)}
                            className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 hover:text-[var(--primary)] transition-all text-[var(--muted)]">
                            <Layers size={16} />
                        </button>
                    </div>
                </div>

                {/* ── KPI STRIP ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Pill icon={Scale} label="Current Weight" value={latestM.weight || '--'} unit="kg" color="indigo" />
                    <Pill icon={Activity} label="Body Fat" value={latestM.bodyFat || '--'} unit="%" color="sky" />
                    <Pill icon={TrendingUp} label="Weight Δ" value={weightTrend ? (weightTrend > 0 ? `+${weightTrend}` : weightTrend) : '--'} unit="kg" color={weightTrend <= 0 ? 'emerald' : 'orange'} />
                    <Pill icon={Target} label="Completion" value={totalLogs ? Math.round((completedLogs / totalLogs) * 100) : 0} unit="%" color={completedLogs / totalLogs > 0.7 ? 'emerald' : 'indigo'} />
                </div>

                {/* ── MINI TREND ─────────────────────────────────────────────── */}
                {metrics.length >= 2 && (
                    <div className="pc-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                                <span className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.3em]">Weight Trajectory</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">7-Day Avg</div>
                                    <div className="text-sm font-black font-outfit">{weeklyAvg || '--'} <span className="text-[9px] opacity-50 font-medium">kg</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Latest</div>
                                    <div className="text-sm font-black font-outfit">{latestM.weight || '--'} <span className="text-[9px] opacity-50 font-medium">kg</span></div>
                                </div>
                            </div>
                        </div>
                        <TrendChart data={metrics} valueKey="weight" color="var(--primary)" height={72} />
                    </div>
                )}

                {/* ── TAB NAV ───────────────────────────────────────────────── */}
                <div className="flex bg-[var(--surface2)]/60 p-1 rounded-2xl border border-[var(--border)]/50 gap-1 overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap flex-1 justify-center min-w-fit
                                ${activeTab === tab.id ? 'bg-[var(--primary)] text-white shadow-[0_4px_20px_rgba(var(--primary-rgb),0.35)]' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}`}>
                            <tab.icon size={12} />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>

                {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
                <AnimatePresence mode="wait">

                    {/* ── LOG SESSION TAB ───────────────────────────────── */}
                    {activeTab === 'log' && (
                        <motion.div key="log" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Form */}
                            <div className="lg:col-span-2">
                                <div className="pc-card p-6 sm:p-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />
                                    <SectionHeader icon={Dumbbell} title="Log Session" badge={`${totalLogs} sessions archived`} />

                                    <form onSubmit={handleLogSubmit} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <Field label="Date">
                                                <div className="relative group">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none transition-colors group-focus-within:text-[var(--primary)]" size={18} />
                                                    <input type="date" className="pc-input !pl-12 py-4 text-xs font-bold" value={logData.date} onChange={e => setLogData(p => ({ ...p, date: e.target.value }))} />
                                                </div>
                                            </Field>
                                            <Field label="Weight (kg)">
                                                <div className="relative group">
                                                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none transition-colors group-focus-within:text-[var(--primary)]" size={18} />
                                                    <input type="number" step="0.1" className="pc-input !pl-12 py-4 text-xs font-bold" value={logData.weight} onChange={e => setLogData(p => ({ ...p, weight: e.target.value }))} placeholder="82.5" />
                                                </div>
                                            </Field>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <ToggleCard
                                                checked={logData.isRestDay}
                                                onChange={e => setLogData(p => ({ ...p, isRestDay: e.target.checked }))}
                                                icon={Moon} label="Recovery Day" sublabel="Skip protocol execution"
                                                activeColor="var(--primary)"
                                                activeClass="border-[var(--primary)]/30 bg-[var(--primary)]/5"
                                            />
                                            <ToggleCard
                                                checked={logData.workoutCompleted}
                                                onChange={e => setLogData(p => ({ ...p, workoutCompleted: e.target.checked }))}
                                                icon={CheckCircle2} label="Protocol Verified" sublabel="Workout completed"
                                                activeColor="#10b981"
                                                activeClass="border-emerald-500/30 bg-emerald-500/5"
                                            />
                                        </div>

                                        <Field label="Routine / Split">
                                            <div className="relative group">
                                                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none transition-colors group-focus-within:text-[var(--primary)]" size={18} />
                                                <input className="pc-input !pl-12 py-4 text-xs font-bold uppercase tracking-tight"
                                                    value={logData.routineDone} onChange={e => setLogData(p => ({ ...p, routineDone: e.target.value }))}
                                                    placeholder="e.g. UPPER BODY — HYPERTROPHY" />
                                            </div>
                                        </Field>

                                        <button type="submit"
                                            className="w-full py-4 pc-btn pc-btn-primary rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_8px_25px_rgba(var(--primary-rgb),0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-transform">
                                            Archive Session Node
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Sidebar column */}
                            <div className="space-y-6">
                                {/* Today's Plan */}
                                {cycle && (() => {
                                    const idx = cycle.logs.length % cycle.daysConfig.length;
                                    const today = cycle.daysConfig[idx];
                                    return (
                                        <div className="pc-card p-5 border-[var(--primary)]/15">
                                            <div className="text-[8px] font-black text-[var(--primary)] uppercase tracking-[0.3em] mb-2">Today's Target</div>
                                            <div className="text-base font-black font-outfit uppercase tracking-tight">{today?.routine || 'Rest Day'}</div>
                                            <div className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest mt-1">
                                                Day {idx + 1} of {cycle.daysConfig.length}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-1.5">
                                                {cycle.daysConfig.map((d, i) => (
                                                    <div key={i} className={`w-7 h-7 rounded-lg text-[8px] font-black flex items-center justify-center border transition-all
                                                        ${i < cycle.logs.length % cycle.daysConfig.length
                                                            ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]'
                                                            : i === idx ? 'bg-[var(--primary)] border-white/20 text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]'
                                                            : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--muted)]'}`}>
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Recent sessions (last 4) */}
                                <div className="pc-card p-5">
                                    <div className="text-[8px] font-black text-[var(--muted)] uppercase tracking-[0.3em] mb-3">Recent Sessions</div>
                                    <div className="space-y-4">
                                        {(cycle?.logs || []).slice(-4).reverse().map(log => (
                                            <div key={log._id} className="flex items-center gap-3 py-2 border-b border-[var(--border)]/40 last:border-0 group">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${log.workoutCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--surface2)] text-[var(--muted)]'}`}>
                                                    {log.workoutCompleted ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-black uppercase truncate">{log.routineDone || (log.isRestDay ? 'Recovery' : 'Session')}</div>
                                                    <div className="text-[8px] text-[var(--muted)] font-bold">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={() => handleEditLog(log)} className="p-1.5 rounded-lg hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] transition-all flex items-center justify-center"><Edit2 size={10} /></button>
                                                    <button onClick={() => handleDeleteLog(log._id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-500 transition-all flex items-center justify-center"><Trash2 size={10} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {!cycle?.logs?.length && <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest text-center py-4 opacity-50">No sessions yet</div>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── BIOMETRICS TAB ────────────────────────────────── */}
                    {activeTab === 'metrics' && (
                        <motion.div key="metrics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Form + Chart */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="pc-card p-6 sm:p-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500"><Scale size={16} /></div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-[0.2em] font-outfit leading-none">Biological Snapshot</h2>
                                                <span className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">
                                                    {weightTrend > 0 ? `+${weightTrend}` : weightTrend} kg from last entry
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleMetricSubmit} className="space-y-6">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {[
                                                { key: 'weight', label: 'Weight (kg)', placeholder: '80.0' },
                                                { key: 'bodyFat', label: 'Body Fat (%)', placeholder: '15.0' },
                                                { key: 'stomach', label: 'Stomach (cm)', placeholder: '85.0' },
                                                { key: 'arm', label: 'Arm (cm)', placeholder: '35.0' },
                                                { key: 'leg', label: 'Leg (cm)', placeholder: '55.0' },
                                                { key: 'muscleMass', label: 'Muscle (%)', placeholder: '40.0' },
                                                { key: 'bmr', label: 'BMR (kcal)', placeholder: '1800' },
                                            ].map(({ key, label, placeholder }) => (
                                                <Field key={key} label={label}>
                                                    <input type="number" step="0.1" className="pc-input py-4 text-xs font-bold"
                                                        value={metricData[key]}
                                                        onChange={e => setMetricData(p => ({ ...p, [key]: e.target.value }))}
                                                        placeholder={placeholder} />
                                                </Field>
                                            ))}
                                        </div>

                                        <button type="submit"
                                            className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_8px_25px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 active:translate-y-0">
                                            Sync Biometric Snapshot
                                        </button>
                                    </form>
                                </div>

                                {/* Body Fat Trend */}
                                {metrics.length >= 2 && (
                                    <div className="pc-card p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.3em]">Body Fat % Trend</span>
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{latestM.bodyFat || '--'}% Current</span>
                                        </div>
                                        <TrendChart data={metrics} valueKey="bodyFat" color="#10b981" height={64} />
                                    </div>
                                )}
                            </div>

                            {/* Snapshot Cards column */}
                            <div className="space-y-4">
                                <div className="text-[8px] font-black text-[var(--muted)] uppercase tracking-[0.3em] px-1 flex items-center justify-between">
                                    <span>Snapshot Archive</span>
                                    <span>{metrics.length} entries</span>
                                </div>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pc-scrollbar pr-1">
                                    {metrics.slice().reverse().map(m => (
                                        <div key={m._id} className="pc-card p-4 group hover:border-emerald-500/20 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="text-lg font-black font-outfit leading-none">{m.weight} <span className="text-[10px] opacity-40 font-medium">kg</span></div>
                                                    <div className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-widest mt-0.5">
                                                        {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setMetricData({ date: new Date(m.date).toISOString().split('T')[0], weight: m.weight || '', bmr: m.bmr || '', muscleMass: m.muscleMass || '', bodyFat: m.bodyFat || '', stomach: m.stomach || '', arm: m.arm || '', leg: m.leg || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); toast.info('Loaded.'); }}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--surface2)] text-[var(--muted)] transition-all flex items-center justify-center"><Edit2 size={10} /></button>
                                                    <button onClick={() => handleDeleteMetric(m._id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-500 transition-all flex items-center justify-center"><Trash2 size={10} /></button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {[
                                                    { label: 'Fat', value: m.bodyFat, unit: '%', color: 'emerald' },
                                                    { label: 'Waist', value: m.stomach, unit: 'cm' },
                                                    { label: 'Arm', value: m.arm, unit: 'cm' },
                                                    { label: 'Leg', value: m.leg, unit: 'cm' },
                                                ].map(({ label, value, unit, color }) => (
                                                    <div key={label} className="bg-[var(--surface2)]/60 rounded-lg p-1.5">
                                                        <div className="text-[6px] font-black text-[var(--muted)] uppercase tracking-widest">{label}</div>
                                                        <div className={`text-[10px] font-black ${color === 'emerald' ? 'text-emerald-500' : ''}`}>{value || '--'}<span className="text-[8px] opacity-40 ml-0.5">{unit}</span></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {!metrics.length && <div className="pc-card p-8 text-center"><p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest opacity-40">No snapshots yet.</p></div>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── HISTORY TAB ───────────────────────────────────── */}
                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            <SectionHeader icon={BarChart2} title="Exertion Timeline" badge={`${totalLogs} nodes total · ${completedLogs} verified`} />
                            {!cycle?.logs?.length ? (
                                <div className="pc-card p-16 text-center">
                                    <Dumbbell size={36} className="mx-auto text-[var(--muted)] opacity-20 mb-4" />
                                    <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.3em] opacity-50">No sessions archived yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {cycle.logs.slice().reverse().map(log => (
                                        <motion.div key={log._id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                            className="pc-card p-5 relative group overflow-hidden hover:border-[var(--primary)]/20 transition-all">
                                            {/* Glow blob */}
                                            <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-[0.12] transition-opacity group-hover:opacity-[0.2] ${log.workoutCompleted ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${log.workoutCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500/70'}`}>
                                                        {log.workoutCompleted ? <CheckCircle2 size={17} /> : <Moon size={17} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-tight leading-none">
                                                            {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div className={`text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 ${log.workoutCompleted ? 'text-emerald-500' : 'text-rose-400'}`}>
                                                            {log.workoutCompleted ? '✓ Verified' : '⟳ Recovery'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditLog(log)} className="p-2 rounded-xl bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] transition-all flex items-center justify-center"><Edit2 size={11} /></button>
                                                    <button onClick={() => handleDeleteLog(log._id)} className="p-2 rounded-xl bg-rose-500/10 text-rose-500/50 hover:text-rose-500 transition-all flex items-center justify-center"><Trash2 size={11} /></button>
                                                </div>
                                            </div>

                                            {log.routineDone && (
                                                <div className="mb-3 px-3 py-2 bg-[var(--surface2)]/60 rounded-xl border border-white/[0.04]">
                                                    <div className="text-[7px] font-black text-[var(--muted)] uppercase tracking-widest mb-0.5">Split</div>
                                                    <div className="text-[11px] font-black uppercase tracking-tight">{log.routineDone}</div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <div className="text-[6px] font-black text-[var(--muted)] uppercase tracking-widest">Weight</div>
                                                        <div className="text-[10px] font-black">{log.weight ? `${log.weight}kg` : '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[6px] font-black text-[var(--muted)] uppercase tracking-widest">Load</div>
                                                        <div className={`text-[10px] font-black ${log.workoutCompleted ? 'text-emerald-500' : 'text-[var(--muted)]'}`}>{log.workoutCompleted ? '1.0×' : '0.0×'}</div>
                                                    </div>
                                                </div>
                                                <div className="text-[7px] font-black text-[var(--muted)] opacity-30 uppercase">{log._id.slice(-6).toUpperCase()}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── PROTOCOLS TAB ─────────────────────────────────── */}
                    {activeTab === 'cycles' && (
                        <motion.div key="cycles" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                            <SectionHeader icon={Award} title="Protocol Archive" badge={`${cycleHistory.length} protocols`}
                                action={
                                    <button onClick={() => setShowSetup(true)}
                                        className="flex items-center gap-2 px-4 py-2 pc-btn pc-btn-primary rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">
                                        <Plus size={12} /> New Protocol
                                    </button>
                                }
                            />
                            {!cycleHistory.length ? (
                                <div className="pc-card p-16 text-center">
                                    <Award size={36} className="mx-auto text-[var(--muted)] opacity-20 mb-4" />
                                    <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.3em] opacity-50 mb-4">No protocols archived.</p>
                                    <button onClick={() => setShowSetup(true)} className="px-6 py-3 pc-btn pc-btn-primary rounded-xl text-[10px] font-black uppercase tracking-widest">Create First Protocol</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {cycleHistory.map(h => (
                                        <div key={h._id} className={`pc-card p-6 relative overflow-hidden transition-all ${h.active ? 'border-[var(--primary)]/30 bg-[var(--primary)]/[0.02]' : ''}`}>
                                            {h.active && (
                                                <div className="absolute top-0 right-0 px-3 py-1.5 bg-[var(--primary)] text-white text-[7px] font-black uppercase tracking-[0.3em] rounded-bl-xl">Active</div>
                                            )}
                                            <div className="flex items-start gap-4 mb-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${h.active ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]' : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--muted)]'}`}>
                                                    <Target size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black uppercase tracking-tight font-outfit leading-tight">{h.cycleType}</h3>
                                                    <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mt-1">{h.daysCount}-day split</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-[var(--surface2)]/60 rounded-xl p-3 text-center">
                                                    <div className="text-xl font-black font-outfit leading-none">{h.logs.length}</div>
                                                    <div className="text-[7px] font-black text-[var(--muted)] uppercase tracking-widest mt-1">Sessions</div>
                                                </div>
                                                <div className="bg-[var(--surface2)]/60 rounded-xl p-3 text-center">
                                                    <div className="text-xl font-black font-outfit leading-none text-emerald-500">{h.logs.filter(l => l.workoutCompleted).length}</div>
                                                    <div className="text-[7px] font-black text-[var(--muted)] uppercase tracking-widest mt-1">Verified</div>
                                                </div>
                                                <div className="bg-[var(--surface2)]/60 rounded-xl p-3 text-center">
                                                    <div className="text-[11px] font-black font-outfit leading-none">{new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</div>
                                                    <div className="text-[7px] font-black text-[var(--muted)] uppercase tracking-widest mt-1">Created</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* ── PROTOCOL SETUP MODAL ──────────────────────────────────── */}
            <AnimatePresence>
                {showSetup && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg)]/80 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-lg pc-card overflow-hidden shadow-2xl">

                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl flex items-center justify-center text-[var(--primary)]"><Target size={16} /></div>
                                        <div>
                                            <h3 className="text-base font-black uppercase tracking-tight font-outfit">Configure Protocol</h3>
                                            <p className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Step {setupStep} / 2</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowSetup(false); setSetupStep(1); }} className="p-2 rounded-xl hover:bg-[var(--surface2)] text-[var(--muted)] transition-all flex items-center justify-center"><X size={18} /></button>
                                </div>

                                {/* Step indicator */}
                                <div className="flex gap-2 mb-8">
                                    {[1, 2].map(s => (
                                        <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= setupStep ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                                    ))}
                                </div>

                                {setupStep === 1 ? (
                                    <div className="space-y-6">
                                        <Field label="Protocol Name">
                                            <input className="pc-input py-4 text-sm font-bold" value={setupData.cycleType}
                                                onChange={e => setSetupData(p => ({ ...p, cycleType: e.target.value }))}
                                                placeholder="e.g. Hypertrophy Phase 1" />
                                        </Field>
                                        <Field label={`Days in Rotation (${setupData.daysCount})`}>
                                            <input type="range" min="1" max="14" className="w-full" value={setupData.daysCount}
                                                onChange={e => setSetupData(p => ({ ...p, daysCount: +e.target.value }))} />
                                            <div className="flex justify-between text-[8px] font-black text-[var(--muted)] uppercase tracking-widest mt-1">
                                                <span>1 day</span><span>14 days</span>
                                            </div>
                                        </Field>
                                        <button onClick={handleSetupNext} className="w-full py-4 pc-btn pc-btn-primary rounded-2xl text-[11px] font-black uppercase tracking-[0.3em]">
                                            Configure Days →
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="max-h-72 overflow-y-auto space-y-3 pc-scrollbar pr-1">
                                            {setupData.daysConfig.map((day, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                                    <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-black text-[var(--primary)] shrink-0">
                                                        {String(i + 1).padStart(2, '0')}
                                                    </div>
                                                    <input className="flex-1 bg-transparent border-none outline-none text-xs font-black uppercase tracking-tight placeholder:text-[var(--muted)] placeholder:font-normal"
                                                        placeholder="Day name (e.g. UPPER BODY)"
                                                        value={day.routine || ''}
                                                        onChange={e => { const c = [...setupData.daysConfig]; c[i] = { ...c[i], routine: e.target.value }; setSetupData(p => ({ ...p, daysConfig: c })); }} />
                                                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                                                        <input type="checkbox" className="hidden" checked={!!day.isRest}
                                                            onChange={e => { const c = [...setupData.daysConfig]; c[i] = { ...c[i], isRest: e.target.checked }; setSetupData(p => ({ ...p, daysConfig: c })); }} />
                                                        <div className={`w-8 h-4.5 rounded-full transition-all relative border ${day.isRest ? 'bg-emerald-500 border-emerald-400' : 'bg-[var(--surface)] border-[var(--border)]'}`} style={{ height: '18px' }}>
                                                            <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${day.isRest ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
                                                        </div>
                                                        <span className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Rest</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setSetupStep(1)} className="flex-[1] py-3.5 pc-btn pc-btn-secondary rounded-xl text-[10px] font-black uppercase tracking-widest">← Back</button>
                                            <button onClick={handleSetupSubmit} className="flex-[2] py-3.5 pc-btn pc-btn-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Commit Protocol</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Confetti active={showConfetti} theme="wellness" variant={confettiVariant} onComplete={() => setShowConfetti(false)} />
        </div>
    );
}
