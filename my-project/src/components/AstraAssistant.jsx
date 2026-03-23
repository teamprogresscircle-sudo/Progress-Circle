import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, Zap, Brain, Rocket, ChevronRight, Activity, Clock, Target, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AstraAssistant() {
    const { user } = useAuth();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [displayText, setDisplayText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const typingIntervalRef = useRef(null);

    const isPremium = user?.plan === 'premium';

    useEffect(() => {
        let active = true;
        if (isPremium) {
            fetchAnalysis(active);
        }
        return () => { active = false; };
    }, [isPremium]);

    const fetchAnalysis = async (active = true) => {
        try {
            setLoading(true);
            const res = await api.get('/ai/analyze');
            if (active && res.data?.success) {
                setAnalysis(res.data.data);
                startTyping(res.data.data.log);
            }
        } catch (err) {
            console.error('Astra failed to analyze:', err);
        } finally {
            if (active) setLoading(false);
        }
    };

    const startTyping = (text) => {
        // Clear any existing interval
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }

        setIsTyping(true);
        setDisplayText("");
        
        let i = 0;
        typingIntervalRef.current = setInterval(() => {
            setDisplayText(text.substring(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
                setIsTyping(false);
            }
        }, 30);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        };
    }, []);

    if (!isPremium) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden p-5 rounded-3xl border border-white/5 bg-white/[0.02]"
            >
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--primary), transparent, var(--accent))' }} />
                
                <div className="relative flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 relative">
                        <Brain className="text-pc-muted opacity-50" size={32} />
                        <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-full border-2 border-[#0b0d12]">
                            <Lock size={10} className="text-white" />
                        </div>
                    </div>
                    
                    <h3 className="text-sm font-black uppercase tracking-widest mb-2">Astra Assistant</h3>
                    <p className="text-[11px] text-pc-muted mb-5 max-w-[200px] leading-relaxed">
                        Unlock Astra for personalized productivity logs, habit insights, and daily predictions.
                    </p>
                    
                    <Link to="/pricing">
                        <button className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}>
                            Upgrade to Pro
                        </button>
                    </Link>
                </div>

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-4 blur-3xl bg-indigo-500/10 w-24 h-24 rounded-full" />
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pc-card relative overflow-hidden group"
        >
            {/* Animated Universe Background */}
            <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, var(--primary), transparent, var(--accent))' }} />
            
            <div className="relative flex items-center gap-4 mb-4">
                <div className="relative flex-shrink-0">
                    {/* Astra Core */}
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 90, 180, 270, 360]
                        }}
                        transition={{ 
                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                        }}
                        className="w-12 h-12 rounded-full p-0.5 flex items-center justify-center shadow-lg"
                        style={{ 
                            background: 'linear-gradient(135deg, var(--primary), var(--accent), #10b981)',
                            boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)'
                        }}
                    >
                        <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                            <Sparkles className="text-primary" size={18} />
                        </div>
                    </motion.div>
                    
                    {/* Orbital Rings */}
                    <div className="absolute -inset-2 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute -inset-4 border border-white/[0.02] rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                </div>
                
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        Astra Assistant
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-pc-muted font-bold">Assistant Online</p>
                </div>
            </div>

            <div className="relative min-h-[100px] p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                {loading ? (
                    <div className="flex items-center gap-2 text-[10px] text-pc-muted animate-pulse">
                        <Zap size={12} className="animate-bounce" />
                        Scanning activity data...
                    </div>
                ) : (
                    <p className="text-[11px] leading-relaxed italic font-bold" style={{ color: 'var(--text)' }}>
                        {displayText}
                        {isTyping && <span className="inline-block w-1 h-3 ml-1 animate-pulse" style={{ background: 'var(--primary)' }} />}
                    </p>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {analysis?.stats && (
                    <>
                        {analysis.stats.trend && (
                            <div className={`px-3 py-1 rounded-xl border text-[10px] font-black flex items-center gap-1.5 shadow-sm ${
                                analysis.stats.trend === 'up' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                                {analysis.stats.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {analysis.stats.trendValue}% {analysis.stats.trend === 'up' ? 'Gain' : 'Drop'}
                            </div>
                        )}
                        {analysis.stats.topSector && (
                            <div className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black text-primary flex items-center gap-1.5 shadow-sm">
                                <Layers size={12} />
                                Focus: {analysis.stats.topSector}
                            </div>
                        )}
                        {analysis.stats.peakHour && (
                            <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 flex items-center gap-1.5 shadow-sm">
                                <Clock size={12} />
                                {analysis.stats.peakHour} Peak
                            </div>
                        )}
                    </>
                )}
            </div>

            {analysis?.recommendation && (
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-4 p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-2 shadow-sm"
                >
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <Rocket className="text-primary" size={14} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-primary leading-tight uppercase tracking-tight mb-0.5">
                            Astra Recommendation
                        </p>
                        <p className="text-[9px] text-pc-muted font-bold leading-relaxed">
                            {analysis.recommendation}
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="mt-5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-pc-muted">Growth Path Locked</span>
                
                <button 
                    onClick={() => fetchAnalysis(true)}
                    disabled={loading || isTyping}
                    className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:gap-2 transition-all disabled:opacity-30"
                >
                    Refresh <ChevronRight size={12} />
                </button>
            </div>
        </motion.div>
    );
}
