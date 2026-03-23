import { useState, useEffect } from 'react';
import { Sidebar, SidebarContent } from './SideBar';
import { QuickAddModal } from './QuickAddModal';
import { MobileNav } from './MobileNav';
import { Plus, Menu, X, AlertTriangle, Zap, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';

export function Layout({ children }) {
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [warningMessage, setWarningMessage] = useState(null);
    const { dark } = useTheme();
    const { user } = useAuth();

    useEffect(() => {
        if (user && user.plan === 'premium' && user.subscription?.currentPeriodEnd) {
            const endDate = new Date(user.subscription.currentPeriodEnd);
            const now = new Date();
            const timeDiff = endDate.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (user.subscription.status === 'cancelled') {
                setWarningMessage(`Your Premium subscription is cancelled and will end on ${endDate.toLocaleDateString()}.`);
            } else if (daysDiff <= 3 && daysDiff >= 0) {
                setWarningMessage(`Your Premium subscription will renew in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}. Make sure your payment method is up to date.`);
            } else if (daysDiff < 0) {
                setWarningMessage('Your Premium subscription has expired.');
            } else {
                setWarningMessage(null);
            }
        } else {
            setWarningMessage(null);
        }
    }, [user]);

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden', flexDirection: 'column' }}>
            {warningMessage && (
                <div style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    borderBottom: '1px solid rgba(234, 179, 8, 0.2)',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    color: '#eab308',
                    fontSize: '13px',
                    fontWeight: 600,
                    zIndex: 100
                }}>
                    <AlertTriangle size={16} className="animate-pulse" />
                    <span>{warningMessage}</span>
                    <Link to="/pricing" style={{ color: '#fef08a', textDecoration: 'underline', marginLeft: '8px' }}>Manage</Link>
                </div>
            )}

            {/* Mobile Header */}
            <header
                className="flex lg:hidden items-center justify-between px-4"
                style={{
                    height: '60px',
                    background: dark ? 'rgba(15, 14, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: dark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 45,
                    flexShrink: 0
                }}
            >
                <div className="flex items-center gap-2">
                    <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.1rem', color: dark ? '#fff' : 'var(--text)' }}>
                        Progress<span style={{ color: dark ? '#fff' : 'var(--primary)', textShadow: dark ? '0 2px 4px rgba(0,0,0,0.2)' : '0 0 1px rgba(0,0,0,0.1)' }}>Circle</span>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationCenter />
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        style={{ background: 'none', border: 'none', color: dark ? '#fff' : 'var(--text)', cursor: 'pointer', padding: '4px' }}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar onQuickAdd={() => setQuickAddOpen(true)} />
                <main style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', overflowY: 'auto' }} className="lg:ml-64">
                    {/* Desktop Header */}
                    <div className="hidden lg:flex items-center justify-end px-8 py-4 gap-4 sticky top-0 z-30"
                        style={{ background: 'var(--bg)', borderBottom: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--border)' }}>
                        <Link
                            id="tour-quick-focus"
                            to="/focus"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={{
                                background: 'rgba(var(--primary-rgb), 0.1)',
                                color: 'var(--primary)',
                                border: '1px solid rgba(var(--primary-rgb), 0.2)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)'}
                        >
                            <Zap size={14} fill="currentColor" /> Quick Focus
                        </Link>
                        <div className="w-px h-6 bg-border/20 mx-2" />
                        <NotificationCenter />
                    </div>
                    {/*
                      Mobile: px-4 pt-5 pb-24 (pb clears the fixed bottom nav)
                      Desktop: px-8 pt-8 pb-16
                    */}
                    <div
                        className="pt-5 px-4 pb-24 lg:pt-8 lg:px-8 lg:pb-16"
                        style={{
                            maxWidth: '1100px',
                            margin: '0 auto',
                            minHeight: 'min-content'
                        }}
                    >
                        {children}
                    </div>
                </main>
            </div>

            <MobileNav onQuickAdd={() => setQuickAddOpen(true)} />

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 50
                            }}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: '280px',
                                zIndex: 55,
                                background: 'var(--surface)',
                                boxShadow: '10px 0 30px rgba(0,0,0,0.1)'
                            }}
                        >
                            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
        </div>
    );
}