import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, CheckSquare, Trophy,
    User, LogOut, Moon, Sun, X, Shield, Repeat, MoreHorizontal, HelpCircle,
    Wallet, Activity, Sprout, ShoppingBag, Star, Calendar, Users, Zap, Salad
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './Avatar';
import { AvatarDisplay } from '../avatar/AvatarDisplay';


const moreNavItems = [
    { path: '/savings', icon: Wallet, label: 'Finance', key: 'savingsEnabled' },
    { path: '/fitness', icon: Activity, label: 'Fitness', key: 'fitnessEnabled' },
    { path: '/nutrition', icon: Salad, label: 'Fuel', key: 'nutritionEnabled' },
];

function getNavItems(user) {
    let base = [
        { path: '/', icon: LayoutDashboard, label: 'Home' },
        { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/planner', icon: Calendar, label: 'Planner' },
    ];

    if (user?.habitsEnabled !== false) {
        base.push({ path: '/habits', icon: Repeat, label: 'Habits' });
    }

    if (user?.savingsEnabled) {
        base.push({ path: '/savings', icon: Wallet, label: 'Finance' });
    }

    if (user?.fitnessEnabled) {
        base.push({ path: '/fitness', icon: Activity, label: 'Fitness' });
    }

    if (user?.nutritionEnabled) {
        base.push({ path: '/nutrition', icon: Salad, label: 'Fuel' });
    }

    if (user?.synergyEnabled) {
        base.push({ path: '/squad', icon: Users, label: 'Squad' });
    }
    base.push({ path: '/leaderboard', icon: Trophy, label: 'Board' });
    base.push({ path: '/profile', icon: User, label: 'Profile' });

    return base;
}

// Gamification quick links (always visible in desktop sidebar)
const gamificationLinks = [
    { path: '/farm', icon: Sprout, label: '🌿 My Farm' },
    { path: '/avatar-shop', icon: ShoppingBag, label: '🛍 Avatar Shop' },
    { path: '/milestones', icon: Star, label: '🏆 Milestones' },
];

const getSidebarBase = (dark, primary) => ({
    background: dark
        ? `linear-gradient(180deg, ${primary} 0%, var(--surface) 100%)`
        : 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    color: dark ? '#fff' : 'var(--text)',
    borderRight: dark ? 'none' : '1px solid var(--border)',
});

export function SidebarContent({ onClose }) {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { dark, toggleDark } = useTheme();
    const sidebarStyle = getSidebarBase(dark, 'var(--primary)');

    return (
        <div style={sidebarStyle}>
            {/* Logo */}
            <div style={{ padding: '20px 24px 16px', borderBottom: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)' }} className="flex items-center justify-between">
                <div>
                    <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.2rem', color: dark ? '#fff' : 'var(--text)' }}>
                        Progress<span style={{ color: dark ? '#fff' : 'var(--primary)', textShadow: dark ? '0 2px 4px rgba(0,0,0,0.2)' : '0 0 1px rgba(0,0,0,0.1)' }}>Circle</span>
                    </span>
                    <p style={{ fontSize: '11px', color: dark ? 'rgba(255,255,255,0.4)' : 'var(--muted)', marginTop: 2 }}>Productivity Suite</p>
                </div>
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: dark ? 'rgba(255,255,255,0.5)' : 'var(--muted)', cursor: 'pointer', padding: 4 }}>
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* User card - Clickable to Profile */}
            {user && (
                <Link
                    id="tour-profile"
                    to="/profile"
                    onClick={onClose}
                    style={{
                        margin: '8px 12px', padding: '8px 12px',
                        background: dark ? 'rgba(255,255,255,0.06)' : 'var(--surface2)',
                        borderRadius: '0.75rem', display: 'flex', alignItems: 'center',
                        gap: 8, textDecoration: 'none', transition: 'all 0.2s'
                    }}
                    className="hover:scale-[1.01] active:scale-[0.99]"
                >
                    <AvatarDisplay avatarConfig={user.avatarConfig} size="sm" showTitle={true} />
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: dark ? '#fff' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                        <div className="flex items-center gap-3">
                            <motion.p
                                key={user.totalScore}
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                                style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,0.4)' : 'var(--muted)' }}
                            >
                                <span className="font-bold text-pc-primary">{(user.totalScore || user.points || 0).toLocaleString()}</span> Score
                            </motion.p>
                            <motion.p
                                key={user.points}
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                                style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,0.4)' : 'var(--muted)' }}
                            >
                                <span className="font-bold text-pc-secondary">{(user.points || 0).toLocaleString()}</span> Pts
                            </motion.p>
                        </div>
                    </div>
                </Link>
            )}

            {/* Nav links */}
            <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {getNavItems(user).map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            id={`tour-nav-${path === '/' ? 'home' : path.replace('/', '')}`}
                            to={path}
                            onClick={onClose}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 14px', borderRadius: '0.75rem',
                                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                                transition: 'all 0.18s',
                                background: active
                                    ? (dark ? 'rgba(var(--primary-rgb), 0.18)' : 'var(--primary-light)')
                                    : 'transparent',
                                color: active
                                    ? (dark ? 'white' : 'var(--primary)')
                                    : (dark ? 'rgba(255,255,255,0.6)' : 'var(--text-light)'),
                                border: active
                                    ? (dark ? '1px solid rgba(var(--primary-rgb), 0.3)' : '1px solid var(--primary-border)')
                                    : '1px solid transparent',
                            }}
                        >
                            <Icon size={17} style={{ color: active ? 'var(--primary)' : (dark ? undefined : 'var(--muted)') }} />
                            {label}
                            {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%' }} />}
                        </Link>
                    );
                })}
                {user?.isAdmin && (
                    <Link to="/admin" onClick={onClose} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 14px', borderRadius: '0.75rem', textDecoration: 'none',
                        fontSize: 14, fontWeight: 500, color: dark ? 'white' : 'var(--text-light)',
                        transition: 'all 0.18s',
                    }}>
                        <Shield size={17} style={{ color: dark ? 'white' : 'var(--primary)' }} /> Admin
                    </Link>
                )}

                {/* Gamification section */}
                <div id="tour-gamification" style={{ margin: '8px 0 4px', fontSize: 10, fontWeight: 600, color: dark ? 'rgba(255,255,255,0.25)' : 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 14px' }}>
                    Gamification
                </div>
                {gamificationLinks.map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            onClick={onClose}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 14px', borderRadius: '0.75rem',
                                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                                transition: 'all 0.18s',
                                background: active
                                    ? (dark ? 'rgba(var(--primary-rgb), 0.18)' : 'var(--primary-light)')
                                    : 'transparent',
                                color: active
                                    ? (dark ? 'white' : 'var(--primary)')
                                    : (dark ? 'rgba(255,255,255,0.6)' : 'var(--text-light)'),
                                border: active
                                    ? (dark ? '1px solid rgba(var(--primary-rgb), 0.3)' : '1px solid var(--primary-border)')
                                    : '1px solid transparent',
                            }}
                        >
                            <Icon size={17} style={{ color: active ? 'var(--primary)' : (dark ? undefined : 'var(--muted)') }} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom actions */}
            <div style={{ borderTop: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Link to="/info" onClick={onClose} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 14px', borderRadius: '0.75rem', background: 'none',
                    border: 'none', color: dark ? 'rgba(255,255,255,0.6)' : 'var(--text-light)', fontSize: 14, textDecoration: 'none',
                    transition: 'all 0.18s',
                }}>
                    <HelpCircle size={17} /> How It Works
                </Link>
                <button
                    onClick={() => {
                        window.dispatchEvent(new Event('start-tutorial'));
                        if (onClose) onClose();
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '9px 14px', borderRadius: '0.75rem', background: dark ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--primary-light)',
                        border: 'none', color: dark ? 'white' : 'var(--primary)', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.18s',
                    }}
                >
                    <HelpCircle size={17} /> Replay Tutorial
                </button>
                <button onClick={toggleDark} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 14px', borderRadius: '0.75rem', background: 'none',
                    border: 'none', color: dark ? 'rgba(255,255,255,0.5)' : 'var(--text-light)', fontSize: 14,
                    cursor: 'pointer', transition: 'all 0.18s',
                }}>
                    {dark ? <Sun size={17} /> : <Moon size={17} />}
                    {dark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={logout} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 14px', borderRadius: '0.75rem', background: 'none',
                    border: 'none', color: dark ? 'rgba(252,165,165,0.7)' : 'var(--error)', fontSize: 14,
                    cursor: 'pointer', transition: 'all 0.18s',
                }}>
                    <LogOut size={17} /> Logout
                </button>
            </div>
        </div>
    );
}

/* ─── Mobile "More" drawer ────────────────────────────────── */
function MoreDrawer({ onClose }) {
    const { dark, toggleDark } = useTheme();
    const { logout, user } = useAuth();

    const drawerStyle = {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        background: dark
            ? 'linear-gradient(180deg, var(--primary) 0%, var(--surface) 100%)'
            : 'var(--surface)',
        borderRadius: '20px 20px 0 0',
        padding: '8px 0 calc(16px + env(safe-area-inset-bottom))',
        borderTop: dark ? 'none' : '1px solid var(--border)',
        color: dark ? '#fff' : 'var(--text)',
    };

    const rowStyle = {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', color: dark ? 'rgba(255,255,255,0.75)' : 'var(--muted)',
        fontSize: 15, fontWeight: 500, cursor: 'pointer',
        background: 'none', border: 'none', width: '100%',
        textDecoration: 'none',
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 55 }}
            />
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                style={drawerStyle}
            >
                {/* Handle */}
                <div style={{ width: 36, height: 4, background: dark ? 'rgba(255,255,255,0.2)' : 'var(--border)', borderRadius: 99, margin: '4px auto 12px' }} />

                {user && (
                    <Link
                        to="/profile"
                        onClick={onClose}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px 14px',
                            borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--border)',
                            textDecoration: 'none'
                        }}
                    >
                        <AvatarDisplay avatarConfig={user.avatarConfig} size="sm" />
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: dark ? '#fff' : 'var(--text)' }}>{user.name}</p>
                            <div className="flex items-center gap-4">
                                <motion.p
                                    key={user.totalScore}
                                    initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                                    style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,0.4)' : 'var(--muted)' }}
                                >
                                    <span className="font-bold text-pc-primary">{(user.totalScore || user.points || 0).toLocaleString()}</span> Score
                                </motion.p>
                                <motion.p
                                    key={user.points}
                                    initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                                    style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,0.4)' : 'var(--muted)' }}
                                >
                                    <span className="font-bold text-pc-secondary">{(user.points || 0).toLocaleString()}</span> Points
                                </motion.p>
                            </div>
                        </div>
                    </Link>
                )}

                {user?.isAdmin && (
                    <Link to="/admin" onClick={onClose} style={{ ...rowStyle, color: dark ? 'white' : 'var(--text-light)' }}>
                        <Shield size={19} style={{ color: dark ? 'white' : 'var(--primary)' }} />
                        <span>Admin Panel</span>
                    </Link>
                )}

                <Link to="/info" onClick={onClose} style={rowStyle}>
                    <HelpCircle size={19} style={{ color: dark ? undefined : 'var(--muted)' }} />
                    <span>How It Works</span>
                </Link>

                {/* Gamification links in More drawer */}
                <div style={{ padding: '8px 20px 4px', fontSize: 10, fontWeight: 600, color: dark ? 'rgba(255,255,255,0.3)' : 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gamification</div>
                {gamificationLinks.map(({ path, label, icon: Icon }) => (
                    <Link key={path} to={path} onClick={onClose} style={rowStyle}>
                        <Icon size={19} style={{ color: dark ? 'white' : 'var(--primary)' }} />
                        <span>{label}</span>
                    </Link>
                ))}

                <button onClick={() => { toggleDark(); }} style={rowStyle}>
                    {dark ? <Sun size={19} style={{ color: '#fbbf24' }} /> : <Moon size={19} style={{ color: 'var(--primary)' }} />}
                    <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <button onClick={logout} style={{ ...rowStyle, color: dark ? 'rgba(252,165,165,0.85)' : 'var(--error)' }}>
                    <LogOut size={19} />
                    <span>Logout</span>
                </button>
            </motion.div>
        </>
    );
}

export function Sidebar() {
    const [moreOpen, setMoreOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();
    const { dark } = useTheme();

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex" style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: 256, flexDirection: 'column', zIndex: 40 }}>
                <SidebarContent />
            </div>

            {/* Mobile Bottom Navigation Removed per user request */}
            {/* 
            <nav
                className="flex lg:hidden items-center justify-around"
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45,
                    background: dark
                        ? 'linear-gradient(180deg, var(--primary) 0%, #0f0e2a 100%)'
                        : 'var(--surface)',
                    borderTop: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--border)',
                    padding: '6px 4px calc(6px + env(safe-area-inset-bottom))',
                }}
            >
                {getNavItems(user).filter((_, i) => i < 5).map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                textDecoration: 'none', flex: 1, padding: '6px 0',
                                color: active ? 'var(--primary)' : (dark ? 'rgba(255,255,255,0.4)' : 'var(--muted)'),
                                transition: 'color 0.2s',
                                minHeight: 44,
                                justifyContent: 'center',
                                position: 'relative',
                            }}
                        >
                            {active && (
                                <motion.div
                                    layoutId="bottom-nav-active"
                                    style={{
                                        position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                                        width: 28, height: 2, background: '#818cf8', borderRadius: '0 0 99px 99px',
                                    }}
                                />
                            )}
                            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                            <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500, letterSpacing: '0.04em' }}>{label}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={() => setMoreOpen(true)}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        background: 'none', border: 'none', flex: 1, padding: '6px 0',
                        color: dark ? 'rgba(255,255,255,0.4)' : 'var(--muted)', cursor: 'pointer', minHeight: 44,
                        justifyContent: 'center',
                    }}
                >
                    <MoreHorizontal size={20} strokeWidth={1.8} />
                    <span style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em' }}>More</span>
                </button>
            </nav>
            */}

            {/* Mobile More drawer */}
            <AnimatePresence>
                {moreOpen && <MoreDrawer onClose={() => setMoreOpen(false)} />}
            </AnimatePresence>
        </>
    );
}