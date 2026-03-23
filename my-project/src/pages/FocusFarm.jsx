import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Globe, TreePine, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { gamificationAPI } from '../api/gamificationAPI';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'sonner';
import { FarmScene, TREES_PER_FARM } from '../components/FarmScene';
import { getTreeMetadata } from '../utils/themeTreeMetadata';

export function FocusFarm() {
    const { gamData, loading, refresh } = useGamification();
    const farmTheme = gamData?.avatarConfig?.farmTheme || 'classic';
    const getMetadata = (type) => getTreeMetadata(farmTheme, type);

    const [communityTrees, setCommunityTrees] = useState(null);

    // Pagination logic: chronological order (oldest planted first inside a farm)
    const allTrees = gamData?.trees || [];
    const totalFarms = Math.max(1, Math.ceil(allTrees.length / TREES_PER_FARM));

    const [currentFarmIdx, setCurrentFarmIdx] = useState(0);

    useEffect(() => {
        setCurrentFarmIdx(totalFarms - 1);
    }, [totalFarms]);

    const handlePrev = () => setCurrentFarmIdx(p => Math.max(0, p - 1));
    const handleNext = () => setCurrentFarmIdx(p => Math.min(totalFarms - 1, p + 1));


    useEffect(() => {
        gamificationAPI.getCommunity()
            .then(r => setCommunityTrees(r.data.data.totalTrees))
            .catch(() => { });
    }, []);


    if (loading || !gamData) return <LoadingSpinner />;

    const startIndex = currentFarmIdx * TREES_PER_FARM;
    const currentFarmTrees = allTrees.slice(startIndex, startIndex + TREES_PER_FARM);

    // Stats based on ALL trees
    const typeCount = allTrees.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
    }, {});

    const rarestTree = ['golden', 'pine_rare', 'oak', 'pine', 'sapling']
        .find(t => typeCount[t] > 0);


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold pc-gradient-text" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>
                        My Farm 🌿
                    </h1>
                    <p className="text-xs text-muted mt-1">
                        Every focus session grows a tree. The longer you focus, the bigger the tree.
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Items', value: allTrees.length, icon: '📦' },
                    { label: 'Rarest', value: rarestTree ? getMetadata(rarestTree).icon : '—', icon: '⭐' },
                    { label: `${getMetadata('oak').name}s`, value: typeCount['oak'] || 0, icon: getMetadata('oak').icon },
                ].map(stat => (
                    <div key={stat.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
                        <span className="text-2xl">{stat.icon}</span>
                        <p className="text-lg font-bold" style={{ color: 'var(--color-text)', fontFamily: 'Manrope, sans-serif' }}>{stat.value}</p>
                        <p className="text-[10px] text-muted text-center">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Guide */}
            <Card>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>How trees grow</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { type: 'sapling', range: '25–49 min', pts: '+15 pts' },
                        { type: 'pine', range: '50–119 min', pts: '+25 pts' },
                        { type: 'oak', range: '≥ 120 min', pts: '+40 pts' },
                        { type: 'golden', range: '100 sessions', pts: 'Milestone' },
                    ].map(g => {
                        const meta = getMetadata(g.type);
                        return (
                            <div key={g.type} className="flex flex-col items-center gap-1 p-2 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                <span className="text-2xl">{meta.icon}</span>
                                <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{meta.name}</p>
                                <p className="text-[10px] text-muted">{g.range}</p>
                                <p className="text-[10px] font-bold" style={{ color: 'var(--primary)' }}>{g.pts}</p>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Farm garden grid */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        🌿 Farm #{currentFarmIdx + 1} ({currentFarmTrees.length}/{TREES_PER_FARM})
                    </h3>
                    {totalFarms > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrev}
                                disabled={currentFarmIdx === 0}
                                className="p-1 rounded hover:opacity-80 disabled:opacity-30 transition-all"
                                style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs text-muted font-medium">{currentFarmIdx + 1} / {totalFarms}</span>
                            <button
                                onClick={handleNext}
                                disabled={currentFarmIdx === totalFarms - 1}
                                className="p-1 rounded hover:opacity-80 disabled:opacity-30 transition-all"
                                style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
                {allTrees.length === 0 ? (
                    <EmptyState
                        icon={Leaf}
                        title="Your farm is empty"
                        description="Finish a focus session, or wait 3 seconds for a test tree! 🌱"
                    />
                ) : (
                    <FarmScene 
                        trees={currentFarmTrees} 
                        farmTheme={gamData.avatarConfig?.farmTheme || 'classic'} 
                    />
                )}
            </Card>

            {/* Community Garden */}
            <div
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.12), rgba(var(--primary-rgb),0.05))', border: '1px solid rgba(var(--primary-rgb),0.2)' }}
            >
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(var(--primary-rgb),0.15)' }}>
                    <Globe size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Community Forest</p>
                    <p className="text-xs text-muted">
                        {communityTrees !== null
                            ? `🌲 ${communityTrees.toLocaleString()} trees planted by all users`
                            : 'Loading community stats…'}
                    </p>
                </div>
                <TreePine size={32} style={{ color: 'var(--primary)' }} className="ml-auto opacity-30" />
            </div>
        </div>
    );
}
