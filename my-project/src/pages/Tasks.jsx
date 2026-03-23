import { useState, useRef, useCallback, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';

import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import dayjs from 'dayjs';
import { Confetti } from '../components/Confetti';
import { Plus, CheckSquare, Pencil, Trash2, Clock, Check, Bell, Tag, Settings, Timer, ChevronDown, ChevronRight, FileText, Layout, Crown, Zap, Target, Shield, Info, Rocket, Sparkles, BarChart, Calendar, GripVertical } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CategoryManager } from '../components/CategoryManager';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';
import { PageInsight } from '../components/PageInsight';

import { useAuth } from '../context/AuthContext';



const TaskItem = ({ task, tasks, categories, expandedTasks, toggleExpand, handleComplete, updateTask, openCreateModal, openEditModal, handleDelete, filter, isSub = false }) => {
    const category = categories?.find(c => c.id === (task.categoryId?._id || task.categoryId));
    const dragControls = useDragControls();
    let subTasks = tasks.filter(t => (t.parentId?._id || t.parentId) === task.id);

    // Apply category filter to sub-tasks as well if a specific category is selected
    if (filter !== 'All') {
        const activeCat = categories.find(c => c.name === filter);
        if (activeCat) {
            subTasks = subTasks.filter(st => (st.categoryId?._id || st.categoryId) === activeCat.id);
        }
    }
    const isExpanded = expandedTasks.has(task.id);
    const progress = task.totalWork > 0 ? (task.completedWork / task.totalWork) * 100 : 0;

    return (
        <Reorder.Item
            value={task}
            dragListener={false}
            dragControls={dragControls}
            className={`pc-card group border-l-4 overflow-hidden ${isSub ? 'sm:ml-8 ml-3 bg-muted/5' : ''} ${task.status === 'completed' ? 'opacity-60' : ''}`}
            style={{ borderLeftColor: category?.color || 'var(--primary)' }}
        >
            <div className="flex items-start gap-4 p-4">
                {/* Drag Handle */}
                {!isSub && (
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="mt-1.5 p-1 cursor-grab active:cursor-grabbing text-muted/30 transition-colors"
                        style={{ '--hover-color': 'var(--primary)' }}
                    >
                        <GripVertical size={18} className="group-hover:text-primary transition-colors" />
                    </div>
                )}

                {task.isBigTask && !isSub ? (
                    <button onClick={() => toggleExpand(task.id)} className="mt-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                ) : (
                    <button
                        onClick={() => handleComplete(task)}
                        className={`flex-shrink-0 mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.status === 'completed'
                            ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/20'
                            : dayjs(task.deadline).diff(dayjs(), 'hour') < 12
                                ? 'border-rose-500 hover:bg-rose-500/10'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                        style={task.status !== 'completed' && dayjs(task.deadline).diff(dayjs(), 'hour') >= 12 ? { borderColor: 'var(--border)' } : {}}
                    >
                        {task.status === 'completed' && <Check size={14} className="text-white" />}
                    </button>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-bold text-[16px] truncate ${task.status === 'completed' ? 'line-through text-muted' : ''}`}>
                            {task.title}
                        </h3>
                        {task.isBigTask && (
                            <span 
                                className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md flex items-center gap-1"
                                style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}
                            >
                                <Layout size={10} /> Project
                            </span>
                        )}
                        <PriorityBadge priority={task.priority} />
                        {category && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                                <Tag size={10} /> {category.name}
                            </span>
                        )}
                    </div>

                    {task.description && <p className="text-sm text-muted mb-2 line-clamp-1">{task.description}</p>}

                    {task.totalWork > 0 && (
                        <div className="mb-3">
                            <div className="flex justify-between items-center text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">
                                <span>Progress: {task.completedWork} / {task.totalWork}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full"
                                    style={{ backgroundColor: category?.color || 'var(--primary)' }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-muted font-bold uppercase tracking-widest">
                        {task.deadline && (
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(task.deadline).toLocaleDateString()}</span>
                        )}
                        {task.estimatedTime > 0 && (
                            <span className="flex items-center gap-1"><Timer size={12} /> {task.actualTimeSpent || 0} / {task.estimatedTime}m</span>
                        )}
                        {task.notes && (
                            <span className="flex items-center gap-1" style={{ color: 'var(--primary)' }}><FileText size={12} /> Notes available</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {!task.isBigTask && task.status !== 'completed' && task.estimatedTime > 0 && (
                        <button onClick={() => updateTask(task.id, { actualTimeSpent: (task.actualTimeSpent || 0) + 15 })} className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 transition-colors" title="Log 15m">
                            <Plus size={16} />
                        </button>
                    )}
                    {/* touch-always-visible makes these always visible on mobile touch devices */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity touch-always-visible">
                        {task.isBigTask && (
                            <button onClick={() => openCreateModal(false, task.id)} className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600" title="Add Sub-task">
                                <Plus size={16} />
                            </button>
                        )}
                        <button onClick={() => openEditModal(task)} className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-muted">
                            <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-muted hover:text-red-500">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && subTasks.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 dark:border-gray-800 pb-4 pr-4"
                    >
                        {subTasks.map(st => (
                            <TaskItem
                                key={st.id}
                                task={st}
                                tasks={tasks}
                                categories={categories}
                                expandedTasks={expandedTasks}
                                toggleExpand={toggleExpand}
                                handleComplete={handleComplete}
                                updateTask={updateTask}
                                openCreateModal={openCreateModal}
                                openEditModal={openEditModal}
                                handleDelete={handleDelete}
                                filter={filter}
                                isSub={true}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
};

export function Tasks() {
    const { user } = useAuth();
    useSEO('Task Manager', 'Manage tasks, set priorities, track deadlines, and break down goals with the ProgressCircle task manager.');
    const { tasks, categories, addTask, updateTask, deleteTask, reorderTasks } = useData();
    const [filter, setFilter] = useState('All');
    const [modalOpen, setModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [expandedTasks, setExpandedTasks] = useState(new Set());
    const [saving, setSaving] = useState(false);
    const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);
    const [showConfetti, setShowConfetti] = useState(null); // null | 'regular' | 'big'
    const filterBarRef = useRef(null);
    const trackRef = useRef(null);
    const isDragging = useRef(false);
    const dragStartX = useRef(0);
    const dragStartScroll = useRef(0);
    const [filterScrollThumb, setFilterScrollThumb] = useState(100);
    const [filterScrollOffset, setFilterScrollOffset] = useState(0);


    const handleFilterScroll = useCallback(() => {
        const el = filterBarRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const scrollable = scrollWidth - clientWidth;
        const thumbPct = (clientWidth / scrollWidth) * 100;
        const offsetPct = scrollable > 0 ? (scrollLeft / scrollable) * (100 - thumbPct) : 0;
        setFilterScrollThumb(thumbPct);
        setFilterScrollOffset(offsetPct);
    }, []);
    const handleTrackClick = useCallback((e) => {
        const el = filterBarRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const rect = track.getBoundingClientRect();
        const clickPct = (e.clientX - rect.left) / rect.width;
        const { scrollWidth, clientWidth } = el;
        el.scrollLeft = clickPct * (scrollWidth - clientWidth);
    }, []);
    const handleThumbMouseDown = useCallback((e) => {
        e.stopPropagation();
        const el = filterBarRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        isDragging.current = true;
        dragStartX.current = e.clientX;
        dragStartScroll.current = el.scrollLeft;
        const onMove = (me) => {
            if (!isDragging.current) return;
            const dx = me.clientX - dragStartX.current;
            const { scrollWidth, clientWidth } = el;
            const trackWidth = track.getBoundingClientRect().width;
            const scrollRatio = (scrollWidth - clientWidth) / (trackWidth * (clientWidth / scrollWidth));
            el.scrollLeft = dragStartScroll.current + dx * scrollRatio;
        };
        const onUp = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, []);
    const [form, setForm] = useState({
        title: '', description: '', priority: 'medium', deadline: '',
        categoryId: '', estimatedTime: 0, alertsEnabled: false, timeEnabled: false,
        isBigTask: false, parentId: null, notes: '', totalWork: 0, completedWork: 0,
        collaborators: [], isSynergyTask: false
    });

    useEffect(() => {
        if (!form.categoryId && categories?.length > 0) {
            setForm(prev => ({ ...prev, categoryId: categories[0].id }));
        }
    }, [categories, form.categoryId]);

    if (!tasks || !categories) return <LoadingSpinner />;

    const toggleExpand = (id) => {
        const next = new Set(expandedTasks);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedTasks(next);
    };

    const handleComplete = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            await updateTask(task.id, { status: newStatus });
            if (newStatus === 'completed') {
                setShowConfetti(task.isBigTask ? 'big' : 'regular');
                toast.success(task.isBigTask ? 'LEGENDARY ACHIEVEMENT! 🏆' : 'Task completed! 🎉');
            }
        } catch { toast.error('Failed to update task'); }
    };

    const handleDelete = (id) => {
        setConfirmDeleteTask(id);
    };

    const confirmTaskDeletion = async () => {
        if (!confirmDeleteTask) return;
        try {
            await deleteTask(confirmDeleteTask);
            toast.success('Task deleted');
        } catch { toast.error('Failed to delete task'); }
        setConfirmDeleteTask(null);
    };

    const openCreateModal = (isBig = false, parentId = null) => {
        setEditTask(null);
        setForm({
            title: '', description: '', priority: 'medium', deadline: '',
            categoryId: '', estimatedTime: 0, alertsEnabled: false, timeEnabled: false,
            isBigTask: isBig, parentId: parentId, notes: '', totalWork: 0, completedWork: 0,
            collaborators: [], isSynergyTask: false
        });
        setModalOpen(true);
    };

    const openEditModal = (task) => {
        setEditTask(task);
        if (task) {
            setForm({
                title: task.title, description: task.description || '', priority: task.priority,
                deadline: task.deadline ? dayjs(task.deadline).format('YYYY-MM-DDTHH:mm') : '',
                categoryId: task.categoryId?._id || task.categoryId || '',
                estimatedTime: task.estimatedTime || 0,
                timeEnabled: (task.estimatedTime > 0),
                isBigTask: task.isBigTask || false,
                parentId: task.parentId?._id || task.parentId || null,
                notes: task.notes || '',
                totalWork: task.totalWork || 0,
                completedWork: task.completedWork || 0,
                collaborators: task.collaborators?.map(c => c._id || c) || [],
                isSynergyTask: task.isSynergyTask || false
            });
            setModalOpen(true);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim()) return toast.error('Title is required');
        setSaving(true);
        try {
            const payload = { ...form };
            if (!payload.timeEnabled) payload.estimatedTime = 0;
            if (payload.categoryId === '') payload.categoryId = null;

            // AUTOMATIC ALERTS: Enable if deadline exists, otherwise disable
            payload.alertsEnabled = !!payload.deadline;

            delete payload.timeEnabled;

            if (editTask) {
                await updateTask(editTask.id, payload);
                toast.success('Task updated');
            } else {
                await addTask(payload);
                toast.success('Task created');
            }
            setModalOpen(false);
        } catch (error) {
            toast.error('Failed to save task');
        } finally {
            setSaving(false);
        }
    };

    const FILTERS = ['All', ...categories.map(c => c.name)];

    const filtered = tasks.filter((t) => {
        if (filter === 'All') return !t.parentId;

        // Find if filter matches a category name
        const cat = categories.find(c => c.name === filter);
        if (cat) return (t.categoryId?._id || t.categoryId) === cat.id && !t.parentId;

        return !t.parentId;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-32">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-extrabold pc-gradient-text tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1.6rem, 6vw, 2.25rem)' }}>My Tasks</h1>
                        <PageInsight
                            title="Task Manager"
                            intro="The core layer for breaking down your objectives. Architect complex goals into manageable steps and monitor your execution speed."
                            operations={[
                                { title: 'Task Breakdown', content: 'Break large-scale goals into small tasks with assigned priorities and urgency.' },
                                { title: 'Categorization', content: 'Organize your work into functional sectors like Work, Personal, and Goals.' },
                                { title: 'Progress Tracking', content: 'Real-time monitoring of task completion states from Pending to Finished.' }
                            ]}
                            neuralTip="Defining a 'Result' for each task before starting increases focus by up to 40%."
                        />
                    </div>
                    <p className="text-xs text-muted font-medium mt-1 uppercase tracking-[0.2em]">{tasks.length} total · {tasks.filter(t => t.status === 'completed').length} done</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" icon={Settings} onClick={() => setCategoryModalOpen(true)}>Categories</Button>
                    <Button icon={Plus} onClick={() => openCreateModal(false)}>New Task</Button>
                </div>
            </div>

            {/* Filter bar: horizontal scroll with custom scrollbar indicator */}
            <div className="flex items-center rounded-2xl shadow-xl relative max-w-full overflow-hidden" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', paddingBottom: '6px' }}>
                {/* Scrollable Categories Section — native scrollbar hidden via CSS */}
                <div
                    ref={filterBarRef}
                    onScroll={handleFilterScroll}
                    className="mobile-scroll-x flex-1 min-w-0 pr-2 pt-1 px-2"
                >
                    {FILTERS.map((f) => {
                        const isCat = categories.find(c => c.name === f);
                        const isActive = filter === f;
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className="px-6 py-2 rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
                                style={isActive ? {
                                    background: 'rgba(var(--primary-rgb), 0.1)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(var(--primary-rgb), 0.2)',
                                    boxShadow: '0 0 15px -5px rgba(var(--primary-rgb), 0.4)'
                                } : {
                                    color: 'var(--muted)',
                                    border: '1px solid transparent'
                                }}
                            >
                                {isCat && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isCat.color }} />}
                                {f}
                            </button>
                        );
                    })}
                </div>

                {/* Sticky Action Section (Always on Right) */}
                <div className="sticky right-0 flex items-center pl-6 z-10" style={{ background: 'var(--surface2)', boxShadow: '-20px 0 20px -10px var(--surface2)' }}>
                    <div className="h-6 w-px bg-white/5 mx-2 flex-shrink-0" />
                    <button
                        onClick={() => user?.plan === 'premium' ? openCreateModal(true) : toast.error('Big Tasks are a Premium feature! ✨')}
                        className="flex items-center gap-2 px-5 py-2 rounded-2xl text-[12px] font-bold uppercase tracking-[0.15em] transition-all flex-shrink-0 whitespace-nowrap"
                        style={{ color: user?.plan === 'premium' ? 'var(--primary)' : undefined }}
                    >
                        {user?.plan !== 'premium' ? <Crown size={14} /> : <Plus size={16} />} Big Task
                    </button>
                </div>

                {/* Custom draggable scrollbar */}
                <div
                    ref={trackRef}
                    onClick={handleTrackClick}
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.06] rounded-full mx-2"
                    style={{ cursor: 'pointer' }}
                >
                    <div
                        onMouseDown={handleThumbMouseDown}
                        className="h-full rounded-full hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--primary)', width: `${filterScrollThumb}%`, marginLeft: `${filterScrollOffset}%`, cursor: 'grab', userSelect: 'none' }}
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={CheckSquare} title="The horizon is clear" description="Start mapping out your next big move." />
            ) : (
                <Reorder.Group axis="y" values={filtered} onReorder={reorderTasks} className="space-y-4">
                    {filtered.map((task) => (
                        <TaskItem
                            key={task.id} task={task} tasks={tasks} categories={categories}
                            expandedTasks={expandedTasks} toggleExpand={toggleExpand}
                            handleComplete={handleComplete} updateTask={updateTask}
                            openCreateModal={openCreateModal} openEditModal={openEditModal}
                            handleDelete={handleDelete} filter={filter}
                        />
                    ))}
                </Reorder.Group>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? "Edit Task" : (form.isBigTask ? "New Project" : "New Task")}>
                <div className="max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
                    <div className="space-y-6 pt-2">
                        {/* Title Section */}
                        <div>
                            <label className="block text-[11px] font-black text-muted uppercase tracking-[0.1em] mb-2 px-1">Title</label>
                            <input
                                className="pc-input text-lg font-bold"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g., Computer Science 101"
                            />
                        </div>

                        {/* Category & Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.1em] mb-2 px-1 flex items-center gap-2">
                                    <Tag size={12} style={{ color: 'var(--primary)' }} /> Category
                                </label>
                                <select
                                    className="pc-input text-sm h-[46px]"
                                    value={form.categoryId}
                                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                >
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.1em] mb-2 px-1 flex items-center gap-2">
                                    <Shield size={12} style={{ color: 'var(--primary)' }} /> Priority
                                </label>
                                <select
                                    className="pc-input text-sm h-[46px]"
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Standard</option>
                                    <option value="high">Critical</option>
                                </select>
                            </div>
                        </div>

                        {/* Deadline & Work Counter Row */}
                        <div className="grid grid-cols-2 gap-5 items-end">
                            <div>
                                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.1em] mb-2 px-1 flex items-center gap-2">
                                    <Clock size={12} style={{ color: 'var(--primary)' }} /> Deadline
                                </label>
                            <input
                                className="pc-input text-sm h-[46px]"
                                type="datetime-local"
                                value={form.deadline}
                                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                            />
                            </div>
                            <div className="flex flex-col justify-end h-[74px]">
                                <label className="block text-[11px] font-black text-muted uppercase tracking-[0.1em] mb-3 px-1 flex items-center gap-2">
                                    <BarChart size={12} style={{ color: form.totalWork > 0 ? 'var(--primary)' : 'var(--muted)' }} /> Work Counter
                                </label>
                                <div className="flex items-center gap-3 px-1 h-[46px]">
                                    <div 
                                        onClick={() => {
                                            if (user?.plan !== 'premium') return toast.error('Work Counters are Premium! ✨');
                                            setForm({ ...form, totalWork: form.totalWork > 0 ? 0 : 10 });
                                        }}
                                        className={`w-10 h-5 rounded-full cursor-pointer transition-all relative ${form.totalWork > 0 ? '' : 'bg-gray-700'}`}
                                        style={form.totalWork > 0 ? { backgroundColor: 'var(--primary)', boxShadow: '0 0 10px rgba(var(--primary-rgb), 0.4)' } : {}}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${form.totalWork > 0 ? 'left-6' : 'left-1'}`} />
                                    </div>
                                    <span className="text-[11px] font-black text-muted uppercase tracking-widest">
                                        {form.totalWork > 0 ? 'On' : 'Off'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Expandable Work Counter Inputs */}
                        {form.totalWork > 0 && (
                            <div 
                                className="p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300"
                                style={{ borderColor: 'rgba(var(--primary-rgb), 0.2)', backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Total Goal</label>
                                        <input type="number" className="pc-input text-sm bg-white/[0.05] border-white/10" value={form.totalWork} onChange={(e) => setForm({ ...form, totalWork: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-white/40 uppercase mb-1.5 ml-1">Current Progress</label>
                                        <input type="number" className="pc-input text-sm bg-white/[0.05] border-white/10" value={form.completedWork} onChange={(e) => setForm({ ...form, completedWork: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes Section */}
                        <div className="space-y-2">
                            <label className="block text-[11px] font-black text-muted uppercase tracking-[0.1em] px-1 flex items-center gap-2">
                                <FileText size={12} style={{ color: 'var(--primary)' }} /> Notes
                            </label>
                            <textarea
                                className={`pc-input resize-none text-sm min-h-[100px] ${user?.plan !== 'premium' ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                                value={form.notes}
                                onChange={(e) => {
                                    if (user?.plan !== 'premium') return toast.error('Notes are a Premium feature! ✨');
                                    setForm({ ...form, notes: e.target.value });
                                }}
                                placeholder="Add specifics, progress notes, or lesson names..."
                                readOnly={user?.plan !== 'premium'}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                className="flex-1 h-12 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                style={{ background: 'var(--primary)', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.25)' }}
                                disabled={saving}
                                onClick={handleSave}
                            >
                                {saving ? <LoadingSpinner size="sm" /> : (editTask ? 'Update Task' : 'Add Task')}
                            </button>
                            <button
                                className="px-6 h-12 bg-white/5 border border-white/10 text-muted font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 hover:text-white transition-all"
                                onClick={() => setModalOpen(false)}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <Confetti
                active={!!showConfetti}
                isBigTask={showConfetti === 'big'}
                onComplete={() => setShowConfetti(null)}
            />
            <CategoryManager open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />

            <Modal open={!!confirmDeleteTask} onClose={() => setConfirmDeleteTask(null)} title="Delete Task?">
                <div className="space-y-4">
                    <p className="text-sm text-muted">Are you sure you want to delete this task?</p>
                    <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-center flex items-center justify-center gap-2">⚠️ This action cannot be undone.</p>
                    <div className="flex gap-3 pt-2">
                        <button className="flex-1 py-3 px-4 rounded-xl font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm" onClick={confirmTaskDeletion}>Delete Task</button>
                        <button className="flex-1 py-3 px-4 rounded-xl font-bold bg-muted/10 text-white hover:bg-muted/20 transition-all border border-border" onClick={() => setConfirmDeleteTask(null)}>Cancel</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

