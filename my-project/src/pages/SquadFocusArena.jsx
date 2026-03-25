import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Timer, Trophy, X, Shield, Swords,
    Flame, Target, Pause, Play, LogOut,
    CheckSquare, Activity, MessageSquare, Plus,
    Users, Star, Send
} from 'lucide-react';
import api from '../api/client';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Elite Micro-Components
import TimerDisplay from '../components/arena/TimerDisplay';
import OperativeGrid from '../components/arena/OperativeGrid';
import TacticalSidebar from '../components/arena/TacticalSidebar';
const IntelligenceSidebar = lazy(() => import('../components/arena/IntelligenceSidebar'));

export default function SquadFocusArena() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const { dark, theme: userTheme } = useTheme();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isHost, setIsHost] = useState(false);
    const [myTasks, setMyTasks] = useState([]);
    const [showTaskSelector, setShowTaskSelector] = useState(false);
    const [showTaskEditModal, setShowTaskEditModal] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const [finishedTasks, setFinishedTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterOnlyBig, setFilterOnlyBig] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const hasInitialized = useState(false)[0]; // Use a state-local mock ref or similar
    const [isLoaded, setIsLoaded] = useState(false);
    const [extending, setExtending] = useState(false);
    const [targetUserId, setTargetUserId] = useState(null);
    const [sidebarTacticalOpen, setSidebarTacticalOpen] = useState(true);
    const [sidebarIntelOpen, setSidebarIntelOpen] = useState(true);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(25);
    const [pointsPop, setPointsPop] = useState({ show: false, points: 0 });

    useEffect(() => {
        if (!currentUser) return;
        fetchRoom();
        fetchMyTasks();
        fetchCategories();

        const savedState = localStorage.getItem(`squad_focus_${id}_${currentUser?._id || currentUser?.id}`);
        if (savedState) {
            try {
                const { selectedIds, finished } = JSON.parse(savedState);
                if (selectedIds) setSelectedTaskIds(selectedIds);
                if (finished) setFinishedTasks(finished);
            } catch (e) { console.error('Failed to parse saved session state'); }
        }
        setIsLoaded(true);

        // Sync server every 5s instead of 3s to reduce load
        const interval = setInterval(fetchRoom, 5000);
        return () => clearInterval(interval);
    }, [id, currentUser]);

    useEffect(() => {
        if (!currentUser || !isLoaded) return;
        const state = { selectedIds: selectedTaskIds, finished: finishedTasks };
        localStorage.setItem(`squad_focus_${id}_${currentUser?._id || currentUser?.id}`, JSON.stringify(state));
    }, [selectedTaskIds, finishedTasks, id, currentUser, isLoaded]);

    const handleSendMessage = useCallback(async (text) => {
        try {
            const res = await api.post(`/social/rooms/${id}/chat`, { text });
            if (res.data.success) setRoom(res.data.data);
        } catch (err) { toast.error('Message failed to send'); }
    }, [id]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await api.get('/categories');
            if (res.data.success) setCategories(res.data.data);
        } catch (err) { console.error('Failed to fetch categories'); }
    }, []);

    const fetchMyTasks = useCallback(async () => {
        try {
            const res = await api.get('/tasks');
            if (res.data.success) {
                const tasks = res.data.data.filter(t => t.status !== 'completed');
                setMyTasks(tasks);
            }
        } catch (err) { console.error('Failed to fetch tasks'); }
    }, []);

    const handleCreateTask = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (!newTaskTitle.trim()) return;
        try {
            const res = await api.post('/tasks', { title: newTaskTitle });
            if (res.data.success) {
                const newTask = res.data.data;
                setMyTasks(prev => [newTask, ...prev]);
                setSelectedTaskIds(prev => [newTask._id, ...prev]);
                setNewTaskTitle('');
                toast.success('Task Created & Assigned');
            }
        } catch (err) { toast.error('Failed to create task'); }
    }, [newTaskTitle]);

    const handleAssignTask = useCallback(async (taskId) => {
        try {
            const battleId = room.activeBattle?._id || room.activeBattle;
            if (!battleId) { toast.error('Tactical session not active'); return; }
            const res = await api.post(`/social/battle/add-task/${battleId}`, { taskId, targetUserId });
            if (res.data.success) {
                toast.success('Mission assigned to operative');
                setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
                fetchRoom();
                setShowTaskSelector(false);
            }
        } catch (err) { toast.error('Assignment synchronization failed'); }
    }, [room?.activeBattle, targetUserId, id]);

    const handleToggleTaskSelection = useCallback((taskId) => {
        setSelectedTaskIds(prev => {
            const isSelecting = !prev.includes(taskId);
            const task = myTasks.find(t => t._id === taskId);
            let newSelection = [...prev];
            if (isSelecting) {
                newSelection.push(taskId);
                if (task.isBigTask) {
                    const children = myTasks.filter(t => (t.parentId?._id || t.parentId) === taskId);
                    children.forEach(c => { if (!newSelection.includes(c._id)) newSelection.push(c._id); });
                }
                if (task.parentId) {
                    const pId = task.parentId?._id || task.parentId;
                    if (!newSelection.includes(pId)) newSelection.push(pId);
                }
            } else {
                newSelection = newSelection.filter(id => id !== taskId);
                if (task.isBigTask) {
                    const children = myTasks.filter(t => (t.parentId?._id || t.parentId) === taskId);
                    children.forEach(c => { newSelection = newSelection.filter(id => id !== c._id); });
                }
            }
            return newSelection;
        });
    }, [myTasks]);

    const fetchRoom = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/social/rooms/${id}`);
            if (res.data.success) {
                const r = res.data.data;
                setRoom(r);
                const hostId = r.host?._id || r.host?.id || r.host;
                const currentId = currentUser?._id || currentUser?.id;
                setIsHost(String(hostId) === String(currentId));
            }
        } catch (err) { console.error('Failed to sync room state'); } finally { setLoading(false); }
    }, [id, currentUser]);

    const handleCompleteSession = useCallback(async () => {
        try {
            const res = await api.post(`/social/rooms/${id}/session/end`);
            if (res.data.success) { fetchRoom(); setShowSummaryModal(true); }
        } catch (err) { toast.error('Failed to complete session'); }
    }, [id, fetchRoom]);

    const handleToggleTaskStatus = useCallback(async (taskId) => {
        try {
            const task = myTasks.find(t => t._id === taskId);
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            if (room.activeBattle) {
                const battleId = room.activeBattle._id || room.activeBattle;
                const res = await api.patch(`/social/battle/toggle-task/${battleId}`, { taskId });
                if (res.data.success) {
                    if (newStatus === 'completed') {
                        const myParticipant = room.activeBattle?.participants?.find(p => {
                            const pid = p.user?._id || p.user?.id || p.user;
                            const mid = currentUser?._id || currentUser?.id;
                            return String(pid) === String(mid);
                        });
                        const isAssigned = myParticipant?.battleTasks?.some(bt => (bt._id || bt) === taskId);
                        const pts = isAssigned ? 50 : 10;
                        setPointsPop({ show: true, points: pts });
                        setTimeout(() => setPointsPop({ show: false, points: 0 }), 3000);
                        toast.success(`Objective Secured! +${pts} XP`);
                        setFinishedTasks(prev => [task, ...prev]);
                    }
                    fetchRoom(); fetchMyTasks();
                }
            } else {
                const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
                if (res.data.success) {
                    if (newStatus === 'completed') setFinishedTasks(prev => [task, ...prev]);
                    fetchMyTasks(); fetchRoom();
                }
            }
        } catch (err) { toast.error('Sync failed'); }
    }, [id, myTasks, room?.activeBattle, currentUser, fetchRoom, fetchMyTasks]);

    const handleStartSession = useCallback(async () => {
        try {
            const res = await api.post(`/social/rooms/${id}/session/start`, { duration: sessionDuration, type: 'battle' });
            if (res.data.success) {
                toast.success('Battle Synchronized. All operatives on standby.', { icon: <Zap className="text-amber-400" /> });
                setShowConfigModal(false); fetchRoom();
            }
        } catch (err) { toast.error('Neural uplink failed'); }
    }, [id, sessionDuration, fetchRoom]);

    const handleControl = useCallback(async (action) => {
        if (action === 'end') { handleCompleteSession(); return; }
        try {
            const res = await api.post(`/social/rooms/${id}/session/control`, { action });
            if (res.data.success) { toast.success(`Session ${action === 'pause' ? 'Paused' : 'Resumed'}`); fetchRoom(); }
        } catch (err) { toast.error(`Failed to ${action} session`); }
    }, [id, fetchRoom, handleCompleteSession]);

    if (loading || !currentUser) return <LoadingSpinner />;
    if (!room) return <div className="text-center py-20 text-white">Squad Room not found or expired.</div>;

    const me = (room.members || []).find(p => {
        const pId = p.user?._id?.toString() || p.user?.id?.toString() || p.user?.toString();
        const cId = currentUser?._id?.toString() || currentUser?.id?.toString();
        return pId && cId && pId === cId;
    });

    if (!me) {
        return (
            <div className="text-center py-20 flex flex-col items-center gap-4 bg-[#070708] min-h-screen pt-40">
                <p className="text-white/60 font-bold">Identity Error: You are not in this Room.</p>
                <Button onClick={() => navigate('/squad')} variant="secondary">Return to Squad</Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[var(--bg)] z-50 flex flex-col overflow-hidden font-sans selection:bg-[var(--primary)]/30">
            {/* Elite Glass Header */}
            <header className="h-20 border-b border-[var(--border)]/10 flex items-center justify-between px-8 bg-[var(--surface)]/80 backdrop-blur-md z-50 relative shrink-0">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

                <div className="flex items-center gap-5">
                    <motion.div 
                        whileHover={{ rotate: 180 }}
                        className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]"
                    >
                        <Swords size={20} />
                    </motion.div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-black uppercase tracking-[0.25em] text-[var(--text)]">
                                Squad Arena <span className="text-[var(--primary)]/40 font-mono text-xs ml-2 tracking-normal">SECURE-ID:{id ? id.slice(-6).toUpperCase() : 'N/A'}</span>
                            </h1>
                            <div className="px-2 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">
                                {room.league || 'Bronze'} League
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5">
                                <Activity size={10} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-[var(--text)]/40 uppercase tracking-wider">{(room.members || []).length} Operatives Active</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-[var(--text)]/10" />
                            <div className="flex items-center gap-1.5">
                                <Trophy size={10} className="text-amber-500" />
                                <span className="text-[10px] font-bold text-[var(--text)]/40 uppercase tracking-wider">{(room.squadXP || 0).toLocaleString()} Total XP</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-1.5 bg-[var(--text)]/5 rounded-2xl border border-[var(--border)]/10">
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--text-rgb), 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSidebarTacticalOpen(!sidebarTacticalOpen)}
                            className={`p-2 rounded-xl transition-all duration-300 ${
                                sidebarTacticalOpen 
                                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' 
                                    : 'bg-transparent text-[var(--text)]/20 hover:text-[var(--text)]/40'
                            }`}
                            title="Toggle Tactical Loadout"
                        >
                            <Target size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--text-rgb), 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSidebarIntelOpen(!sidebarIntelOpen)}
                            className={`p-2 rounded-xl transition-all duration-300 ${
                                sidebarIntelOpen 
                                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' 
                                    : 'bg-transparent text-[var(--text)]/20 hover:text-[var(--text)]/40'
                            }`}
                            title="Toggle Intelligence Feed"
                        >
                            <MessageSquare size={18} />
                        </motion.button>
                    </div>

                    <div className="hidden md:flex items-center gap-3 px-5 py-2 rounded-2xl bg-[var(--text)]/5 border border-[var(--text)]/5 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${room.activeSession?.isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'}`} />
                        <span className="text-[10px] font-black uppercase text-[var(--text)]/60 tracking-[0.1em]">
                            Uplink: {room.activeSession?.isActive ? 'Secured' : 'Standby'}
                        </span>
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.close()} 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)]/10 text-rose-500/70 hover:text-rose-500 transition-[background-color,border-color,color,transform] duration-200 font-black text-[10px] uppercase tracking-widest bg-[var(--text)]/2"
                    >
                        <LogOut size={16} />
                        Disengage
                    </motion.button>
                </div>
            </header>

            {/* Main Interactive Workspace */}
            <div className="flex-1 grid lg:grid-cols-12 gap-0 overflow-hidden relative">
                
                {/* Tactical Oversight Sidebar */}
                <AnimatePresence mode="wait">
                    {sidebarTacticalOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="lg:col-span-3 border-r border-[var(--border)]/10 h-full overflow-hidden"
                        >
                            <TacticalSidebar 
                                myTasks={myTasks}
                                selectedTaskIds={selectedTaskIds}
                                onToggleTaskStatus={handleToggleTaskStatus}
                                onOpenConfig={() => setShowTaskEditModal(true)}
                                onClose={() => setSidebarTacticalOpen(false)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Center High-Performance Zone */}
                <main className={`flex flex-col p-8 overflow-y-auto pc-scrollbar relative bg-[var(--bg)] min-h-0 ${
                    sidebarTacticalOpen && sidebarIntelOpen 
                        ? 'lg:col-span-6' 
                        : (sidebarTacticalOpen || sidebarIntelOpen ? 'lg:col-span-9' : 'lg:col-span-12')
                }`}>
                    <div className="flex-1 flex flex-col items-center justify-start space-y-20 pt-12 pb-24">
                        <TimerDisplay 
                            isActive={room.activeSession?.isActive}
                            startTime={room.activeSession?.startTime}
                            duration={room.activeSession?.durationMinutes}
                            isPaused={room.activeSession?.isPaused}
                            isHost={isHost}
                            onControl={handleControl}
                            onComplete={handleCompleteSession}
                            onOpenConfig={() => setShowConfigModal(true)}
                        />

                        <OperativeGrid 
                            members={room.members || []}
                            currentUserId={currentUser?._id || currentUser?.id}
                            hostId={room.host?._id || room.host?.id || room.host}
                            onAssignTask={(uid) => { setTargetUserId(uid); setShowTaskSelector(true); }}
                        />
                    </div>
                </main>

                {/* Intelligence & Comms Sidebar (Lazy Loaded) */}
                <AnimatePresence mode="wait">
                    {sidebarIntelOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="lg:col-span-3 border-l border-[var(--border)]/10 h-full overflow-hidden"
                        >
                            <Suspense fallback={<div className="h-full bg-[var(--bg)]/40 border-l border-[var(--border)]/10 animate-pulse" />}>
                                <IntelligenceSidebar 
                                    messages={room.messages}
                                    currentUser={currentUser}
                                    onSendMessage={handleSendMessage}
                                    participants={room.activeBattle?.participants || []}
                                    league={room.league}
                                    onClose={() => setSidebarIntelOpen(false)}
                                />
                            </Suspense>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Task Edit Modal (Strategic Planner) */}
            <AnimatePresence>
                {showTaskEditModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTaskEditModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)]/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                            
                            <div className="relative mb-10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-[var(--text)] uppercase tracking-tight flex items-center gap-4">
                                        <CheckSquare className="text-[var(--primary)]" size={24} /> Strategic Planner
                                    </h2>
                                    <p className="text-[10px] font-black text-[var(--text)]/30 uppercase tracking-[0.3em] mt-2">Active Mission Configuration</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black uppercase text-[var(--text)]/20">Sector:</span>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="bg-transparent text-[10px] font-bold text-[var(--text)] outline-none border-b border-[var(--border)]/20 pb-1 cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
                                        >
                                            <option value="all" className="bg-[var(--surface)]">All Sectors</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id} className="bg-[var(--surface)]">{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setFilterOnlyBig(!filterOnlyBig)}
                                        className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all px-3 py-1.5 rounded-lg border ${filterOnlyBig ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]' : 'text-[var(--text)]/40 border-transparent hover:text-[var(--text)]'}`}
                                    >
                                        <Shield size={12} className={filterOnlyBig ? 'fill-[var(--primary)]/20' : ''} /> Epics Only
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreateTask} className="flex gap-3 mb-8 relative z-10">
                                <div className="relative flex-1 group">
                                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text)]/20 group-focus-within:text-[var(--primary)] transition-colors" size={14} />
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="Transmit new objective..."
                                        className="pc-input w-full pl-11 h-14 text-xs font-bold bg-[var(--text)]/[0.02] focus:bg-[var(--text)]/[0.05] border border-[var(--border)]/10 focus:border-[var(--primary)]/40 rounded-xl outline-none transition-all"
                                    />
                                </div>
                                <Button type="submit" className="h-14 px-6 bg-[var(--primary)] font-black text-[10px] uppercase rounded-xl">Add Task</Button>
                            </form>

                            <div className="flex-1 overflow-y-auto pc-scrollbar pr-4 space-y-4 min-h-0">
                                {myTasks.filter(t => !t.parentId).filter(task => {
                                    if (filterOnlyBig && !task.isBigTask) return false;
                                    if (filterCategory !== 'all' && task.categoryId?._id !== filterCategory && task.categoryId !== filterCategory) return false;
                                    return true;
                                }).length > 0 ? myTasks.filter(t => !t.parentId).filter(task => {
                                    if (filterOnlyBig && !task.isBigTask) return false;
                                    if (filterCategory !== 'all' && task.categoryId?._id !== filterCategory && task.categoryId !== filterCategory) return false;
                                    return true;
                                }).map(task => (
                                    <div key={task._id} className="space-y-3">
                                        <button
                                            onClick={() => handleToggleTaskSelection(task._id)}
                                            className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all group ${selectedTaskIds.includes(task._id)
                                                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--text)] shadow-lg shadow-[var(--primary)]/5'
                                                : 'bg-[var(--text)]/[0.02] border-[var(--border)]/10 text-[var(--text)]/40 hover:border-[var(--border)]/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className={`p-2 rounded-xl transition-all ${selectedTaskIds.includes(task._id) ? 'bg-[var(--primary)] text-white' : 'bg-[var(--text)]/5 text-[var(--text)]/10'
                                                    }`}>
                                                    <CheckSquare size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-extrabold truncate">{task.title}</span>
                                                    {task.isBigTask && <span className="text-[8px] font-extrabold uppercase text-[var(--primary)]/60 mt-0.5 tracking-widest">Mega Mission</span>}
                                                </div>
                                            </div>
                                            {selectedTaskIds.includes(task._id) && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]" />
                                            )}
                                        </button>

                                        {/* Sub-tasks with Elite styling */}
                                        <div className="ml-8 space-y-2 border-l-2 border-[var(--border)]/10 pl-6">
                                            {myTasks.filter(st => (st.parentId?._id || st.parentId) === task._id).map(st => (
                                                <button
                                                    key={st._id}
                                                    onClick={() => handleToggleTaskSelection(st._id)}
                                                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${selectedTaskIds.includes(st._id)
                                                        ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20 text-[var(--text)]'
                                                        : 'bg-transparent border-transparent text-[var(--text)]/30 hover:text-[var(--text)]/60'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <CheckSquare size={14} className={selectedTaskIds.includes(st._id) ? 'text-[var(--primary)]' : 'text-[var(--text)]/10'} />
                                                        <span className="text-xs font-bold truncate tracking-tight">{st.title}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[var(--border)]/10 rounded-3xl bg-[var(--text)]/[0.01]">
                                        <Target size={32} className="text-[var(--text)]/5" />
                                        <p className="text-[10px] font-black text-[var(--text)]/20 uppercase tracking-[0.4em] text-center leading-relaxed">Intelligence Void <br /> No matching sectors detected</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="primary"
                                className="w-full mt-10 h-16 bg-[var(--primary)] shadow-2xl shadow-[var(--primary)]/20 font-black text-xs uppercase tracking-[0.3em] rounded-2xl"
                                onClick={() => setShowTaskEditModal(false)}
                            >
                                Operationalize Strategy
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Session Summary Modal (After-Action Report) */}
            <AnimatePresence>
                {showSummaryModal && finishedTasks.length > 0 && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowSummaryModal(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="relative w-full max-w-xl bg-gradient-to-br from-[var(--surface)] to-[var(--bg)] border border-emerald-500/20 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(16,185,129,0.15)] text-center overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                            
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_20px_40px_rgba(16,185,129,0.2)] border border-emerald-500/20"
                            >
                                <Trophy size={48} />
                            </motion.div>

                            <h2 className="text-3xl font-black text-[var(--text)] uppercase tracking-tighter mb-3">Protocol Secured</h2>
                            <p className="text-[10px] font-black text-emerald-500/60 mb-10 uppercase tracking-[0.4em]">After-Action Report (AAR) Available</p>

                            <div className="space-y-4 mb-10 text-left max-h-72 overflow-y-auto pc-scrollbar pr-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-[var(--text)]/30 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Activity size={14} className="text-emerald-500" /> Objectives Neutralized
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase">{finishedTasks.length} Units</span>
                                </div>
                                
                                {finishedTasks.map((task, idx) => (
                                    <motion.div 
                                        key={task._id} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/10 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                            <span className="text-sm font-black text-[var(--text)] uppercase tracking-tight">{task.title}</span>
                                        </div>
                                        <div className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest">+XP RECORDED</div>
                                    </motion.div>
                                ))}
                            </div>

                            <Button
                                variant="primary"
                                className="w-full h-16 bg-emerald-600 shadow-xl shadow-emerald-600/30 font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all hover:scale-[1.02]"
                                onClick={() => setShowSummaryModal(false)}
                            >
                                Archive & Re-engage
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rewards / Points Feedback Sequence */}
            <AnimatePresence>
                {pointsPop.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: -150, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 2, filter: 'blur(20px)' }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none"
                    >
                        <div className="flex flex-col items-center">
                            <motion.div 
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="relative"
                            >
                                <span className="text-8xl font-black text-amber-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.8)]">+XP</span>
                                <span className="absolute -top-10 -right-10 text-4xl font-black text-amber-500">{pointsPop.points}</span>
                            </motion.div>
                            <span className="text-xl font-black text-white uppercase tracking-[0.6em] mt-8 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">Synchronized</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task Selector (Mission Briefing / Assignment) */}
            <AnimatePresence>
                {showTaskSelector && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowTaskSelector(false)}
                            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)]/10 rounded-[2.5rem] p-10 z-[111] shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 blur-[50px] rounded-full -mr-16 -mt-16" />
                            
                            <h2 className="text-xl font-black text-[var(--text)] mb-8 uppercase tracking-widest flex items-center gap-4">
                                <Target size={20} className="text-[var(--primary)]" /> Field Assignment
                            </h2>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto pc-scrollbar pr-3">
                                {myTasks.length > 0 ? myTasks.map(task => (
                                    <motion.button
                                        key={task._id}
                                        whileHover={{ x: 5 }}
                                        onClick={() => handleAssignTask(task._id)}
                                        className="w-full p-4 rounded-2xl bg-[var(--text)]/[0.02] border border-[var(--border)]/10 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 transition-all text-left flex items-center gap-4 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[var(--text)]/5 flex items-center justify-center text-[var(--text)]/20 group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-all">
                                            <Zap size={16} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-[var(--text)] truncate uppercase tracking-tight">{task.title}</span>
                                            <span className="text-[8px] font-black text-[var(--text)]/20 uppercase tracking-[0.2em] mt-1">Pending Sync</span>
                                        </div>
                                    </motion.button>
                                )) : (
                                    <div className="py-12 flex flex-col items-center justify-center gap-4">
                                        <Activity size={32} className="text-[var(--text)]/5" />
                                        <p className="text-[9px] font-black text-[var(--text)]/20 uppercase tracking-[0.4em] text-center">Operational Void<br/>No active protocols</p>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => setShowTaskSelector(false)}
                                className="w-full mt-8 py-4 text-[10px] font-black uppercase text-[var(--text)]/20 hover:text-[var(--text)]/60 transition-colors tracking-[0.4em]"
                            >
                                ABORT ASSIGNMENT
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Session Deployment (Config) */}
            <AnimatePresence>
                {showConfigModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfigModal(false)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)]/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(var(--primary-rgb),0.2)] overflow-hidden"
                        >
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-[100px]" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />

                            <div className="relative space-y-12">
                                <div className="text-center space-y-4">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                                        className="w-24 h-24 bg-[var(--primary)]/10 rounded-3xl flex items-center justify-center mx-auto border border-[var(--primary)]/20 shadow-2xl relative"
                                    >
                                        <Timer className="text-[var(--primary)]" size={40} />
                                        <div className="absolute inset-0 border-2 border-[var(--primary)]/20 rounded-3xl animate-ping" />
                                    </motion.div>
                                    <h2 className="text-4xl font-black text-[var(--text)] uppercase tracking-tighter">System Deployment</h2>
                                    <p className="text-[10px] font-black text-[var(--text)]/30 uppercase tracking-[0.5em]">Synchronizing Neural Focus Link</p>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {[25, 50, 90].map((mins, idx) => (
                                        <motion.button
                                            key={mins}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => setSessionDuration(mins)}
                                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${sessionDuration === mins
                                                ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10 text-[var(--text)]'
                                                : 'bg-[var(--text)]/[0.02] border-[var(--border)]/10 text-[var(--text)]/20 hover:border-[var(--border)]/30'
                                                }`}
                                        >
                                            <span className="text-3xl font-black">{mins}</span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Minutes</span>
                                        </motion.button>
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleStartSession}
                                    className="w-full h-20 bg-[var(--primary)] shadow-2xl shadow-[var(--primary)]/30 font-black text-sm uppercase tracking-[0.4em] rounded-[2rem] text-white flex items-center justify-center gap-4 transition-all"
                                >
                                    <Zap size={20} className="fill-white" />
                                    Initiate Uplink
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
