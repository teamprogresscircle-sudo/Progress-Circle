import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Trophy, Star, Zap, Shield, X } from 'lucide-react';
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
        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
    >
        {!isMe && (
            <span className="text-[9px] font-black text-[var(--text)]/20 uppercase tracking-widest mb-2 ml-1">
                {msg.sender?.name || 'Operative'}
            </span>
        )}
        <div className={`p-4 rounded-2xl text-[12px] font-medium leading-relaxed shadow-lg transition-all break-words w-fit max-w-[90%] ${
            isMe
                ? 'bg-[var(--primary)] text-white rounded-tr-none shadow-[0_10px_20px_rgba(var(--primary-rgb),0.2)]'
                : 'bg-[var(--surface)] text-[var(--text)]/80 rounded-tl-none border border-[var(--border)]/10'
        }`}>
            {msg.text}
        </div>
        <span className="text-[7px] text-[var(--text)]/20 font-black uppercase mt-2 tracking-[0.2em]">
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
        <aside className="lg:col-span-3 border-l border-[var(--border)]/10 flex flex-col bg-[var(--bg)] h-full overflow-hidden relative">
            {/* Ambient Tonal Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
            {/* Intel Header */}
            <div className="p-8 border-b border-[var(--border)]/10 bg-[var(--text)]/[0.015] relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-[30px] rounded-full" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-[10px] font-black text-[var(--text)]/30 uppercase tracking-[0.3em] flex items-center gap-3">
                        <MessageSquare size={14} className="text-[var(--primary)]" /> Squad Comms
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                            <span className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest">Encrypted Overlay</span>
                        </div>
                        {onClose && (
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-[var(--text)]/20 hover:text-[var(--primary)] transition-colors"
                            >
                                <X size={14} />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Quick Signal Loadout */}
                <div className="flex flex-wrap gap-2 relative z-10">
                    {QUICK_SIGNALS.map((signal, idx) => (
                        <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSendMessage(signal.text)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]/10 text-[9px] font-bold text-[var(--text)]/50 hover:text-[var(--text)] hover:border-[var(--primary)]/30 transition-all shadow-sm"
                        >
                            {signal.text}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Live Feed Container */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pc-scrollbar p-8 space-y-8">
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
                </div>

                {/* Input Matrix */}
                <div className="p-8 pt-0 shrink-0">
                    <div className="relative flex items-center gap-3 bg-[var(--surface)] p-2.5 rounded-[1.5rem] border border-[var(--border)]/10 shadow-xl transition-[border-color,box-shadow] duration-200 focus-within:border-[var(--primary)]/40">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleSend}
                            placeholder="Type signal..."
                            className="flex-1 bg-transparent border-none px-4 py-3 text-[13px] font-semibold text-[var(--text)] placeholder:text-[var(--text)]/10 focus:outline-none"
                        />
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: -15 }}
                            whileTap={{ scale: 0.9, rotate: 0 }}
                            onClick={() => handleSend()}
                            className="p-3.5 bg-[var(--primary)] rounded-2xl text-white shadow-lg shadow-[var(--primary)]/30 border border-white/10"
                        >
                            <Send size={18} />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Performance Leaderboard (Drawer style or fixed bottom) */}
            <div className="mt-auto border-t border-[var(--border)]/10 bg-[var(--text)]/[0.01] p-8 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-[var(--text)]/30 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Trophy size={14} className="text-amber-500" /> Operative Rank
                    </h3>
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">
                        <Star size={10} className="fill-amber-500" /> {league}
                    </div>
                </div>

                <div className="space-y-4 max-h-48 overflow-y-auto pc-scrollbar pr-2">
                    {sortedLeaderboard.map((p, idx) => (
                        <motion.div 
                            key={p.user?._id || p.user} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between group transition-all"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-[10px] font-black w-4 font-mono ${idx === 0 ? 'text-amber-400' : 'text-[var(--text)]/10'}`}>{idx + 1}.</span>
                                <Avatar src={p.user?.avatar} name={p.user?.name} size="xs" className="border border-[var(--border)]/10" />
                                <span className="text-[12px] font-bold text-[var(--text)]/70 truncate group-hover:text-[var(--text)] transition-colors">{p.user?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <span className="block text-[11px] font-black text-[var(--primary)] leading-none">+{p.pointsEarned || 0}</span>
                                    <span className="text-[8px] font-black text-[var(--text)]/10 uppercase tracking-widest">{p.tasksCompleted || 0} MIS</span>
                                </div>
                                {idx === 0 && <Shield size={12} className="text-amber-500 fill-amber-500/10" />}
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
