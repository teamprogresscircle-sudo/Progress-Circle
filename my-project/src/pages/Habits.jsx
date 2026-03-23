import { useState, useMemo, memo, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Repeat, Trash2, CheckCircle2, Circle, Calendar, Clock, Sparkles, MoreHorizontal, Tag } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Confetti } from '../components/Confetti';
import { toast } from 'sonner';

const themeColorScheme = {
    accent: 'var(--primary)',
    bg: 'rgba(var(--primary-rgb), 0.12)',
    ring: 'rgba(var(--primary-rgb), 0.25)',
    label: 'theme'
};

/* ─── Extract first emoji from string ────────────────────────── */
const extractEmoji = (text) => {
    if (!text) return null;
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const match = text.match(emojiRegex);
    return match ? match[0] : null;
};

/* ─── Calculate longest consecutive streak from completedDates ─ */
function calcStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    // Sort dates ascending
    const sorted = [...completedDates].sort();
    let maxStreak = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffMs = curr.getTime() - prev.getTime();
        const diffDays = Math.round(diffMs / 86400000);
        if (diffDays === 1) {
            current++;
            if (current > maxStreak) maxStreak = current;
        } else if (diffDays > 1) {
            current = 1;
        }
        // diffDays === 0 means duplicate, skip
    }
    return maxStreak;
}

/* ─── SVG Progress Circle ───────────────────────────────────── */
function ProgressCircle({ percent, color, size = 72, strokeWidth = 5 }) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
            />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <text
                x={size / 2} y={size / 2}
                textAnchor="middle" dominantBaseline="central"
                fill={color}
                fontSize={size * 0.19}
                fontWeight="800"
                style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
            >
                {Math.round(percent)}%
            </text>
        </svg>
    );
}

/* ─── Mini calendar grid (bigger, fills the space) ───────────── */
function MiniCalendarGrid({ completedDates, color }) {
    const [viewDate, setViewDate] = useState(new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0-6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Offset for Monday-start (Mon=0, Tue=1, ... Sun=6)
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const changeMonth = (delta) => {
        const next = new Date(viewDate);
        next.setMonth(viewDate.getMonth() + delta);
        setViewDate(next);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button 
                    onClick={() => changeMonth(-1)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 4 }}
                >
                    <Repeat size={10} style={{ transform: 'rotate(180deg)', opacity: 0.6 }} />
                </button>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 70, textAlign: 'center' }}>
                    {viewDate.toLocaleDateString('en-US', { month: 'long' })}
                </span>
                <button 
                    onClick={() => changeMonth(1)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 4 }}
                >
                    <Repeat size={10} style={{ opacity: 0.6 }} />
                </button>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '5px',
                maxWidth: 160,
            }}>
                {Array.from({ length: 42 }).map((_, i) => {
                    const dayNum = i - offset + 1;
                    const isValid = dayNum > 0 && dayNum <= daysInMonth;
                    const dateStr = isValid ? new Date(year, month, dayNum).toISOString().split('T')[0] : null;
                    const done = isValid && completedDates?.includes(dateStr);
                    
                    return (
                        <div
                            key={i}
                            title={dateStr || ''}
                            style={{
                                width: 14, height: 14,
                                borderRadius: 4,
                                background: isValid ? (done ? color : 'rgba(255,255,255,0.06)') : 'transparent',
                                transition: 'background 0.2s',
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Yearly Activity Heatmap (Jan 1 - Dec 31) ───────────────── */
const YearlyHeatmap = memo(function YearlyHeatmap({ habits }) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const firstMon = useMemo(() => {
        const startOfYear = new Date(selectedYear, 0, 1);
        // Find the Monday of the week starting the year
        let firstDay = startOfYear.getDay(); // 0=Sun, 1=Mon...
        let diffToMon = firstDay === 0 ? -6 : 1 - firstDay;
        const fm = new Date(startOfYear);
        fm.setDate(startOfYear.getDate() + diffToMon);
        return fm;
    }, [selectedYear]);

    const heatmapData = useMemo(() => {
        const grid = [];
        for (let row = 0; row < 7; row++) {
            const rowData = [];
            for (let col = 0; col < 53; col++) {
                const d = new Date(firstMon);
                d.setDate(firstMon.getDate() + (col * 7) + row);
                const dateStr = d.toISOString().split('T')[0];
                const dYear = d.getFullYear();

                if (dYear !== selectedYear) {
                    rowData.push({ date: dateStr, intensity: -1 });
                } else {
                    let total = habits.length || 1;
                    let done = 0;
                    habits.forEach(h => {
                        if (h.completedDates?.includes(dateStr)) done++;
                    });
                    const ratio = total > 0 ? done / total : 0;
                    rowData.push({ date: dateStr, intensity: ratio, done, total });
                }
            }
            grid.push(rowData);
        }
        return grid;
    }, [habits, selectedYear, firstMon]);

    const totalTracked = useMemo(() => {
        let count = 0;
        habits.forEach(h => {
            h.completedDates?.forEach(d => {
                if (d.startsWith(selectedYear.toString())) count++;
            });
        });
        return count;
    }, [habits, selectedYear]);

    const getColor = (intensity) => {
        if (intensity < 0) return 'rgba(255, 255, 255, 0.01)';
        if (intensity === 0) return 'rgba(255, 255, 255, 0.04)';
        if (intensity <= 0.25) return 'rgba(var(--primary-rgb), 0.25)';
        if (intensity <= 0.5) return 'rgba(var(--primary-rgb), 0.5)';
        if (intensity <= 0.75) return 'rgba(var(--primary-rgb), 0.75)';
        return 'var(--primary)'; // vibrant theme primary
    };

    const CELL = 12;
    const GAP = 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '24px',
                position: 'relative',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 24, flexWrap: 'wrap', gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'rgba(var(--primary-rgb),0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb),0.2)',
                    }}>
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text)', letterSpacing: '0.1em', margin: 0 }}>
                            Consistency Matrix
                        </h2>
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                            Reflecting {selectedYear} Habit Evolution
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '4px 10px',
                        border: '1px solid var(--border)',
                    }}>
                        <button 
                            onClick={() => setSelectedYear(y => y - 1)}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
                        >
                            <Repeat size={12} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 44, textAlign: 'center', color: 'var(--text)' }}>
                            {selectedYear}
                        </span>
                        <button 
                            onClick={() => setSelectedYear(y => y + 1)}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
                        >
                            <Repeat size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Container */}
            <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: 12 }}>
                <div style={{ display: 'flex', gap: 0, minWidth: 'min-content' }}>
                    {/* Day labels */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: GAP,
                        marginRight: 10, flexShrink: 0, marginTop: 24,
                    }}>
                        {dayLabels.map((label, i) => (
                            <div key={label} style={{
                                height: CELL, display: 'flex', alignItems: 'center',
                                fontSize: 9, color: i % 2 === 0 ? 'var(--muted)' : 'transparent', 
                                fontWeight: 700, width: 28,
                            }}>
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap cells */}
                    <div style={{ display: 'flex', gap: GAP, paddingTop: 24 }}>
                        {Array.from({ length: 53 }).map((_, col) => {
                            const colDate = new Date(firstMon);
                            colDate.setDate(firstMon.getDate() + (col * 7));
                            
                            const prevDate = new Date(firstMon);
                            prevDate.setDate(firstMon.getDate() + ((col - 1) * 7));
                            
                            // Only show month label if it's a new month AND it belongs to the selected year
                            const isNewMonth = (col === 0 || colDate.getMonth() !== prevDate.getMonth()) && colDate.getFullYear() === selectedYear;
                             // Additionally, if it's the first week (col=0) but it's still December, we skip it
                            const labelShown = isNewMonth && colDate.getFullYear() === selectedYear;
                            const monthName = colDate.toLocaleDateString('en-US', { month: 'short' });

                            return (
                                <div key={col} style={{ 
                                    display: 'flex', flexDirection: 'column', gap: GAP,
                                    position: 'relative',
                                }}>
                                    {labelShown && (
                                        <span style={{
                                            position: 'absolute', top: -20, left: 0,
                                            fontSize: 9, fontWeight: 800, color: 'var(--text)',
                                            textTransform: 'uppercase', whiteSpace: 'nowrap',
                                            opacity: 0.7,
                                        }}>
                                            {monthName}
                                        </span>
                                    )}
                                    {heatmapData.map((row, rowIdx) => (
                                        <div
                                            key={rowIdx}
                                            title={`${row[col]?.date}: ${row[col]?.done || 0}/${row[col]?.total || 0}`}
                                            style={{
                                                width: CELL,
                                                height: CELL,
                                                borderRadius: 2,
                                                background: getColor(row[col]?.intensity ?? 0),
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'scale(1.2)';
                                                e.currentTarget.style.zIndex = '10';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.zIndex = '1';
                                            }}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Stats & Legend */}
            <div style={{ 
                marginTop: 12, display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                    {totalTracked} TOTAL SYNC ACTIONS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Less</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                        {[0, 0.1, 0.4, 0.7, 1].map((lvl, i) => (
                            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(lvl) }} />
                        ))}
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>More</span>
                </div>
            </div>
        </motion.div>
    );
});

/* ─── Habit Card ────────────────────────────────────────────── */
const HabitCard = memo(function HabitCard({ habit, colorScheme, icon, index, onToggle, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const today = new Date().toISOString().split('T')[0];
    const isDoneToday = habit.completedDates?.includes(today);

    // Progress: completedDates / (duration × frequency)
    const totalTarget = (habit.duration || 4) * (habit.frequency || 1);
    const completedCount = habit.completedDates?.length || 0;
    const percent = totalTarget > 0 ? Math.min(100, Math.round((completedCount / totalTarget) * 100)) : 0;

    // Streak: longest consecutive days from completedDates
    const streak = useMemo(() => calcStreak(habit.completedDates), [habit.completedDates]);
    const extractedEmoji = useMemo(() => extractEmoji(habit.name), [habit.name]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '20px',
                display: 'flex', flexDirection: 'column', gap: 12,
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = colorScheme.accent;
                e.currentTarget.style.boxShadow = `0 0 20px ${colorScheme.ring}`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Top row: icon + name + menu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: 16, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.02em',
                    }}>
                        {habit.name}
                    </span>
                </div>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--muted)', padding: 4,
                        }}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    position: 'absolute', right: 0, top: '100%',
                                    background: 'var(--surface2)', border: '1px solid var(--border)',
                                    borderRadius: 10, padding: 4, zIndex: 10,
                                    minWidth: 120, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                }}
                            >
                                <button
                                    onClick={() => { setMenuOpen(false); onDelete(habit.id); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        width: '100%', padding: '8px 12px', border: 'none',
                                        background: 'none', color: '#ef4444', cursor: 'pointer',
                                        borderRadius: 8, fontSize: 13, fontWeight: 600,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Description (Optional) */}
            {habit.description && (
                <p style={{
                    fontSize: 12, color: 'var(--muted)',
                    lineHeight: 1.4, marginTop: -4, marginBottom: 4,
                    fontWeight: 500, opacity: 0.8,
                    padding: '0 2px'
                }}>
                    {habit.description}
                </p>
            )}

            {/* Progress bar row */}
            <div>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 6,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                        {percent}% Complete
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                        {completedCount}/{totalTarget} days
                    </span>
                </div>
                <div style={{
                    height: 4, borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                            height: '100%', borderRadius: 4,
                            background: colorScheme.accent,
                        }}
                    />
                </div>
            </div>

            {/* Center: circle + mini calendar + streak */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, padding: '8px 0',
            }}>
                {/* Progress circle */}
                <div style={{ flexShrink: 0, position: 'relative' }}>
                    <ProgressCircle percent={percent} color={colorScheme.accent} size={76} strokeWidth={5} />
                    {isDoneToday && (
                        <div style={{
                            position: 'absolute', bottom: -2, right: -2,
                            background: '#22c55e', borderRadius: '50%',
                            width: 18, height: 18, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <CheckCircle2 size={12} color="#fff" />
                        </div>
                    )}
                </div>

                {/* Mini calendar — bigger grid */}
                <MiniCalendarGrid
                    completedDates={habit.completedDates}
                    color={colorScheme.accent}
                />

                {/* Streak number */}
                <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
                    <div style={{
                        fontSize: 38, fontWeight: 800,
                        fontFamily: 'Outfit, sans-serif',
                        color: 'var(--text)',
                        lineHeight: 1,
                    }}>
                        {streak}
                    </div>
                    <div style={{
                        fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--muted)', marginTop: 4,
                    }}>
                        Day Streak
                    </div>
                </div>
            </div>

            {/* Toggle button */}
            <button
                onClick={() => onToggle(habit)}
                style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 12,
                    border: isDoneToday ? `1px solid rgba(34,197,94,0.3)` : `1px solid ${colorScheme.accent}`,
                    background: isDoneToday ? 'rgba(34,197,94,0.1)' : colorScheme.bg,
                    color: isDoneToday ? '#22c55e' : colorScheme.accent,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
                {isDoneToday ? (
                    <><CheckCircle2 size={16} /> COMPLETED — TAP TO UNDO</>
                ) : (
                    <><Circle size={16} /> LOG TODAY</>
                )}
            </button>

            {/* Bottom bar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid var(--border)',
                paddingTop: 10,
                marginTop: 2,
            }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {extractedEmoji && (
                        <>
                            <span style={{ fontSize: 16 }}>{extractedEmoji}</span>
                            <span style={{ fontSize: 16 }}>{extractedEmoji}</span>
                        </>
                    )}
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontWeight: 700,
                    color: streak > 0 ? colorScheme.accent : 'var(--muted)',
                    letterSpacing: '0.05em',
                }}>
                    {streak} DAY STREAK
                    {streak > 0 && <span>🔥</span>}
                </div>
            </div>
        </motion.div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
/* ─── New Habit Modal (Isolated for Performance) ────────────── */
const HabitFormModal = memo(function HabitFormModal({ open, onClose, onSave, saving }) {
    const { categories } = useData();
    const [form, setForm] = useState({
        name: '', description: '', frequency: 1, duration: 4, categoryId: ''
    });

    useEffect(() => {
        if (!form.categoryId && categories?.length > 0) {
            setForm(prev => ({ ...prev, categoryId: categories[0].id }));
        }
    }, [categories, form.categoryId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ padding: '8px 4px' }}>
                <div className="text-center mb-8">
                    <h2 className="text-xl font-black pc-gradient-text tracking-tighter uppercase mb-0.5">
                        New Habit Loop
                    </h2>
                    <p className="text-pc-muted text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Initialize Neural Routine</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 opacity-70">1. Define Metric</label>
                            <div className="relative group">
                                <input
                                    className="pc-input text-xl font-black bg-surface2 border-border focus:border-indigo-500/50 transition-all duration-300"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g., DEEP WORK"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 opacity-70">2. Contextual Data</label>
                            <textarea
                                className="pc-input text-sm min-h-[70px] py-4 bg-surface2 border-border focus:border-indigo-500/50"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="What is the objective of this loop?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 opacity-70">Frequency</label>
                                <div className="relative">
                                    <select
                                        className="pc-input text-sm appearance-none bg-surface2 border-border h-12"
                                        value={form.frequency}
                                        onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value) })}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}x per week</option>)}
                                    </select>
                                    <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted" size={14} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 opacity-70">Duration</label>
                                <div className="relative">
                                    <select
                                        className="pc-input text-sm appearance-none bg-surface2 border-border h-12"
                                        value={form.duration}
                                        onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                                    >
                                        {[1, 2, 4, 8, 12].map(n => <option key={n} value={n}>{n} Weeks</option>)}
                                    </select>
                                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted" size={14} />
                                </div>
                            </div>
                        </div>
                        
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full h-12 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: 'var(--primary)', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.25)' }}
                    >
                        {saving ? (
                            <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> INITIALIZING...</>
                        ) : (
                            <><Plus size={20} /> DEPLOY HABIT LOOP</>
                        )}
                    </button>
                </form>
            </div>
        </Modal>
    );
});

export function Habits() {
    const { habits, addHabit, toggleHabit, deleteHabit, categories } = useData();
    const { user } = useAuth();
    useSEO('Habit Tracker', 'Build atomic routines and track daily habit completion with ProgressCircle.');

    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    if (!habits) return <LoadingSpinner />;

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const todayStr = today.toISOString().split('T')[0];

    const completedToday = habits.filter(h => h.completedDates?.includes(todayStr)).length;
    const completedPercent = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

    const handleSave = async (habitData) => {
        if (!habitData.name.trim()) return toast.error('Habit name is required');
        setSaving(true);
        try {
            await addHabit(habitData);
            toast.success('Habit deployed! 🚀');
            setModalOpen(false);
        } catch (error) {
            toast.error('Failed to create habit');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Terminate this habit loop?')) return;
        try {
            await deleteHabit(id);
            toast.success('Habit deleted');
        } catch {
            toast.error('Failed to delete habit');
        }
    };

    const handleToggle = async (habit) => {
        const wasDone = habit.completedDates?.includes(todayStr);
        try {
            const updated = await toggleHabit(habit.id);
            if (!wasDone && updated.completedDates?.includes(todayStr)) {
                setShowConfetti(true);
                toast.success(`NEURAL SYNC COMPLETE! ⚡`, {
                    description: `${habit.name}: Streak growing!`,
                    duration: 4000
                });
            }
        } catch {
            toast.error('Failed to sync habit loop');
        }
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 120px 0' }}>
            {/* ─── Yearly Activity Heatmap ──────────── */}
            <YearlyHeatmap habits={habits} />

            {/* ─── Today's Habits Header ────────────── */}
            <div style={{ marginTop: 32, marginBottom: 20 }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-end', flexWrap: 'wrap', gap: 12,
                }}>
                    <div>
                        <h1 style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: 'clamp(1.4rem, 5vw, 1.9rem)',
                            fontWeight: 700, color: 'var(--text)',
                            marginBottom: 4, letterSpacing: '-0.03em',
                        }}>
                            Today's Habits – {dayName}, {monthDay}
                        </h1>
                        <p style={{
                            fontSize: 13, color: 'var(--muted)', fontWeight: 500,
                        }}>
                            {habits.length} Active | {completedPercent}% Completed
                        </p>
                    </div>
                    {user?.plan === 'free' && habits.length >= 5 ? (
                        <Link to="/pricing">
                            <Button variant="premium" className="bg-gradient-to-r from-amber-500 to-orange-600 border-none">
                                ✨ Unlock Unlimited
                            </Button>
                        </Link>
                    ) : (
                        <Button icon={Plus} onClick={() => setModalOpen(true)}>New Habit</Button>
                    )}
                </div>
            </div>

            {/* ─── Habit Cards Grid ─────────────────── */}
            {habits.length === 0 ? (
                <EmptyState icon={Repeat} title="No active loops" description="Consistency is the key to mastery. Start a new habit today." />
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 20,
                }}>
                    {habits.map((habit, i) => {
                        const category = habit.categoryId?._id ? habit.categoryId : categories?.find(c => c.id === habit.categoryId);
                        const habitColor = category?.color || 'var(--primary)';
                        const customColorScheme = {
                            accent: habitColor,
                            bg: `${habitColor}15`,
                            ring: `${habitColor}30`,
                            label: category?.name || 'Global'
                        };
                        return (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                colorScheme={customColorScheme}
                                index={i}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                            />
                        );
                    })}
                </div>
            )}

            {/* ─── Modal ────────────────────────────── */}
            <HabitFormModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleSave}
                saving={saving}
            />

            <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        </div>
    );
}
