import React, { useState, useMemo } from 'react';
import { MessageSquare, Send, Trophy, Star, Zap, Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../Avatar';

const QUICK_SIGNALS = [
    { text: "Locked in 🔒", color: "indigo" },
    { text: "Stay focused ⚡", color: "amber" },
    { text: "Objective near 🎯", color: "emerald" },
    { text: "Break time? ☕", color: "rose" }
];

const MessageBubble = React.memo(({ msg, isMe }) => (
    <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full space-y-2`}
    >
        {!isMe && (
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">
                {msg.sender?.name || 'Operative'}
            </span>
        )}
        <div className={`px-6 py-4 rounded-[1.5rem_0.4rem_1.5rem_0.4rem] text-[12px] font-black uppercase tracking-wide transition-all break-words w-fit max-w-[90%] backdrop-blur-3xl border ${
            isMe
                ? 'bg-[var(--primary)] text-white border-white/10 shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)]'
                : 'bg-white/[0.04] text-white/60 border-white/5 shadow-inner'
        }`}>
            {msg.text}
        </div>
        <span className="text-[7px] text-white/10 font-black uppercase tracking-[0.3em] px-2">
            {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
    </motion.div>
));

const IntelligenceSidebar = ({
    messages = [],
    currentUser,
    onSendMessage,
    participants = [],
    league = 'Bronze',
    onClose
}) => {
    const [input, setInput] = useState('');

    const handleSend = (e) => {
        if (e && e.key && e.key !== 'Enter') return;
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    const sortedLeaderboard = useMemo(() => 
        [...participants].sort((a, b) => (b.pointsEarned || 0) - (a.pointsEarned || 0)),
    [participants]);

    return (
        <aside className="lg:col-span-3 h-full flex flex-col bg-[#0b0f1a] relative border-l border-white/5 overflow-hidden">
            {/* Ambient Tonal Background */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--primary)]/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
            {/* Intel Header */}
            <div className="p-10 border-b border-white/5 bg-white/[0.015] relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-[30px] rounded-full" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] flex items-center gap-3">
                            <MessageSquare size={14} /> Comms Uplink
                        </h3>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-6 italic">Secure Channel 09</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-white hover:border-[var(--primary)]/30 transition-all active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Signal Nodes */}
                <div className="flex flex-wrap gap-2.5 relative z-10">
                    {QUICK_SIGNALS.map((signal, idx) => (
                        <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSendMessage(signal.text)}
                            className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-black text-white/40 hover:text-white hover:border-[var(--primary)]/40 transition-all uppercase tracking-widest shadow-sm"
                        >
                            {signal.text}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Live Feed Container */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pc-scrollbar p-10 space-y-10">
                    <AnimatePresence>
                        {messages.length > 0 ? (
                            messages.map((msg, i) => {
                                const isMe = String(msg.sender?._id || msg.sender?.id || msg.sender) === String(currentUser?._id || currentUser?.id);
                                return <MessageBubble key={msg._id || i} msg={msg} isMe={isMe} />;
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 grayscale">
                                <Zap size={48} className="mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Comm-Link Neutral</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Command Console Input */}
                <div className="p-10 pt-0 shrink-0">
                    <div className="relative flex items-center gap-4 bg-white/[0.03] p-3 rounded-[2rem_0.5rem_2rem_0.5rem] border border-white/5 shadow-2xl transition-all duration-300 focus-within:border-[var(--primary)]/50 focus-within:bg-white/[0.05]">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleSend}
                            placeholder="TRANSMIT SIGNAL..."
                            className="flex-1 bg-transparent border-none px-6 py-4 text-[12px] font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSend()}
                            className="p-4 bg-[var(--primary)] rounded-2xl text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] border border-white/20 transition-all"
                        >
                            <Send size={20} />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Operative Ranking Footer */}
            <div className="mt-auto border-t border-white/5 bg-white/[0.015] p-10 shrink-0">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-3">
                            <Trophy size={14} className="text-amber-500" /> Operative Ranking
                        </h3>
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em] ml-7">Battle Performance Unit</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">
                        <Star size={12} className="fill-amber-500" /> {league}
                    </div>
                </div>

                <div className="space-y-6 max-h-56 overflow-y-auto pc-scrollbar pr-2">
                    {sortedLeaderboard.map((p, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={p.user?._id || p.user} 
                            className="flex items-center justify-between group transition-all"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className={`text-[10px] font-black w-5 font-mono ${idx === 0 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-white/10'}`}>{idx + 1}.</span>
                                <div className="relative">
                                    <Avatar src={p.user?.avatar} name={p.user?.name} size="xs" className="border border-white/10 group-hover:border-[var(--primary)]/50 transition-colors" />
                                    {idx === 0 && <Shield size={10} className="absolute -top-1 -right-1 text-amber-500 fill-amber-500/20 shadow-lg" />}
                                </div>
                                <span className="text-[12px] font-black uppercase tracking-tight text-white/40 group-hover:text-white transition-colors truncate">{p.user?.name}</span>
                            </div>
                            <div className="flex items-center gap-5 shrink-0">
                                <div className="text-right">
                                    <span className="block text-[11px] font-black text-[var(--primary)] leading-none italic shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]">+{p.pointsEarned || 0} XP</span>
                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-widest mt-1 block">{p.tasksCompleted || 0} DIRECTIVES</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            </div>
        </aside>
    );
};

export default React.memo(IntelligenceSidebar);
