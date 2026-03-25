import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Flame, Activity, Zap } from 'lucide-react';
import { Avatar } from '../Avatar';

const OperativeCard = React.memo(({ member, isMe, isHost, onAssignTask }) => {
    const isFocusing = member.status === 'focusing';
    const statusColor = isFocusing ? 'emerald' : 'amber';

    return (
        <motion.div
            key={member._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4, boxShadow: `0 10px 30px rgba(0,0,0,0.3)` }}
            className={`relative flex flex-col items-center gap-6 p-8 rounded-[2.5rem] bg-[var(--surface)] border transition-[background-color,border-color,box-shadow,transform] duration-300 overflow-hidden group ${isMe ? 'border-[var(--primary)]/40 bg-[var(--primary)]/[0.03] shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'border-[var(--border)]/10 hover:border-[var(--text)]/20'
                }`}
        >
            {/* Background Narrative Glow */}
            <div className={`absolute -inset-1 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-1000 ${isFocusing ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`} />

            <div className="relative">
                {/* Status Pulse Ring */}
                <AnimatePresence>
                    {isFocusing && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -inset-4 rounded-full border-2 border-emerald-500/20 pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                {/* Avatar with XP Ring Mockup */}
                <div className="relative p-1 rounded-full border border-[var(--border)]/10">
                    <Avatar
                        src={member.user?.avatar}
                        name={member.user?.name}
                        size="lg"
                        className="relative z-10 border-4 border-[var(--bg)]"
                    />
                    <svg className="absolute inset-0 -rotate-90 w-full h-full p-0.5">
                        <circle
                            cx="50%" cy="50%" r="48%"
                            className="stroke-[var(--text)]/[0.05] fill-none"
                            strokeWidth="2"
                        />
                        <motion.circle
                            cx="50%" cy="50%" r="48%"
                            className={`stroke-${statusColor}-500 fill-none`}
                            strokeWidth="3"
                            strokeDasharray="100"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 100 - (member.focusScore || 65) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Status Indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[var(--bg)] z-20 ${isFocusing ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-amber-500'
                        }`} />
                </div>
            </div>

            <div className="text-center w-full min-w-0 z-10">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <h4 className="text-[14px] font-black text-[var(--text)] uppercase truncate tracking-tight">
                        {member.user?.name}
                    </h4>
                    {String(member.isHost || member.role === 'host') === 'true' && (
                        <Shield size={12} className="text-[var(--primary)]" />
                    )}
                </div>

                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${isFocusing
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-[var(--text)]/20 bg-[var(--text)]/5 border-[var(--border)]/10'
                    }`}>
                    {isFocusing ? 'Protocol: High-Focus' : 'Standby Mode'}
                </span>

                <div className="mt-8 pt-6 border-t border-[var(--border)]/5 space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="text-left">
                            <span className="text-[8px] font-black uppercase text-[var(--text)]/20 tracking-widest block mb-1">Synergy</span>
                            <span className="text-[12px] font-black text-[var(--text)]/60">88%</span>
                        </div>
                        <div className="h-1.5 w-24 bg-[var(--text)]/[0.03] rounded-full overflow-hidden border border-[var(--border)]/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '88%' }}
                                className={`h-full ${isFocusing ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[var(--text)]/10'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Action Overlay (Visible to Host) */}
            {isHost && !isMe && (
                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
                    onClick={() => onAssignTask(member.user?._id || member.user?.id || member.user)}
                    className="mt-4 w-full py-3 rounded-2xl border border-dashed border-[var(--border)]/20 text-[9px] font-black uppercase text-[var(--text)]/30 hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all flex items-center justify-center gap-2"
                >
                    <Zap size={12} /> Assign Directive
                </motion.button>
            )}
        </motion.div>
    );
});

const OperativeGrid = ({ members, currentUserId, hostId, onAssignTask }) => {
    const squadEnergy = useMemo(() => {
        const active = members.filter(m => m.status === 'focusing').length;
        return (active / Math.max(1, members.length)) * 100;
    }, [members]);

    return (
        <div className="w-full space-y-12">
            {/* Squad Energy Collective Header */}
            <div className="relative p-8 rounded-[2rem] bg-[var(--surface)]/20 border border-[var(--border)]/5 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                            <Flame size={20} className={squadEnergy > 0 ? 'animate-bounce' : ''} />
                        </div>
                        <div>
                            <h3 className="text-[12px] font-black text-[var(--text)] uppercase tracking-[0.3em]">Collective Squad Energy</h3>
                            <p className="text-[9px] font-bold text-[var(--text)]/30 uppercase tracking-[0.1em] mt-1">Multi-Operative Focus Synchronization</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-[var(--text)]">{Math.round(squadEnergy)}%</span>
                        <span className="block text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Sync Peak</span>
                    </div>
                </div>

                <div className="h-2 w-full bg-[var(--text)]/[0.03] rounded-full overflow-hidden border border-[var(--border)]/10 p-0.5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${squadEnergy}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[var(--primary)] via-emerald-500 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                    />
                </div>
            </div>

            {/* Operative Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {members.map(member => (
                    <OperativeCard
                        key={member._id}
                        member={member}
                        isMe={String(member.user?._id || member.user?.id || member.user) === String(currentUserId)}
                        isHost={String(hostId) === String(currentUserId)}
                        onAssignTask={onAssignTask}
                    />
                ))}
            </div>
        </div>
    );
};

export default React.memo(OperativeGrid);
