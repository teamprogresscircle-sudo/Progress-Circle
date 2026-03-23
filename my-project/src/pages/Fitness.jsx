/* [APEX ELITE V2.1] - Resolved History naming collision */
import { useState, useEffect, useMemo } from 'react';
import { useSEO } from '../hooks/useSEO';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Dumbbell, TrendingUp, Scale, 
    ChevronRight, Plus, Trash2, Calendar, 
    Zap, Target, Layers, Ruler, Edit2, Clock, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { toast } from 'sonner';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Confetti } from '../components/Confetti';
import { PageInsight } from '../components/PageInsight';

// APEX ELITE: Neural Restoration Terminology
const UI = {
    WORKOUTS: 'Workout Splits',
    BODY: 'Body Metrics',
    CYCLES: 'Cycle Archive',
    HISTORY: 'Exertion Timeline',
    PLAN: 'Protocol'
};

export function Fitness() {
    const { user } = useAuth();
    useSEO('Physical Wellness Engine', 'Track workout cycles, log body metrics, and optimize your physical performance with ProgressCircle fitness module.');
    
    const [cycle, setCycle] = useState(null);
    const [cycleHistory, setCycleHistory] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiVariant, setConfettiVariant] = useState('pulse');
    
    // View State
    const [activeTab, setActiveTab] = useState('workouts'); // Internal toggle for mobile or focused view
    const [showSetup, setShowSetup] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [setupData, setSetupData] = useState({ cycleType: 'Hypertrophy Phase 1', daysCount: 4, daysConfig: [] });

    // Logger State
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
            
            // Auto-detect if today is a rest day from plan
            if (cycleRes.data.data && !logData.routineDone) {
                const logsLength = cycleRes.data.data.logs.length;
                const configLength = cycleRes.data.data.daysConfig.length;
                if (configLength > 0) {
                    const dayIdx = logsLength % configLength;
                    const todayPlanned = cycleRes.data.data.daysConfig[dayIdx];
                    if (todayPlanned && !todayPlanned.routine) {
                        setLogData(prev => ({ ...prev, isRestDay: true }));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load fitness data');
        } finally {
            setLoading(false);
        }
    };

    // V3.2 ANALYTICAL AVERAGING
    const getWeeklyAverage = (metricList) => {
        if (!metricList || metricList.length === 0) return null;
        const now = new Date();
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        
        const recent = metricList.filter(m => new Date(m.date) >= sevenDaysAgo);
        if (recent.length === 0) return metricList[metricList.length - 1].weight; // Fallback to last if none in 7d
        
        const sum = recent.reduce((acc, m) => acc + m.weight, 0);
        return (sum / recent.length).toFixed(1);
    };

    const weeklyAvg = useMemo(() => getWeeklyAverage(metrics), [metrics]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleSetupNext = () => {
        if (!setupData.cycleType || setupData.daysCount < 1) return toast.error('Invalid cycle details');
        let initialConfig = [];
        for (let i = 1; i <= setupData.daysCount; i++) {
            initialConfig.push({ dayNumber: i, routine: '' });
        }
        setSetupData({ ...setupData, daysConfig: initialConfig });
        setSetupStep(2);
    };

    const handleSetupSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fitness/cycle', setupData);
            setConfettiVariant('fountain');
            setShowConfetti(true);
            toast.success('Physical Split synchronized.');
            setShowSetup(false);
            fetchData();
        } catch (error) {
            toast.error('Cycle sync failed.');
        }
    };

    const handleLogSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fitness/log', logData);
            setConfettiVariant('pulse');
            setShowConfetti(true);
            toast.success('Workout archived.');
            setLogData({ ...logData, routineDone: '', workoutCompleted: false });
            fetchData();
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('Plan Required', {
                    description: 'Please set up your Workout Plan in the header first.'
                });
            } else {
                toast.error('Log failed.', {
                    description: error.response?.data?.message || 'Check your connection.'
                });
            }
        }
    };

    const handleMetricSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {};
            Object.keys(metricData).forEach(key => {
                if (metricData[key] !== '') payload[key] = key === 'date' ? metricData[key] : Number(metricData[key]);
            });
            await api.post('/fitness/metrics', payload);
            setConfettiVariant('fountain');
            setShowConfetti(true);
            toast.success('Bio-metrics synchronized.');
            setMetricData({ ...metricData, weight: '', bodyFat: '' }); // Partial reset
            fetchData();
        } catch (error) {
            toast.error('Metric update failed.');
        }
    };

    const handleDeleteLog = async (logId) => {
        if (!confirm('Permanent deletion of exertion node?')) return;
        try {
            await api.delete(`/fitness/log/${logId}`);
            toast.success('Node removed from timeline.');
            fetchData();
        } catch (error) {
            toast.error('Deletion failed.');
        }
    };

    const handleDeleteMetric = async (id) => {
        if (!confirm('Permanent deletion of bio-metric node?')) return;
        try {
            await api.delete(`/fitness/metrics/${id}`);
            toast.success('Bio-snapshot removed.');
            fetchData();
        } catch (error) {
            toast.error('Deletion failed.');
        }
    };

    const handleEditLog = (log) => {
        setLogData({
            date: new Date(log.date).toISOString().split('T')[0],
            isRestDay: log.isRestDay,
            workoutCompleted: log.workoutCompleted,
            routineDone: log.routineDone,
            weight: log.weight || '',
            notes: log.notes || ''
        });
        setActiveTab('workouts');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.info('Workout loaded for edit.');
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-sm font-black text-rose-500 uppercase tracking-widest animate-pulse">Syncing Biological Feed...</p>
        </div>
    );

    const latestMetric = metrics[metrics.length - 1] || {};
    const prevMetric = metrics[metrics.length - 2] || {};
    const weightTrend = latestMetric.weight && prevMetric.weight ? latestMetric.weight - prevMetric.weight : 0;

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-inter antialiased px-6 md:px-12 py-10 pb-32 transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto space-y-12">
                
                {/* MODERN HEADER */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-[var(--border)]">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="w-14 h-14 bg-[var(--surface2)] rounded-2xl flex items-center justify-center border border-[var(--border)] text-[var(--primary)] shadow-sm">
                            <Activity size={28} className="pc-streak-glow" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em]">Biometric Engine</span>
                                <PageInsight 
                                    title="Physical Performance Optimization"
                                    intro="Architect and verify your biological frame. Optimize high-intensity exertion and track long-term physiological adaptation."
                                    operations={[
                                        { title: 'Exertion Logging', content: 'Archive daily workout parameters, intensity, and recovery states.' },
                                        { title: 'Biological Snapshots', content: 'Synchronize weight, body fat, and muscle mass to compute trends.' },
                                        { title: 'Protocol Archive', content: 'Retrieve and analyze previous workout cycles for progress.' }
                                    ]}
                                    neuralTip="Synchronizing biological data with exertion nodes reveals the true impact of your protocols."
                                />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none font-outfit">Neural Fitness</h1>
                            <p className="text-xs font-medium text-[var(--muted)] max-w-md font-inter">Optimize your biological frame for maximum performance through data-driven exertion tracking.</p>
                        </div>
                    </div>

                    <div className="flex bg-[var(--surface2)] p-1.5 rounded-2xl border border-[var(--border)] shadow-sm">
                        <button 
                            onClick={() => setActiveTab('workouts')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all font-inter ${activeTab === 'workouts' ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                        >
                            {UI.WORKOUTS}
                        </button>
                        <button 
                            onClick={() => setActiveTab('body')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all font-inter ${activeTab === 'body' ? 'bg-[#10b981] text-white shadow-lg shadow-emerald-500/10' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                        >
                            {UI.BODY}
                        </button>
                        <button 
                            onClick={() => setActiveTab('cycles')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all font-inter ${activeTab === 'cycles' ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                        >
                            {UI.CYCLES}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* LEFT COLUMN: Main Form */}
                    <div className="lg:col-span-8 space-y-10">
                        <AnimatePresence mode="wait">
                            {activeTab === 'workouts' ? (
                                <motion.div 
                                    key="workouts"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="space-y-10"
                                >
                                    <div className="pc-card p-10 relative overflow-hidden transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)] text-[var(--primary)]">
                                                <Dumbbell size={20} />
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none font-outfit">Exertion Log</h3>
                                        </div>

                                        <form onSubmit={handleLogSubmit} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Cycle Date</label>
                                                    <input type="date" className="pc-input p-4" value={logData.date} onChange={e => setLogData({...logData, date: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Current Weight (KG)</label>
                                                    <input type="number" step="0.1" className="pc-input p-4" value={logData.weight} onChange={e => setLogData({...logData, weight: e.target.value})} placeholder="e.g. 82.5" />
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-6 p-6 bg-[var(--surface2)] rounded-2xl border border-[var(--border)]">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input type="checkbox" className="hidden" checked={logData.isRestDay} onChange={e => setLogData({...logData, isRestDay: e.target.checked})} />
                                                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${logData.isRestDay ? 'bg-[var(--primary)] border-[var(--primary)] shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] group-hover:border-[var(--muted)]'}`}>
                                                        {logData.isRestDay && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${logData.isRestDay ? 'text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}>Recovery Mode</span>
                                                </label>

                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input type="checkbox" className="hidden" checked={logData.workoutCompleted} onChange={e => setLogData({...logData, workoutCompleted: e.target.checked})} />
                                                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${logData.workoutCompleted ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] group-hover:border-[var(--muted)]'}`}>
                                                        {logData.workoutCompleted && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${logData.workoutCompleted ? 'text-emerald-500' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}>Protocol Verified</span>
                                                </label>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Routine Detail</label>
                                                <input className="pc-input p-4" value={logData.routineDone} onChange={e => setLogData({...logData, routineDone: e.target.value})} placeholder="e.g. PUSH - Heavy Chest Focus" />
                                            </div>

                                            <button type="submit" className="w-full py-5 pc-btn-primary rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.01] transition-transform">Archive Exertion Node</button>
                                        </form>
                                    </div>

                                    {/* TIMELINE */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.4em] ml-2 font-inter">Exertion Archive</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {cycle?.logs.slice().reverse().map((log) => (
                                                <div key={log._id} className="pc-card pc-card-lift p-6 flex items-center justify-between group">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${log.isRestDay ? 'bg-[var(--surface2)] border-[var(--border)] text-[var(--muted)]' : 'bg-[rgba(var(--primary-rgb),0.1)] border-[rgba(var(--primary-rgb),0.2)] text-[var(--primary)]'}`}>
                                                            {log.isRestDay ? <Activity size={20} /> : <Dumbbell size={20} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-base font-black uppercase tracking-tighter group-hover:text-[var(--primary)] transition-colors">{log.routineDone || (log.isRestDay ? 'Recovery' : 'Workout')}</div>
                                                            <div className="text-[9px] font-black text-[var(--muted)] flex items-center gap-3 mt-1.5 uppercase tracking-widest">
                                                                <span>{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                                                                <span className="text-[var(--primary)]/60">{log.weight} KG</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <button onClick={() => handleEditLog(log)} className="p-3 rounded-xl hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] transition-all flex items-center justify-center"><Edit2 size={12} /></button>
                                                        <button onClick={() => handleDeleteLog(log._id)} className="p-3 rounded-xl hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-500 transition-all flex items-center justify-center"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === 'body' ? (
                                <motion.div 
                                    key="body"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="space-y-10"
                                >
                                    <div className="pc-card p-10 relative overflow-hidden transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)] text-emerald-500">
                                                <Scale size={20} />
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none font-outfit">Biological Snapshot</h3>
                                        </div>

                                        <form onSubmit={handleMetricSubmit} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Stomach (CM)</label>
                                                    <input type="number" step="0.1" className="pc-input p-4" value={metricData.stomach} onChange={e => setMetricData({...metricData, stomach: e.target.value})} placeholder="0.0" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Arm (CM)</label>
                                                    <input type="number" step="0.1" className="pc-input p-4" value={metricData.arm} onChange={e => setMetricData({...metricData, arm: e.target.value})} placeholder="0.0" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Leg (CM)</label>
                                                    <input type="number" step="0.1" className="pc-input p-4" value={metricData.leg} onChange={e => setMetricData({...metricData, leg: e.target.value})} placeholder="0.0" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Body Fat (%)</label>
                                                    <input type="number" step="0.1" className="pc-input p-4" value={metricData.bodyFat} onChange={e => setMetricData({...metricData, bodyFat: e.target.value})} placeholder="0.0" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Muscle (%)</label>
                                                    <input type="number" step="0.1" className="pc-input p-4" value={metricData.muscleMass} onChange={e => setMetricData({...metricData, muscleMass: e.target.value})} placeholder="0.0" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">BMR (KCAL)</label>
                                                    <input type="number" className="pc-input p-4" value={metricData.bmr} onChange={e => setMetricData({...metricData, bmr: e.target.value})} placeholder="0" />
                                                </div>
                                            </div>

                                            <button type="submit" className="w-full py-5 pc-btn-primary bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.01] transition-transform">Sync Biological Metrics</button>
                                        </form>
                                    </div>

                                    {/* BIOMETRIC HISTORY */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.4em] ml-2 font-inter">Snapshot History</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {metrics.slice().reverse().map((m) => (
                                                <div key={m._id} className="pc-card pc-card-lift p-6 flex items-center justify-between group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-center w-14 py-2 shrink-0 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                                            <div className="text-xl font-black leading-none font-outfit">{m.weight}</div>
                                                            <div className="text-[7px] font-black text-[var(--muted)] uppercase mt-0.5 tracking-widest">KG</div>
                                                        </div>
                                                        <div className="w-[1px] h-8 bg-[var(--border)]" />
                                                        <div>
                                                            <div className="text-[11px] font-black uppercase tracking-tight">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                            <div className="text-[9px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">{m.bodyFat || '--'}% ADIPOSE INDEX</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <button onClick={() => {
                                                            setMetricData({
                                                                date: new Date(m.date).toISOString().split('T')[0],
                                                                weight: m.weight || '',
                                                                bmr: m.bmr || '',
                                                                muscleMass: m.muscleMass || '',
                                                                bodyFat: m.bodyFat || '',
                                                                stomach: m.stomach || '',
                                                                arm: m.arm || '',
                                                                leg: m.leg || ''
                                                            });
                                                            toast.info('Snapshot loaded for refinement.');
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }} className="p-3 rounded-xl hover:bg-[var(--surface2)] text-[var(--muted)] transition-all flex items-center justify-center"><Edit2 size={12} /></button>
                                                        <button onClick={() => handleDeleteMetric(m._id)} className="p-3 rounded-xl hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-500 transition-all flex items-center justify-center"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="cycles"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="space-y-10"
                                >
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.4em] ml-2 font-inter">Protocol Archives</h4>
                                        <div className="grid grid-cols-1 gap-6">
                                            {cycleHistory.length === 0 ? (
                                                <div className="pc-card p-20 text-center space-y-4">
                                                    <Layers size={40} className="mx-auto text-[var(--muted)]/20" />
                                                    <div className="text-[var(--muted)] font-black uppercase tracking-widest text-[10px]">No Archived Protocols Detected</div>
                                                </div>
                                            ) : (
                                                cycleHistory.map((h) => (
                                                    <div key={h._id} className={`pc-card p-8 relative overflow-hidden group transition-all duration-500 ${h.active ? 'ring-2 ring-[var(--primary)]/20 border-[var(--primary)]/30' : ''}`}>
                                                        {h.active && <div className="absolute top-0 right-0 px-6 py-2 bg-[var(--primary)] text-[8px] font-black uppercase tracking-widest text-white rounded-bl-2xl shadow-lg">Active Protocol</div>}
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                            <div className="flex items-center gap-6">
                                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${h.active ? 'bg-[rgba(var(--primary-rgb),0.1)] border-[rgba(var(--primary-rgb),0.2)] text-[var(--primary)]' : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--muted)]'}`}>
                                                                    <Target size={24} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xl font-black uppercase tracking-tighter font-outfit leading-tight mb-1">{h.cycleType}</h3>
                                                                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.2em]">{h.daysCount} Day Optimized Split</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-12">
                                                                <div className="text-right">
                                                                    <div className="text-3xl font-black text-[var(--text)] font-outfit tracking-tighter leading-none mb-1">{h.logs.length}</div>
                                                                    <div className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Exertion Nodes</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[11px] font-black text-[var(--text)] uppercase tracking-tight leading-none mb-1">{new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                                                                    <div className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest">Initialization</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN: Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* CURRENT SPLIT */}
                        <div className="pc-card p-8 space-y-8 relative overflow-hidden group">
                           <div className="flex items-center gap-4 relative z-10">
                               <div className="p-2 bg-[var(--surface2)] rounded-lg text-[var(--muted)]">
                                   <Layers size={16} />
                               </div>
                               <h4 className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.4em] leading-none font-inter">Current Split</h4>
                           </div>
                           
                           <div className="relative z-10 space-y-2">
                               <div className="text-3xl font-black uppercase tracking-tighter transition-all group-hover:text-[var(--primary)] duration-500 font-outfit leading-tight">
                                   {cycle?.cycleType || 'Standby Mode'}
                               </div>
                               <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
                                   <Clock size={12} className="text-[var(--primary)]/50" />
                                   {cycle ? `Day ${(cycle.logs.length % cycle.daysConfig.length) + 1} of ${cycle.daysConfig.length} Cycle` : 'Initialize Protocol to Begin'}
                               </p>
                           </div>

                           <button 
                                onClick={() => setShowSetup(true)}
                                className="w-full py-4 pc-btn-secondary text-[10px] uppercase tracking-[0.2em] font-black hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all"
                           >
                                Modify Protocol
                           </button>
                        </div>

                        {/* NEURAL INSIGHT */}
                        <div className="pc-card p-10 space-y-6 relative overflow-hidden transition-all duration-500 border-emerald-500/10 hover:border-emerald-500/30">
                           <div className="flex items-center gap-4 relative z-10">
                               <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                   <TrendingUp size={18} />
                               </div>
                               <h4 className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.4em] leading-none font-inter">Neural Insight</h4>
                           </div>
                           
                           <div className="space-y-4">
                               <p className="text-[11px] font-medium text-[var(--muted)] leading-relaxed relative z-10">
                                   Exertion detected on <span className="text-emerald-500 font-black">{cycle?.logs.filter(l => l.workoutCompleted).length || 0}</span> of the last 7 cycles. 
                                   Body composition shifting towards leaner muscle density. Optimal recovery phase initiated.
                               </p>
                               <div className="h-1 w-full bg-[var(--surface2)] rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500 w-[70%]" />
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM SUMMARY: Stat Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8">
                    <StatCard 
                        label="Aggregate Weight" 
                        value={latestMetric.weight || '--'} 
                        suffix=" KG" 
                        icon={Scale} 
                        color="indigo" 
                        delay={0.1}
                    />
                    <StatCard 
                        label="Adipose Index" 
                        value={latestMetric.bodyFat || '--'} 
                        suffix="%" 
                        icon={Zap} 
                        color="sky" 
                        delay={0.2}
                    />
                    <StatCard 
                        label="Net Trajectory" 
                        value={weightTrend > 0 ? `+${weightTrend.toFixed(1)}` : weightTrend.toFixed(1)} 
                        suffix=" KG" 
                        icon={TrendingUp} 
                        color={weightTrend <= 0 ? 'green' : 'orange'} 
                        delay={0.3}
                    />
                    <StatCard 
                        label="Cycle Progress" 
                        value={cycle ? Math.round((cycle.logs.length / 30) * 100) : 0} 
                        suffix="%" 
                        icon={Activity} 
                        color="purple" 
                        delay={0.4}
                    />
                </div>

            {/* PROTOCOL MODAL */}
            <AnimatePresence>
                {showSetup && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-xl p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="pc-card w-full max-w-2xl overflow-hidden shadow-2xl border-[var(--border)]"
                        >
                            <div className="p-10 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[rgba(var(--primary-rgb),0.1)] rounded-xl flex items-center justify-center text-[var(--primary)]">
                                            <Target size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter font-outfit">Protocol Configuration</h3>
                                            <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mt-1">Step {setupStep} of 2: Structure Definition</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowSetup(false)} className="p-2 hover:bg-[var(--surface2)] rounded-xl text-[var(--muted)] transition-all">
                                        <ChevronRight size={20} className="rotate-90" />
                                    </button>
                                </div>

                                {setupStep === 1 ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Cycle Type</label>
                                                <input className="pc-input p-4" value={setupData.cycleType} onChange={e => setSetupData({...setupData, cycleType: e.target.value})} placeholder="e.g. Hypertrophy - Split A" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">Daily Sequence Count</label>
                                                <input type="number" className="pc-input p-4" value={setupData.daysCount} onChange={e => setSetupData({...setupData, daysCount: Number(e.target.value)})} min="1" max="14" />
                                            </div>
                                        </div>
                                        <button onClick={handleSetupNext} className="w-full py-5 pc-btn-primary rounded-2xl text-[12px] font-black uppercase tracking-[0.3em]">Configure Daily Parameters</button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4 pc-scrollbar">
                                            {setupData.daysConfig.map((day, idx) => (
                                                <div key={idx} className="p-6 bg-[var(--surface2)] rounded-2xl border border-[var(--border)] flex items-center gap-6 group transition-all hover:border-[var(--muted)]">
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-black text-[var(--primary)] text-xs">0{idx+1}</div>
                                                    <input 
                                                        className="flex-1 bg-transparent border-none outline-none font-black text-sm uppercase tracking-tight text-[var(--text)] placeholder:text-[var(--muted)]"
                                                        placeholder="Day Name (e.g. UPPER BODY)"
                                                        value={day.routine || day.name}
                                                        onChange={e => {
                                                            const newConfig = [...setupData.daysConfig];
                                                            newConfig[idx] = { ...newConfig[idx], routine: e.target.value, name: e.target.value };
                                                            setSetupData({ ...setupData, daysConfig: newConfig });
                                                        }}
                                                    />
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input type="checkbox" className="hidden" checked={day.isRest} onChange={e => {
                                                            const newConfig = [...setupData.daysConfig];
                                                            newConfig[idx] = { ...newConfig[idx], isRest: e.target.checked };
                                                            setSetupData({ ...setupData, daysConfig: newConfig });
                                                        }} />
                                                        <div className={`w-10 h-6 rounded-full transition-all relative ${day.isRest ? 'bg-emerald-500' : 'bg-[var(--surface)] border border-[var(--border)]'}`}>
                                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${day.isRest ? 'left-5' : 'left-1'}`} />
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase text-[var(--muted)] tracking-widest">Rest</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => setSetupStep(1)} className="flex-1 py-5 pc-card hover:bg-[var(--surface2)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Back</button>
                                            <button onClick={handleSetupSubmit} className="flex-[2] py-5 pc-btn-primary rounded-2xl text-[12px] font-black uppercase tracking-[0.3em]">Commit Protocol</button>
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
        </div>
    );
}
