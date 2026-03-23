import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, ArrowLeft } from 'lucide-react';
import SoftAurora from '../../Animations/SoftAuora/SoftAurora';
import { Footer } from '../components/Footer';

export function About() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-[#F8FAFC] font-inter selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
            {/* Technical Background */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[#0B0B0F]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
                
                {/* Elite Grid */}
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                
                {/* Technical Markers */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 border-t border-l border-white/40" />
                    <div className="absolute top-1/4 right-1/4 w-2 h-2 border-t border-r border-white/40" />
                    <div className="absolute bottom-1/4 left-1/4 w-2 h-2 border-b border-l border-white/40" />
                    <div className="absolute bottom-1/4 right-1/4 w-2 h-2 border-b border-r border-white/40" />
                </div>

                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scanline_8s_linear_infinite] pointer-events-none" />
            </div>

            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 py-6 px-10">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg flex items-center justify-center transition-all duration-500 group-hover:bg-white/[0.07]">
                                <Target size={16} className="text-white" />
                            </div>
                            <span className="font-outfit font-bold text-lg tracking-tight text-white">
                                ProgressCircle
                            </span>
                        </Link>
                    </div>
                    <Link to="/" className="text-[10px] font-bold tracking-[0.2em] text-white/40 hover:text-white transition-colors uppercase flex items-center gap-2">
                        <ArrowLeft size={12} />
                        Back to System
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 pt-40 pb-32 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Hero Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32 relative">
                        {/* Title Column 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative"
                        >
                            {/* Improved Clock Ornament - Scaled down */}
                            <div className="absolute -top-10 -left-10 w-80 h-80 opacity-[0.1] pointer-events-none -z-10">
                                <ClockOrnament />
                            </div>
                            
                            <h1 className="text-5xl md:text-6xl font-sans font-semibold tracking-tight text-white leading-[1.1] mb-8 relative z-10">
                                Master<br />your time.
                            </h1>
                            
                            <p className="text-white/40 text-lg leading-relaxed max-w-sm font-normal relative z-10 px-1">
                                ProgressCircle was built for the obsessive. For those who realize that time is the only truly finite resource and that every habit is in the architecture of the self.
                            </p>
                        </motion.div>

                        {/* Title Column 2 */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                            className="relative text-right md:text-left flex flex-col items-end md:items-start"
                        >
                            {/* Improved Compass Ornament - Scaled down */}
                            <div className="absolute -top-10 -right-10 md:left-5 w-80 h-80 opacity-[0.1] pointer-events-none -z-10">
                                <CompassOrnament />
                            </div>
                            
                            <h2 className="text-5xl md:text-6xl font-sans font-semibold tracking-tight text-white leading-[1.1] mb-8 relative z-10">
                                <span className="text-white/20">Expand</span><br />
                                <span>your circle.</span>
                            </h2>

                            <p className="text-white/40 text-lg leading-relaxed max-w-sm text-right md:text-left font-normal relative z-10 px-1">
                                Our purpose is to provide a precision-engineered environment where focus is the default, and expansion is inevitable result. We don't just track tasks; we engineer momentum.
                            </p>
                        </motion.div>

                        {/* Central Circle of Influence Visual */}
                        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md hidden lg:block pointer-events-none z-0">
                            <CircleOfInfluenceVisual />
                        </div>
                    </div>

                    {/* Principles Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1px] bg-white/[0.05] border border-white/[0.05] mb-32 overflow-hidden rounded-[2rem]">
                        <PrincipleModule
                            title="The Compound Circle"
                            desc="Progress isn't linear; it's exponential. We visualize the compound effect of your habits so you can see the future you're building, today."
                            visual={<CompoundVisual />}
                        />
                        <PrincipleModule
                            title="Absolute Clarity"
                            desc="If it doesn't help you focus, it doesn't belong. Our interface is a silent partner, designed to stay out of your way until it's needed."
                            visual={<ClarityVisual />}
                        />
                        <PrincipleModule
                            title="Sovereign Data"
                            desc="Your growth data is your most valuable asset. We treat your digital legacy with the same respect as a private vault."
                            visual={<DataVisual />}
                        />
                        <PrincipleModule
                            title="Seamless Flow"
                            desc="From physiological tracking to task execution, everything lives in one high-fidelity ecosystem. One system. No friction."
                            visual={<FlowVisual />}
                        />
                    </div>

                    {/* Footer Stats & CTA */}
                    <div className="text-center pt-24 border-t border-white/[0.05] relative overflow-hidden">
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-3xl md:text-4xl font-sans font-semibold text-white mb-4 tracking-tight">Ready to start your journey?</h3>
                                <p className="text-white/30 text-lg md:text-xl font-normal opacity-60">Join the Elite / Secure Your Circle</p>
                            </div>
                            
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="px-12 py-4 bg-white text-[#0B0B0F] rounded-full font-semibold text-lg transition-all shadow-xl relative group overflow-hidden"
                            >
                                <span className="relative z-10">Join Now</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// Helper Components
function PrincipleModule({ title, desc, visual }) {
    return (
        <div className="p-10 bg-[#0B0B0F] hover:bg-white/[0.02] transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] -rotate-45 translate-x-16 -translate-y-16 group-hover:bg-white/[0.03] transition-colors" />
            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                <div className="flex-1 space-y-4">
                    <h3 className="text-xl md:text-2xl font-sans font-semibold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-normal">{title}</h3>
                    <p className="text-white/40 leading-relaxed font-normal text-base">{desc}</p>
                </div>
                <div className="w-36 h-36 flex items-center justify-center relative flex-shrink-0">
                    <div className="absolute inset-0 bg-white/[0.02] rounded-2xl group-hover:bg-white/[0.05] transition-colors" />
                    <div className="relative z-10 w-full h-full flex items-center justify-center scale-90">
                        {visual}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CircleOfInfluenceVisual() {
    return (
        <div className="relative w-80 h-80 mx-auto opacity-20">
            {/* Sphere Wireframe - Enhanced */}
            <div className="absolute inset-x-0 inset-y-0 rounded-full border border-white/[0.05] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
                <div className="w-[80%] h-[80%] rounded-full border border-white/[0.02] animate-[pulse_4s_infinite]" />
                
                {/* Wireframe grids */}
                <div className="absolute inset-0 opacity-10">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="absolute inset-0 border-x border-white/20 rounded-[50%]" style={{ transform: `rotateY(${i * 18}deg)` }} />
                    ))}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute inset-0 border-y border-white/20 rounded-[50%]" style={{ transform: `rotateX(${i * 30}deg)` }} />
                    ))}
                </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6 rounded-full translate-y-4">
                    <div className="text-[6px] font-bold uppercase tracking-[0.4em] text-white/10 mb-2">visualization of the</div>
                    <div className="text-[10px] font-medium text-white/40 mb-1 leading-none">invisible and tangible</div>
                    <div className="text-[12px] font-bold uppercase tracking-tight text-indigo-400/50">"Circle of Influence"</div>
                </div>
            </div>

            {/* Orbitals with high-end glow */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
            >
                <div className="absolute top-0 left-1/2 -track-x-1/2 -translate-y-1/2">
                    <div className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full" />
                </div>
                <div className="absolute bottom-1/4 right-0 flex flex-col items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-400/50 rounded-full" />
                </div>
            </motion.div>
        </div>
    );
}

function ClockOrnament() {
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full text-white stroke-current fill-none">
            {/* Outer Ring */}
            <circle cx="50" cy="50" r="48" strokeWidth="0.5" opacity="0.5" />
            <circle cx="50" cy="50" r="45" strokeWidth="0.1" opacity="0.2" />
            
            {/* Hour Markers */}
            {[...Array(12)].map((_, i) => (
                <line
                    key={i}
                    x1="50" y1="5" x2="50" y2="12"
                    transform={`rotate(${i * 30} 50 50)`}
                    strokeWidth="0.8"
                />
            ))}
            
            {/* Minute Ticks */}
            {[...Array(60)].map((_, i) => (
                i % 5 !== 0 && (
                    <line
                        key={i}
                        x1="50" y1="5" x2="50" y2="8"
                        transform={`rotate(${i * 6} 50 50)`}
                        strokeWidth="0.2"
                        opacity="0.5"
                    />
                )
            ))}

            {/* Central Hub */}
            <circle cx="50" cy="50" r="1.5" fill="currentColor" />
            
            {/* Hands */}
            <motion.line 
                x1="50" y1="50" x2="50" y2="25" 
                strokeWidth="1" 
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                style={{ originX: "50px", originY: "50px" }}
            />
            <motion.line 
                x1="50" y1="50" x2="75" y2="50" 
                strokeWidth="0.5" 
                animate={{ rotate: 360 }}
                transition={{ duration: 3600, repeat: Infinity, ease: "linear" }}
                style={{ originX: "50px", originY: "50px" }}
            />
        </svg>
    );
}

function CompassOrnament() {
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full text-white stroke-current fill-none">
            {/* Outer Dials */}
            <circle cx="50" cy="50" r="48" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="42" strokeWidth="0.2" strokeDasharray="2 2" />
            
            {/* Degree Markers */}
            {[...Array(36)].map((_, i) => (
                <line
                    key={i}
                    x1="50" y1="2" x2="50" y2="6"
                    transform={`rotate(${i * 10} 50 50)`}
                    strokeWidth={i % 9 === 0 ? "1" : "0.3"}
                />
            ))}

            {/* Cardinal Points */}
            <text x="50" y="15" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor" stroke="none">N</text>
            <text x="85" y="53" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor" stroke="none">E</text>
            <text x="50" y="92" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor" stroke="none">S</text>
            <text x="15" y="53" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor" stroke="none">W</text>

            {/* Compass Needle */}
            <motion.path 
                d="M50 20 L58 50 L50 80 L42 50 Z" 
                fill="currentColor" 
                opacity="0.3"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ originX: "50px", originY: "50px" }}
            />
            
            {/* Crosshair */}
            <path d="M50 0 L50 100 M0 50 L100 50" strokeWidth="0.1" opacity="0.3" />
        </svg>
    );
}

function CompoundVisual() {
    return (
        <div className="relative w-full h-full p-6 flex flex-col justify-end">
            {/* Fibonacci Spiral Overlay */}
            <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full opacity-10 stroke-indigo-400 fill-none">
                <path d="M100 100 C 100 0, 0 0, 0 100" />
                <path d="M0 100 C 0 50, 50 50, 50 100" />
            </svg>
            <div className="flex items-end gap-1.5 h-16">
                {[2, 3, 5, 8, 13, 21, 34].map((h, i) => (
                    <div 
                        key={i} 
                        className="flex-1 bg-white/10 rounded-sm group-hover:bg-indigo-500/40 transition-all duration-500" 
                        style={{ height: `${h}%` }} 
                    />
                ))}
            </div>
            <div className="mt-2 flex justify-between text-[8px] font-bold text-white/20">
                <span>DAILY</span>
                <span>EFFORT</span>
                <span className="text-white/40">TIME</span>
            </div>
        </div>
    );
}

function ClarityVisual() {
    return (
        <div className="w-28 h-20 p-2 relative overflow-hidden group">
            <div className="absolute inset-0 border border-white/10 rounded-lg bg-white/[0.02]" />
            <div className="h-full w-full flex flex-col gap-2 relative">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity }} className="h-full w-1/3 bg-indigo-500" />
                </div>
                <div className="flex gap-1 h-full">
                    <div className="w-1/4 h-full bg-white/5 rounded-md" />
                    <div className="w-3/4 h-full bg-white/[0.03] rounded-md border border-white/5 p-2 flex flex-col gap-1">
                        <div className="h-1 w-full bg-white/10 rounded" />
                        <div className="h-1 w-2/3 bg-white/10 rounded" />
                        <div className="h-1 w-1/2 bg-white/10 rounded" />
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-indigo-500/5 to-transparent animate-[shimmer_3s_infinite]" />
        </div>
    );
}

function DataVisual() {
    return (
        <div className="w-24 h-24 relative flex items-center justify-center">
            {/* 3D Cube Perspective */}
            <div className="absolute inset-4 border border-white/20 rounded-xl transform rotate-3 scale-x-110" />
            <div className="absolute inset-4 border border-indigo-500/30 rounded-xl transform -rotate-3 bg-indigo-950/20 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border border-indigo-400 flex items-center justify-center relative">
                   <div className="absolute inset-0 border border-white/40 rounded-full animate-ping opacity-20" />
                   <Target size={16} className="text-white animate-pulse" />
                </div>
                <div className="text-[6px] font-black text-white/40 uppercase tracking-[0.2em]">Data Blocks Secured</div>
                <div className="text-[8px] font-bold text-white tracking-widest leading-none">1,234,567</div>
            </div>
        </div>
    );
}

function FlowVisual() {
    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <svg viewBox="0 0 100 40" className="w-full h-12 overflow-visible">
                <defs>
                    <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                </defs>
                <motion.path
                    d="M0 20 C 20 20, 30 5, 50 20 S 80 35, 100 20"
                    fill="none"
                    stroke="url(#flowGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <circle cx="100" cy="20" r="4" fill="#fbbf24" className="animate-pulse" />
            </svg>
        </div>
    );
}
