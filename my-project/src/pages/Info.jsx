import { motion } from 'framer-motion';
import { Target, Trophy, Flame, CheckCircle2, Repeat, Clock, HelpCircle, Star, Shield, Users } from 'lucide-react';
import { Card } from '../components/Card';

export function Info() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-32">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl" style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                    <HelpCircle size={28} />
                </div>
                <div>
                    <h1 className="font-extrabold pc-gradient-text tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1.6rem, 6vw, 2.25rem)' }}>How It Works</h1>
                    <p className="text-xs text-muted font-medium mt-1 uppercase tracking-[0.2em]">Guide & Point System</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── What is Progress Circle? ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                    <Card className="h-full">
                        <div className="flex items-center gap-3 mb-4">
                            <Star className="text-yellow-500" size={24} />
                            <h2 className="text-xl font-bold">What is Progress Circle?</h2>
                        </div>
                        <p className="text-sm text-pc-muted leading-relaxed mb-4">
                            Progress Circle is a comprehensive productivity suite designed to help you organize your life, track your time, build lasting habits, and conquer your goals through gamification.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 style={{ color: 'var(--primary)' }} className="shrink-0 mt-0.5" size={16} />
                                <div>
                                    <strong className="text-sm text-white block">Tasks & Sub-tasks</strong>
                                    <span className="text-xs text-pc-muted">Break down huge projects into small, manageable checklists.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Repeat style={{ color: 'var(--primary)' }} className="shrink-0 mt-0.5" size={16} />
                                <div>
                                    <strong className="text-sm text-white block">Habit Loops</strong>
                                    <span className="text-xs text-pc-muted">Track daily positive behaviors to reprogram your routines.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Shield style={{ color: 'var(--primary)' }} className="shrink-0 mt-0.5" size={16} />
                                <div>
                                    <strong className="text-sm text-white block">Focus Farm & Squads</strong>
                                    <span className="text-xs text-pc-muted">Grow trees by focusing deeply and team up to tackle objectives.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Target style={{ color: 'var(--primary)' }} className="shrink-0 mt-0.5" size={16} />
                                <div>
                                    <strong className="text-sm text-white block">Strategic Goals</strong>
                                    <span className="text-xs text-pc-muted">Set exact deadlines and tie tasks to your longest-term visions.</span>
                                </div>
                            </li>
                        </ul>
                    </Card>
                </motion.div>

                {/* ── Points & Gamification ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                    <Card className="h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 w-32 h-32 rounded-bl-full pointer-events-none" style={{ background: 'rgba(var(--primary-rgb), 0.05)' }} />
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <Trophy className="text-amber-400" size={24} />
                            <h2 className="text-xl font-bold">How Points Work</h2>
                        </div>
                        <p className="text-sm text-pc-muted leading-relaxed mb-4 relative z-10">
                            Your <strong>Points</strong> are earned directly by completing actions and are used for purchasing items in the Avatar Shop. They also determine your League tier.
                        </p>

                        <div className="space-y-2 relative z-10 h-64 overflow-y-auto pr-2 scrollbar-none">
                            {[
                                { action: "Completing a standard task", pts: "+10 pts" },
                                { action: "Completing a Team Synergy task", pts: "+15 pts" },
                                { action: "Logging a Daily Habit", pts: "+5 pts" },
                                { action: "Achieving a Strategic Goal", pts: "+50 pts" },
                                { action: "25+ min Focus Session (Sapling)", pts: "+15 pts" },
                                { action: "50+ min Focus Session (Pine)", pts: "+25 pts" },
                                { action: "120+ min Focus Session (Oak)", pts: "+40 pts" },
                                { action: "7-Day Consistent Task Streak", pts: "+100 pts" },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="text-sm font-medium">{item.action}</span>
                                    <span className="text-xs font-black px-2 py-1 rounded" style={{ color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.1)' }}>{item.pts}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* ── League Score System ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="md:col-span-2">
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <Trophy className="text-amber-400" size={24} />
                            <h2 className="text-xl font-bold">The League Score System</h2>
                        </div>
                        <p className="text-sm text-pc-muted leading-relaxed mb-6">
                            Your total <strong>Points</strong> determine your <strong>League</strong> tier independently of your ranking. Reaching higher leagues proves your consistency and unlocks new prestige across the platform.
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { name: 'Master', min: '500,000+', emoji: '👑', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                                { name: 'Diamond', min: '100,000+', emoji: '💎', color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.1)' },
                                { name: 'Platinum', min: '25,000+', emoji: '⚡', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.1)' },
                                { name: 'Gold', min: '5,000+', emoji: '🏆', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
                                { name: 'Silver', min: '1,000+', emoji: '🥈', color: '#e2e8f0', bg: 'rgba(226, 232, 240, 0.1)' },
                                { name: 'Bronze', min: '0 - 999', emoji: '🥉', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
                            ].map(league => (
                                <div key={league.name} className="flex flex-col items-center p-4 rounded-xl border border-white/5" style={{ background: league.bg }}>
                                    <span className="text-3xl mb-2 drop-shadow-lg">{league.emoji}</span>
                                    <span className="text-sm font-black uppercase tracking-wider" style={{ color: league.color }}>{league.name}</span>
                                    <span className="text-[10px] font-bold text-white/70 mt-1">{league.min} pts</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* ── Leaderboard Score System ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="md:col-span-2">
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 w-32 h-32 rounded-bl-full pointer-events-none" style={{ background: 'rgba(var(--primary-rgb), 0.05)' }} />
                        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                            <div className="p-4 rounded-full shrink-0" style={{ background: 'rgba(var(--primary-rgb), 0.1)' }}>
                                <Star size={40} style={{ color: 'var(--primary)' }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-2">How Leaderboard Score Works 🌟</h2>
                                <p className="text-sm text-pc-muted leading-relaxed mb-3">
                                    While Points are for the shop and leagues, your <strong>Total Score</strong> is what ranks you on the global Leaderboards. It is a comprehensive metric of your overall productivity calculated by:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                                        <div className="text-xs font-bold text-white mb-1">🔥 Streaks Bonus</div>
                                        <div className="text-[11px] text-pc-muted">Massive multiplier for holding consecutive day streaks (+100 per streak day).</div>
                                    </div>
                                    <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                                        <div className="text-xs font-bold text-white mb-1">⏱️ Focus Deep Work</div>
                                        <div className="text-[11px] text-pc-muted">Directly rewards time spent in isolated Focus Sessions.</div>
                                    </div>
                                    <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                                        <div className="text-xs font-bold text-white mb-1">🛡️ Squad Collaboration</div>
                                        <div className="text-[11px] text-pc-muted">Points earned collectively with your Synergy Squad.</div>
                                    </div>
                                    <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                                        <div className="text-xs font-bold text-white mb-1">🏆 Milestones</div>
                                        <div className="text-[11px] text-pc-muted">Huge +500 bumps for hitting benchmarks (7-day streaks, total point brackets, growing trees).</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* ── Striking & Consistency ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2">
                    <Card>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="p-4 bg-orange-500/10 rounded-full shrink-0">
                                <Flame className="text-orange-500" size={40} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-2">The Streak System 🔥</h2>
                                <p className="text-sm text-pc-muted leading-relaxed">
                                    Your streak represents consecutive days of <strong>meaningful activity</strong>. To extend your streak, you must do at least one of the following every day:
                                </p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <span className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" /> Complete 1 Task</span>
                                    <span className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5"><Repeat size={12} style={{ color: 'var(--primary)' }} /> Log 1 Habit</span>
                                    <span className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5"><Target size={12} className="text-rose-400" /> Complete 1 Goal</span>
                                    <span className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5"><Clock size={12} className="text-sky-400" /> Track Focus Time</span>
                                </div>
                                <p className="text-xs text-rose-400/80 mt-3 font-medium bg-rose-500/5 p-2 rounded inline-block">
                                    Miss a day, and your streak resets to 0. Stay consistent!
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* ── Squad System ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="md:col-span-2">
                    <Card>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="p-4 rounded-full shrink-0" style={{ background: 'rgba(var(--primary-rgb), 0.1)' }}>
                                <Users size={40} style={{ color: 'var(--primary)' }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-2">The Squad System 🛡️</h2>
                                <p className="text-sm text-pc-muted leading-relaxed">
                                    Productivity doesn't have to be lonely. <strong>Squads</strong> are groups of up to 4 users who team up to collectively dominate their goals and earn <strong>Squad XP</strong>.
                                </p>
                                <ul className="text-sm text-pc-muted leading-relaxed mt-3 space-y-2 list-disc list-inside">
                                    <li><strong>Squad Focus Rooms:</strong> Join real-time sessions. Earning varies by duration <strong>(Minutes × 2 + 50 XP)</strong> upon completion.</li>
                                    <li><strong>Squad Tasks:</strong> Completing standard tasks while in an active room awards <strong>+10 XP</strong>.</li>
                                    <li><strong>Pinned Battle Tasks:</strong> Completing specific targets staked in the Focus Arena awards a massive <strong>+50 XP</strong>.</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
