import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Search, UserPlus, UserMinus, Zap, Shield, Star, MessageSquare, 
    Flame, Trophy, ArrowRight, TrendingUp, Share2, Heart, Award, CheckSquare, 
    Bell, Swords, Activity 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';
import api from '../api/client';
import { FocusBattleModal } from '../components/FocusBattleModal';
import { TrajectoryModal } from '../components/TrajectoryModal';
import { BattleConfigModal } from '../components/BattleConfigModal';
import { NotificationCenter } from '../components/NotificationCenter';
import { Confetti } from '../components/Confetti';
import { PageInsight } from '../components/PageInsight';

const PulseFeed = () => {
    const mockFeed = [
        { id: 1, user: 'Alex', action: 'completed a Critical Mission', time: '2m ago', type: 'task' },
        { id: 2, user: 'Sarah', action: 'hit a 15-day Streak!', time: '15m ago', type: 'streak' },
        { id: 3, user: 'Nova', action: 'deployed a Synergy Orb', time: '1h ago', type: 'orb' },
    ];

    return (
        <div className="space-y-3">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Zap size={14} className="text-indigo-500" /> Astra Pulse
            </h3>
            <div className="space-y-2">
                {mockFeed.map((item) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3 group hover:border-indigo-500/30 transition-all"
                    >
                        <div className={`p-2 rounded-xl ${
                            item.type === 'task' ? 'bg-emerald-500/10 text-emerald-500' :
                            item.type === 'streak' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-indigo-500/10 text-indigo-500'
                        }`}>
                            {item.type === 'task' ? <CheckSquare size={14} /> : 
                             item.type === 'streak' ? <Flame size={14} /> : <Zap size={14} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold">
                                <span className="text-white">{item.user}</span>{' '}
                                <span className="text-muted">{item.action}</span>
                            </p>
                            <p className="text-[9px] text-muted/50 font-black uppercase mt-0.5">{item.time}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export function Social() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [network, setNetwork] = useState({ followers: [], following: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [activeBattles, setActiveBattles] = useState([]);
    const [discoverableBattles, setDiscoverableBattles] = useState([]);
    
    // Battle & Trajectory State
    const [battleModalOpen, setBattleModalOpen] = useState(false);
    const [trajectoryModalOpen, setTrajectoryModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [trajectoryHistory, setTrajectoryHistory] = useState([]);
    const [configOpen, setConfigOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiVariant, setConfettiVariant] = useState('burst');

    useEffect(() => {
        fetchNetwork();
        fetchDiscoverable();
    }, []);

    const fetchNetwork = async () => {
        try {
            const res = await api.get('/social/network');
            if (res.data.success) setNetwork(res.data.data);
            
            // Check for active battles I am in
            const battleRes = await api.get('/social/battle/active');
            if (battleRes.data.success) setActiveBattles(battleRes.data.data);
        } catch (err) {
            toast.error('Failed to load social network');
        } finally {
            setLoading(false);
        }
    };

    const fetchDiscoverable = async () => {
        try {
            const res = await api.get('/social/battle/discover');
            if (res.data.success) setDiscoverableBattles(res.data.data);
        } catch (err) {
            console.error('Failed to load discoverable arenas');
        }
    };

    const handleJoinBattle = async (battleId) => {
        try {
            const res = await api.post(`/social/battle/join/${battleId}`);
            if (res.data.success) {
                toast.success('Synchronized with Arena perimeter');
                navigate(`/battle/${battleId}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Breach failed');
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await api.get(`/social/search?query=${searchQuery}`);
            if (res.data.success) setSearchResults(res.data.data);
        } catch (err) {
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleFollow = async (userId) => {
        try {
            const res = await api.post(`/social/follow/${userId}`);
            if (res.data.success) {
                setConfettiVariant('fountain');
                setShowConfetti(true);
                toast.success(res.data.message);
                fetchNetwork();
                setSearchResults(prev => prev.map(u => u._id === userId ? { ...u, isFollowing: true } : u));
            }
        } catch (err) {
            toast.error('Follow failed');
        }
    };

    const handleGiftOrb = async (recipientId) => {
        try {
            const res = await api.post('/social/gift-orb', { recipientId });
            if (res.data.success) {
                setConfettiVariant('burst');
                setShowConfetti(true);
                toast.success(res.data.message);
                // Points updated on next user fetch or refresh
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gifting failed');
        }
    };

    const handleViewTrajectory = async (targetUser) => {
        setSelectedUser(targetUser);
        try {
            const res = await api.get(`/social/trajectory/${targetUser._id}`);
            if (res.data.success) {
                setTrajectoryHistory(res.data.data);
                setTrajectoryModalOpen(true);
            }
        } catch (err) {
            toast.error('Failed to load trajectory');
        }
    };

    const handleOpenBattle = (targetUser) => {
        setSelectedUser(targetUser);
        setConfigOpen(true);
    };

    const handleSendInvite = async (config) => {
        try {
            const res = await api.post('/social/battle/invite', config);
            if (res.data.success) {
                toast.success('Battle invitation transmitted!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invite failed');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black pc-gradient-text tracking-tight">Social Circle</h1>
                        <PageInsight 
                            title="Neural Network"
                            intro="Synchronize with other operatives and orchestrate collective missions. Build alliances, monitor comrade status, and expand your operational reach."
                            operations={[
                                { title: 'Comrade Synchronization', content: 'Connect with other users to monitor real-time focus activities and milestones.' },
                                { title: 'Alliance Orchestration', content: 'Form and manage groups to tackle high-complexity collective objectives.' },
                                { title: 'Intel Exchange', content: 'Share tactical insights and status updates via the Global Social Feed.' }
                            ]}
                            neuralTip="Collective focus sessions (Synergy) increase individual adherence to deep-work protocols by up to 35%."
                        />
                    </div>
                    <p className="text-xs text-muted font-bold uppercase tracking-[0.2em] mt-1">Connect · Collaborate · Conquer</p>
                </div>
                <div className="flex gap-4">
                    {activeBattles.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                            <Swords size={16} className="text-rose-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">{activeBattles.length} Active Arenas</span>
                        </div>
                    )}
                    <div className="px-5 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-0.5">Synergy Points</p>
                        <p className="text-xl font-black text-white">{user?.socialStats?.synergyPoints || 0}</p>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Network & Search */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Arena Hub */}
                    {(activeBattles.length > 0 || discoverableBattles.length > 0) && (
                        <div className="space-y-4">
                             <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <Activity size={14} className="animate-pulse" /> Strategic Arena Hub
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* My Active Battles */}
                                {activeBattles.map((b) => {
                                    const userId = user?._id || user?.id;
                                    const opponent = b.participants.find(p => {
                                        const pId = p.user?._id || p.user?.id || p.user;
                                        return pId?.toString() !== userId?.toString();
                                    });
                                    const isPending = b.status === 'pending';
                                    
                                    let timeDisplay = null;
                                    if (b.status === 'active' && b.endTime) {
                                        const remaining = Math.max(0, Math.floor((new Date(b.endTime) - new Date()) / 1000));
                                        const m = Math.floor(remaining / 60);
                                        const s = remaining % 60;
                                        timeDisplay = `${m}:${s < 10 ? '0' : ''}${s}`;
                                    }

                                    return (
                                        <Card key={b._id} className={`p-4 bg-gradient-to-br border-rose-500/20 relative group hover:border-rose-500/40 transition-all ${isPending ? 'from-amber-500/10 opacity-80' : 'from-rose-500/10'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={opponent?.user?.avatar} name={opponent?.user?.name} size="sm" />
                                                    <div>
                                                        <h4 className="text-xs font-black text-white uppercase tracking-tight">Active Room</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[9px] font-bold uppercase text-rose-400/70">
                                                                {b.participants.length} USERS • {isPending ? 'PENDING' : 'LIVE'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={() => navigate(`/battle/${b._id}`)}
                                                    variant="primary"
                                                    className={`h-8 px-4 text-[9px] uppercase font-black ${isPending ? 'bg-amber-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                                                    icon={isPending ? ArrowRight : Swords}
                                                >
                                                    {isPending ? 'Respond' : 'Enter'}
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}

                                {/* Discoverable Arenas */}
                                {discoverableBattles.map((b) => (
                                    <Card key={b._id} className="p-4 bg-white/[0.02] border-indigo-500/10 relative group hover:border-indigo-500/30 transition-all border-dashed">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                     <Avatar src={b.host?.avatar} name={b.host?.name} size="sm" />
                                                     <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0D0D0F]" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-white uppercase tracking-tight">{b.host?.name}'s Enclave</h4>
                                                    <p className="text-[9px] font-bold text-muted uppercase mt-0.5">Open for deployment</p>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => handleJoinBattle(b._id)}
                                                variant="secondary"
                                                className="h-8 px-4 text-[9px] uppercase font-black bg-indigo-500/10 hover:bg-indigo-500 border-indigo-500/20"
                                                icon={UserPlus}
                                            >
                                                Join
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <Card className="p-6">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pc-input w-full pl-12 h-14 text-lg font-bold"
                                placeholder="Search by name, email, or Neural ID..."
                            />
                            <button type="submit" disabled={searching} className="absolute right-2 top-2 h-10 px-6 bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all">
                                {searching ? '...' : 'Scope'}
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-4">
                                {searchResults.map((u) => (
                                    <div key={u._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <Avatar src={u.avatar} name={u.name} size="md" />
                                            <div>
                                                <h4 className="font-bold text-white">{u.name}</h4>
                                                <div className="flex items-center gap-3 text-[10px] text-muted font-black uppercase">
                                                    <span className="text-indigo-400">{u.totalScore || u.points} score</span>
                                                    <span className="text-amber-500">{u.streak}d fire</span>
                                                </div>
                                            </div>
                                        </div>
                                        {network.following.some(f => f._id === u._id) ? (
                                            <span className="text-[10px] font-black text-muted uppercase tracking-widest px-4 py-2">Connected</span>
                                        ) : (
                                            <Button icon={UserPlus} onClick={() => handleFollow(u._id)} variant="secondary">Follow</Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Following List */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                             Professional Network <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-xs">{network.following.length}</span>
                        </h3>
                        
                        {network.following.length === 0 ? (
                            <Card className="p-12 text-center border-dashed">
                                <Users className="mx-auto text-muted mb-4 opacity-20" size={48} />
                                <p className="text-muted font-bold">Your circle is empty. Start finding peers to build your network.</p>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {network.following.map((f) => (
                                    <Card key={f._id} className="p-5 group hover:border-indigo-500/40 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleGiftOrb(f._id)}
                                                className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                                                title="Send Synergy Orb"
                                            >
                                                <Zap size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <Avatar src={f.avatar} name={f.name} size="lg" />
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{f.name}</h4>
                                                <div className="flex gap-4 mt-1">
                                                    <div className="text-center">
                                                        <p className="text-[9px] text-muted uppercase font-black">Score</p>
                                                        <p className="text-xs font-bold text-indigo-400">{f.totalScore || f.points}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[9px] text-muted uppercase font-black">Streak</p>
                                                        <p className="text-xs font-bold text-amber-500">{f.streak}d</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[9px] text-muted uppercase font-black">Wins</p>
                                                        <p className="text-xs font-bold text-emerald-400">{f.socialStats?.battlesWon || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                                            <Button variant="ghost" size="sm" className="text-[10px] h-8" onClick={() => handleViewTrajectory(f)}>View Trajectory</Button>
                                            <Button variant="secondary" size="sm" className="h-8 px-3 text-[10px]" icon={ArrowRight} onClick={() => handleOpenBattle(f)}>Battle</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Pulse & Insights */}
                <div className="space-y-8">
                    <Card className="p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
                        <PulseFeed />
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border-indigo-500/20">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Award size={14} /> Synergy Hub
                        </h3>
                        <p className="text-xs text-muted leading-relaxed mb-6 font-medium">
                            Deploy Synergy Orbs to boost your partner's growth. High synergy increases collective farm yields and mission rewards.
                        </p>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Zap className="text-indigo-400" size={16} />
                                    <span className="text-[10px] font-black uppercase text-white">Synergy Orb</span>
                                </div>
                                <span className="text-[10px] font-bold text-muted">500 PTS</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 opacity-50">
                                <div className="flex items-center gap-3">
                                    <Shield className="text-purple-400" size={16} />
                                    <span className="text-[10px] font-black uppercase text-white">Streak Shard</span>
                                </div>
                                <span className="text-[10px] font-bold text-muted">LOCKED</span>
                            </div>
                        </div>

                        <Button className="w-full mt-6 h-12 bg-indigo-500 shadow-lg shadow-indigo-500/20" icon={Star}>
                            Upgrade Network
                        </Button>
                    </Card>
                </div>
            </div>

            <BattleConfigModal 
                open={configOpen} 
                onClose={() => setConfigOpen(false)} 
                opponent={selectedUser}
                onInvite={handleSendInvite}
            />

            
            <TrajectoryModal 
                open={trajectoryModalOpen} 
                onClose={() => setTrajectoryModalOpen(false)} 
                user={selectedUser}
                history={trajectoryHistory}
            />

            <Confetti active={showConfetti} theme="synergy" variant={confettiVariant} onComplete={() => setShowConfetti(false)} />
        </div>
    );
}

export default Social;
