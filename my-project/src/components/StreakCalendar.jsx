import { motion } from 'framer-motion';
import { Crown, Check, X, Snowflake } from 'lucide-react';
import dayjs from 'dayjs';

export function StreakCalendar({ history = [], plan = 'free' }) {
    const today = dayjs().startOf('day');
    const days = Array.from({ length: 28 }).map((_, i) => {
        const date = today.subtract(i, 'day');
        const dateStr = date.format('YYYY-MM-DD');
        const isDone = history.some(h => dayjs(h).format('YYYY-MM-DD') === dateStr);
        return {
            date,
            isDone,
            isToday: i === 0
        };
    }).reverse();

    if (plan !== 'premium') {
        return (
            <div className="relative p-6 rounded-3xl bg-surface-2 border border-white/5 overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Crown className="text-amber-500 mb-2" size={32} />
                    <p className="text-xs font-black uppercase tracking-widest text-white">Advanced Streak Tracking</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Unlock your complete consistency calendar with Pro.</p>
                </div>
                
                <div className="grid grid-cols-7 gap-2 grayscale opacity-20 pointer-events-none">
                    {days.map((d, i) => (
                        <div key={i} className={`aspect-square rounded-lg border border-white/5 flex items-center justify-center text-[10px] font-bold ${d.isDone ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-muted-foreground'}`}>
                            {d.date.date()}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-3xl bg-surface-2 border border-indigo-500/10 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Crown className="text-amber-500" size={18} />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Consistency Lab</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/5 border border-white/10" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Missed</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
                {days.map((d, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className={`relative aspect-square rounded-[14px] flex flex-col items-center justify-center transition-all ${
                            d.isDone 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner' 
                                : d.isToday 
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
                                    : 'bg-white/5 text-muted-foreground border border-white/5'
                        }`}
                    >
                        <span className={`text-[11px] font-black ${d.isDone ? 'opacity-100' : 'opacity-60'}`}>{d.date.date()}</span>
                        {d.isDone && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-pc-surface border-2 border-pc-surface">
                                <Check size={10} strokeWidth={4} />
                            </div>
                        )}
                        {!d.isDone && !d.isToday && d.date.isBefore(today) && (
                           <X size={10} className="text-rose-500/30 mt-0.5" />
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Monthly Accuracy</p>
                        <p className="text-2xl font-black text-white">{Math.round((days.filter(d => d.isDone).length / days.length) * 100)}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Hits</p>
                        <p className="text-2xl font-black text-emerald-400">{days.filter(d => d.isDone).length}</p>
                    </div>
                </div>
                
                <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(days.filter(d => d.isDone).length / days.length) * 100}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    />
                </div>
            </div>
        </div>
    );
}
