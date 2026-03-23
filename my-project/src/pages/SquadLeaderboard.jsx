import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, Medal, Award, Users, Shield, 
    ArrowLeft, Target, Zap, Flame, Star,
    ChevronRight, Info, Crown, Gem, Sword
} from 'lucide-react';
import api from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';

const LEAGUES = [
    { id: 'Master', min: 150000, color: 'text-amber-400', bg: 'from-amber-400/20 to-amber-900/10', border: 'border-amber-400/30', icon: Crown, shadow: 'shadow-amber-500/20' },
    { id: 'Diamond', min: 50000, color: 'text-cyan-400', bg: 'from-cyan-400/20 to-cyan-900/10', border: 'border-cyan-400/30', icon: Gem, shadow: 'shadow-cyan-500/20' },
    { id: 'Platinum', min: 15000, color: 'text-indigo-400', bg: 'from-indigo-400/20 to-indigo-900/10', border: 'border-indigo-400/30', icon: Zap, shadow: 'shadow-indigo-500/20' },
    { id: 'Gold', min: 5000, color: 'text-yellow-500', bg: 'from-yellow-400/20 to-yellow-900/10', border: 'border-yellow-400/30', icon: Target, shadow: 'shadow-yellow-500/20' },
    { id: 'Silver', min: 1000, color: 'text-slate-300', bg: 'from-slate-400/20 to-slate-800/10', border: 'border-slate-300/30', icon: Shield, shadow: 'shadow-slate-500/10' },
    { id: 'Bronze', min: 0, color: 'text-orange-500', bg: 'from-orange-500/20 to-orange-900/10', border: 'border-orange-500/30', icon: Sword, shadow: 'shadow-orange-500/10' },
];

export function SquadLeaderboard() {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeLeague, setActiveLeague] = useState(LEAGUES[0].id);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/social/leaderboard');
                setLeaderboard(res.data.data);
                
                // Find highest league with squads or default to Bronze
                const squads = res.data.data;
                const topSquad = squads[0];
                if (topSquad) {
                    setActiveLeague(topSquad.league || 'Bronze');
                }
            } catch (err) {
                console.error('Failed to fetch squad leaderboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const filteredSquads = leaderboard.filter(s => (s.league || 'Bronze') === activeLeague);
    const currentLeagueData = LEAGUES.find(l => l.id === activeLeague);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#070708] text-white overflow-x-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br ${currentLeagueData.bg} rounded-full blur-[120px] opacity-20 transition-all duration-1000`} />
                <div className={`absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-gradient-to-tr ${currentLeagueData.bg} rounded-full blur-[100px] opacity-10 transition-all duration-1000`} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Top Navigation */}
                <div className="flex items-center justify-between mb-12">
                    <button 
                        onClick={() => navigate('/squad')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Command Center</span>
                    </button>

                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Matrix Active</span>
                    </div>
                </div>

                {/* Hero Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]"
                    >
                        Tactical Hierarchy
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl sm:text-7xl lg:text-8xl font-black italic tracking-tighter mb-4"
                    >
                        THE <span className="pc-gradient-text">ARENA</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted text-sm sm:text-base font-medium max-w-2xl mx-auto"
                    >
                        Compete in the world's most elite production matrix. 
                        Ascend through the leagues to unlock neural dominance.
                    </motion.p>
                </div>

                {/* League Selector Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-16 sticky top-4 z-50 p-2 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl">
                    {LEAGUES.map((league) => {
                        const Icon = league.icon;
                        const isActive = activeLeague === league.id;
                        return (
                            <button
                                key={league.id}
                                onClick={() => setActiveLeague(league.id)}
                                className={`relative px-6 py-3 rounded-2xl flex items-center gap-3 transition-all ${
                                    isActive 
                                    ? `bg-white/5 border border-white/10 ${league.color} shadow-lg` 
                                    : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <Icon size={18} fill={isActive ? 'currentColor' : 'none'} fillOpacity={0.1} />
                                <span className="text-xs font-black uppercase tracking-wider">{league.id}</span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="league-glow"
                                        className={`absolute inset-0 rounded-2xl transition-all duration-1000 blur-xl opacity-20 -z-10 bg-gradient-to-r ${league.bg}`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Section */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeLeague}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-12"
                    >
                        {/* Podium for top 3 in this league */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto px-4 pb-12">
                            {[filteredSquads[1], filteredSquads[0], filteredSquads[2]].map((squad, i) => {
                                if (!squad) return <div key={i} className="hidden md:block" />;
                                
                                const actualRank = i === 1 ? 1 : i === 0 ? 2 : 3;
                                const isWinner = actualRank === 1;

                                return (
                                    <div 
                                        key={squad._id}
                                        className={`flex flex-col items-center gap-6 ${isWinner ? 'order-1 md:order-2' : i === 0 ? 'order-2 md:order-1' : 'order-3'}`}
                                    >
                                        <div className="relative group">
                                            {/* Glow Effect */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${currentLeagueData.bg} rounded-[3rem] blur-3xl opacity-40 group-hover:opacity-70 transition-all duration-500`} />
                                            
                                            {/* Card */}
                                            <div className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-[3.5rem] bg-[#111114] border-2 ${currentLeagueData.border} flex flex-col items-center justify-center p-6 shadow-2xl overflow-hidden`}>
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                                                <currentLeagueData.icon size={isWinner ? 80 : 64} className={`${currentLeagueData.color} mb-2`} fill="currentColor" fillOpacity={0.1} />
                                                <div className="absolute bottom-4 flex flex-col items-center">
                                                    <span className={`text-2xl font-black ${currentLeagueData.color}`}>#{actualRank}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2">{squad.name}</h3>
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-lg font-black ${currentLeagueData.color}`}>{squad.squadXP?.toLocaleString() || 0}</span>
                                                    <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">Matrix Momentum</span>
                                                </div>
                                                <div className="w-[1px] h-8 bg-white/10" />
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-black">{squad.memberCount}</span>
                                                    <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">Operational Units</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Pedestal */}
                                        <div className={`w-full max-w-[200px] rounded-t-3xl bg-gradient-to-t ${currentLeagueData.bg} ${isWinner ? 'h-32' : actualRank === 2 ? 'h-24' : 'h-16'} border-x border-t ${currentLeagueData.border} hidden md:block opacity-50`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* List view for the rest */}
                        {filteredSquads.length > 3 ? (
                            <div className="max-w-4xl mx-auto space-y-3 px-4">
                                {filteredSquads.slice(3).map((squad, i) => (
                                    <div 
                                        key={squad._id}
                                        className="group flex items-center gap-6 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                    >
                                        <div className="w-12 text-sm font-black text-muted group-hover:text-white transition-colors">
                                            #{i + 4}
                                        </div>

                                        <div className="flex-1 flex items-center gap-4 min-w-0">
                                            <div className={`p-3 rounded-2xl bg-white/5 ${currentLeagueData.color} group-hover:scale-110 transition-transform`}>
                                                <Shield size={20} />
                                            </div>
                                            <div className="truncate">
                                                <p className="font-black text-white uppercase tracking-tight text-lg">{squad.name}</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                        <Users size={12} className="text-muted" />
                                                        <span className="text-[10px] font-bold text-muted uppercase">{squad.memberCount} Reinforcements</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden sm:flex items-center gap-8">
                                            <div className="text-right">
                                                <p className={`text-xl font-black ${currentLeagueData.color}`}>{squad.squadXP?.toLocaleString() || 0}</p>
                                                <p className="text-[9px] font-black text-muted uppercase tracking-widest">Global Purity</p>
                                            </div>
                                            <div className="p-2 bg-white/5 rounded-xl text-muted group-hover:text-white transition-colors">
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredSquads.length === 0 ? (
                            <div className="text-center py-24 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] max-w-2xl mx-auto">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-muted">
                                    <Info size={40} />
                                </div>
                                <h4 className="text-xl font-black uppercase tracking-tight mb-2">No Squads in {activeLeague}</h4>
                                <p className="text-muted text-sm font-medium">The matrix is currently empty for this sector. Complete tasks to ascend.</p>
                            </div>
                        ) : null}
                    </motion.div>
                </AnimatePresence>

                {/* Footer Info / Rewards Preview */}
                <div className="mt-24 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-white/5 pt-16 mb-20">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-3xl bg-gradient-to-br ${currentLeagueData.bg} border ${currentLeagueData.border}`}>
                                <currentLeagueData.icon size={32} className={currentLeagueData.color} />
                            </div>
                            <div>
                                <h4 className={`text-2xl font-black uppercase tracking-tight ${currentLeagueData.color}`}>{activeLeague} League</h4>
                                <p className="text-xs font-black text-muted uppercase tracking-[0.2em]">Operational Tier Benefits</p>
                            </div>
                        </div>
                        <p className="text-muted text-sm leading-relaxed max-w-md">
                            Operating within the {activeLeague} League grants your squad special privileges within the ProgressCircle domain. 
                            Maintain high performance to avoid tactical demotion.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center gap-3 text-center group hover:bg-white/5 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <Star fill="currentColor" size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-white">Visual Tag</p>
                                <p className="text-[8px] font-bold text-muted uppercase mt-1">Unique {activeLeague} Badge</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center gap-3 text-center group hover:bg-white/5 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <Zap fill="currentColor" size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-white">XP Sync</p>
                                <p className="text-[8px] font-bold text-muted uppercase mt-1">Faster Rank Scaling</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Decorative Footer */}
            <div className="h-64 bg-gradient-to-t from-indigo-500/5 to-transparent flex items-center justify-center border-t border-white/5">
                <div className="flex flex-col items-center gap-6 opacity-20">
                    <Shield size={64} className="text-indigo-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">Tactical Dominance System</p>
                </div>
            </div>
        </div>
    );
}
