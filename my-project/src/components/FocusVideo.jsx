import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [APEX ELITE V2.3] - Neural Immersion Engine
 * Lightweight YouTube background loop system.
 * Offloads all video bandwidth to Google servers.
 */
export function FocusVideo({ videoId, active, opacity = 0.4 }) {
    if (!videoId) return null;

    // Constructing the optimized YouTube embed URL
    // autoplay=1: start immediately
    // mute=0: We want the ambient sounds/ASMR. Browsers allow this since the video is initiated via user click.
    // loop=1 + playlist: required for seamless looping
    // controls=1: allows volume adjustment
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}&controls=1&showinfo=0&rel=0&modestbranding=1&disablekb=1&enablejsapi=1`;

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="fixed inset-0 -z-20 overflow-hidden pointer-events-none"
                >
                    {/* The Video Layer */}
                    <div className="absolute inset-0 scale-[1.15]">
                        <iframe
                            src={embedUrl}
                            className="w-full h-full pointer-events-none"
                            allow="autoplay; encrypted-media"
                            title="Neural Environment"
                            frameBorder="0"
                        />
                    </div>

                    {/* The "Neural Veil" - Readability & Aesthetic Overlay */}
                    <div 
                        className="absolute inset-0 bg-[#050510] transition-opacity duration-1000"
                        style={{ opacity: 1 - opacity }}
                    />
                    
                    {/* Radial Vignette for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]/40" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
