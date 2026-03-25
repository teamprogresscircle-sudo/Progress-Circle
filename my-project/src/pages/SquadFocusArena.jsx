import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
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

    // Stable Modal & Sidebar Callbacks
    const toggleTacticalSidebar = useCallback(() => setSidebarTacticalOpen(prev => !prev), []);
    const toggleIntelSidebar = useCallback(() => setSidebarIntelOpen(prev => !prev), []);
    const openTacticalConfig = useCallback(() => setShowTaskEditModal(true), []);
    const closeTacticalSidebar = useCallback(() => setSidebarTacticalOpen(false), []);
    const closeIntelSidebar = useCallback(() => setSidebarIntelOpen(false), []);
    const closeConfigModal = useCallback(() => setShowConfigModal(false), []);
    const openConfigModal = useCallback(() => setShowConfigModal(true), []);
    const closeTaskEditModal = useCallback(() => setShowTaskEditModal(false), []);
    const closeTaskSelector = useCallback(() => setShowTaskSelector(false), []);
    const openTaskSelector = useCallback((uid) => {
        setTargetUserId(uid);
        setShowTaskSelector(true);
    }, []);

    // Optimized filtering for Strategic Planner
    const filteredMainTasks = useMemo(() => {
        return myTasks.filter(t => !t.parentId && (!filterOnlyBig || t.isBigTask) && (filterCategory === 'all' || t.categoryId?._id === filterCategory || t.categoryId === filterCategory));
    }, [myTasks, filterOnlyBig, filterCategory]);

    useEffect(() => {
        if (!currentUser || !isLoaded) return;
        const state = { selectedIds: selectedTaskIds, finished: finishedTasks };
        localStorage.setItem(`squad_focus_${id}_${currentUser?._id || currentUser?.id}`, JSON.stringify(state));
    }, [selectedTaskIds, finishedTasks, id, currentUser, isLoaded]);

    const handleSendMessage = useCallback(async (text) => {
        try {
            const res = await api.post(`/social/rooms/${id}/chat`, { text });
            // The API returns the messages array in res.data.data, not the full room object
            if (res.data.success) setRoom(prev => prev ? { ...prev, messages: res.data.data } : prev);
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


    const me = useMemo(() => {
        if (!room?.members || !currentUser) return null;
        return room.members.find(p => {
            const pId = p.user?._id?.toString() || p.user?.id?.toString() || p.user?.toString();
            const cId = currentUser?._id?.toString() || currentUser?.id?.toString();
            return pId && cId && pId === cId;
        });
    }, [room?.members, currentUser]);


    const members = room?.members || [];
    const messages = room?.messages || [];

    // ── MEMOIZED HUD SECTIONS ──────────────────────────────────────────────
    
    // 1. Stable Header Block
    const headerBlock = useMemo(() => (
        <header className="h-24 border-b border-[var(--primary)]/10 flex items-center justify-between px-12 bg-[#0b0f1a] relative shrink-0 overflow-hidden">
            {/* Tactical Glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />
            
            <div className="flex items-center gap-8 relative z-10">
                <div className="relative group">
                    <div className="absolute inset-0 bg-[var(--primary)] blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                    <div className="relative p-4 rounded-[2rem_0.5rem_2rem_0.5rem] bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all duration-700 hover:rotate-[360deg]">
                        <Swords size={24} />
                    </div>
                </div>
                
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black uppercase tracking-[0.4em] text-white">
                            Neural <span className="text-[var(--primary)]">Arena</span>
                        </h1>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                            <Shield size={10} className="text-[var(--primary)]" />
                            <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">{room?.league || 'Elite'} Protocol</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{members.length} Active Nodes</span>
                        </div>
                        <div className="w-1 h-3 border-l border-white/10" />
                        <div className="flex items-center gap-2">
                            <Zap size={10} className="text-amber-500" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{(room?.squadXP || 0).toLocaleString()} Total Power</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side Status Readouts */}
            <div className="flex items-center gap-6 relative z-10 text-white">
                <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-[1.2rem_0.4rem_1.2rem_0.4rem] border border-white/5 shadow-inner">
                    <button
                        onClick={toggleTacticalSidebar}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${
                            sidebarTacticalOpen 
                                ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] border border-white/10' 
                                : 'text-white/20 hover:text-white/60 hover:bg-white/5'
                        }`}
                        title="Tactical Loadout"
                    >
                        <Target size={18} />
                    </button>
                    <button
                        onClick={toggleIntelSidebar}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${
                            sidebarIntelOpen 
                                ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] border border-white/10' 
                                : 'text-white/20 hover:text-white/60 hover:bg-white/5'
                        }`}
                        title="Intelligence Feed"
                    >
                        <MessageSquare size={18} />
                    </button>
                </div>

                <div className="h-10 w-px bg-white/5" />

                <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black text-[var(--primary)]/60 uppercase tracking-[0.3em]">Uplink Active</span>
                    <span className="text-[11px] font-mono text-white/20 tracking-tighter uppercase whitespace-nowrap">REF: {id?.slice(-8)}</span>
                </div>
                
                <div className="h-10 w-px bg-white/5" />
                
                <button 
                  onClick={() => navigate('/squad')}
                  className="group relative px-6 py-3 rounded-[1.5rem_0.4rem_1.5rem_0.4rem] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all overflow-hidden shadow-lg hover:shadow-red-500/20"
                >
                    <div className="flex items-center gap-3 relative z-10 transition-transform active:scale-95">
                        <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em]">Disengage</span>
                    </div>
                </button>
            </div>
        </header>
    ), [members.length, room?.league, room?.squadXP, id, navigate, sidebarTacticalOpen, sidebarIntelOpen, toggleTacticalSidebar, toggleIntelSidebar]);

    // 2. Stable Tactical Sidebar Block
    const tacticalSidebarBlock = useMemo(() => {
        if (!sidebarTacticalOpen) return null;
        return (
            <div className="lg:col-span-3 border-r border-[var(--border)]/10 h-full overflow-hidden transition-all duration-300">
                <TacticalSidebar 
                    myTasks={myTasks}
                    selectedTaskIds={selectedTaskIds}
                    onToggleTaskStatus={handleToggleTaskStatus}
                    onOpenConfig={openTacticalConfig}
                    onClose={closeTacticalSidebar}
                />
            </div>
        );
    }, [sidebarTacticalOpen, myTasks, selectedTaskIds, handleToggleTaskStatus, openTacticalConfig, closeTacticalSidebar]);

    // 3. Stable Main Interactive Zone Block
    const mainZoneBlock = useMemo(() => (
        <main className={`flex flex-col p-8 overflow-y-auto pc-scrollbar relative bg-[var(--bg)] min-h-0 ${
            sidebarTacticalOpen && sidebarIntelOpen 
                ? 'lg:col-span-6' 
                : (sidebarTacticalOpen || sidebarIntelOpen ? 'lg:col-span-9' : 'lg:col-span-12')
        }`}>
            <div className="flex-1 flex flex-col items-center justify-start space-y-20 pt-12 pb-24">
                <TimerDisplay 
                    isActive={room?.activeSession?.isActive}
                    startTime={room?.activeSession?.startTime}
                    duration={room?.activeSession?.durationMinutes}
                    isPaused={room?.activeSession?.isPaused}
                    isHost={isHost}
                    onControl={handleControl}
                    onComplete={handleCompleteSession}
                    onOpenConfig={openConfigModal}
                />

                <OperativeGrid 
                    members={members}
                    currentUserId={currentUser?._id || currentUser?.id}
                    hostId={room?.host?._id || room?.host?.id || room?.host}
                    onAssignTask={openTaskSelector}
                />
            </div>
        </main>
    ), [sidebarTacticalOpen, sidebarIntelOpen, room?.activeSession, isHost, handleControl, handleCompleteSession, openConfigModal, members, currentUser, room?.host, openTaskSelector]);

    // 4. Stable Intelligence Sidebar Block
    const intelligenceSidebarBlock = useMemo(() => {
        if (!sidebarIntelOpen) return null;
        return (
            <div className="lg:col-span-3 border-l border-[var(--border)]/10 h-full overflow-hidden transition-all duration-300">
                <Suspense fallback={<div className="h-full bg-[var(--bg)]/40 border-l border-[var(--border)]/10 animate-pulse" />}>
                    <IntelligenceSidebar 
                        messages={messages}
                        currentUser={currentUser}
                        onSendMessage={handleSendMessage}
                        participants={room?.activeBattle?.participants || []}
                        league={room?.league}
                        onClose={closeIntelSidebar}
                    />
                </Suspense>
            </div>
        );
    }, [sidebarIntelOpen, messages, currentUser, handleSendMessage, room?.activeBattle, room?.league, closeIntelSidebar]);

    if (loading || !currentUser) return <LoadingSpinner />;
    if (!room) return <div className="text-center py-20 text-white">Squad Room not found or expired.</div>;

    if (!loading && room && !me) {
        return (
            <div className="text-center py-20 flex flex-col items-center gap-4 bg-[#070708] min-h-screen pt-40">
                <p className="text-white/60 font-bold">Identity Error: You are not in this Room.</p>
                <div className="flex items-center gap-4">
                    <Button onClick={fetchRoom} variant="primary">Retry Connection</Button>
                    <Button onClick={() => navigate('/squad')} variant="secondary">Return to Squad</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[var(--bg)] z-50 flex flex-col overflow-hidden font-sans selection:bg-[var(--primary)]/30">
            {headerBlock}

            <div className="flex-1 grid lg:grid-cols-12 gap-0 overflow-hidden relative">
                {tacticalSidebarBlock}
                {mainZoneBlock}
                {intelligenceSidebarBlock}
            </div>
            {/* Task Edit Modal (Strategic Planner) */}
            {showTaskEditModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowTaskEditModal(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300"
                    />
                    <div
                        className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)]/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all duration-300 transform scale-100 opacity-100"
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
                                {filteredMainTasks.length > 0 ? filteredMainTasks.map(task => (
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
                                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)] transition-transform duration-200 scale-100" />
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
                        </div>
                    </div>
                )}

            {/* Session Summary Modal (After-Action Report) */}
            {showSummaryModal && finishedTasks.length > 0 && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowSummaryModal(false)}
                        className="absolute inset-0 bg-black/90 backdrop-blur-2xl transition-opacity duration-300"
                    />
                    <div
                        className="relative w-full max-w-xl bg-gradient-to-br from-[var(--surface)] to-[var(--bg)] border border-emerald-500/20 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(16,185,129,0.15)] text-center overflow-hidden transition-all duration-300 transform scale-100 opacity-100"
                    >
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                        
                        <div 
                            className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_20px_40px_rgba(16,185,129,0.2)] border border-emerald-500/20 transition-transform duration-500 scale-100"
                        >
                            <Trophy size={48} />
                        </div>

                            <h2 className="text-3xl font-black text-[var(--text)] uppercase tracking-tighter mb-3">Protocol Secured</h2>
                            <p className="text-[10px] font-black text-emerald-500/60 mb-10 uppercase tracking-[0.4em]">After-Action Report (AAR) Available</p>

                            <div className="space-y-4 mb-10 text-left max-h-72 overflow-y-auto pc-scrollbar pr-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-[var(--text)]/30 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Activity size={14} className="text-emerald-500" /> Objectives Neutralized
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase">{finishedTasks.length} Units</span>
                                </div>
                                {finishedTasks.map((task) => (
                                    <div 
                                        key={task._id} 
                                        className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/10 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                            <span className="text-sm font-black text-[var(--text)] uppercase tracking-tight">{task.title}</span>
                                        </div>
                                        <div className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest">+XP RECORDED</div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="primary"
                                className="w-full h-16 bg-emerald-600 shadow-xl shadow-emerald-600/30 font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all hover:scale-[1.02]"
                                onClick={() => setShowSummaryModal(false)}
                            >
                                Archive & Re-engage
                            </Button>
                        </div>
                    </div>
                )}

            {/* Rewards / Points Feedback Sequence */}
            {pointsPop.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <span className="text-8xl font-black text-amber-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.8)]">+XP</span>
                            <span className="absolute -top-10 -right-10 text-4xl font-black text-amber-500">{pointsPop.points}</span>
                        </div>
                        <span className="text-xl font-black text-white uppercase tracking-[0.6em] mt-8 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">Synchronized</span>
                    </div>
                </div>
            )}

            {/* Task Selector (Mission Briefing / Assignment) */}
            {showTaskSelector && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowTaskSelector(false)}
                        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity duration-300"
                    />
                    <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)]/10 rounded-[2.5rem] p-10 z-[111] shadow-2xl overflow-hidden transition-all duration-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 blur-[50px] rounded-full -mr-16 -mt-16" />
                        
                        <h2 className="text-xl font-black text-[var(--text)] mb-8 uppercase tracking-widest flex items-center gap-4">
                            <Target size={20} className="text-[var(--primary)]" /> Field Assignment
                        </h2>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto pc-scrollbar pr-3">
                            {myTasks.length > 0 ? myTasks.map(task => (
                                <button
                                    key={task._id}
                                    onClick={() => handleAssignTask(task._id)}
                                    className="w-full p-4 rounded-2xl bg-[var(--text)]/[0.02] border border-[var(--border)]/10 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 hover:translate-x-1 transition-all text-left flex items-center gap-4 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[var(--text)]/5 flex items-center justify-center text-[var(--text)]/20 group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-all">
                                        <Zap size={16} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-black text-[var(--text)] truncate uppercase tracking-tight">{task.title}</span>
                                        <span className="text-[8px] font-black text-[var(--text)]/20 uppercase tracking-[0.2em] mt-1">Pending Sync</span>
                                    </div>
                                </button>
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
                    </div>
                </div>
            )}

            {/* Neural Control Interface (Strategic Deployment) */}
            <AnimatePresence>
                {showConfigModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeConfigModal}
                            className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg overflow-hidden rounded-[6rem_1rem_6rem_1rem] p-12"
                            style={{
                                background: `radial-gradient(circle at 30% 20%, rgba(var(--primary-rgb), 0.15), transparent 60%), linear-gradient(145deg, #0b0f1a, #151824)`,
                                border: '1px solid rgba(var(--primary-rgb), 0.1)',
                                boxShadow: `inset 0 0 40px rgba(var(--primary-rgb), 0.08), 0 30px 80px rgba(0,0,0,0.8)`
                            }}
                        >
                            {/* Tactical Accents */}
                            <div className="absolute top-0 left-0 w-32 h-1 bg-[var(--primary)]" />
                            <div className="absolute top-0 left-0 w-1 h-32 bg-[var(--primary)]" />
                            <div className="absolute bottom-0 right-0 w-32 h-1 bg-[var(--primary)]/20" />
                            <div className="absolute bottom-0 right-0 w-1 h-32 bg-[var(--primary)]/20" />

                            <div className="relative space-y-12">
                                {/* Tactical Header */}
                                <div className="text-center space-y-5">
                                    <div className="relative w-24 h-24 mx-auto">
                                        <div 
                                            className="absolute inset-0 bg-[var(--primary)]/10 rounded-[2rem_0.5rem_2rem_0.5rem] border border-[var(--primary)]/20"
                                            style={{ boxShadow: `0 0 20px rgba(var(--primary-rgb), 0.1)` }}
                                        />
                                        <div className="relative h-full flex items-center justify-center">
                                            <Timer className="text-[var(--primary)]" size={40} />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                                            <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em]">Neural Link: Ready</span>
                                        </div>
                                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight" style={{ letterSpacing: '1.5px' }}>Cognitive Lock-In</h2>
                                        <p className="text-[11px] font-medium text-white/40 uppercase tracking-[0.3em]">Protocol Initiation Required</p>
                                    </div>
                                </div>

                                {/* Energy Node Selection Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[25, 50, 90].map((mins) => (
                                        <motion.button
                                            key={mins}
                                            whileHover={{ scale: 1.05, y: -4 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSessionDuration(mins)}
                                            className={`relative p-8 rounded-[2rem_0.5rem_2rem_0.5rem] border flex flex-col items-center gap-3 transition-all duration-300 ${sessionDuration === mins
                                                ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_0_25px_rgba(var(--primary-rgb),0.6)]'
                                                : 'bg-white/[0.02] border-white/5 text-white/30 hover:border-[var(--primary)]/30 hover:bg-white/[0.04]'
                                                }`}
                                            style={sessionDuration === mins ? {
                                                background: `linear-gradient(135deg, var(--primary), var(--accent))`,
                                                boxShadow: `0 0 35px rgba(var(--primary-rgb), 0.5)`
                                            } : {}}
                                        >
                                            <span className={`text-4xl font-black ${sessionDuration === mins ? 'text-white' : ''}`}>{mins}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Minute</span>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* High-Impact Launch Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleStartSession}
                                    className="group relative w-full h-20 overflow-hidden font-black text-xs uppercase tracking-[0.5em] rounded-[1.5rem_0.5rem_1.5rem_0.5rem] text-white flex items-center justify-center gap-4 shadow-[0_10px_40px_rgba(var(--primary-rgb),0.4)] hover:shadow-[0_15px_50px_rgba(var(--primary-rgb),0.6)] transition-all"
                                >
                                    <div 
                                        className="absolute inset-0"
                                        style={{
                                            background: `linear-gradient(90deg, var(--primary), var(--accent), var(--primary))`,
                                            backgroundSize: '200% 100%',
                                            animation: 'gradientMove 3s linear infinite'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                    <Zap size={20} className="relative z-10 fill-white group-hover:scale-125 transition-transform" />
                                    <span className="relative z-10">Initiate Uplink</span>
                                </motion.button>

                                <button 
                                    onClick={closeConfigModal}
                                    className="w-full py-2 text-[9px] font-black uppercase text-white/20 hover:text-white/60 transition-colors tracking-[0.4em]"
                                >
                                    Disengage Protocol
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
