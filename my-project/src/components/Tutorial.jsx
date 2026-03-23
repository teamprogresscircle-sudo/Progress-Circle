import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Joyride, { STATUS } from 'react-joyride';
import { Sparkles, X, Target } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export function Tutorial() {
    const { user } = useAuth();
    const location = useLocation();
    const [runTour, setRunTour] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    const steps = location.pathname === '/' ? [...globalSteps, ...homeSteps] : globalSteps;

    return (
        <>
            <AnimatePresence>
                {showPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, type: 'spring', damping: 25 }}
                            className="bg-[#1e1e2e] border border-white/10 rounded-3xl p-8 shadow-2xl w-full max-w-md relative overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-glow">
                                    <Sparkles className="text-indigo-400 w-8 h-8 animate-pulse" />
                                </div>

                                <h2 className="text-2xl font-black mb-3 text-white page-title" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    System Initialized
                                </h2>
                                <p className="text-sm font-medium text-gray-400 mb-8 max-w-[280px]">
                                    Would you like a quick professional tour of your new dashboard features?
                                </p>

                                <div className="flex flex-col sm:flex-row w-full gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={handleDecline}
                                        className="flex-1 h-12 border border-white/10 font-bold uppercase tracking-wider text-xs hover:bg-white/5 bg-transparent"
                                    >
                                        Skip Tour
                                    </Button>
                                    <Button
                                        onClick={handleAccept}
                                        className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-wider text-xs shadow-lg shadow-indigo-500/20 text-white border-none"
                                    >
                                        <Target size={16} className="mr-2" /> Start Tour
                                    </Button>
                                </div>
                            </div>

                            <button onClick={handleDecline} className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Joyride
                steps={steps}
                run={runTour}
                continuous
                showSkipButton
                showProgress
                hideCloseButton
                callback={handleJoyrideCallback}
                floaterProps={{
                    disableAnimation: true,
                }}
                styles={{
                    options: {
                        arrowColor: '#2a2a3e',
                        backgroundColor: '#2a2a3e',
                        primaryColor: '#6366f1',
                        textColor: '#ffffff',
                        overlayColor: 'rgba(0, 0, 0, 0.75)',
                        zIndex: 1000,
                    },
                    tooltipContainer: {
                        textAlign: 'left',
                        fontFamily: 'Inter, sans-serif',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        overflow: 'hidden',
                        padding: '8px'
                    },
                    buttonNext: {
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontWeight: '900',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)',
                    },
                    buttonBack: {
                        color: '#9ca3af',
                        marginRight: '12px',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    },
                    buttonSkip: {
                        color: '#9ca3af',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    },
                }}
            />
        </>
    );
}
