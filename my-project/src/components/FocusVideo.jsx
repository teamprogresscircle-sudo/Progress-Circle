import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [APEX ELITE V2.3] - Neural Immersion Engine
 * YouTube background — iframe mounts after paint to keep INP low (embed is heavy).
 */
export function FocusVideo({ videoId, active, opacity = 0.4 }) {
    const [iframeReady, setIframeReady] = useState(false);

    useEffect(() => {
        if (!active || !videoId) {
            setIframeReady(false);
            return;
        }
        setIframeReady(false);
        let cancelled = false;
        const t = window.setTimeout(() => {
            if (!cancelled) setIframeReady(true);
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [active, videoId]);

    if (!videoId) return null;

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
                    <div className="absolute inset-0 scale-[1.15]">
                        {iframeReady && (
                            <iframe
                                src={embedUrl}
                                className="w-full h-full pointer-events-none"
                                allow="autoplay; encrypted-media"
                                title="Neural Environment"
                                frameBorder="0"
                                loading="lazy"
                            />
                        )}
                    </div>

                    <div
                        className="absolute inset-0 bg-[#050510] transition-opacity duration-1000"
                        style={{ opacity: 1 - opacity }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]/40" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
