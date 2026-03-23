import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/Card';

export function Unlockables() {
    const { gamData, loading } = useGamification();

    if (loading || !gamData) return <LoadingSpinner />;

    const { milestones = [] } = gamData;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-bold pc-gradient-text" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>
                    Milestones 🏆
                </h1>
                <p className="text-xs text-muted mt-1">Reach goals to unlock special rewards and avatar items.</p>
            </div>

            {/* Summary row */}
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.12), rgba(var(--primary-rgb),0.04))', border: '1px solid rgba(var(--primary-rgb),0.2)' }}>
                <Trophy size={24} className="text-primary" />
                <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {milestones.filter(m => m.unlocked).length} / {milestones.length} Milestones Unlocked
                    </p>
                    <p className="text-xs text-muted">Keep going — each unlock grants a permanent reward!</p>
                </div>
            </div>

            {/* Milestone cards */}
            <div className="grid gap-3 sm:grid-cols-2">
                {milestones.map((m, i) => {
                    const pct = Math.min((m.current / m.total) * 100, 100);
                    return (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-2xl relative overflow-hidden"
                            style={{
                                background: m.unlocked
                                    ? 'linear-gradient(135deg, rgba(var(--primary-rgb),0.1), rgba(var(--primary-rgb),0.04))'
                                    : 'var(--color-surface-2)',
                                border: m.unlocked ? '1.5px solid rgba(var(--primary-rgb),0.4)' : '1.5px solid transparent',
                            }}
                        >
                            {/* Glow effect when unlocked */}
                            {m.unlocked && (
                                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(var(--primary-rgb),0.15), transparent 70%)' }} />
                            )}

                            <div className="flex items-start gap-3">
                                <span className="text-2xl leading-none">{m.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{m.label}</p>
                                        {m.unlocked && (
                                            <span className="text-[10px] font-bold text-primary bg-[rgba(var(--primary-rgb),0.1)] px-2 py-0.5 rounded-full shrink-0">
                                                ✓ Unlocked
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted mt-0.5">{m.description}</p>
                                    <p className="text-[11px] text-primary mt-1 font-medium">🎁 {m.reward}</p>

                                    {/* Progress bar */}
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-[10px] text-muted">
                                            <span>{Math.min(m.current, m.total).toLocaleString()} / {m.total.toLocaleString()}</span>
                                            <span>{Math.round(pct)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.12)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                                                className="h-full rounded-full"
                                                style={{
                                                    background: m.unlocked
                                                        ? 'var(--primary)'
                                                        : 'rgba(var(--primary-rgb), 0.7)',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
