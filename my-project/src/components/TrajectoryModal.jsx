import { motion } from 'framer-motion';
import { TrendingUp, X, Activity, Target, Zap } from 'lucide-react';
import { Card } from './Card';
import { Modal } from './Modal';

export function TrajectoryModal({ open, onClose, user, history }) {
    if (!user || !history) return null;

    const maxPoints = Math.max(...history.map(d => d.points), 1);
    
    return (
        <Modal open={open} onClose={onClose} title={`${user.name}'s Trajectory`}>
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">Growth Velocity</p>
                        <p className="text-xl font-black text-white">+12.5% this week</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        <Activity size={14} /> 7-Day Performance
                    </h4>
                    
                    <div className="h-48 flex items-end gap-2 px-2 pb-6 pt-4 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
                            {[1, 2, 3, 4].map(i => <div key={i} className="border-t border-white w-full" />)}
                        </div>

                        {history.map((day, i) => {
                            const height = (day.points / maxPoints) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg relative"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-10">
                                            {day.points} PTS
                                        </div>
                                    </motion.div>
                                    <span className="text-[8px] font-black text-muted uppercase">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 bg-white/[0.02]">
                        <p className="text-[9px] font-black text-muted uppercase mb-1 flex items-center gap-1">
                            <Target size={10} /> Focus Consistency
                        </p>
                        <p className="text-lg font-black text-white">High</p>
                    </Card>
                    <Card className="p-4 bg-white/[0.02]">
                        <p className="text-[9px] font-black text-muted uppercase mb-1 flex items-center gap-1">
                            <Zap size={10} /> Synergy Level
                        </p>
                        <p className="text-lg font-black text-indigo-400">Elite</p>
                    </Card>
                </div>

                <p className="text-[10px] text-muted text-center italic">
                    Trajectory is calculated based on daily breakthroughs and mission completions.
                </p>
            </div>
        </Modal>
    );
}
