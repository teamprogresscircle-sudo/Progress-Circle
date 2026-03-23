import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Timer, Trophy, X, Shield, Swords,
    Flame, Target, Pause, Play, LogOut,
    CheckSquare, Activity, MessageSquare, Plus
} from 'lucide-react';
import api from '../api/client';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function SquadFocusArena() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
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
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(25);
    const [pointsPop, setPointsPop] = useState({ show: false, points: 0 });

    useEffect(() => {
        if (!currentUser) return;
        fetchRoom();
        fetchMyTasks();
        fetchCategories();

        // Load persistent state
        const savedState = localStorage.getItem(`squad_focus_${id}_${currentUser?._id || currentUser?.id}`);
        console.log("Loading state for", id, savedState);
        if (savedState) {
            try {
                const { selectedIds, finished } = JSON.parse(savedState);
                if (selectedIds) setSelectedTaskIds(selectedIds);
                if (finished) setFinishedTasks(finished);
            } catch (e) {
                console.error('Failed to parse saved session state');
            }
        }
        setIsLoaded(true);

        const interval = setInterval(fetchRoom, 3000);
        return () => clearInterval(interval);
    }, [id, currentUser]);

    // Save persistent state
    useEffect(() => {
        if (!currentUser || !isLoaded) return;

        const state = {
            selectedIds: selectedTaskIds,
            finished: finishedTasks
        };
        console.log("Saving state for", id, state);
        localStorage.setItem(`squad_focus_${id}_${currentUser?._id || currentUser?.id}`, JSON.stringify(state));
    }, [selectedTaskIds, finishedTasks, id, currentUser, isLoaded]);

    const handleSendMessage = async (e) => {
        if (e.key !== 'Enter' || !messageInput.trim()) return;
        try {
            const res = await api.post(`/social/rooms/${id}/chat`, { text: messageInput });
            if (res.data.success) {
                setRoom(res.data.data);
                setMessageInput('');
            }
        } catch (err) {
            toast.error('Message failed to send');
        }
    };
    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            if (res.data.success) setCategories(res.data.data);
        } catch (err) {
            console.error('Failed to fetch categories');
        }
    };

    const fetchMyTasks = async () => {
        try {
            const res = await api.get('/tasks');
            if (res.data.success) {
                const tasks = res.data.data.filter(t => t.status !== 'completed');
                setMyTasks(tasks);
                // No longer auto-initializing selectedTaskIds to allow user choice
            }
        } catch (err) {
            console.error('Failed to fetch tasks');
        }
    };

    const handleCreateTask = async (e) => {
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
        } catch (err) {
            toast.error('Failed to create task');
        }
    };

    const handleAssignTask = async (taskId) => {
        try {
            const battleId = room.activeBattle?._id || room.activeBattle;
            if (!battleId) {
                toast.error('Tactical session not active');
                return;
            }
            const res = await api.post(`/social/battle/add-task/${battleId}`, {
                taskId,
                targetUserId
            });
            if (res.data.success) {
                toast.success('Mission assigned to operative');
                // Remove from my selection if it was there
                setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
                fetchRoom();
                setShowTaskSelector(false);
            }
        } catch (err) {
            toast.error('Assignment synchronization failed');
        }
    };

    const handleToggleTaskSelection = (taskId) => {
        setSelectedTaskIds(prev => {
            const isSelecting = !prev.includes(taskId);
            const task = myTasks.find(t => t._id === taskId);
            let newSelection = [...prev];

            if (isSelecting) {
                newSelection.push(taskId);
                // If Big Task, select all children
                if (task.isBigTask) {
                    const children = myTasks.filter(t => (t.parentId?._id || t.parentId) === taskId);
                    children.forEach(c => {
                        if (!newSelection.includes(c._id)) newSelection.push(c._id);
                    });
                }
                // If Child Task, ensure parent is selected
                if (task.parentId) {
                    const pId = task.parentId?._id || task.parentId;
                    if (!newSelection.includes(pId)) newSelection.push(pId);
                }
            } else {
                newSelection = newSelection.filter(id => id !== taskId);
                // If Big Task, deselect all children
                if (task.isBigTask) {
                    const children = myTasks.filter(t => (t.parentId?._id || t.parentId) === taskId);
                    children.forEach(c => {
                        newSelection = newSelection.filter(id => id !== c._id);
                    });
                }
            }
            return newSelection;
        });
    };

    const fetchRoom = async () => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/social/rooms/${id}`);
            if (res.data.success) {
                const r = res.data.data;
                setRoom(r);
                const hostId = r.host?._id || r.host?.id || r.host;
                const currentId = currentUser?._id || currentUser?.id;
                setIsHost(String(hostId) === String(currentId));

                if (r.activeSession?.isActive && r.activeSession?.startTime) {
                    const start = new Date(r.activeSession.startTime);
                    const end = new Date(start.getTime() + (r.activeSession.durationMinutes * 60000));
                    const remaining = Math.max(0, Math.floor((end - new Date()) / 1000));
                    setTimeLeft(remaining);

                    if (remaining === 0 && String(hostId) === String(currentId)) {
                        handleCompleteSession();
                    }
                } else {
                    setTimeLeft(0);
                }
            }
        } catch (err) {
            console.error('Failed to sync room state');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSession = async () => {
        try {
            const res = await api.post(`/social/rooms/${id}/session/end`);
            if (res.data.success) {
                fetchRoom();
                setShowSummaryModal(true);
            }
        } catch (err) {
            toast.error('Failed to complete session');
        }
    };

    const handleToggleTaskStatus = async (taskId) => {
        try {
            const task = myTasks.find(t => t._id === taskId);
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            
            // If in active battle, use the battle-specific route to award points
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

                        toast.success(`Objective Secured! +${pts} XP`, {
                            icon: <Trophy className="text-amber-400" />
                        });
                        setFinishedTasks(prev => [task, ...prev]);
                    }
                    fetchRoom();
                    fetchMyTasks();
                }
            } else {
                const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
                if (res.data.success) {
                    if (newStatus === 'completed') {
                        setFinishedTasks(prev => [task, ...prev]);
                    }
                    fetchMyTasks();
                    fetchRoom();
                }
            }
        } catch (err) {
            toast.error('Sync failed');
        }
    };

    const handleStartSession = async () => {
        try {
            const res = await api.post(`/social/rooms/${id}/session/start`, {
                duration: sessionDuration,
                type: 'battle'
            });
            if (res.data.success) {
                toast.success('Battle Synchronized. All operatives on standby.', {
                    icon: <Zap className="text-amber-400" />
                });
                setShowConfigModal(false);
                fetchRoom();
            }
        } catch (err) {
            toast.error('Neural uplink failed');
        }
    };

    const handleControl = async (action) => {
        try {
            const res = await api.post(`/social/rooms/${id}/session/control`, { action });
            if (res.data.success) {
                toast.success(`Session ${action === 'pause' ? 'Paused' : 'Resumed'}`);
                fetchRoom();
            }
        } catch (err) {
            toast.error(`Failed to ${action} session`);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading || !currentUser) return <LoadingSpinner />;
    if (!room) return <div className="text-center py-20 text-white">Squad Room not found or expired.</div>;

    const me = room.members.find(p => {
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
        <div className="fixed inset-0 bg-[#070708] z-50 flex flex-col overflow-hidden">
            {/* Minimal Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02] backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Swords size={18} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">Squad Focus <span className="text-muted opacity-50 underline decoration-indigo-500/50 underline-offset-4">ID-{id.slice(-4)}</span></h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{room.league || 'Bronze'} LEAGUE</span>
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">• {room.squadXP?.toLocaleString() || 0} XP</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${room.activeSession?.isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                        <span className="text-[10px] font-black uppercase text-muted tracking-widest">{room.activeSession?.isActive ? 'Active Protocol' : 'Standby'}</span>
                    </div>
                    <button onClick={() => navigate('/squad')} className="p-2 text-muted hover:text-white transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 grid lg:grid-cols-4 gap-0 overflow-hidden">
                {/* Left Sidebar: Strategic Control */}
                <div className="lg:col-span-1 border-r border-white/5 p-6 space-y-8 overflow-y-auto pc-scrollbar bg-[#09090A]">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Target size={14} className="text-indigo-400" /> My Tasks
                            </h3>
                            <span className="text-[9px] font-black text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">{myTasks.filter(t => t.status === 'completed').length} DONE</span>
                        </div>
                        <div className="space-y-3">
                            {myTasks?.filter(t => selectedTaskIds.includes(t._id)).length > 0 ?
                                myTasks.filter(t => selectedTaskIds.includes(t._id) && !t.parentId).map((task) => (
                                    <div key={task._id} className="space-y-2">
                                        <div
                                            className={`p-4 rounded-2xl bg-white/[0.03] border flex items-center justify-between gap-3 transition-all group border-white/5 ${task.isBigTask ? 'border-indigo-500/20 bg-indigo-500/[0.01]' : ''}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <button
                                                    onClick={() => handleToggleTaskStatus(task._id)}
                                                    className="p-1.5 rounded-lg transition-all bg-white/5 text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10"
                                                >
                                                    <CheckSquare size={14} />
                                                </button>
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-black truncate ${task.isBigTask ? 'text-indigo-400' : 'text-white'}`}>
                                                        {task.title}
                                                    </span>
                                                    {task.isBigTask && <span className="text-[7px] font-black uppercase text-indigo-400/50">Master Mission</span>}
                                                </div>
                                            </div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${task.isBigTask ? 'bg-indigo-400' : 'bg-indigo-500/50'} shadow-[0_0_5px_rgba(99,102,241,0.3)]`} />
                                        </div>

                                        {/* Render Sub-tasks */}
                                        <div className="ml-6 space-y-2">
                                            {myTasks.filter(st => (st.parentId?._id || st.parentId) === task._id && selectedTaskIds.includes(st._id)).map(st => (
                                                <div
                                                    key={st._id}
                                                    className="p-3 rounded-xl bg-white/[0.015] border border-white/5 flex items-center justify-between gap-3 group"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <button
                                                            onClick={() => handleToggleTaskStatus(st._id)}
                                                            className="p-1.5 rounded-lg bg-white/5 text-white/10 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                                                        >
                                                            <CheckSquare size={12} />
                                                        </button>
                                                        <span className="text-[11px] font-bold text-white/70 truncate">{st.title}</span>
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-indigo-500/30" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                        <p className="text-[10px] font-black text-muted uppercase">No Tasks Active</p>
                                    </div>
                                )}
                            <Button
                                variant="ghost"
                                className="w-full text-[10px] h-11 border-dashed bg-white/[0.02] border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30"
                                icon={Zap}
                                onClick={() => { setShowTaskEditModal(true) }}
                            >
                                Edit Tasks
                            </Button>
                        </div>
                    </div>

                    {/* Shared Intelligence: Other Participants */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={14} className="text-emerald-400" /> Squad Status
                        </h3>
                        <div className="space-y-8">
                            {currentUser && room.members.filter(p => {
                                const myId = (currentUser?._id || currentUser?.id)?.toString();
                                const peerId = (p.user?._id || p.user?.id || p.user)?.toString();
                                const myName = currentUser?.name?.toLowerCase().trim();
                                const peerName = p.user?.name?.toLowerCase().trim();

                                const isMe = (myId && peerId && myId === peerId) || (myName && peerName && myName === peerName);
                                return true;
                            }).map((peer) => {
                                const myId = (currentUser?._id || currentUser?.id)?.toString();
                                const peerId = (peer.user?._id || peer.user?.id || peer.user)?.toString();
                                const isMe = (myId && peerId && myId === peerId);
                                return (
                                <div key={peer._id} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={peer.user?.avatar} name={peer.user?.name} size="xs" />
                                            <span className="text-[11px] font-black text-white uppercase tracking-tighter">
                                                {peer.user?.name}
                                                {isMe && <span className="ml-1 text-indigo-400 font-bold">(YOU)</span>}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${peer.status === 'focusing' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                            <span className={`text-[9px] font-black uppercase ${peer.status === 'focusing' ? 'text-emerald-400' : 'text-amber-400'}`}>{peer.status}</span>
                                        </div>
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-3">
                                        <Timer size={12} className="text-white/30" />
                                        <span className="text-[10px] font-bold text-white/60">Session Time: {Math.floor(peer.totalFocusTime / 60)}h {(peer.totalFocusTime % 60)}m</span>
                                    </div>

                                    {/* Member's Assigned Tasks */}
                                    {room.activeBattle?.participants?.find(p => (p.user?._id || p.user) === (peer.user?._id || peer.user))?.battleTasks?.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {room.activeBattle.participants.find(p => (p.user?._id || p.user) === (peer.user?._id || peer.user)).battleTasks.map(bt => (
                                                <div key={bt._id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${bt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-white/20'}`}>
                                                            {bt.status === 'completed' ? <CheckSquare size={10} /> : <Zap size={10} />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold truncate ${bt.status === 'completed' ? 'text-white/30 line-through' : 'text-white/70'}`}>{bt.title}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Task Assignment for Host */}
                                    {isHost && !isMe && (
                                        <button
                                            onClick={() => { setTargetUserId(peer.user?._id || peer.user?.id || peer.user); setShowTaskSelector(true); }}
                                            className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-[9px] font-black uppercase text-muted hover:text-indigo-400 hover:border-indigo-400/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={10} /> Assign Task
                                        </button>
                                    )}
                                </div>
                            );
                            })}
                        </div>
                    </div>

                    {/* Leaderboard Section */}
                    {room.activeBattle?.participants?.length > 0 && (
                        <div className="space-y-6 pt-6 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Trophy size={14} className="text-amber-400" /> Top Operatives
                                </h3>
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                                    <Star size={10} className="text-indigo-400" fill="currentColor" fillOpacity={0.2} />
                                    <span className="text-[9px] font-black text-indigo-400 uppercase">{room.league || 'Bronze'}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[...(room.activeBattle.participants || [])]
                                    .sort((a, b) => b.pointsEarned - a.pointsEarned)
                                    .map((p, idx) => (
                                        <div key={p.user?._id || p.user} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-white/20 w-4">{idx + 1}.</span>
                                                <Avatar src={p.user?.avatar} name={p.user?.name} size="xs" />
                                                <span className="text-[11px] font-bold text-white/80">{p.user?.name}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[11px] font-black text-indigo-400">+{p.pointsEarned} XP</span>
                                                <span className="text-[8px] font-black text-white/20 uppercase">{p.tasksCompleted} Missions</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Center: The Grand Arena Grid */}
                <div className="lg:col-span-2 relative flex flex-col p-8 overflow-y-auto pc-scrollbar">
                    <div className="max-w-3xl mx-auto w-full space-y-12">
                        {/* Timer UI */}
                        {/* Timer UI */}
                        <div className="text-center space-y-8">
                            <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="144"
                                        cy="144"
                                        r="130"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-white/5"
                                    />
                                    <motion.circle
                                        cx="144"
                                        cy="144"
                                        r="130"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray="816.8"
                                        initial={{ strokeDashoffset: 816.8 }}
                                        animate={{
                                            strokeDashoffset: 816.8 - (816.8 * (timeLeft / (room.activeSession?.durationMinutes * 60 || 1)))
                                        }}
                                        transition={{ duration: 1, ease: "linear" }}
                                        className="text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <motion.span
                                        animate={{
                                            scale: room.activeSession?.isActive ? [1, 1.05, 1] : 1,
                                            color: timeLeft > 0 && timeLeft < 300 ? ['#ffffff', '#f43f5e', '#ffffff'] : '#ffffff'
                                        }}
                                        transition={{ repeat: Infinity, duration: timeLeft < 300 ? 1 : 4 }}
                                        className="text-7xl font-black tracking-tighter tabular-nums text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                    >
                                        {room.activeSession?.isActive ? formatTime(timeLeft) : '00:00'}
                                    </motion.span>
                                    <span className="text-[10px] font-black uppercase text-muted tracking-[0.3em] mt-2">Protocol {room.activeSession?.isActive ? 'Active' : 'Standby'}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                {isHost && !room.activeSession?.isActive && (
                                    <Button onClick={() => setShowConfigModal(true)} variant="primary" className="px-12 h-14 bg-indigo-600 font-extrabold shadow-xl shadow-indigo-600/20">INITIATE FOCUS</Button>
                                )}
                                {isHost && room.activeSession?.isActive && (
                                    <Button icon={Pause} onClick={() => handleControl('pause')} variant="secondary" className="px-8 h-14 bg-white/5 border-white/10">PAUSE</Button>
                                )}
                                {isHost && room.activeSession?.isActive && (
                                    <Button icon={X} onClick={() => handleControl('end')} className="px-8 h-14 bg-rose-600/20 border-rose-600/30 text-rose-500 hover:bg-rose-600 hover:text-white transition-all">ABORT</Button>
                                )}
                            </div>
                        </div>

                        {/* Roster Grid */}
                        <div className={`grid gap-6 ${room.members.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {room.members.map((p) => {
                                const isCurrentUser = String(p.user?._id || p.user?.id || p.user) === String(currentUser?._id || currentUser?.id);
                                return (
                                    <motion.div
                                        key={p._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex flex-col items-center gap-4 p-6 rounded-3xl bg-white/[0.02] border transition-all ${isCurrentUser ? 'border-indigo-500/30 bg-indigo-500/[0.02]' : 'border-white/5'
                                            }`}
                                    >
                                        <div className="relative">
                                            <Avatar src={p.user?.avatar} name={p.user?.name} size="lg" />
                                            {String(room.host?._id || room.host?.id || room.host) === String(p.user?._id || p.user?.id || p.user) && (
                                                <div className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-500 shadow-lg border-2 border-[#0D0D0F]">
                                                    <Shield size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center w-full">
                                            <h4 className="text-xs font-black text-white uppercase truncate">{p.user?.name}</h4>
                                            <div className="flex items-center justify-between mt-3 mb-1 px-1">
                                                <span className="text-[9px] font-black text-muted uppercase">Status</span>
                                                <span className={`text-[9px] font-black uppercase ${p.status === 'focusing' ? 'text-emerald-400' : 'text-amber-400'}`}>{p.status}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: p.status === 'focusing' ? '100%' : '50%' }}
                                                    className={`h-full ${isCurrentUser ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : (p.status === 'focusing' ? 'bg-emerald-500/50' : 'bg-amber-500/50')}`}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Host Global Controls */}
                        {isHost && (
                            <div className="flex justify-center gap-4 pt-8 border-t border-white/5">
                                {!room.activeSession?.isActive ? (
                                    <Button icon={Play} onClick={() => handleStartSession(25)} className="bg-indigo-600 shadow-lg shadow-indigo-600/20 px-8 py-6 text-sm">Start 25m Focus</Button>
                                ) : (
                                    <Button icon={X} onClick={() => handleCompleteSession()} className="bg-emerald-600 shadow-lg shadow-emerald-600/20 px-8 py-6 text-sm">Complete Session</Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar: Signal Log & Comms */}
                <div className="lg:col-span-1 border-l border-white/5 p-6 flex flex-col overflow-hidden bg-[#09090A]">
                    <div className="flex-1 space-y-6 overflow-y-auto pc-scrollbar pr-2">
                        <div className="space-y-4 pt-4 max-h-[100%] flex flex-col overflow-hidden h-full">
                            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                <MessageSquare size={14} className="text-indigo-400" /> Squad Comm Channel
                            </h3>
                            <div className="flex-1 space-y-4 overflow-y-auto pc-scrollbar pr-2">
                                {room.messages?.map((msg, i) => {
                                    const isMe = String(msg.sender?._id || msg.sender?.id || msg.sender) === String(currentUser?._id || currentUser?.id);
                                    return (
                                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-bold ${isMe ? 'bg-indigo-500 text-white rounded-tr-none shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-white/5 text-white/80 rounded-tl-none border border-white/5'
                                                }`}>
                                                {!isMe && <p className="text-[8px] opacity-40 uppercase mb-1">{msg.sender?.name || 'Squad Member'}</p>}
                                                {msg.text}
                                            </div>
                                            <span className="text-[7px] text-muted font-black uppercase mt-1 tracking-widest">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 mt-auto">
                        <div className="relative group">
                            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors" size={14} />
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={handleSendMessage}
                                placeholder="Transmit message..."
                                className="pc-input w-full pl-11 h-12 text-xs font-bold bg-white/[0.02] focus:bg-white/[0.05]"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Task Edit Modal Overlay */}
            <AnimatePresence>
                {showTaskEditModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTaskEditModal(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0D0D0F] border border-white/10 rounded-3xl p-8 z-[61] shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <Target size={20} className="text-indigo-500" /> Session Objectives
                                </h2>
                                <button onClick={() => setShowTaskEditModal(false)} className="text-muted hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Rapid Task Entry & Filters */}
                            <div className="space-y-4 mb-8">
                                <form onSubmit={handleCreateTask} className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors" size={14} />
                                        <input
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="Transmit new objective..."
                                            className="pc-input w-full pl-11 h-12 text-xs font-bold bg-white/[0.02] focus:bg-white/[0.05]"
                                        />
                                    </div>
                                    <Button type="submit" className="h-12 px-6 bg-indigo-600 font-black text-[10px] uppercase">Add Task</Button>
                                </form>

                                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-black uppercase text-muted">Category:</label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="bg-transparent text-[10px] font-bold text-white outline-none border-b border-white/10 pb-1"
                                        >
                                            <option value="all" className="bg-[#0D0D0F]">All Sectors</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id} className="bg-[#0D0D0F]">{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-px h-4 bg-white/10" />
                                    <button
                                        onClick={() => setFilterOnlyBig(!filterOnlyBig)}
                                        className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all ${filterOnlyBig ? 'text-indigo-400' : 'text-muted hover:text-white'}`}
                                    >
                                        <Shield size={12} className={filterOnlyBig ? 'fill-indigo-400/20' : ''} /> Big Tasks Only
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-80 overflow-y-auto pc-scrollbar pr-2">
                                <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Planner Sync</h4>
                                {myTasks.filter(t => !t.parentId).filter(task => {
                                    if (filterOnlyBig && !task.isBigTask) return false;
                                    if (filterCategory !== 'all' && task.categoryId?._id !== filterCategory && task.categoryId !== filterCategory) return false;
                                    return true;
                                }).length > 0 ? myTasks.filter(t => !t.parentId).filter(task => {
                                    if (filterOnlyBig && !task.isBigTask) return false;
                                    if (filterCategory !== 'all' && task.categoryId?._id !== filterCategory && task.categoryId !== filterCategory) return false;
                                    return true;
                                }).map(task => (
                                    <div key={task._id} className="space-y-2">
                                        <button
                                            onClick={() => handleToggleTaskSelection(task._id)}
                                            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all group ${selectedTaskIds.includes(task._id)
                                                    ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                                                    : 'bg-white/[0.02] border-white/5 text-muted hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-1.5 rounded-lg transition-all ${selectedTaskIds.includes(task._id) ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/20'
                                                    }`}>
                                                    <CheckSquare size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold truncate">{task.title}</span>
                                                    {task.isBigTask && <span className="text-[8px] font-black uppercase text-indigo-400/60 ">Big Mission</span>}
                                                </div>
                                            </div>
                                            {selectedTaskIds.includes(task._id) && (
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                            )}
                                        </button>

                                        {/* Nested Children in Modal */}
                                        <div className="ml-8 space-y-2 border-l border-white/5 pl-4">
                                            {myTasks.filter(st => (st.parentId?._id || st.parentId) === task._id).map(st => (
                                                <button
                                                    key={st._id}
                                                    onClick={() => handleToggleTaskSelection(st._id)}
                                                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${selectedTaskIds.includes(st._id)
                                                            ? 'bg-indigo-500/5 border-indigo-500/20 text-white'
                                                            : 'bg-white/[0.01] border-white/5 text-muted hover:border-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <CheckSquare size={12} className={selectedTaskIds.includes(st._id) ? 'text-indigo-400' : 'text-white/10'} />
                                                        <span className="text-xs font-bold truncate">{st.title}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/5 rounded-2xl">
                                        <Target size={24} className="text-white/10" />
                                        <p className="text-[10px] font-black text-muted uppercase text-center">No matching data <br /> found in scanner</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="primary"
                                className="w-full mt-8 h-14 bg-indigo-600 shadow-lg shadow-indigo-600/20 font-black"
                                onClick={() => setShowTaskEditModal(false)}
                            >
                                CLOSE SCANNER
                            </Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Session Summary Modal */}
            <AnimatePresence>
                {showSummaryModal && finishedTasks.length > 0 && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowSummaryModal(false)}
                            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70]"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gradient-to-br from-[#121214] to-[#0A0A0B] border border-emerald-500/20 rounded-[2.5rem] p-10 z-[71] shadow-[0_0_50px_rgba(16,185,129,0.1)] text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <Trophy size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Protocol Secured</h2>
                            <p className="text-xs text-muted mb-8 font-bold">Your focus session has yielded results. Synergy peak detected.</p>

                            <div className="space-y-3 mb-8 text-left max-h-60 overflow-y-auto pc-scrollbar pr-2">
                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity size={12} /> Objectives Completed ({finishedTasks.length})
                                </h4>
                                {finishedTasks.map(task => (
                                    <div key={task._id} className="p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-sm font-bold text-white">{task.title}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="primary"
                                className="w-full h-14 bg-emerald-600 shadow-lg shadow-emerald-600/20 font-black text-xs"
                                onClick={() => setShowSummaryModal(false)}
                            >
                                CONTINUE SQUAD FOCUS
                            </Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showTaskSelector && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowTaskSelector(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0D0D0F] border border-white/10 rounded-3xl p-8 z-[61] shadow-2xl"
                        >
                            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                                <Target size={20} className="text-indigo-500" /> Assign Protocol
                            </h2>
                            <div className="space-y-2 max-h-80 overflow-y-auto pc-scrollbar pr-2">
                                {myTasks.length > 0 ? myTasks.map(task => (
                                    <button
                                        key={task._id}
                                        onClick={() => handleAssignTask(task._id)}
                                        className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted group-hover:text-indigo-400 transition-colors">
                                            <Zap size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-white truncate">{task.title}</span>
                                    </button>
                                )) : (
                                    <p className="text-center py-8 text-xs text-muted font-bold">No tasks available in your scanner.</p>
                                )}
                            </div>
                            <Button variant="secondary" className="w-full mt-6 h-12" onClick={() => setShowTaskSelector(false)}>Cancel</Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Leaderboard and Points Popups */}
            <AnimatePresence>
                {pointsPop.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: 1, y: -100, scale: 1.5 }}
                        exit={{ opacity: 0, scale: 2 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-6xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">+{pointsPop.points} XP</span>
                            <span className="text-xl font-black text-white uppercase tracking-widest mt-2">Objective Secured</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Session Configuration Modal */}
            <AnimatePresence>
                {showConfigModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfigModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#0D0D0F] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
                        >
                            {/* Background Glow */}
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[100px]" />

                            <div className="relative space-y-8">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
                                        <Timer className="text-indigo-400" size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Mission Briefing</h2>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest">Select Operation Duration</p>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[25, 50, 90].map((mins) => (
                                        <button
                                            key={mins}
                                            onClick={() => setSessionDuration(mins)}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${sessionDuration === mins
                                                    ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                                                    : 'bg-white/[0.02] border-white/5 text-muted hover:border-white/20'
                                                }`}
                                        >
                                            <span className="text-xl font-black">{mins}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest">MINS</span>
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    onClick={handleStartSession}
                                    variant="primary"
                                    className="w-full h-14 bg-indigo-600 font-extrabold text-xs uppercase tracking-[0.2em]"
                                >
                                    Initiate Protocol
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
