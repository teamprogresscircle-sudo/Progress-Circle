import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const TimerDisplay = ({
    isActive,
    startTime,
    duration,
    isPaused,
    isHost,
    onControl,
    onComplete,
    onAbort,
    onOpenConfig
}) => {
    const getInitialTime = () => {
        if (!isActive || !startTime) return 0;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + (duration * 60000));
        return Math.max(0, Math.floor((end - new Date()) / 1000));
    };

    const [localTime, setLocalTime] = useState(getInitialTime);

    const calculateTimeLeft = useCallback(() => {
        if (!isActive || !startTime) return 0;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + (duration * 60000));
        return Math.max(0, Math.floor((end - new Date()) / 1000));
    }, [isActive, startTime, duration]);

    useEffect(() => {
        setLocalTime(calculateTimeLeft());
    }, [isActive, startTime, duration, calculateTimeLeft]);

    const timeDisplay = React.useMemo(() => {
        const h = Math.floor(localTime / 3600);
        const m = Math.floor((localTime % 3600) / 60);
        const s = localTime % 60;
        return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`;
    }, [localTime]);

    useEffect(() => {
        if (!isActive || isPaused || localTime <= 0) return;
        const interval = setInterval(() => {
            setLocalTime(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive, isPaused, localTime]);

    const prevLocalTimeRef = useRef(null);
    const autoCompleteFiredRef = useRef(false);
    const sessionKeyRef = useRef('');

    useEffect(() => {
        if (!isActive) {
            autoCompleteFiredRef.current = false;
            prevLocalTimeRef.current = null;
            sessionKeyRef.current = '';
            return;
        }
        if (!startTime) return;
        const key = `${String(startTime)}-${duration}`;
        if (sessionKeyRef.current !== key) {
            sessionKeyRef.current = key;
            autoCompleteFiredRef.current = false;
            prevLocalTimeRef.current = null;
        }
    }, [isActive, startTime, duration]);

    useEffect(() => {
        if (!isHost || !isActive || isPaused || !onComplete) return;
        if (localTime !== 0) {
            prevLocalTimeRef.current = localTime;
            return;
        }
        if (autoCompleteFiredRef.current) return;

        const start = new Date(startTime);
        const endMs = start.getTime() + duration * 60000;
        const overdue = Date.now() >= endMs;
        const prev = prevLocalTimeRef.current;
        const fromCountdown = prev !== null && prev > 0;

        if (!fromCountdown && !overdue) {
            return;
        }

        autoCompleteFiredRef.current = true;
        prevLocalTimeRef.current = 0;
        void Promise.resolve(onComplete?.()).catch(() => {
            autoCompleteFiredRef.current = false;
        });
    }, [localTime, isHost, isActive, isPaused, startTime, duration, onComplete]);

    const statusLabel = !isActive
        ? 'Ready to start'
        : isPaused
            ? 'Paused'
            : localTime === 0 && isActive
                ? "Time's up"
                : 'Session active';

    return (
        <div className="text-center space-y-6 md:space-y-10 relative w-full max-w-2xl mx-auto px-2">
            <div className="relative mx-auto flex items-center justify-center">
                <div className="relative z-10 flex flex-col items-center">
                    <span
                        className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-[var(--text)] tabular-nums font-outfit tracking-tight leading-none transition-opacity duration-300 ${
                            isPaused ? 'opacity-35' : ''
                        }`}
                    >
                        {timeDisplay}
                    </span>

                    <div className="flex items-center gap-2.5 mt-5 md:mt-6 px-5 py-2 rounded-full bg-[var(--surface2)]/90 border border-[var(--border)]/15 font-inter shadow-sm">
                        <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                                isActive && !isPaused ? 'bg-[var(--primary)]' : 'bg-[var(--text)]/25'
                            }`}
                            aria-hidden
                        />
                        <span className="text-[11px] font-semibold text-[var(--text)]/55 uppercase tracking-[0.2em]">
                            {statusLabel}
                        </span>
                    </div>
                </div>
            </div>

            {isHost && (
                <div className="flex items-center justify-center pt-4 md:pt-8">
                    {!isActive ? (
                        <button
                            type="button"
                            onClick={onOpenConfig}
                            className="relative w-full max-w-sm min-h-[4.5rem] rounded-2xl bg-[var(--surface)] border border-[var(--border)]/20 overflow-hidden shadow-sm font-outfit transition-colors hover:bg-[var(--surface2)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                        >
                            <div className="absolute inset-0 flex items-center justify-center gap-3 px-4">
                                <div className="w-2 h-2 bg-[var(--primary)] rounded-full" />
                                <span className="text-sm font-bold text-[var(--text)] uppercase tracking-[0.15em]">
                                    Start focus session
                                </span>
                            </div>
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-3 w-full max-w-md">
                            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-2xl bg-[var(--surface)]/95 border border-[var(--border)]/15 shadow-sm font-inter w-full">
                                <button
                                    type="button"
                                    onClick={() => onControl(isPaused ? 'resume' : 'pause')}
                                    className="w-14 h-14 flex items-center justify-center bg-[var(--surface2)] text-[var(--text)] rounded-xl border border-[var(--border)]/15 transition-colors hover:bg-[var(--text)]/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                                    aria-label={isPaused ? 'Resume' : 'Pause'}
                                >
                                    {isPaused ? <Play size={26} fill="currentColor" className="ml-0.5" /> : <Pause size={26} />}
                                </button>

                                <div className="hidden sm:block h-10 w-px bg-[var(--border)]/15" aria-hidden />

                                <button
                                    type="button"
                                    onClick={onAbort}
                                    className="px-4 py-3.5 text-[var(--text)]/45 hover:text-red-500/90 font-bold text-[11px] uppercase tracking-[0.1em] transition-colors rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500/50"
                                >
                                    Abort
                                </button>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-[var(--text)]/45 text-center leading-relaxed max-w-lg mx-auto px-2 font-inter">
                                Rewards finalize automatically when the timer hits <span className="text-[var(--text)]/65 font-medium">0:00</span>.
                                Check <span className="text-[var(--text)]/65 font-medium">Room scores</span> for session tasks by person. Use <span className="text-[var(--text)]/55">Abort</span> only to stop without the completion bonus.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(TimerDisplay);
