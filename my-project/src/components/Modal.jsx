import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export function Modal({ open, onClose, title, children, maxWidth = '480px' }) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 999999,
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                        padding: '1.5rem',
                        background: 'rgba(0,0,0,0.85)',
                        overflowY: 'auto',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        className="pc-card"
                        style={{ 
                            width: '100%', 
                            maxWidth, 
                            margin: 'auto',
                            position: 'relative',
                            background: '#12121A',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                        }}
                    >
                        <button 
                            onClick={onClose} 
                            style={{ 
                                position: 'absolute', right: 20, top: 20, 
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: 10, padding: 6, cursor: 'pointer', zIndex: 60,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                            <X size={18} style={{ color: 'var(--muted)' }} />
                        </button>

                        {title && (
                            <div className="mb-6">
                                <h2 className="text-xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent uppercase tracking-tight">{title}</h2>
                            </div>
                        )}
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

// Full screen slide-up modal for app-like experiences
export function FullScreenModal({ open, onClose, title, children }) {
    if (typeof document === 'undefined') return null;
    
    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
                    className="bg-[var(--bg)] flex flex-col"
                >
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface)] z-10 shadow-sm relative pt-safe pb-4">
                        <div className="flex-1" />
                        <h2 className="text-lg font-bold text-[var(--text)] text-center flex-1">{title}</h2>
                        <div className="flex-1 flex justify-end">
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto w-full no-scrollbar px-4 sm:px-6 md:px-8 py-6 pb-32">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
