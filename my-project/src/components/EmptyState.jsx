import { motion } from 'framer-motion';

export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-14 text-center"
        >
            <div style={{
                width: 64, height: 64, borderRadius: '1rem',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem', opacity: 0.85
            }}>
                <Icon size={28} color="#fff" />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h3>
            <p className="text-sm mb-5 max-w-xs" style={{ color: 'var(--muted)' }}>{description}</p>
            {action}
        </motion.div>
    );
}
