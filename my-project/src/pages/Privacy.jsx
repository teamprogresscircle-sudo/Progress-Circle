import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, ArrowLeft, Shield, Lock, Eye, Download, Trash2, Zap, CheckCircle2, ShieldCheck, Database, Settings } from 'lucide-react';
import { Footer } from '../components/Footer';

export function Privacy() {
    const navigate = useNavigate();

    const sections = [
        {
            id: 'design',
            title: "Minimal by Design",
            icon: <Database className="text-blue-400" size={24} />,
            content: "We only collect what's essential to power your progress — including task activity, habit tracking, and focus duration. Nothing more.",
            items: ["Task Data", "Habit Metrics", "Focus Sessions"],
            accent: "blue"
        },
        {
            id: 'sharing',
            title: "Never Sold. Never Shared.",
            icon: <Eye className="text-rose-400" size={24} />,
            content: "Your personal data is never sold, rented, or shared with third parties. Period.",
            special: {
                title: "Zero Data Selling Policy",
                desc: "We do not monetize your personal information — ever."
            },
            accent: "rose"
        },
        {
            id: 'security',
            title: "Enterprise-Grade Security",
            icon: <ShieldCheck className="text-emerald-400" size={24} />,
            content: "All data is encrypted in transit and at rest using industry-standard AES-256 protocols. Your information is protected with the same level of security used by global financial systems.",
            badges: ["AES-256 Encryption", "Secure Transmission", "Infrastructure Protection"],
            accent: "emerald"
        },
        {
            id: 'control',
            title: "You Stay in Control",
            icon: <Settings className="text-indigo-400" size={24} />,
            content: "You have full sovereignty over your digital lineage. We provide transparent access to your data and respect your right to be forgotten within our ecosystem.",
            accent: "indigo"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-[#F8FAFC] font-sans selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
            {/* Technical Background */}
            <div className="fixed inset-0 z-0 select-none pointer-events-none">
                <div className="absolute inset-0 bg-[#0B0B0F]" />
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/[0.05] blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/[0.05] blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 py-8 px-10">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg flex items-center justify-center transition-all group-hover:bg-white/5">
                            <Target size={16} className="text-white" />
                        </div>
                        <span className="font-sans font-bold text-lg tracking-tight text-white">
                            ProgressCircle
                        </span>
                    </Link>
                    <Link to="/" className="text-[10px] font-black tracking-[0.3em] text-white/40 hover:text-white transition-all uppercase flex items-center gap-2 group">
                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                        Exit System
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 pt-48 pb-40 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Elite Hero Update */}
                    <div className="max-w-3xl mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 mb-8">
                                <Shield size={12} className="text-blue-400" />
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Privacy-First Architecture</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-sans font-semibold tracking-tight text-white leading-[1.05] mb-8">
                                Your Data.<br />
                                <span className="text-white/30">Fully Under Your Control.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-white/40 leading-relaxed font-normal max-w-2xl">
                                ProgressCircle is built on a privacy-first architecture — where your data remains yours, always secure, always transparent.
                            </p>
                        </motion.div>
                    </div>

                    {/* Trust Bar - Tactical */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-y-4 gap-x-10 py-6 border-y border-white/[0.03] mb-24"
                    >
                        <TrustBadge icon={<Lock size={14} />} label="Privacy First" />
                        <TrustBadge icon={<ShieldCheck size={14} />} label="Encrypted by Default" />
                        <TrustBadge icon={<Eye size={14} className="opacity-40" />} label="No Data Selling" />
                        <TrustBadge icon={<Settings size={14} />} label="Full User Control" />
                    </motion.div>

                    {/* 4 Core Sections - Glass Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
                        {sections.map((section, idx) => (
                            <PrivacyCard key={section.id} section={section} delay={idx * 0.1} />
                        ))}
                    </div>

                    {/* Final CTA - Elite Upgrade */}
                    <div className="relative pt-32 pb-20 text-center border-t border-white/[0.03]">
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h3 className="text-3xl md:text-4xl font-sans font-semibold text-white mb-6 tracking-tight leading-tight">
                                Take Control of Your Data — and Your Progress.
                            </h3>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="px-14 py-4 bg-white text-[#0B0B0F] rounded-full font-bold text-lg shadow-2xl transition-all hover:bg-neutral-100"
                            >
                                Start Your System
                            </motion.button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// Sub-components
function TrustBadge({ icon, label }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="text-blue-400 opacity-60">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 whitespace-nowrap">{label}</span>
        </div>
    );
}

function PrivacyCard({ section, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay }}
            whileHover={{ y: -5, borderColor: 'rgba(255,255,255,0.15)' }}
            className="p-8 md:p-10 bg-white/[0.03] border border-white/[0.08] rounded-[2rem] backdrop-blur-[10px] flex flex-col h-full relative group transition-all duration-500"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                {section.icon}
            </div>
            
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                        {section.icon}
                    </div>
                    <h2 className="text-xl font-sans font-semibold text-white">{section.title}</h2>
                </div>
                
                <p className="text-white/40 leading-relaxed font-normal mb-8">
                    {section.content}
                </p>

                {/* Section Specific Extras */}
                {section.items && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                        {section.items.map(item => (
                            <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                                <CheckCircle2 size={14} className="text-blue-400" />
                                <span className="font-medium tracking-tight whitespace-nowrap">{item}</span>
                            </div>
                        ))}
                    </div>
                )}

                {section.special && (
                    <div className="mt-4 p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl relative overflow-hidden group/special">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-3xl opacity-0 group-hover/special:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                                {section.special.title}
                            </div>
                            <p className="text-rose-400/80 text-sm font-medium">{section.special.desc}</p>
                        </div>
                    </div>
                )}

                {section.badges && (
                    <div className="flex flex-wrap gap-2">
                        {section.badges.map(badge => (
                            <div key={badge} className="px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-400 tracking-wide">{badge}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {section.actions && (
                <div className="mt-10 flex flex-wrap gap-3">
                    {section.actions.map(action => (
                        <div 
                            key={action.label} 
                            className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-all active:scale-95 group/action"
                        >
                            <span className="opacity-40 group-hover/action:opacity-100 transition-opacity">{action.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover/action:text-white transition-colors">
                                {action.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
