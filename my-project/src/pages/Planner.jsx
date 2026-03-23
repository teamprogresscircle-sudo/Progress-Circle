import { useState, useMemo, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';

import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Plus, X, Layout, Trash2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';
import { PageInsight } from '../components/PageInsight';

dayjs.extend(isBetween);

// Default fallbacks handled in backend or inline

export function Planner() {
    const { calendarEvents = [], addCalendarBlock, deleteCalendarBlock, deleteTask, fetchCalendarEvents, tasks = [], categories = [] } = useData();
    useSEO('Tactical Planner', 'Plan your week with time-blocked focus sessions. ProgressCircle helps you schedule deep work and achieve more.');
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [isAddingBlock, setIsAddingBlock] = useState(false);
    const [loading, setLoading] = useState(true);

    const [newBlock, setNewBlock] = useState({
        taskId: '',
        startTime: '',
        endTime: '',
        notes: ''
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const start = currentDate.startOf('month').toISOString();
                const end = currentDate.endOf('month').toISOString();
                if (fetchCalendarEvents) {
                    await fetchCalendarEvents(start, end);
                }
            } catch (err) {
                console.error('Planner load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentDate, fetchCalendarEvents]);

    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfMonth = currentDate.startOf('month').day();
    const days = useMemo(() => {
        const arr = [];
        const prevMonth = currentDate.subtract(1, 'month');
        const prevMonthDays = prevMonth.daysInMonth();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            arr.push({ date: prevMonth.date(prevMonthDays - i), currentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            arr.push({ date: currentDate.date(i), currentMonth: true });
        }
        const remaining = 42 - arr.length;
        const nextMonth = currentDate.add(1, 'month');
        for (let i = 1; i <= remaining; i++) {
            arr.push({ date: nextMonth.date(i), currentMonth: false });
        }
        return arr;
    }, [currentDate, firstDayOfMonth, daysInMonth]);

    const getDayEvents = (date) => {
        if (!calendarEvents) return [];
        return calendarEvents.filter(event =>
            dayjs(event.start).isSame(date, 'day')
        );
    };

    const handleNextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
    const handlePrevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));

    const handleAddBlock = async () => {
        if (!newBlock.taskId) {
            return toast.error('Please select a task');
        }
        const selectedTask = tasks.find(t => t.id === newBlock.taskId);
        if (!selectedTask) return toast.error('Task not found');
        try {
            let startStr = null;
            let endStr = null;
            if (newBlock.startTime) {
                startStr = `${selectedDate.format('YYYY-MM-DD')}T${newBlock.startTime}`;
            }
            if (newBlock.endTime) {
                endStr = `${selectedDate.format('YYYY-MM-DD')}T${newBlock.endTime}`;
            }

            const cat = categories.find(c => c.id === (selectedTask.categoryId?._id || selectedTask.categoryId));

            await addCalendarBlock({
                title: selectedTask.title,
                taskId: selectedTask.id,
                type: 'focus',
                startTime: startStr,
                endTime: endStr,
                date: selectedDate.format('YYYY-MM-DD'),
                color: cat?.color || '#6366f1',
                notes: newBlock.notes
            });
            toast.success('Task scheduled! 🚀');
            setIsAddingBlock(false);
            setNewBlock({ taskId: '', startTime: '', endTime: '', notes: '' });
        } catch (error) {
            toast.error('Failed to schedule task');
        }
    };

    const handleDeleteEvent = async (event) => {
        try {
            if (event.type === 'task') {
                const taskId = event.id.split('-')[1];
                await deleteTask(taskId);
            } else if (event.type === 'block') {
                await deleteCalendarBlock(event.id);
            }
            toast.success('Event removed');
        } catch (error) {
            toast.error('Failed to remove event');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black pc-gradient-text tracking-tight flex items-center gap-3">
                            <CalendarIcon className="text-[var(--primary)]" size={32} />
                            Universe Planner
                        </h1>
                        <PageInsight 
                            title="Tactical Scheduler"
                            intro="Visualize and allocate your cognitive resources across the temporal matrix. Coordinate complex deadlines with daily execution windows."
                            operations={[
                                { title: 'Temporal Visualization', content: 'Review your week-at-a-glance to identify high-density operational periods.' },
                                { title: 'Resource Allocation', content: 'Assign tasks to specific time slots to ensure mission-critical completion.' },
                                { title: 'Conflict Resolution', content: 'Identify and mitigate overlapping objectives before they compromise your trajectory.' }
                            ]}
                            neuralTip="Front-loading your tactical planning (Sundays) reduces 'Decision Fatigue' by up to 60% during active work cycles."
                        />
                    </div>
                    <p className="text-muted text-sm font-medium mt-1 uppercase tracking-widest">
                        Syncing your goals, habits & time
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-surface p-1 rounded-2xl border border-border shadow-sm">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-surface2 rounded-xl transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-black uppercase tracking-widest px-4 min-w-[140px] text-center">
                        {currentDate.format('MMMM YYYY')}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-surface2 rounded-xl transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="p-0 overflow-hidden border-none bg-surface/50 backdrop-blur-xl">
                <div className="grid grid-cols-7 border-b border-border">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-4 text-center text-[11px] font-black text-muted uppercase tracking-[0.2em]">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-6 min-h-[750px] bg-surface rounded-3xl border border-border overflow-hidden shadow-2xl shadow-[var(--primary)]/5">
                    {days.map((day, idx) => {
                        const dayEvents = getDayEvents(day.date);
                        const isToday = day.date.isSame(dayjs(), 'day');
                        const isSelected = selectedDate && day.date.isSame(selectedDate, 'day');

                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    setSelectedDate(day.date);
                                    setIsDayModalOpen(true);
                                    setIsAddingBlock(false);
                                }}
                                className={`relative p-2 border-r border-b border-border cursor-pointer transition-all hover:bg-[var(--primary)]/5
                                    ${!day.currentMonth ? 'opacity-30' : ''}
                                    ${isSelected ? 'bg-[var(--primary)]/10 ring-2 ring-inset ring-[var(--primary)]/30' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg transition-all
                                        ${isToday ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]' : 'text-slate-500/50'}
                                    `}>
                                        {day.date.date()}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
                                            <span className="text-[8px] font-black text-muted uppercase tracking-tighter">
                                                {dayEvents.length}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-1.5 space-y-0.5 overflow-hidden h-[86px]">
                                    {dayEvents.slice(0, 4).map((event, eIdx) => (
                                        <div
                                            key={eIdx}
                                            className="rounded-md font-bold truncate border transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden group/item relative"
                                            style={{ 
                                                backgroundColor: `${event.color}12`, 
                                                borderColor: `${event.color}25`,
                                                borderLeftColor: event.color,
                                                borderLeftWidth: 3,
                                            }}
                                        >
                                            <div className="flex flex-col px-1.5 py-0.5 min-w-0">
                                                <div 
                                                    className="text-[9px] truncate leading-tight mb-0.5"
                                                    style={{ color: event.color }}
                                                >
                                                    {event.title}
                                                </div>
                                                {event.categoryName && (
                                                    <div 
                                                        className="text-[7px] truncate opacity-60 font-black uppercase tracking-tight leading-none"
                                                        style={{ color: event.color }}
                                                    >
                                                        {event.categoryName}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {dayEvents.length > 4 && (
                                        <div className="text-[8px] text-muted font-black text-center pt-0.5 opacity-50 uppercase tracking-tighter">
                                            + {dayEvents.length - 4} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Day Details Modal */}
            <Modal
                open={isDayModalOpen}
                onClose={() => {
                    setIsDayModalOpen(false);
                    setTimeout(() => setSelectedDate(null), 300); // Clear after animation
                }}
                title={selectedDate?.format('dddd, MMMM D')}
            >
                {selectedDate && (
                    <div className="space-y-6">
                        {!isAddingBlock ? (
                            <>
                                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {getDayEvents(selectedDate).length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl">
                                            <p className="text-muted font-bold uppercase tracking-widest text-xs">No entries for this date</p>
                                        </div>
                                    ) : (
                                        getDayEvents(selectedDate).map((event, idx) => (
                                            <div 
                                                key={idx} 
                                                className="group flex items-center gap-4 p-3 rounded-2xl border overflow-hidden"
                                                style={{ borderColor: `${event.color}30`, borderLeftColor: event.color, borderLeftWidth: 4, backgroundColor: `${event.color}08` }}
                                            >
                                                <div 
                                                    className="p-3 rounded-xl flex-shrink-0"
                                                    style={{ backgroundColor: `${event.color}18`, color: event.color }}
                                                >
                                                    {event.type === 'block' ? <CalendarIcon size={18} /> : <Layout size={18} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-sm truncate">{event.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {event.categoryName && (
                                                            <span 
                                                                className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md"
                                                                style={{ backgroundColor: `${event.color}18`, color: event.color }}
                                                            >
                                                                {event.categoryName}
                                                            </span>
                                                        )}
                                                        {event.type === 'block' && event.start ? (
                                                            <span className="text-[10px] font-black uppercase text-muted tracking-widest">
                                                                {dayjs(event.start).format('HH:mm')}{event.end ? ` – ${dayjs(event.end).format('HH:mm')}` : ''}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-black uppercase text-muted tracking-widest">
                                                                {event.priority} priority
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteEvent(event);
                                                    }}
                                                    className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <Button className="w-full flex items-center justify-center gap-2 pc-btn-primary" onClick={() => setIsAddingBlock(true)}>
                                    <Plus size={18} /> Schedule a Task
                                </Button>
                            </>
                        ) : (
                            <div className="space-y-5">
                                {/* Task Picker */}
                                <div>
                                    <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2">Select Task</label>
                                    <select
                                        className="pc-input h-12 text-sm"
                                        value={newBlock.taskId}
                                        onChange={(e) => setNewBlock({ ...newBlock, taskId: e.target.value })}
                                    >
                                        <option value="">— Pick a task —</option>
                                        {tasks
                                            .filter(t => t.status !== 'completed' && !t.parentId)
                                            .map(t => {
                                                const cat = categories.find(c => c.id === (t.categoryId?._id || t.categoryId));
                                                return (
                                                    <option key={t.id} value={t.id}>
                                                        {cat ? `[${cat.name}] ` : ''}{t.title}
                                                    </option>
                                                );
                                            })
                                        }
                                    </select>
                                </div>

                                {/* Optional time range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2">Start <span className="normal-case opacity-50">(optional)</span></label>
                                        <input
                                            type="time"
                                            className="pc-input"
                                            value={newBlock.startTime}
                                            onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2">End <span className="normal-case opacity-50">(optional)</span></label>
                                        <input
                                            type="time"
                                            className="pc-input"
                                            value={newBlock.endTime}
                                            onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2">Notes <span className="normal-case opacity-50">(optional)</span></label>
                                    <textarea
                                        className="pc-input min-h-[80px] resize-none"
                                        placeholder="Any specifics for this session?"
                                        value={newBlock.notes}
                                        onChange={(e) => setNewBlock({ ...newBlock, notes: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button className="flex-1 h-12" onClick={handleAddBlock}>Schedule Task</Button>
                                    <Button variant="secondary" onClick={() => setIsAddingBlock(false)}>Cancel</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
