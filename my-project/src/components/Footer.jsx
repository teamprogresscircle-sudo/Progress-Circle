import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Instagram, Facebook, Cpu, Zap, ShieldCheck } from 'lucide-react';

export function Footer() {
    const navigate = useNavigate();

    const footerLinks = {
        system: [
            { label: 'Features', href: '/login' },
            { label: 'Ecosystem', href: '/login' },
            { label: 'Pricing', href: '/login' },
            { label: 'Leaderboard', href: '/login' },
            { label: 'Squads', href: '/login' },
        ],
        support: [
            { label: 'Our Mission', href: '/about' },
            { label: 'Documentation', href: '#' },
            { label: 'System status', href: '#', badge: 'Online' },
        ],
        legal: [
            { label: 'Privacy Protocol', href: '/privacy' },
            { label: 'Terms of Operation', href: '/terms' },
            { label: 'Data Sovereignty', href: '/privacy#control' },
        ]
    };

    return (
        <footer className="relative pt-32 pb-16 px-6 border-t border-white/[0.03] bg-[#0B0B0F] overflow-hidden">
            {/* Technical Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
            
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
                    {/* Branding Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            navigate('/');
                        }}>
                            <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-center transition-all group-hover:bg-white/5">
                                <Target size={20} className="text-white" />
                            </div>
                            <span className="font-sans font-bold text-xl tracking-tight text-white">ProgressCircle</span>
                        </div>
                        <p className="text-white/40 text-lg leading-relaxed max-w-sm font-normal">
                            A precision-engineered ecosystem for focusing on what matters. Track tasks, build habits, and expand your digital legacy.
                        </p>
                        <div className="flex items-center gap-4 py-3 px-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-fit">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Technical Status // Nominal</span>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">System</h4>
                        <ul className="space-y-4">
                            {footerLinks.system.map(link => (
                                <li key={link.label}>
                                    <FooterLink href={link.href}>{link.label}</FooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Support</h4>
                        <ul className="space-y-4">
                            {footerLinks.support.map(link => (
                                <li key={link.label} className="flex items-center gap-2">
                                    <FooterLink href={link.href}>{link.label}</FooterLink>
                                    {link.badge && (
                                        <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase rounded">
                                            {link.badge}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Legal</h4>
                        <ul className="space-y-4">
                            {footerLinks.legal.map(link => (
                                <li key={link.label}>
                                    <FooterLink href={link.href}>{link.label}</FooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/[0.03] flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8">
                        <p className="text-white/20 text-[10px] font-black tracking-[0.2em] uppercase">
                            &copy; 2026 PROGRESS CIRCLE. ALL RIGHTS RESERVED.
                        </p>
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                            <Cpu size={12} className="text-white/20" />
                            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Protocol v4.2.0-Alpha</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <SocialIcon icon={<Instagram size={18} />} href="#" />
                        <SocialIcon icon={<Facebook size={18} />} href="#" />
                        <SocialIcon 
                            icon={
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                </svg>
                            } 
                            href="#" 
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, children }) {
    const content = (
        <span className="text-sm font-medium text-white/40 hover:text-white transition-all duration-300">
            {children}
        </span>
    );

    if (href.startsWith('/')) {
        return <Link to={href}>{content}</Link>;
    }
    return <a href={href}>{content}</a>;
}

function SocialIcon({ icon, href }) {
    return (
        <motion.a
            whileHover={{ y: -3, scale: 1.1 }}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 hover:border-white/10 transition-all duration-300"
        >
            {icon}
        </motion.a>
    );
}
