import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Trash2, ShieldAlert, Zap, Users, Info, Flame,
    X, Wallet, Salad, Repeat, Target, Sparkles, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

const TYPE_CONFIG = {
    task_deadline: { icon: ShieldAlert, color: 'var(--primary)', label: 'NEURAL WARNING', path: '/tasks' },
    task_overdue: { icon: AlertCircle, color: '#ef4444', label: 'MISSION OVERDUE', path: '/tasks' },
    streak_warning: { icon: Flame, color: '#fb923c', label: 'CONSISTENCY SYNC', path: '/habits' },
    habit_missed: { icon: Repeat, color: '#f472b6', label: 'HABIT DEFICIT', path: '/habits' },
    nutrition_sync: { icon: Salad, color: '#4ade80', label: 'FUEL UPDATE', path: '/nutrition' },
    nutrition_deficit: { icon: Target, color: '#fbbf24', label: 'METABOLIC ALERT', path: '/nutrition' },
    water_goal_missed: { icon: Zap, color: 'var(--accent)', label: 'HYDRATION SYNC', path: '/nutrition' },
    budget_exceeded: { icon: Wallet, color: '#fcd34d', label: 'CAPITAL DANGER', path: '/savings' },
    financial_goal_alert: { icon: Sparkles, color: 'var(--accent)', label: 'GOAL UPDATE', path: '/savings' },
    battle_invite: { icon: Zap, color: 'var(--primary)', label: 'BATTLE INVITE', path: '/squad' },
    neural_milestone_unlocked: { icon: Sparkles, color: 'var(--accent)', label: 'MILESTONE', path: '/profile' },
    referral_success: { icon: Users, color: '#a3e635', label: 'NEURAL LINK', path: '/profile' },
    premium_reward: { icon: Sparkles, color: '#fbbf24', label: 'UPGRADE SYNC', path: '/profile' },
    welcome: { icon: Info, color: 'var(--primary)', label: 'WELCOME OPERATIVE', path: '/' },
    default: { icon: Info, color: 'var(--muted)', label: 'NEURAL LOG', path: '/' },
};

// Panel enters/exits with a fast tween — no spring physics overhead
const PANEL_VARIANTS = {
    hidden: { x: '100%' },
    visible: { x: 0, transition: { type: 'tween', duration: 0.22, ease: [0.25, 0.1, 0.25, 1] } },
    exit: { x: '100%', transition: { type: 'tween', duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

export function NotificationCenter() {
    const { dark } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch {
            console.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen, fetchNotifications]);

    const markAsRead = useCallback(async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
        } catch {
            toast.error('Sync failed');
        }
    }, []);

    const deleteAll = useCallback(async () => {
        try {
            setLoading(true);
            await api.put('/notifications/read-all');
            setNotifications([]);
            setIsOpen(false);
            toast.success('Neural streams cleared.');
        } catch {
            toast.error('Clear failed.');
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteOne = useCallback(async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch {
            toast.error('Operation failed');
        }
    }, []);

    const handleNotificationClick = useCallback((n) => {
        const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
        if (n.status === 'pending') markAsRead(n._id);
        setIsOpen(false);
        navigate(config.path);
    }, [markAsRead, navigate]);

    const unreadCount = notifications.filter(n => n.status === 'pending').length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(true)}
                className="p-2.5 rounded-xl transition-colors relative"
                style={{
                    color: 'var(--text)',
                    background: 'rgba(var(--primary-rgb), 0.05)',
                    border: '1px solid var(--border)'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[var(--bg)] shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay — no backdrop-blur, just a semi-transparent tint */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-50 bg-black/50"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            variants={PANEL_VARIANTS}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed right-0 top-0 h-full w-full max-w-sm md:max-w-md shadow-2xl z-[60] border-l border-[var(--border)] flex flex-col"
                            style={{ background: 'var(--surface)', willChange: 'transform' }}
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
                                <div>
                                    <h2 className="text-base font-black tracking-tighter italic" style={{ fontFamily: 'Manrope, sans-serif' }}>NOTIFICATION CENTER</h2>
                                    <p className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-60" style={{ color: 'var(--primary)', fontFamily: 'Manrope, sans-serif' }}>Powering your progress</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-[var(--surface2)] rounded-full transition-colors"
                                    style={{ color: 'var(--muted)' }}
                                >
                                    <X size={17} />
                                </button>
                            </div>

                            {/* Actions */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-1.5 flex justify-end flex-shrink-0 border-b border-[var(--border)]/40">
                                    <button
                                        onClick={deleteAll}
                                        className="text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 px-2 py-1 rounded-md border border-rose-500/20 hover:bg-rose-500/10 text-rose-500"
                                        style={{ fontFamily: 'Manrope, sans-serif' }}
                                    >
                                        <Trash2 size={8} /> Neural Reset
                                    </button>
                                </div>
                            )}

                            {/* List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1.5">
                                {loading && notifications.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-3 py-16">
                                        <div className="w-7 h-7 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ fontFamily: 'Manrope, sans-serif' }}>Scanning streams...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
                                        <Bell size={36} className="mb-3" style={{ color: 'var(--primary)' }} />
                                        <p className="text-sm font-black italic" style={{ fontFamily: 'Manrope, sans-serif' }}>ALL STREAMS CLEAR</p>
                                        <p className="text-[10px] mt-1 font-medium">Neural integrity at 100%.</p>
                                    </div>
                                ) : (
                                    /* Plain divs instead of animated motion.divs — eliminates per-item overhead */
                                    notifications.map((n) => {
                                        const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                                        const Icon = config.icon;
                                        const isPending = n.status === 'pending';
                                        return (
                                            <div
                                                key={n._id}
                                                className={`group relative flex gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${isPending
                                                        ? 'bg-[var(--surface2)] border-[var(--border)]'
                                                        : 'bg-transparent border-transparent opacity-55'
                                                    }`}
                                                onClick={() => handleNotificationClick(n)}
                                            >
                                                {/* Icon */}
                                                <div
                                                    className="h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center border border-[var(--border)]"
                                                    style={{ background: 'var(--surface)' }}
                                                >
                                                    <Icon size={14} style={{ color: config.color }} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: config.color, fontFamily: 'Manrope, sans-serif' }}>
                                                            {config.label}
                                                        </span>
                                                        <span className="text-[9px] opacity-30" style={{ color: 'var(--text)' }}>·</span>
                                                        <span className="text-[9px] font-bold" style={{ color: 'var(--muted)', fontFamily: 'Manrope, sans-serif' }}>
                                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] font-medium leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                                                        {n.message}
                                                    </p>
                                                </div>

                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteOne(n._id); }}
                                                    className="absolute right-2 top-2 p-1 hover:bg-rose-500/10 rounded-md text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={12} />
                                                </button>

                                                {/* Unread dot */}
                                                {isPending && (
                                                    <div
                                                        className="absolute right-2.5 bottom-2.5 w-1.5 h-1.5 rounded-full"
                                                        style={{ background: 'var(--primary)' }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
