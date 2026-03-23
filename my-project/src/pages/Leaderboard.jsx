import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { getLeague, LEAGUES } from '../utils/leagues';
import { Trophy, Flame, Target, Clock } from 'lucide-react';

const LEAGUE_NEON = {
    Master: { ring: '#f59e0b', ring2: '#fbbf24', glow: 'rgba(245,158,11,0.4)' },
    Diamond: { ring: '#22d3ee', ring2: '#818cf8', glow: 'rgba(34,211,238,0.4)' },
    Platinum: { ring: '#818cf8', ring2: '#a78bfa', glow: 'rgba(129,140,248,0.4)' },
    Gold: { ring: '#eab308', ring2: '#f59e0b', glow: 'rgba(234,179,8,0.4)' },
    Silver: { ring: '#94a3b8', ring2: '#cbd5e1', glow: 'rgba(148,163,184,0.3)' },
    Bronze: { ring: '#f97316', ring2: '#fb923c', glow: 'rgba(249,115,22,0.4)' },
};

function getPlanetSize(localRank) {
    if (localRank === 1) return 90;
    if (localRank === 2) return 74;
    if (localRank === 3) return 64;
    if (localRank === 4) return 56;
    return 50;
}

function Stars() {
    const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.4, delay: Math.random() * 5, dur: 2 + Math.random() * 3,
    })), []);
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {stars.map(s => (
                <motion.div key={s.id} className="absolute rounded-full"
                    style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, background: '#fff' }}
                    animate={{ opacity: [0.1, 0.8, 0.1] }}
                    transition={{ duration: s.dur, delay: s.delay, repeat: Infinity }} />
            ))}
        </div>
    );
}

function OrbitRing({ size, c1, c2, duration, reverse, uid }) {
    return (
        <div className="absolute pointer-events-none"
             style={{ 
                 width: size * 1.6, height: size * 1.6, 
                 left: '50%', top: '50%', 
                 transform: 'translate(-50%, -50%) perspective(1000px) rotateX(68deg)',
                 zIndex: 5
             }}>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <defs>
                    <motion.linearGradient 
                        id={`lg-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%"
                        animate={{ gradientTransform: `rotate(${reverse ? -360 : 360}, 0.5, 0.5)` }}
                        transition={{ duration, repeat: Infinity, ease: 'linear' }}
                    >
                        <stop offset="0%"   stopColor={c1} />
                        <stop offset="30%"  stopColor={c2} />
                        <stop offset="50%"  stopColor={c1} />
                        <stop offset="70%"  stopColor={c2} />
                        <stop offset="100%" stopColor={c1} />
                    </motion.linearGradient>
                    <filter id={`gf-${uid}`}>
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <circle
                    cx="50" cy="50" r="46"
                    fill="none"
                    stroke={`url(#lg-${uid})`}
                    strokeWidth="3.5"
                    filter={`url(#gf-${uid})`}
                />
            </svg>
        </div>
    );
}

function Planet({ entry, localRank, isMe }) {
    const league = getLeague(entry.user?.totalScore || 0);
    const neon = LEAGUE_NEON[league.id] || LEAGUE_NEON.Bronze;
    const size = getPlanetSize(localRank);
    const score = (entry.user?.totalScore || entry.user?.points || 0).toLocaleString();
    const orbitR = size * 0.92;
    const uid1 = `${entry.user?.id || localRank}-a`;
    const uid2 = `${entry.user?.id || localRank}-b`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: localRank * 0.08, type: 'spring', bounce: 0.3 }}
            className="flex flex-col items-center gap-1.5"
        >
            {/* Score */}
            <motion.p
                style={{ color: neon.ring, fontFamily: 'Manrope,sans-serif', fontSize: size * 0.19, fontWeight: 900, textShadow: `0 0 14px ${neon.ring}` }}
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3.2 + localRank * 0.3, repeat: Infinity, ease: 'easeInOut' }}
            >
                {score}
            </motion.p>

            {/* Planet + rings */}
            <div className="relative flex items-center justify-center flex-shrink-0"
                style={{ width: size * 1.8, height: size * 1.6 }}
            >
                {/* Back Ring (z-index < 10) - Top Half + overlap */}
                <div className="absolute inset-0 pointer-events-none" 
                     style={{ transform: 'rotateZ(-18deg)', zIndex: 5, clipPath: 'inset(0 0 49% 0)' }}>
                    <div className="absolute inset-0 overflow-visible">
                        <OrbitRing size={size} c1={neon.ring} c2={neon.ring2} duration={12} uid={uid1} />
                    </div>
                </div>

                {/* Planet body */}
                <div className="absolute rounded-full flex items-center justify-center"
                    style={{
                        width: size, height: size,
                        background: `radial-gradient(circle at 35% 30%, #2a1060, #08040f)`,
                        boxShadow: `0 0 ${size * 0.4}px ${neon.glow}, 0 0 ${size * 0.25}px ${neon.ring} inset`,
                        border: `2px solid ${neon.ring}`,
                        zIndex: 10,
                    }}>
                    <AvatarDisplay
                        avatarConfig={entry.user?.avatarConfig}
                        userTheme={entry.user?.themePreferences}
                        size={size >= 80 ? 'lg' : size >= 64 ? 'md' : 'sm'}
                        showTitle={true}
                    />
                    {/* Gloss highlight */}
                    <div className="absolute rounded-full pointer-events-none"
                        style={{ top: '8%', left: '12%', width: '40%', height: '26%', background: 'radial-gradient(circle, rgba(255,255,255,0.22), transparent)' }} />
                </div>

                {/* Front Ring (z-index > 10) - Bottom Half + overlap */}
                <div className="absolute inset-0 pointer-events-none" 
                     style={{ transform: 'rotateZ(-18deg)', zIndex: 15, clipPath: 'inset(49% 0 0 0)' }}>
                    <OrbitRing size={size} c1={neon.ring} c2={neon.ring2} duration={12} uid={uid1} />
                </div>

                {/* League badge */}
                <div className="absolute flex items-center justify-center rounded-full"
                    style={{
                        bottom: '2%', right: '28%',
                        width: size * 0.32, height: size * 0.32, fontSize: size * 0.16,
                        background: '#0a0614',
                        border: `2.5px solid ${neon.ring}`,
                        boxShadow: `0 0 12px ${neon.ring}`,
                        zIndex: 20
                    }}>
                    {league.emoji}
                </div>
            </div>

            {/* Name + rank */}
            <div className="text-center" style={{ maxWidth: size * 2 }}>
                <p className="font-bold text-white truncate leading-tight" style={{ fontSize: size * 0.17, fontFamily: 'Manrope,sans-serif' }}>
                    {entry.user?.name}
                    {isMe && <span style={{ color: 'var(--primary)', fontSize: size * 0.12 }}> (you)</span>}
                </p>
                <div className="flex flex-col gap-0.5 mt-1">
                    <p style={{ color: neon.ring, fontSize: size * 0.13, fontWeight: 800, opacity: 0.9 }}>
                        🏆 #{localRank} in {league.label}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: size * 0.11, fontWeight: 700 }}>
                        🌐 #{entry.rank} globally
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function ListCard({ entry, isMe, index }) {
    const league = getLeague(entry.user?.totalScore || 0);
    const neon = LEAGUE_NEON[league.id] || LEAGUE_NEON.Bronze;
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all`}
            style={{
                background: 'rgba(255,255,255,0.032)',
                borderColor: isMe ? neon.ring + '55' : 'rgba(255,255,255,0.06)',
                boxShadow: isMe ? `0 0 0 1px ${neon.ring}33` : 'none',
            }}
        >
            <div className="w-8 flex-shrink-0 text-right">
                <span className="text-[10px] font-black opacity-30" style={{ color: neon.ring }}>#{entry.rank}</span>
            </div>
            <AvatarDisplay avatarConfig={entry.user?.avatarConfig} userTheme={entry.user?.themePreferences} size="sm" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                    {entry.user?.name}
                    {isMe && <span className="ml-1 text-[10px]" style={{ color: 'var(--primary)' }}>(you)</span>}
                </p>
                <p className="text-[9px] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <span className="font-bold" style={{ color: neon.ring }}>🏆 #{index + 6} in {league.label}</span>
                    <span className="opacity-60 text-[8px]">🌐 #{entry.rank} globally</span>
                </p>
                <p className="text-[8px] flex items-center gap-2 mt-1 opacity-40">
                    <span className="flex items-center gap-0.5"><Target size={8} style={{ color: '#f59e0b' }} />{(entry.user?.totalScore || entry.user?.points || 0).toLocaleString()} score</span>
                    <span className="flex items-center gap-0.5"><Flame size={8} style={{ color: '#f97316' }} />{entry.user?.streak || 0}d</span>
                </p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="font-black text-sm" style={{ color: neon.ring, fontFamily: 'Manrope,sans-serif' }}>
                    {(entry.user?.totalScore || entry.user?.points || 0).toLocaleString()}
                </p>
                <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>score</p>
            </div>
        </motion.div>
    );
}

function TabBtn({ league, active, count, onClick }) {
    const neon = LEAGUE_NEON[league.id] || LEAGUE_NEON.Bronze;
    return (
        <button onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0"
            style={{
                background: active ? `${neon.ring}25` : 'rgba(255,255,255,0.04)',
                color: active ? neon.ring : 'rgba(255,255,255,0.3)',
                border: `1px solid ${active ? neon.ring + '55' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: active ? `0 0 16px ${neon.glow}` : 'none',
            }}>
            {league.emoji} {league.label}
            <span className="ml-0.5 opacity-50">({count})</span>
        </button>
    );
}

export function Leaderboard() {
    const { leaderboard } = useData();
    const { user } = useAuth();
    useSEO('Cosmic Arena', 'Global leaderboard — ranked by score.');

    // Group by league, keeping global rank from backend (already sorted by totalScore)
    const grouped = useMemo(() => {
        if (!leaderboard) return {};
        const g = {};
        for (const entry of leaderboard) {
            const l = getLeague(entry.user?.totalScore || 0);
            if (!g[l.id]) g[l.id] = { league: l, entries: [] };
            g[l.id].entries.push(entry);
        }
        return g;
    }, [leaderboard]);

    const tabs = useMemo(() => LEAGUES.filter(l => grouped[l.id]).map(l => l.id), [grouped]);
    const [activeTab, setActiveTab] = useState(null);
    const currentTab = (activeTab && grouped[activeTab]) ? activeTab : tabs[0];

    const myRank = useMemo(() => leaderboard?.find(e => e.user?.id === user?.id)?.rank, [leaderboard, user]);
    const myLeague = useMemo(() => getLeague(user?.totalScore || 0), [user]);
    const myLeagueRank = useMemo(() => {
        if (!grouped[myLeague.id]) return null;
        const idx = grouped[myLeague.id].entries.findIndex(e => e.user?.id === user?.id);
        return idx !== -1 ? idx + 1 : null;
    }, [grouped, myLeague.id, user?.id]);
    const myNeon = LEAGUE_NEON[myLeague?.id] || LEAGUE_NEON.Bronze;

    if (!leaderboard) return <LoadingSpinner />;
    if (leaderboard.length === 0) return <EmptyState icon={Trophy} title="Leaderboard is empty" description="Score points by completing tasks to appear here!" />;

    const currentGroup = grouped[currentTab];
    if (!currentGroup) return null;

    const top5 = currentGroup.entries.slice(0, 5);
    const restArr = currentGroup.entries.slice(5);

    return (
        <div className="relative rounded-3xl overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, #0e0628 0%, #040312 55%, #000 100%)', minHeight: '85vh' }}>
            <Stars />

            {/* Nebula glows */}
            <div className="absolute top-0 left-0 w-96 h-80 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.1), transparent 70%)' }} />
            <div className="absolute top-20 right-0 w-72 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08), transparent 70%)' }} />

            <div className="relative z-10 p-5 pb-8 space-y-5">

                {/* Title */}
                <div className="text-center pt-1">
                    <h1 className="font-black" style={{
                        fontFamily: 'Manrope,sans-serif', fontSize: 'clamp(1.5rem,5vw,2rem)',
                        background: 'linear-gradient(90deg,#818cf8,#22d3ee,#f59e0b)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        🪐 Leaderboard
                    </h1>
                    <p className="text-[10px] mt-0.5 uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        Top 50 operators · Ranked by score
                    </p>
                </div>

                {/* Your global rank banner */}
                {myRank && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="mx-auto max-w-lg flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-6 rounded-2xl"
                        style={{ background: `${myNeon.ring}12`, border: `1px solid ${myNeon.ring}40` }}>
                        <div className="flex items-center gap-2">
                            <Trophy size={16} style={{ color: myNeon.ring }} />
                            <p className="text-sm font-black text-white">
                                Global: <span style={{ color: myNeon.ring }}>#{myRank}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                            <span className="text-sm">{myLeague.emoji}</span>
                            <p className="text-sm font-black text-white">
                                {myLeague.label}: <span style={{ color: myNeon.ring }}>#{myLeagueRank || '?'}</span>
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* League tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {tabs.map(lid => (
                        <TabBtn key={lid} league={grouped[lid].league} count={grouped[lid].entries.length}
                            active={lid === currentTab} onClick={() => setActiveTab(lid)} />
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    <motion.div key={currentTab}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Top 5 — cosmic planets */}
                        <div className="flex flex-wrap justify-center gap-4 md:gap-6 py-4">
                            {top5.map((entry, i) => (
                                <Planet key={entry.user?.id || i} entry={entry} localRank={i + 1}
                                    isMe={entry.user?.id === user?.id} />
                            ))}
                        </div>

                        {/* Rank 6–50 — dark list */}
                        {restArr.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Remaining Operators</p>
                                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                </div>
                                <div className="space-y-2">
                                    {restArr.map((entry, i) => (
                                        <ListCard key={entry.user?.id || i} entry={entry}
                                            isMe={entry.user?.id === user?.id} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}