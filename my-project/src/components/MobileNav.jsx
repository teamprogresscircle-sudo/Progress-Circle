import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, CheckSquare, Users,
    User, Plus, Trophy, Grid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function MobileNav({ onQuickAdd }) {
    const location = useLocation();
    const { user } = useAuth();
    const { dark } = useTheme();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Home' },
        { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/squad', icon: Users, label: 'Squad' },
        { path: '/profile', icon: User, label: 'Me' },
    ];

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[60]"
            style={{
                background: dark ? 'rgba(15, 18, 36, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
            }}
        >
            <div className="flex items-center justify-around h-16 px-2 relative">
                {navItems.map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative"
                            style={{
                                color: active ? 'var(--primary)' : 'var(--muted)',
                                opacity: active ? 1 : 0.7
                            }}
                        >
                            {active && (
                                <motion.div
                                    layoutId="mobile-active-glint"
                                    className="absolute -top-[1px] w-8 h-[2px] bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                                />
                            )}
                            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-bold tracking-tight uppercase">{label}</span>
                        </Link>
                    );
                })}

                {/* Floating Quick Add for Mobile */}
                <button
                    onClick={onQuickAdd}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-bg active:scale-90 transition-all"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                >
                    <Plus size={24} strokeWidth={3} />
                </button>
            </div>
        </nav>
    );
}
