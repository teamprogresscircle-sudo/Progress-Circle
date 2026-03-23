import { motion } from 'framer-motion';
import { Cpu, Hammer, Timer, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Maintenance() {
    const { logout, isAuthenticated } = useAuth();
    
    return (
        <div className="h-screen bg-[#050505] flex flex-col items-center justify-start overflow-y-auto p-6 md:p-12 relative z-50">
            {/* Cyber Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-2xl w-full relative z-10 text-center space-y-10 py-10 md:py-20"
            >
                {/* Animated Logo/Icon Area */}
                <div className="flex justify-center">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="w-32 h-32 rounded-full border-2 border-dashed border-indigo-500/30 flex items-center justify-center"
                        >
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-20 h-20 rounded-full border-2 border-indigo-500/50 flex items-center justify-center bg-indigo-500/5 backdrop-blur-xl"
                            >
                                <Cpu className="text-indigo-500" size={40} />
                            </motion.div>
                        </motion.div>
                        
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-2 -right-2 bg-amber-500 text-black p-2 rounded-xl shadow-lg shadow-amber-500/20"
                        >
                            <Hammer size={20} />
                        </motion.div>
                    </div>
                </div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"
                    >
                        <ShieldAlert size={14} className="text-amber-500" />
                        Core Protocol: Biological Sync Suspended
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">
                        Neural <span className="pc-gradient-text">Upgrade</span><br />
                        In Progress
                    </h1>

                    <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-lg mx-auto">
                        The Progress Circle biosphere is currently undergoing a scheduled core optimization. 
                        Your neural growth data is safe and synchronized.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: Timer, label: "Estimated Return", value: "30-60 Min" },
                        { icon: Hammer, label: "Optimization", value: "Level 4" },
                        { icon: Cpu, label: "Status", value: "Offline" }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.1 }}
                            className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 text-center space-y-2 backdrop-blur-sm"
                        >
                            <item.icon className="mx-auto text-indigo-400 opacity-50" size={20} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</p>
                            <p className="text-sm font-bold text-white">{item.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Static Button Container (No motion to avoid visibility bugs) */}
                <div className="pt-12 pb-12 space-y-8">
                    <p className="text-[10px] font-mono text-indigo-500/50 uppercase tracking-widest">
                        SYSTEM_ERROR_503 // MAINTENANCE_ACTIVE
                    </p>
                    
                    <div className="flex flex-col items-center gap-4">
                        {!isAuthenticated ? (
                            <a 
                                href="/login" 
                                className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                Authorize & Sync
                            </a>
                        ) : (
                            <button 
                                onClick={logout}
                                className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
                            >
                                <LogOut size={16} />
                                Terminate Session
                            </button>
                        )}
                        
                        <p className="text-zinc-600 text-[10px] font-medium italic">
                            Biometric verification required for neural access
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
