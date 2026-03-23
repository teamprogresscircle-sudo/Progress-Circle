import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, ArrowLeft, FileText, CheckCircle2, Shield, Lock, Zap, Scale, Gavel, Wallet, Power } from 'lucide-react';
import { Footer } from '../components/Footer';

export function Terms() {
    const navigate = useNavigate();

    const sections = [
        {
            id: 'foundation',
            title: "The Foundation",
            icon: <Scale className="text-blue-400" size={24} />,
            content: "By accessing the ProgressCircle ecosystem, you enter a binding agreement of operational excellence. These terms ensure a high-fidelity environment for all elite performers.",
            items: ["Acceptance of Terms", "Operational Guidelines", "System Integrity"],
            accent: "blue"
        },
        {
            id: 'sovereignty',
            title: "Digital Sovereignty",
            icon: <Lock className="text-rose-400" size={24} />,
            content: "Your digital legacy is your own. You are the sole architect of your account security and all activities occurring under your unique identifier.",
            special: {
                title: "Protocol Alert",
                desc: "Misuse of Astra AI or gamification protocols may lead to immediate suspension."
            },
            accent: "rose"
        },
        {
            id: 'exchange',
            title: "The Elite Exchange",
            icon: <Wallet className="text-emerald-400" size={24} />,
            content: "Elite Premium subscriptions provide advanced operational capabilities. All transactions are secured via high-grade digital channels. Refunds are managed via our dedicated success policy.",
            badges: ["Secure Payments", "Premium Access", "Transparent Billing"],
            accent: "emerald"
        },
        {
            id: 'finality',
            title: "System Finality",
            icon: <Power className="text-indigo-400" size={24} />,
            content: "We reserve the right to terminate system access for conduct that violates these protocols or threatens the integrity of our digital infrastructure.",
            accent: "indigo"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-[#F8FAFC] font-sans selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
            {/* Technical Background */}
            <div className="fixed inset-0 z-0 select-none pointer-events-none">
                <div className="absolute inset-0 bg-[#0B0B0F]" />
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/[0.05] blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/[0.05] blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
                
                {/* Elite Grid */}
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
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
                        Back to Origin
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 pt-48 pb-40 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Hero Section */}
                    <div className="max-w-3xl mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 mb-8">
                                <FileText size={12} className="text-indigo-400" />
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Operational Protocols // v1.0</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-sans font-semibold tracking-tight text-white leading-[1.05] mb-8">
                                Code of Conduct.<br />
                                <span className="text-white/30">Guidelines for Expansion.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-white/40 leading-relaxed font-normal max-w-2xl">
                                To maintain the integrity of our high-performance ecosystem, all users must adhere to these operational protocols. Precision, respect, and sovereignty are our core pillars.
                            </p>
                        </motion.div>
                    </div>

                    {/* Tactical Feature Bar */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-y-4 gap-x-10 py-6 border-y border-white/[0.03] mb-24"
                    >
                        <FeatureBadge icon={<Scale size={14} />} label="Mutual Respect" />
                        <FeatureBadge icon={<Zap size={14} />} label="System Integrity" />
                        <FeatureBadge icon={<Shield size={14} className="opacity-40" />} label="Data Sovereignty" />
                        <FeatureBadge icon={<Gavel size={14} />} label="Fair Usage" />
                    </motion.div>

                    {/* Core Sections - Glass Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
                        {sections.map((section, idx) => (
                            <TermsCard key={section.id} section={section} delay={idx * 0.1} />
                        ))}
                    </div>

                    {/* Final CTA */}
                    <div className="relative pt-32 pb-20 text-center border-t border-white/[0.03]">
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h3 className="text-3xl md:text-4xl font-sans font-semibold text-white mb-6 tracking-tight leading-tight">
                                Ready to Commit to Your Growth?
                            </h3>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="px-14 py-4 bg-white text-[#0B0B0F] rounded-full font-bold text-lg shadow-2xl transition-all hover:bg-neutral-100"
                            >
                                Agree & Continue
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
function FeatureBadge({ icon, label }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="text-indigo-400 opacity-60">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 whitespace-nowrap">{label}</span>
        </div>
    );
}

function TermsCard({ section, delay }) {
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
                                <Shield size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-400 tracking-wide">{badge}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
