import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Trophy, CheckSquare, Target, Trash2, RefreshCw, 
    Search, Filter, Edit3, Shield, Star, Zap, Settings, 
    TrendingUp, BarChart3, Mail, Calendar, Crown, X, Save, 
    AlertTriangle, Activity, Database, Key, Server, Terminal,
    Globe, Lock, Unlock, Gift, ArrowUpRight, Cpu, Tag, Plus,
    DollarSign, ActivitySquare, AlertCircle, FileText, UserMinus
} from 'lucide-react';
import { adminAPI } from '../../api/adminAPI';
import { StatCard } from '../../components/StatCard';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Card } from '../../components/Card';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export function AdminDashboard() {
    const { user: currentUser, refreshUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState(null); // Used for basic edit mode
    const [deepDiveUser, setDeepDiveUser] = useState(null); // Complete data load
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [rewardAmount, setRewardAmount] = useState(50);
    const [pulseData, setPulseData] = useState([]);

    // Promo codes state
    const [promoCodes, setPromoCodes] = useState([]);
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);
    const [newPromo, setNewPromo] = useState({
        code: '',
        rewardType: 'premium_days',
        rewardValue: 30,
        maxUses: 100
    });

    // Subscription grant
    const [grantDays, setGrantDays] = useState(30);
    const [isGranting, setIsGranting] = useState(false);

    // Treasury
    const [paymentLogs, setPaymentLogs] = useState([]);
    const [treasuryLoading, setTreasuryLoading] = useState(false);

    // Audit Logs
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);

    // Pricing
    const [pricing, setPricing] = useState({ monthlyPriceCents: 14900, yearlyPriceCents: 129900 });
    const [isSavingPricing, setIsSavingPricing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, settingsRes, promoRes, pricingRes, analyticsRes] = await Promise.all([
                adminAPI.getStats(), 
                adminAPI.getUsers(),
                adminAPI.getSettings(),
                adminAPI.getPromoCodes(),
                adminAPI.getPricing(),
                adminAPI.getAnalyticsSubscriptions(),
            ]);
            setStats(statsRes.data.data);
            setUsers(usersRes.data.data);
            setSettings(settingsRes.data.data);
            setPromoCodes(promoRes.data.data);
            setPricing(pricingRes.data.data);
            setAnalytics(analyticsRes.data.data);
        } catch { toast.error('Shield Interface Failure: Link compromised.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchData();
        // Generate mock pulse data
        setPulseData(Array.from({ length: 40 }, () => Math.random() * 100));
        const interval = setInterval(() => {
            setPulseData(prev => [...prev.slice(1), Math.random() * 100]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Tab Data Fetching
    useEffect(() => {
        const fetchTabData = async () => {
            if (activeTab === 'treasury' && paymentLogs.length === 0) {
                setTreasuryLoading(true);
                try {
                    const res = await adminAPI.getPaymentLogs();
                    setPaymentLogs(res.data.data);
                } catch { toast.error('Failed to access Treasury logs'); }
                finally { setTreasuryLoading(false); }
            } else if (activeTab === 'audit' && auditLogs.length === 0) {
                setAuditLoading(true);
                try {
                    const res = await adminAPI.getAuditLogs();
                    setAuditLogs(res.data.data);
                } catch { toast.error('Failed to access Immutable Audit Trail'); }
                finally { setAuditLoading(false); }
            }
        };
        fetchTabData();
    }, [activeTab]);

    const loadDeepDive = async (userId) => {
        try {
            const res = await adminAPI.getUserDeepDive(userId);
            setDeepDiveUser(res.data.data);
            setEditingUser(res.data.data.user); // Sync state for form overrides
        } catch { toast.error('Failed to access Deep Dive data'); }
    };

    const handleUpdateUser = async (id, data) => {
        setIsSaving(true);
        try {
            await adminAPI.updateUser(id, data);
            toast.success('CORE OVERWRITE SUCCESSFUL');
            setEditingUser(null);
            setDeepDiveUser(null);
            fetchData();
            if (currentUser && currentUser.id === id) {
                refreshUser();
            }
        } catch { toast.error('OVERWRITE FAILED: SECURITY PROTOCOL'); }
        finally { setIsSaving(false); }
    };

    const handleToggleSetting = async (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        try {
            await adminAPI.updateSettings(newSettings);
            toast.success(`${key.toUpperCase()} STATUS MODIFIED`);
        } catch { toast.error('PROTOCOL UPDATE FAILED'); fetchData(); }
    };

    const handleRewardAll = async () => {
        if (!confirm(`Execute GLOBAL INJECTION of ${rewardAmount} points to ALL biologicals?`)) return;
        try {
            await adminAPI.rewardAll({ points: rewardAmount, reason: 'Admin Bonus' });
            toast.success('GLOBAL INJECTION COMPLETE');
            fetchData();
        } catch { toast.error('INJECTION INTERRUPTED'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('DANGER: This will permanently purge the user data. Proceed?')) return;
        try {
            await adminAPI.deleteUser(id);
            toast.success('PURGE COMPLETE');
            fetchData();
        } catch { toast.error('PURGE INTERRUPTED'); }
    };

    // Promo Code Handlers
    const handleCreatePromo = async () => {
        try {
            await adminAPI.createPromoCode(newPromo);
            toast.success('Promo Code Generated');
            setIsCreatingPromo(false);
            setNewPromo({ code: '', rewardType: 'premium_days', rewardValue: 30, maxUses: 100 });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate promo code');
        }
    };

    const handleTogglePromo = async (promo) => {
        try {
            await adminAPI.updatePromoCode(promo._id, { isActive: !promo.isActive });
            toast.success(`Code ${promo.code} status updated`);
            fetchData();
        } catch { toast.error('Status update failed'); }
    };

    const handleDeletePromo = async (id) => {
        if (!confirm('Delete this promo code permanently?')) return;
        try {
            await adminAPI.deletePromoCode(id);
            toast.success('Promo Code Deleted');
            fetchData();
        } catch { toast.error('Deletion failed'); }
    };

    const handleGrantSubscription = async (userId) => {
        if (!grantDays || grantDays <= 0) { toast.error('Enter valid number of days'); return; }
        setIsGranting(true);
        try {
            const res = await adminAPI.grantSubscription(userId, grantDays);
            toast.success(res.data.message);
            setEditingUser(null);
            setDeepDiveUser(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to grant subscription');
        } finally { setIsGranting(false); }
    };

    const handleSavePricing = async () => {
        setIsSavingPricing(true);
        try {
            await adminAPI.updatePricing({
                monthlyPriceCents: Math.round(pricing.monthlyPriceCents),
                yearlyPriceCents: Math.round(pricing.yearlyPriceCents),
            });
            toast.success('Pricing updated successfully!');
        } catch { toast.error('Failed to update pricing'); }
        finally { setIsSavingPricing(false); }
    };

    const handleSyncScores = async () => {
        if (!confirm('Execute GLOBAL SCORE SYNCHRONIZATION for all biological signatures? This will recalculate everyone\'s rank based on the new formula.')) return;
        setIsSyncing(true);
        try {
            const res = await adminAPI.syncScores();
            toast.success(res.data.message || 'GLOBAL SYNC COMPLETE');
            fetchData();
        } catch { toast.error('SYNC INTERRUPTED'); }
        finally { setIsSyncing(false); }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !stats) return <div className="h-screen flex items-center justify-center bg-pc-bg"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="min-h-screen pb-20 space-y-10 selection:bg-indigo-500/30">
            {/* Cyber Header */}
            <header className="relative py-10 px-8 rounded-[3rem] border border-white/10 overflow-hidden bg-white/[0.02]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="text-indigo-500 animate-pulse" size={24} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Security Level: GOD MODE</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black pc-gradient-text leading-tight">
                            Command <span className="text-white opacity-20">/</span> Suite
                        </h1>
                        <p className="text-pc-muted font-medium mt-4 max-w-md leading-relaxed text-sm">
                            Total system sovereignty enabled. Real-time neural monitoring and core protocol authorized.
                        </p>
                    </motion.div>

                    <div className="flex gap-4">
                        <div className="px-8 py-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                            <p className="text-[10px] font-black text-pc-muted uppercase tracking-widest mb-1">System Pulse</p>
                            <div className="flex items-end gap-1 h-6">
                                {pulseData.slice(-15).map((h, i) => (
                                    <div key={i} className="h-full w-1 flex items-end">
                                        <motion.div 
                                            animate={{ height: `${h}%` }}
                                            className="w-full bg-indigo-500/40 rounded-full"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-mono text-indigo-400 mt-2">STABLE / 99.8%</p>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="flex flex-wrap gap-3 p-2 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 w-fit mx-auto md:mx-0">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3, color: 'indigo' },
                    { id: 'treasury', label: 'Treasury', icon: DollarSign, color: 'emerald' },
                    { id: 'users', label: 'User Matrix', icon: Server, color: 'sky' },
                    { id: 'promos', label: 'Promo Codes', icon: Tag, color: 'green' },
                    { id: 'system', label: 'SysControl', icon: Cpu, color: 'amber' },
                    { id: 'audit', label: 'Audit Logs', icon: FileText, color: 'rose' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                                ? 'bg-indigo-500 text-white shadow-2xl shadow-indigo-500/40' 
                                : 'text-pc-muted hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </nav>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Monthly Rev (MRR)" value={`$${analytics?.mrrEGP || 0}`} icon={DollarSign} color="emerald" />
                            <StatCard label="Active Premium" value={analytics?.premiumUsers || 0} icon={Crown} color="amber" />
                            <StatCard label="Total Souls" value={stats?.totalUsers} icon={Users} color="indigo" />
                            <StatCard label="Lost Souls (Churn)" value={analytics?.cancelledUsers || 0} icon={UserMinus} color="rose" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Neural Load" value={stats?.totalTasks} icon={Zap} color="sky" />
                            <StatCard label="Biosphere" value={stats?.totalTrees} icon={Globe} color="green" />
                            <StatCard label="Expired Subs" value={analytics?.expiredUsers || 0} icon={AlertCircle} color="orange" />
                            <StatCard label="Free Tier" value={analytics?.freeUsers || 0} icon={Shield} color="slate" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 p-8 border-white/5 bg-white/[0.01]">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black flex items-center gap-3">
                                        <Activity className="text-indigo-500" size={20} /> System Vitality
                                    </h3>
                                    <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none">
                                        <option>Last 7 Cycles</option>
                                        <option>Last 30 Cycles</option>
                                    </select>
                                </div>
                                <div className="h-64 flex items-end gap-4 px-2">
                                    {[60, 40, 80, 50, 90, 70, 100].map((h, i) => (
                                        <div key={i} className="flex-1 group relative h-full">
                                            <div className="absolute inset-x-0 bottom-1 top-0 bg-indigo-500/5 rounded-t-2xl mb-1" />
                                            <motion.div 
                                                initial={{ height: 0 }} 
                                                animate={{ height: `${h}%` }} 
                                                className="absolute bottom-1 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-2xl shadow-lg shadow-indigo-500/20 group-hover:brightness-125 transition-all z-10"
                                            />
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none">
                                                <div className="bg-white text-indigo-900 text-[10px] font-black px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                                                    +{h}% Growth
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-6 px-4 text-[10px] text-pc-muted font-black uppercase tracking-[0.2em]">
                                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <span key={d}>{d}</span>)}
                                </div>
                            </Card>

                            <div className="space-y-6">
                                <Card className="p-8 border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Terminal size={80} /></div>
                                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                        <AlertTriangle className="text-amber-500" size={18} /> Administrative Alert
                                    </h3>
                                    <p className="text-xs text-pc-muted font-medium leading-relaxed mb-6">
                                        You are operating with **full database sovereignty**. All injections and purges are irreversible.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-amber-500/70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                            PROTOCOL 001: MONITORING ACTIVE
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black text-amber-500/70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                            PROTOCOL 002: BACKUP SYNCHRONIZED
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Treasury Tab */}
                {activeTab === 'treasury' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500"><DollarSign size={28} /></div>
                            <div>
                                <h2 className="text-2xl font-black">Global Treasury</h2>
                                <p className="text-xs text-pc-muted">Real-time payment and transaction monitoring</p>
                            </div>
                        </div>

                        {treasuryLoading ? (
                            <div className="p-10 text-center"><LoadingSpinner size="lg" /></div>
                        ) : (
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-pc-muted">
                                            <tr>
                                                <th className="px-6 py-4 rounded-tl-[2rem]">Date</th>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Plan</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 rounded-tr-[2rem]">Order ID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 disabled:divide-transparent">
                                            {paymentLogs.map(log => (
                                                <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">{new Date(log.createdAt).toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-bold text-white">{log.userId?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 font-mono text-emerald-400">{(log.amount / 100).toFixed(2)} {log.currency}</td>
                                                    <td className="px-6 py-4 capitalize">{log.billingCycle || 'N/A'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-widest ${
                                                            log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                                            log.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                                            'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                        }`}>{log.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-mono text-pc-muted">{log.orderId}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Audit Logs Tab */}
                {activeTab === 'audit' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500"><FileText size={28} /></div>
                                <div>
                                    <h2 className="text-2xl font-black text-rose-500 flex items-center gap-2">
                                        <Lock size={20} /> Immutable Audit Trail
                                    </h2>
                                    <p className="text-xs text-rose-500/50">Tracking all authorized structural modifications</p>
                                </div>
                            </div>
                        </div>

                        {auditLoading ? (
                            <div className="p-10 text-center"><LoadingSpinner size="lg" /></div>
                        ) : (
                            <div className="space-y-4">
                                {auditLogs.length === 0 ? (
                                    <div className="p-10 text-center text-pc-muted font-black uppercase tracking-widest bg-white/[0.02] rounded-[2rem] border border-white/5">
                                        No structural modifications detected. The system is clean.
                                    </div>
                                ) : auditLogs.map(log => (
                                    <div key={log._id} className="p-6 rounded-[2rem] bg-rose-500/[0.02] border border-rose-500/10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="p-3 bg-white/5 rounded-xl"><Terminal size={16} className="text-pc-muted" /></div>
                                            <div>
                                                <p className="text-sm font-black text-white">{log.adminId?.name || 'System'}</p>
                                                <p className="text-[10px] text-pc-muted font-mono">{new Date(log.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest min-w-[150px] text-center">
                                            {log.actionType.replace(/_/g, ' ')}
                                        </div>

                                        <div className="flex-1 text-sm text-pc-muted font-mono bg-black/20 p-4 rounded-xl border border-white/5 w-full break-words">
                                            {log.targetUserId && (
                                                <span className="text-indigo-400 font-bold block mb-1">Target: {log.targetUserId.name}</span>
                                            )}
                                            {JSON.stringify(log.details)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div 
                        key="users"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-pc-muted group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search Matrix for ID, Email, or Neural Signature..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] pl-16 pr-8 py-5 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all placeholder:text-pc-muted/50"
                                />
                            </div>
                            <Button variant="outline" onClick={fetchData} className="px-8 flex gap-3 text-[11px] font-black tracking-widest rounded-[2rem]">
                                <RefreshCw size={16} /> RE-SYNC
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {filteredUsers.map((u, i) => (
                                <motion.div
                                    key={u._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] transition-all"
                                >
                                    <div className="flex items-center gap-6 flex-1 w-full">
                                        <div className="relative">
                                            <Avatar src={u.avatar} name={u.name} size="lg" className="rounded-3xl" />
                                            {u.isAdmin && (
                                                <div className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50">
                                                    <Shield size={12} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-black text-white">{u.name}</h4>
                                                {u.plan === 'premium' && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-tighter rounded-md border border-amber-500/20">Pro</span>}
                                            </div>
                                            <p className="text-xs text-pc-muted/70 font-mono tracking-tighter">{u.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap md:flex-nowrap items-center gap-8 w-full md:w-auto">
                                        <div className="flex gap-10">
                                            <div className="text-center">
                                                <p className="text-xs font-black text-indigo-400 mb-1">{(u.totalScore || u.points || 0).toLocaleString()}</p>
                                                <p className="text-[9px] text-pc-muted font-black uppercase tracking-widest">Score</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-emerald-400 mb-1">{(u.points || 0).toLocaleString()}</p>
                                                <p className="text-[9px] text-pc-muted font-black uppercase tracking-widest">Points</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-sky-400 mb-1">{u.streak}d</p>
                                                <p className="text-[9px] text-pc-muted font-black uppercase tracking-widest">Consistency</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => loadDeepDive(u._id)}
                                                className="p-4 rounded-2xl bg-white/5 text-pc-muted hover:text-white hover:bg-indigo-500 transition-all shadow-xl hover:shadow-indigo-500/20"
                                            >
                                                <Search size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(u._id)}
                                                className="p-4 rounded-2xl bg-red-500/5 text-red-500/50 hover:bg-red-500 hover:text-white transition-all shadow-xl hover:shadow-red-500/20"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'system' && (
                    <motion.div 
                        key="system"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <Card className="p-10 space-y-10 border-indigo-500/10 bg-indigo-500/[0.02] rounded-[3rem]">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500"><Database size={28} /></div>
                                <div>
                                    <h2 className="text-2xl font-black">Core Protocols</h2>
                                    <p className="text-xs text-pc-muted">Modify global system behavior</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.03] border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${settings?.maintenanceMode ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                            {settings?.maintenanceMode ? <Lock size={20} /> : <Unlock size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black">Maintenance Mode</p>
                                            <p className="text-[10px] text-pc-muted uppercase tracking-widest">Restrict Public Access</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleSetting('maintenanceMode')}
                                        className={`w-14 h-8 rounded-full relative transition-all duration-500 ${settings?.maintenanceMode ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-white/10'}`}
                                    >
                                        <motion.div 
                                            animate={{ x: settings?.maintenanceMode ? 28 : 4 }}
                                            className="absolute top-2 w-4 h-4 rounded-full bg-white shadow-xl"
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.03] border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-500/20 text-indigo-500 rounded-xl"><Star size={20} /></div>
                                        <div>
                                            <p className="text-sm font-black text-white">XP Multiplier</p>
                                            <p className="text-[10px] text-pc-muted uppercase tracking-widest">Global Reward Rate</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 font-mono font-black">
                                        <button onClick={() => toast.info('Multiplier adjustment coming soon')} className="hover:text-white transition-colors"> - </button>
                                        <span>1.0x</span>
                                        <button onClick={() => toast.info('Multiplier adjustment coming soon')} className="hover:text-white transition-colors"> + </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <button 
                                        onClick={handleSyncScores}
                                        disabled={isSyncing}
                                        className="w-full py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                                        {isSyncing ? 'Synchronizing Neural Ranks...' : 'Global Score Sync (Recalculate All)'}
                                    </button>
                                    <p className="text-[9px] text-pc-muted mt-3 text-center uppercase tracking-tighter">Forces a full recalculation of totalScore using the new formula for every user.</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-10 space-y-10 border-amber-500/10 bg-amber-500/[0.02] rounded-[3rem]">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500"><Gift size={28} /></div>
                                <div>
                                    <h2 className="text-2xl font-black">Global Injections</h2>
                                    <p className="text-xs text-pc-muted">Transmit rewards to all souls</p>
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-pc-muted px-2">
                                        <span>Point Magnitude</span>
                                        <span className="text-amber-500">{rewardAmount} PTS</span>
                                    </div>
                                    <input 
                                        type="range" min="10" max="500" step="10"
                                        value={rewardAmount}
                                        onChange={(e) => setRewardAmount(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-amber-500/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                </div>

                                <button 
                                    onClick={handleRewardAll}
                                    className="w-full py-6 rounded-[2rem] bg-amber-500 text-indigo-950 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    <Zap size={18} /> Global Neural Injection
                                </button>

                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[9px] font-black text-amber-500/70 leading-relaxed uppercase tracking-widest">
                                    <AlertTriangle size={14} className="flex-shrink-0" />
                                    Injection affects all {stats?.totalUsers} active biological signatures.
                                </div>
                            </div>
                        </Card>

                        {/* Subscription Pricing */}
                        <Card className="p-10 space-y-8 border-indigo-500/10 bg-indigo-500/[0.02] rounded-[3rem] md:col-span-2">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500"><Star size={28} /></div>
                                <div>
                                    <h2 className="text-2xl font-black">Subscription Pricing</h2>
                                    <p className="text-xs text-pc-muted">Control what users pay for Premium access</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-pc-muted block">Monthly Price (EGP)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={Math.round(pricing.monthlyPriceCents / 100)}
                                        onChange={(e) => setPricing(p => ({ ...p, monthlyPriceCents: parseInt(e.target.value) * 100 }))}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-pc-muted block">Yearly Price (EGP)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={Math.round(pricing.yearlyPriceCents / 100)}
                                        onChange={(e) => setPricing(p => ({ ...p, yearlyPriceCents: parseInt(e.target.value) * 100 }))}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSavePricing}
                                disabled={isSavingPricing}
                                className="w-full py-5 rounded-[2rem] bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Save size={16} /> {isSavingPricing ? 'Saving...' : 'Save Pricing'}
                            </button>
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'promos' && (
                    <motion.div
                        key="promos"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <Tag className="text-green-500" /> Active Promotions
                            </h2>
                            <Button onClick={() => setIsCreatingPromo(true)} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black">
                                <Plus size={18} /> Generate Code
                            </Button>
                        </div>

                        {isCreatingPromo && (
                            <Card className="p-8 mb-8 border-green-500/20 bg-green-500/5">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-pc-muted mb-2 block">Code String</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. SUMMER2024"
                                            value={newPromo.code}
                                            onChange={(e) => setNewPromo({...newPromo, code: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 uppercase focus:border-green-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-pc-muted mb-2 block">Reward Type</label>
                                        <select
                                            value={newPromo.rewardType}
                                            onChange={(e) => setNewPromo({...newPromo, rewardType: e.target.value})}
                                            className="w-full bg-[#1A1E26] border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 transition-colors text-white"
                                        >
                                            <option value="premium_days">Premium Days</option>
                                            <option value="points">Points (XP)</option>
                                            <option value="cash">Discounted Price (EGP)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-pc-muted mb-2 block">Reward Value</label>
                                        <input 
                                            type="number" 
                                            value={newPromo.rewardValue}
                                            onChange={(e) => setNewPromo({...newPromo, rewardValue: parseInt(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-pc-muted mb-2 block">Max Uses</label>
                                        <input 
                                            type="number" 
                                            value={newPromo.maxUses}
                                            onChange={(e) => setNewPromo({...newPromo, maxUses: parseInt(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-6 justify-end">
                                    <Button variant="outline" onClick={() => setIsCreatingPromo(false)}>Cancel</Button>
                                    <Button onClick={handleCreatePromo} className="bg-green-500 hover:bg-green-600 text-black">Save Code</Button>
                                </div>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {promoCodes.length === 0 ? (
                                <div className="col-span-fulltext-center text-pc-muted p-10 bg-white/5 rounded-2xl border border-white/10 text-center">
                                    No active promo codes found in the system.
                                </div>
                            ) : promoCodes.map(promo => (
                                <Card key={promo._id} className="p-6 border-white/5 bg-white/[0.02] flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg font-mono font-black text-xl tracking-widest">
                                                {promo.code}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleTogglePromo(promo)} className={`p-2 rounded-lg ${promo.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                    {promo.isActive ? <Unlock size={16} /> : <Lock size={16} />}
                                                </button>
                                                <button onClick={() => handleDeletePromo(promo._id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-pc-muted">Reward</span>
                                                <span className="font-bold text-white">
                                                    {promo.rewardValue} {promo.rewardType.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-pc-muted">Uses</span>
                                                <span className="font-bold text-white shadow-xl">
                                                    {promo.usedCount} / {promo.maxUses === null ? '∞' : promo.maxUses}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-pc-muted font-mono">
                                        <span>Status: <span className={promo.isActive ? "text-green-500" : "text-red-500"}>{promo.isActive ? 'ACTIVE' : 'INACTIVE'}</span></span>
                                        <span>Created: {new Date(promo.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overwrite & Deep Dive Modal */}
            <AnimatePresence>
                {deepDiveUser && editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setDeepDiveUser(null); setEditingUser(null); }}
                            className="absolute inset-0 bg-[#06080E]/95 backdrop-blur-[30px]"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-6xl h-[90vh] bg-[#0F1219] border border-white/10 rounded-[3.5rem] shadow-full overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-6">
                                    <Avatar src={editingUser.avatar} name={editingUser.name} size="xl" className="rounded-3xl" />
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-3xl font-black text-white">{editingUser.name}</h3>
                                            {editingUser.plan === 'premium' && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-500/20">PREMIUM</span>}
                                        </div>
                                        <p className="text-sm font-mono text-pc-muted/70 flex items-center gap-2 mt-1">
                                            <Key size={14} className="text-indigo-500" /> {editingUser._id}
                                            <span className="mx-2 overflow-hidden block w-1 h-1 rounded-full bg-white/20" />
                                            {editingUser.email}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setDeepDiveUser(null); setEditingUser(null); }} className="p-3 rounded-full hover:bg-white/5 transition-colors"><X size={24} /></button>
                            </div>

                            {/* Modal Body (Scrollable Split View) */}
                            <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8">
                                
                                {/* Left Column: God Mode Controls */}
                                <div className="w-full lg:w-1/3 space-y-8 flex-shrink-0">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-pc-muted ml-2">Digital Alias</label>
                                            <input 
                                                type="text" defaultValue={editingUser.name}
                                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:border-indigo-500 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-pc-muted ml-2">Neural Experience (Points)</label>
                                            <input 
                                                type="number" defaultValue={editingUser.points}
                                                onChange={(e) => setEditingUser({ ...editingUser, points: parseInt(e.target.value) })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:border-indigo-500 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-pc-muted ml-2">Consistency Streak (Days)</label>
                                            <input 
                                                type="number" defaultValue={editingUser.streak}
                                                onChange={(e) => setEditingUser({ ...editingUser, streak: parseInt(e.target.value) })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:border-indigo-500 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-pc-muted ml-2">Access Plan Override</label>
                                            <select 
                                                value={editingUser.plan}
                                                onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:border-indigo-500 transition-all outline-none appearance-none"
                                            >
                                                <option value="free">FREE_ACCESS</option>
                                                <option value="premium">PRO_ACCESS</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-pc-muted ml-2">Admin Sovereignty</label>
                                            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03] border border-white/10 rounded-[1.5rem]">
                                                <span className="text-sm font-bold text-pc-muted">Authorized</span>
                                                <button 
                                                    onClick={() => setEditingUser({ ...editingUser, isAdmin: !editingUser.isAdmin })}
                                                    className={`w-12 h-6 rounded-full relative transition-all ${editingUser.isAdmin ? 'bg-indigo-500' : 'bg-white/10'}`}
                                                >
                                                    <motion.div animate={{ x: editingUser.isAdmin ? 24 : 4 }} className="absolute top-1 w-4 h-4 rounded-full bg-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Database size={16} className="text-indigo-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Save Modifications</p>
                                        </div>
                                        <Button onClick={() => handleUpdateUser(editingUser._id, editingUser)} disabled={isSaving} className="w-full rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/40">
                                            {isSaving ? <LoadingSpinner size="sm" /> : 'Execute Overwrite'}
                                        </Button>
                                    </div>

                                    {/* Grant Premium Subscription */}
                                    <div className="p-6 rounded-[2rem] bg-green-500/5 border border-green-500/20 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Crown size={16} className="text-green-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Grant Premium Subscription</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[9px] font-black text-pc-muted uppercase tracking-widest">Days to Grant</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={grantDays}
                                                    onChange={(e) => setGrantDays(parseInt(e.target.value))}
                                                    className="w-full bg-white/[0.05] border border-green-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:border-green-500 outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleGrantSubscription(editingUser._id)}
                                                disabled={isGranting}
                                                className="self-end px-6 py-3 bg-green-500 text-black font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-green-400 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Crown size={14} />
                                                {isGranting ? '...' : 'Grant'}
                                            </button>
                                        </div>
                                        {editingUser.subscription?.currentPeriodEnd && (
                                            <p className="text-[10px] text-pc-muted">
                                                Current expiry: <span className="text-green-400 font-bold">{new Date(editingUser.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Destruction */}
                                    <div className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/20 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={16} className="text-red-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Destructive Actions</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(editingUser._id)}
                                            className="w-full py-4 bg-red-500/10 text-red-500 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 size={14} className="inline mr-2 -mt-0.5" /> Purge User
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Historical Data */}
                                <div className="w-full lg:w-2/3 space-y-8">
                                    
                                    {/* Payment History */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-pc-muted uppercase tracking-widest border-b border-white/5 pb-2">Recent Financials</h4>
                                        {deepDiveUser.payments?.length === 0 ? (
                                            <div className="text-xs text-pc-muted font-mono bg-white/[0.01] p-4 rounded-xl border border-white/5">No active payment records found.</div>
                                        ) : (
                                            <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-white/[0.03] text-[9px] font-black uppercase tracking-widest text-pc-muted">
                                                        <tr>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3">Amount</th>
                                                            <th className="px-4 py-3">Status</th>
                                                            <th className="px-4 py-3 font-mono">Invoice ID</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {deepDiveUser.payments.map(log => (
                                                            <tr key={log._id}>
                                                                <td className="px-4 py-3 text-pc-muted font-mono">{new Date(log.createdAt).toLocaleDateString()}</td>
                                                                <td className="px-4 py-3 font-bold text-emerald-400">{(log.amount / 100).toFixed(2)} {log.currency}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-black ${
                                                                        log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                                                    }`}>{log.status}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-pc-muted font-mono">{log.orderId}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Tasks */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-pc-muted uppercase tracking-widest border-b border-white/5 pb-2 flex justify-between">
                                            <span>Neural Task Activity</span>
                                            <span className="text-indigo-400">{deepDiveUser.tasks?.length} Records</span>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {deepDiveUser.tasks?.length === 0 ? (
                                                <div className="col-span-2 text-xs text-pc-muted font-mono bg-white/[0.01] p-4 rounded-xl border border-white/5">No task records found.</div>
                                            ) : deepDiveUser.tasks?.slice(0, 10).map(task => (
                                                <div key={task._id} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
                                                    <div className="flex items-start gap-3 mb-2">
                                                        <div className={`mt-0.5 p-1 rounded-sm ${task.completed ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-pc-muted'}`}>
                                                            {task.completed ? <CheckSquare size={12} /> : <Target size={12} />}
                                                        </div>
                                                        <span className={`text-sm font-bold ${task.completed ? 'text-white/50 line-through' : 'text-white'}`}>{task.title}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end mt-2">
                                                        <span className="text-[9px] font-black uppercase text-pc-muted tracking-widest">{task.difficulty} • +{task.pointsValue} XP</span>
                                                        <span className="text-[9px] font-mono text-pc-muted">{new Date(task.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Habit Check-ins */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-pc-muted uppercase tracking-widest border-b border-white/5 pb-2 flex justify-between">
                                            <span>Habit Logs</span>
                                            <span className="text-indigo-400">{deepDiveUser.habits?.length} Records</span>
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {deepDiveUser.habits?.length === 0 ? (
                                               <div className="text-xs text-pc-muted font-mono bg-white/[0.01] p-4 rounded-xl border border-white/5">No habit records found.</div>
                                            ) : deepDiveUser.habits?.slice(0, 5).map(habit => (
                                                <div key={habit._id} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-bold text-white mb-1">{habit.title}</p>
                                                        <p className="text-[9px] font-black uppercase text-pc-muted tracking-widest">{habit.type} • {habit.streak} Day Streak</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {habit.history?.slice(-5).map(hist => (
                                                            <div key={hist.date} className={`w-3 h-3 rounded-sm ${hist.completed ? 'bg-green-500' : 'bg-white/10'}`} title={new Date(hist.date).toLocaleDateString()} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
