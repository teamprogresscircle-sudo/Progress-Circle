import React, { useState } from 'react';
import { Info, Zap, Activity, Layers, Target, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';

/**
 * [APEX ELITE V2.2] - Page Insight Engine
 * High-fidelity instructional overlay for top-tier operations.
 */
export function PageInsight({ title, intro, operations, neuralTip }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Check if user has already opened this specific insight before
    const storageKey = `insight_seen_${title.replace(/\s+/g, '_').toLowerCase()}`;
    const [hasSeen, setHasSeen] = useState(() => localStorage.getItem(storageKey) === 'true');

    const handleOpen = () => {
        setIsOpen(true);
        if (!hasSeen) {
            setHasSeen(true);
            localStorage.setItem(storageKey, 'true');
        }
    };

    return (
        <>
            <button 
                onClick={handleOpen}
                className="group relative flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-500 shadow-lg active:scale-90"
                style={{
                    background: 'rgba(var(--primary-rgb), 0.1)',
                    border: '1px solid rgba(var(--primary-rgb), 0.2)',
                    color: 'var(--primary)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)'; e.currentTarget.style.color = 'var(--primary)'; }}
                title="Neural Insight"
            >
                <Info size={18} />
                {!hasSeen && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--primary)' }}></span>
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--primary)' }}></span>
                    </span>
                )}
            </button>

            <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Neural Intelligence Feed" maxWidth="600px">
                <div className="space-y-10 py-4">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: 'rgba(var(--primary-rgb), 0.1)',
                                    border: '1px solid rgba(var(--primary-rgb), 0.2)',
                                    color: 'var(--primary)',
                                    boxShadow: '0 0 20px rgba(var(--primary-rgb), 0.1)'
                                }}
                            >
                                <Zap size={24} className="pc-streak-glow" />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: 'var(--primary)' }}>Protocol Insight</span>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter font-manrope">{title}</h3>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-zinc-400 leading-relaxed font-inter pl-1 ml-1" style={{ borderLeft: '2px solid rgba(var(--primary-rgb), 0.2)' }}>{intro}</p>
                    </div>

                    {/* Operations Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Standard Operations</h4>
                            <div className="h-[1px] flex-grow bg-white/[0.03] ml-4" />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {operations.map((op, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-[#0b0d12]/50 p-6 rounded-[1.5rem] border border-white/[0.03] flex gap-6 group cursor-default transition-all"
                                    style={{ '--hover-border': 'rgba(var(--primary-rgb), 0.3)' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = `rgba(var(--primary-rgb), 0.3)`}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="font-black text-2xl italic font-manrope transition-colors tracking-tighter" style={{ color: `rgba(var(--primary-rgb), 0.3)` }}>0{idx + 1}</div>
                                        <div className="w-px h-full" style={{ background: `rgba(var(--primary-rgb), 0.1)` }} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            {op.title}
                                            <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: 'var(--primary)' }} />
                                        </div>
                                        <div className="text-[11px] font-medium text-zinc-500 leading-relaxed max-w-sm">{op.content}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Neural Tip Section */}
                    {neuralTip && (
                        <div
                            className="p-8 rounded-[2rem] relative overflow-hidden group shadow-2xl"
                            style={{
                                background: 'rgba(var(--primary-rgb), 0.05)',
                                border: '1px solid rgba(var(--primary-rgb), 0.2)'
                            }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 blur-3xl -z-0" style={{ background: 'rgba(var(--primary-rgb), 0.05)' }} />
                            <div className="flex items-start gap-6 relative z-10">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{
                                        background: 'rgba(var(--primary-rgb), 0.1)',
                                        border: '1px solid rgba(var(--primary-rgb), 0.2)',
                                        color: 'var(--primary)'
                                    }}
                                >
                                    <ShieldCheck size={20} />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--primary)' }}>Neural Optimization Tip</div>
                                    <p className="text-[13px] font-bold text-zinc-300 leading-relaxed italic pr-4">"{neuralTip}"</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={() => setIsOpen(false)}
                        className="w-full py-5 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-white/5 active:scale-[0.98] shadow-2xl"
                        style={{ background: 'rgba(var(--primary-rgb), 0.08)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.08)'}
                    >
                        Deactivate Operational Briefing
                    </button>
                </div>
            </Modal>
        </>
    );
}
