import { motion } from 'framer-motion';

export function StatCard({ label, value, icon: Icon, color = 'indigo', suffix = '', delay = 0 }) {
    const colorMap = {
        indigo: 'var(--primary)',
        sky: 'rgb(14, 165, 233)',
        green: 'rgb(34, 197, 94)',
        orange: 'rgb(249, 115, 22)',
        purple: 'var(--accent)',
    };
    
    const iconColor = colorMap[color] || colorMap.indigo;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className="pc-card pc-card-lift group"
            style={{ borderLeft: `3px solid ${iconColor}` }}
        >
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tighter text-[var(--text)] font-outfit">
                            {value}
                        </span>
                        <span className="text-[10px] font-black uppercase text-[var(--muted)] mb-1">{suffix}</span>
                    </div>
                </div>
                <div className="p-4 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110 duration-500" style={{ background: `color-mix(in srgb, ${iconColor} 15%, transparent)` }}>
                    <Icon size={22} style={{ color: iconColor }} />
                </div>
            </div>
        </motion.div>
    );
}
