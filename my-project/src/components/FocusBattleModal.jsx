import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer, Trophy, X, Shield, Swords, Flame, Target } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function FocusBattleModal({ open, onClose, opponent }) {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [battleStarted, setBattleStarted] = useState(false);
    const [userProgress, setUserProgress] = useState(0);
    const [opponentProgress, setOpponentProgress] = useState(0);

    useEffect(() => {
        let timer;
        if (battleStarted && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
                // Simulate opponent progress randomly for demo
                if (Math.random() > 0.98) setOpponentProgress(p => Math.min(100, p + 5));
            }, 1000);
        } else if (timeLeft === 0) {
            setBattleStarted(false);
            toast.success("Battle Over! Checking results...");
        }
        return () => clearInterval(timer);
    }, [battleStarted, timeLeft]);

    const handleStart = () => {
        setBattleStarted(true);
        toast.info("Battle Protocol Engaged! Focus now.");
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!opponent) return null;

    return (
        <Modal open={open} onClose={onClose} title="Focus Battle Arena" maxWidth="max-w-2xl">
            <div className="space-y-8 py-4">
                {/* Arena Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-4 animate-pulse">
                        <Swords size={18} />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Direct Confrontation</span>
                    </div>
                </div>

                {/* Versus display */}
                <div className="flex items-center justify-between gap-8">
                    {/* User */}
                    <div className="flex-1 flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar src={user.avatar} name={user.name} size="xl" />
                            <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-500 text-white shadow-xl">
                                <Shield size={16} />
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="font-black text-white">{user.name}</h4>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">You</p>
                        </div>
                    </div>

                    {/* Timer / Middle */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                             <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin opacity-20" />
                             <div className="text-2xl font-black text-white tabular-nums">
                                {formatTime(timeLeft)}
                             </div>
                        </div>
                    </div>

                    {/* Opponent */}
                    <div className="flex-1 flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar src={opponent.avatar} name={opponent.name} size="xl" />
                            <div className="absolute -bottom-2 -left-2 p-2 rounded-xl bg-rose-500 text-white shadow-xl">
                                <Flame size={16} />
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="font-black text-white">{opponent.name}</h4>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Target</p>
                        </div>
                    </div>
                </div>

                {/* Power Meters */}
                <div className="space-y-6 px-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase text-muted tracking-widest">
                            <span>Your Intensity</span>
                            <span>{userProgress}%</span>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${userProgress}%` }}
                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase text-muted tracking-widest">
                            <span>{opponent.name}'s Output</span>
                            <span>{opponentProgress}%</span>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${opponentProgress}%` }}
                                className="h-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex flex-col items-center gap-4">
                    {!battleStarted ? (
                        <Button 
                            className="w-full h-16 text-xl bg-rose-500 hover:bg-rose-400 shadow-xl shadow-rose-500/20"
                            icon={Zap}
                            onClick={handleStart}
                        >
                            IGNITE BATTLE
                        </Button>
                    ) : (
                        <div className="text-center group">
                            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-4 group-hover:text-indigo-400 transition-colors">Complete tasks to gain intensity!</p>
                            <Button variant="ghost" onClick={() => setUserProgress(p => Math.min(100, p + 10))} icon={Target}>
                                Simulate Breakthrough (+10%)
                            </Button>
                        </div>
                    )}
                    <p className="text-[10px] text-muted uppercase font-black tracking-widest">Stake: 100 Synergy Points</p>
                </div>
            </div>
        </Modal>
    );
}
