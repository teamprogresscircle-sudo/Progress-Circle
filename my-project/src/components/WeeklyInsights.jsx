import { motion } from 'framer-motion';
import { Target, CheckCircle2, Flame, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import dayjs from 'dayjs';
import { useMemo } from 'react';

export function WeeklyInsights({ tasks, sessions }) {
    const weeklyData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => dayjs().subtract(i, 'day').format('YYYY-MM-DD')).reverse();

        const stats = last7Days.map(date => {
            const completedCount = tasks.filter(t => t.status === 'completed' && dayjs(t.completedAt).isSame(dayjs(date), 'day')).length;
            const focusMinutes = sessions.filter(s => dayjs(s.startTime).isSame(dayjs(date), 'day')).reduce((acc, s) => acc + s.duration, 0);

            return {
                date,
                dayName: dayjs(date).format('ddd'),
                completedCount,
                focusMinutes
            };
        });

        const totalCompleted = stats.reduce((acc, s) => acc + s.completedCount, 0);
        const totalFocus = stats.reduce((acc, s) => acc + s.focusMinutes, 0);
        const maxCompleted = Math.max(...stats.map(s => s.completedCount), 1);

        return { stats, totalCompleted, totalFocus, maxCompleted };
    }, [tasks, sessions]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest leading-none">Weekly Performance</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-pc-muted uppercase tracking-tighter">Tasks Done</p>
                        <p className="text-sm font-black text-green-500">{weeklyData.totalCompleted}</p>
                    </div>
                    <div className="text-right border-l border-white/5 pl-4">
                        <p className="text-[9px] font-black text-pc-muted uppercase tracking-tighter">Hours Focused</p>
                        <p className="text-sm font-black text-primary">{Math.floor(weeklyData.totalFocus / 60)}h</p>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between gap-1 h-32 px-2">
                {weeklyData.stats.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="w-full flex flex-col items-center justify-end h-full">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(day.completedCount / weeklyData.maxCompleted) * 100}%` }}
                                transition={{ delay: idx * 0.1 }}
                                className={`w-3 sm:w-6 rounded-t-lg transition-all ${day.completedCount > 0 ? 'bg-primary group-hover:opacity-80' : 'bg-white/5'}`}
                                style={{ minHeight: day.completedCount > 0 ? '4px' : '0' }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-pc-muted uppercase tracking-tighter">{day.dayName}</span>
                    </div>
                ))}
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary text-white">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary">Weekly Insight</p>
                        <p className="text-xs font-bold leading-snug">
                            {weeklyData.totalCompleted > 5
                                ? "You're building momentum! Keep the streak alive."
                                : "A fresh week starts now. Set small goals to gain traction."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
