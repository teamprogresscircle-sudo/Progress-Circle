import { motion } from 'framer-motion';

export function Card({ children, className = '', hover = false, ...props }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`pc-card ${hover ? 'pc-card-lift cursor-pointer' : ''} ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
}