import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckSquare } from 'lucide-react';

const TimerDisplay = ({ 
    isActive, 
    startTime, 
    duration, 
    isPaused, 
    isHost, 
    onControl, 
    onComplete, 
    onOpenConfig 
}) => {
    const [localTime, setLocalTime] = useState(0);

    // Calculate initial time
    const calculateTimeLeft = useCallback(() => {
        if (!isActive || !startTime) return 0;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + (duration * 60000));
        return Math.max(0, Math.floor((end - new Date()) / 1000));
    }, [isActive, startTime, duration]);

    // Initialize/Sync time
    useEffect(() => {
        setLocalTime(calculateTimeLeft());
    }, [isActive, startTime, duration, calculateTimeLeft]);

    // Local ticker
    useEffect(() => {
        if (!isActive || isPaused || localTime <= 0) return;

        const interval = setInterval(() => {
            setLocalTime(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, isPaused, localTime]);

    // Periodic sync with server (simulated by props update from parent)
    // The parent (SquadFocusArena) already fetches room every 3s.
    // We can just rely on the initialization useEffect for sync.

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="text-center space-y-12 relative scale-110">
            {/* Animated Background Rings */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[45%] w-[500px] h-[500px] pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border border-[var(--text)]/[0.03] rounded-full" 
                />
                <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-10 border border-[var(--text)]/[0.015] rounded-full" 
                />
            </div>

            <div className="relative w-80 h-80 mx-auto flex items-center justify-center group">
                {/* Glowing Ambient Effect */}
                <motion.div
                    animate={{
                        opacity: isActive ? [0.3, 0.4, 0.3] : 0.1,
                        scale: isActive ? [1, 1.1, 1] : 1
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute inset-0 bg-[var(--primary)]/15 blur-[40px] rounded-full"
                />

                <svg className="w-full h-full transform -rotate-90 relative z-10 transition-transform duration-700 group-hover:scale-105">
                    <circle
                        cx="160"
                        cy="160"
                        r="152"
                        className="stroke-[var(--text)]/[0.03] fill-none"
                        strokeWidth="1"
                    />
                    <motion.circle
                        cx="160"
                        cy="160"
                        r="150"
                        className="stroke-[var(--primary)] fill-none transition-all duration-300"
                        strokeWidth="4"
                        strokeDasharray="942"
                        initial={{ strokeDashoffset: 942 }}
                        animate={{ 
                            strokeDashoffset: isActive ? 942 - (942 * (localTime / (duration * 60 || 1))) : 942 
                        }}
                        transition={{ duration: 1, ease: "linear" }}
                        strokeLinecap="round"
                        style={{ filter: isActive ? `drop-shadow(0 0 10px rgba(var(--primary-rgb), 0.4))` : 'none' }}
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <div className="flex flex-col items-center">
                        <span 
                            className={`text-8xl font-black text-[var(--text)] tracking-tighter block drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] transition-all duration-200 tabular-nums ${isPaused ? 'opacity-40 scale-95 blur-[1px]' : ''}`}
                        >
                            {formatTime(localTime)}
                        </span>
                        
                        <motion.div 
                            initial={false}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 mt-4"
                        >
                            <div className={`w-2 h-2 rounded-full ${isActive && !isPaused ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--text)]/20'}`} />
                            <span className="text-[10px] font-black text-[var(--text)]/30 uppercase tracking-[0.5em]">
                                {isActive ? (isPaused ? 'Tactical Pause' : 'Protocol Active') : 'Standby Mode'}
                            </span>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Cinematic Control Hub */}
            <AnimatePresence>
                {isHost && (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center justify-center pt-8"
                    >
                        <div className="flex items-center gap-6 p-2.5 rounded-[2rem] bg-[var(--surface)]/40 border border-[var(--border)]/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--primary)]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            
                            {!isActive ? (
                                <motion.button 
                                    whileHover={{ scale: 1.05, boxShadow: `0 0 40px rgba(var(--primary-rgb),0.4)` }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onOpenConfig} 
                                    className="px-14 py-5 bg-[var(--primary)] rounded-full font-black text-xs uppercase tracking-[0.3em] text-white transition-all shadow-xl shadow-[var(--primary)]/20 border border-white/10"
                                >
                                    Initiate Deployment
                                </motion.button>
                            ) : (
                                <div className="flex items-center gap-6 px-4">
                                    <motion.button 
                                        whileHover={{ scale: 1.1, backgroundColor: 'var(--text)/0.1' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onControl(isPaused ? 'resume' : 'pause')}
                                        className="w-14 h-14 flex items-center justify-center bg-[var(--text)]/5 text-[var(--text)] rounded-full transition-all border border-[var(--border)]/10"
                                    >
                                        {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                                    </motion.button>
                                    
                                    <div className="h-8 w-px bg-[var(--border)]/10" />

                                    <motion.button 
                                        whileHover={{ scale: 1.05, backgroundColor: '#10b981', color: 'white' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onComplete}
                                        className="flex items-center gap-3 px-8 py-5 bg-[var(--text)]/[0.03] border border-[var(--border)]/10 text-[var(--text)]/60 rounded-full font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        <CheckSquare size={18} />
                                        Secure Objective
                                    </motion.button>

                                    <motion.button 
                                        whileHover={{ scale: 1.05, backgroundColor: '#f43f5e', color: 'white' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onControl('end')}
                                        className="px-8 py-5 bg-[var(--text)]/[0.03] border border-[var(--border)]/10 text-[var(--text)]/60 rounded-full font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Abort
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(TimerDisplay);
