import { motion } from 'framer-motion';
import { CheckCircle2, Trophy, Flame, Timer, Activity } from 'lucide-react';
import dayjs from 'dayjs';

export function ActivityTimeline({ activities }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-8 text-pc-muted">
                <Activity className="mx-auto mb-2 opacity-20" size={32} />
                <p className="text-xs font-medium">No activity logged yet today.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative pl-6">
            {activities.map((item, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="timeline-item relative"
                >
                    <div className="absolute -left-6 top-0 w-3 h-3 rounded-full bg-primary border-2 border-surface flex items-center justify-center z-10">
                        <div className="w-1 h-1 bg-white rounded-full" />
                    </div>

                    <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold leading-none">{item.title}</h4>
                        <span className="text-[10px] font-black text-pc-muted uppercase tracking-tighter">
                            {dayjs(item.timestamp).format('HH:mm')}
                        </span>
                    </div>
                    <p className="text-xs text-pc-muted line-clamp-2">{item.description}</p>
                </motion.div>
            ))}
        </div>
    );
}
