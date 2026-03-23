import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const THEMES = {
    regular: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'],
    synergy: ['#06b6d4', '#3b82f6', '#8b5cf6', '#c084fc', '#22d3ee'], // Blue/Violet (Collaborative)
    income: ['#10b981', '#059669', '#34d399', '#facc15', '#fbbf24'], // Green/Gold (Wealth)
    expense: ['#ef4444', '#f87171', '#dc2626', '#b91c1c', '#7f1d1d'], // Red (Burn/Warning)
    investment: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'], // Deep Blue (Growth)
    wellness: ['#f43f5e', '#fb7185', '#fb923c', '#f59e0b', '#fde047'], // Rose/Amber (Energy)
    nutrition: ['#2dd4bf', '#a3e635', '#4ade80', '#0ea5e9', '#6ee7b7']  // Teal/Lime (Fuel)
};

/**
 * Advanced Confetti Component - Differentiated feedback for each module.
 * 
 * @param {boolean} active - Triggers the animation
 * @param {string} theme - 'regular' | 'synergy' | 'income' | 'expense' | 'investment' | 'wellness' | 'nutrition'
 * @param {string} variant - 'burst' | 'rain' | 'spiral' | 'fountain' | 'pulse'
 */
export function Confetti({ active, theme = 'regular', variant = 'burst', onComplete }) {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (active) {
            const count = (variant === 'rain' || variant === 'spiral') ? 60 : 40;
            const colors = THEMES[theme] || THEMES.regular;
            
            const newParticles = Array.from({ length: count }).map((_, idx) => {
                const id = Math.random().toString(36).substr(2, 9);
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 8 + 4;
                const delay = Math.random() * 0.5;
                const duration = Math.random() * 2 + 1.5;
                
                // Physics based on variant
                let initial = {};
                let animate = {};
                
                switch(variant) {
                    case 'rain': // Falling from top (Income)
                        initial = { y: '-10vh', x: `${Math.random() * 100}vw`, opacity: 1, rotate: 0 };
                        animate = { y: '110vh', rotate: 720, opacity: [1, 1, 0] };
                        break;
                    case 'spiral': // Spinning up and fading (Expense/Burn)
                        initial = { y: '100vh', x: '50vw', opacity: 1, scale: 1, rotate: 0 };
                        animate = { 
                            y: '-20vh', 
                            x: [`${50 + Math.random() * 20 - 10}vw`, `${50 + Math.random() * 40 - 20}vw`, `${50 + Math.random() * 60 - 30}vw`],
                            rotate: 1080, 
                            scale: 0.2,
                            opacity: [1, 0.8, 0] 
                        };
                        break;
                    case 'fountain': // Spraying from bottom center (Investment/Growth)
                        const angle = (Math.random() * 60 + 60) * (Math.PI / 180); // 60 to 120 degrees
                        const velocity = Math.random() * 100 + 50;
                        initial = { y: '105vh', x: '50vw', opacity: 1, scale: 0 };
                        animate = { 
                            y: ['105vh', '20vh', '110vh'],
                            x: ['50vw', `${50 + Math.cos(angle) * velocity}vw`, `${50 + Math.cos(angle) * (velocity * 2)}vw`],
                            scale: [0, 1.2, 0.5],
                            opacity: [1, 1, 0]
                        };
                        break;
                    case 'pulse': // Expanding from center (Wellness)
                        const pAngle = Math.random() * Math.PI * 2;
                        const pDist = Math.random() * 40 + 20;
                        initial = { y: '50vh', x: '50vw', opacity: 1, scale: 0 };
                        animate = { 
                            y: `${50 + Math.sin(pAngle) * pDist}vh`,
                            x: `${50 + Math.cos(pAngle) * pDist}vw`,
                            scale: [0, 1.5, 0.5],
                            opacity: [1, 0]
                        };
                        break;
                    default: // Mid-screen explosion (Synergy/Regular)
                        initial = { y: '50vh', x: '50vw', opacity: 1, scale: 0 };
                        animate = { 
                            y: [`50vh`, `${Math.random() * 100}vh`],
                            x: [`50vw`, `${Math.random() * 100}vw`],
                            scale: [0, 1, 0.5],
                            opacity: [1, 0.8, 0],
                            rotate: 360
                        };
                }

                return { id, initial, animate, duration, delay, color, size, shape: Math.floor(Math.random() * 3) };
            });
            
            setParticles(newParticles);

            const timer = setTimeout(() => {
                setParticles([]);
                if (onComplete) onComplete();
            }, 4000);
            
            return () => clearTimeout(timer);
        }
    }, [active, theme, variant, onComplete]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={p.initial}
                        animate={p.animate}
                        transition={{
                            duration: p.duration,
                            delay: p.delay,
                            ease: "easeOut"
                        }}
                        style={{
                            position: 'absolute',
                            width: p.size,
                            height: p.shape === 2 ? p.size * 0.4 : p.size,
                            backgroundColor: p.color,
                            borderRadius: p.shape === 0 ? '50%' : '2px',
                            boxShadow: `0 0 15px ${p.color}50`,
                            mixBlendMode: 'screen'
                        }}
                    >
                        {p.shape === 0 && theme === 'income' && <div className="w-full h-full flex items-center justify-center text-[6px] font-black text-white/50">$</div>}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
