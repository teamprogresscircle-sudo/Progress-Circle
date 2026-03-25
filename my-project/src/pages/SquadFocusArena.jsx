import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
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
import { toast } from 'sonner';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Elite Micro-Components
import TimerDisplay from '../components/arena/TimerDisplay';
import OperativeGrid from '../components/arena/OperativeGrid';
import TacticalSidebar from '../components/arena/TacticalSidebar';
const IntelligenceSidebar = lazy(() => import('../components/arena/IntelligenceSidebar'));



export default function SquadFocusArena() {
    const { id } = useParams();
    const { user: currentUser, refreshUser } = useAuth();
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
    const [assigneeBundle, setAssigneeBundle] = useState({ memberTasks: [], hostTasks: [] });
    const [assignLoading, setAssignLoading] = useState(false);
    const [sidebarTacticalOpen, setSidebarTacticalOpen] = useState(true);
    const [sidebarIntelOpen, setSidebarIntelOpen] = useState(true);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(25);
    const [pointsPop, setPointsPop] = useState({ show: false, points: 0 });
    const [battleParticipants, setBattleParticipants] = useState([]);
    const [roomScoreByUser, setRoomScoreByUser] = useState({});

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
    const closeTaskSelector = useCallback(() => {
        setShowTaskSelector(false);
        setTargetUserId(null);
        setAssigneeBundle({ memberTasks: [], hostTasks: [] });
    }, []);
    const openTaskSelector = useCallback(async (uid) => {
        setTargetUserId(uid);
        setShowTaskSelector(true);
        const me = String(currentUser?._id || currentUser?.id);
        if (String(uid) === me) {
            setAssigneeBundle({ memberTasks: [], hostTasks: [] });
            setAssignLoading(false);
            return;
        }
        setAssignLoading(true);
        setAssigneeBundle({ memberTasks: [], hostTasks: [] });
        try {
            const res = await api.get(`/social/rooms/${id}/member-tasks/${uid}`);
            const raw = res.data?.success ? res.data.data : null;
            if (Array.isArray(raw)) {
                setAssigneeBundle({ memberTasks: raw, hostTasks: [] });
            } else {
                setAssigneeBundle({
                    memberTasks: raw?.memberTasks || [],
                    hostTasks: raw?.hostTasks || []
                });
            }
        } catch {
            toast.error("Could not load this member's tasks");
            setAssigneeBundle({ memberTasks: [], hostTasks: [] });
        } finally {
            setAssignLoading(false);
        }
    }, [id, currentUser]);

    // Optimized filtering for Strategic Planner
    const filteredMainTasks = useMemo(() => {
        return myTasks.filter(t => !t.parentId && (!filterOnlyBig || t.isBigTask) && (filterCategory === 'all' || t.categoryId?._id === filterCategory || t.categoryId === filterCategory));
    }, [myTasks, filterOnlyBig, filterCategory]);

    useEffect(() => {
        if (!currentUser || !isLoaded) return;
        const state = { selectedIds: selectedTaskIds, finished: finishedTasks };
        localStorage.setItem(`squad_focus_${id}_${currentUser?._id || currentUser?.id}`, JSON.stringify(state));
    }, [selectedTaskIds, finishedTasks, id, currentUser, isLoaded]);

    const fetchBattleScores = useCallback(async (battleRef) => {
        try {
            const battleId = battleRef?._id || battleRef;
            if (!battleId) {
                setBattleParticipants([]);
                return;
            }
            const res = await api.get(`/social/battle/${battleId}`);
            if (res.data?.success) {
                setBattleParticipants(res.data.data?.participants || []);
            }
        } catch (err) {
            console.error('Failed to fetch battle scores');
        }
    }, []);

    const buildScoreMapFromRoom = useCallback((roomData) => {
        const map = {};

        if (Array.isArray(roomData?.memberScores) && roomData.memberScores.length) {
            roomData.memberScores.forEach((entry) => {
                const uid = String(entry.userId?._id || entry.userId?.id || entry.userId);
                if (!uid) return;
                map[uid] = Number(
                    entry.totalScore ??
                    0
                ) || 0;
            });
        }

        (roomData?.members || []).forEach((m) => {
            const uid = String(m.user?._id || m.user?.id || m.user);
            if (!uid) return;
            const score = Number(
                m.user?.totalScore ??
                0
            ) || 0;
            if (map[uid] == null || map[uid] === 0) {
                map[uid] = score;
            }
        });

        const currentUid = String(currentUser?._id || currentUser?.id || '');
        if (currentUid && map[currentUid] == null) {
            map[currentUid] = Number(
                currentUser?.totalScore ??
                0
            ) || 0;
        }

        return map;
    }, [currentUser]);

    const fetchRoomUserScores = useCallback(async () => {
        try {
            const res = await api.get('/social/rooms');
            if (!res.data?.success) return;
            const roomEntry = (res.data.data || []).find((r) => String(r._id) === String(id));
            if (!roomEntry?.members?.length) return;

            setRoomScoreByUser(buildScoreMapFromRoom(roomEntry));
        } catch (err) {
            console.error('Failed to fetch room user scores');
        }
    }, [id, buildScoreMapFromRoom]);

    const fetchRoom = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/social/rooms/${id}`);
            if (res.data.success) {
                const r = res.data.data;
                setRoom(r);
                setRoomScoreByUser(buildScoreMapFromRoom(r));
                if (r.activeBattle) {
                    await fetchBattleScores(r.activeBattle);
                } else {
                    setBattleParticipants([]);
                }
                await fetchRoomUserScores();
                const hostId = r.host?._id || r.host?.id || r.host;
                const currentId = currentUser?._id || currentUser?.id;
                setIsHost(String(hostId) === String(currentId));
            }
        } catch (err) { console.error('Failed to sync room state'); } finally { setLoading(false); }
    }, [id, currentUser, fetchBattleScores, fetchRoomUserScores, buildScoreMapFromRoom]);

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
                toast.success('Task staked for this session');
                setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
                await fetchBattleScores(battleId);
                fetchRoom();
                closeTaskSelector();
            }
        } catch (err) { toast.error('Assignment synchronization failed'); }
    }, [room?.activeBattle, targetUserId, fetchBattleScores, fetchRoom, closeTaskSelector]);

    const handleUnassignTask = useCallback(async (taskId, targetUserId) => {
        try {
            const battleId = room.activeBattle?._id || room.activeBattle;
            if (!battleId) {
                toast.error('Tactical session not active');
                return;
            }
            const res = await api.post(`/social/battle/remove-task/${battleId}`, { taskId, targetUserId });
            if (res.data.success) {
                toast.success('Removed from session');
                await fetchBattleScores(battleId);
                fetchRoom();
            }
        } catch {
            toast.error('Could not remove assignment');
        }
    }, [room?.activeBattle, fetchBattleScores, fetchRoom]);

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

    const completingSessionRef = useRef(false);
    const handleCompleteSession = useCallback(async () => {
        if (completingSessionRef.current) return;
        completingSessionRef.current = true;
        const maxAttempts = 8;
        let attempt = 0;
        try {
            while (attempt < maxAttempts) {
                try {
                    const res = await api.post(`/social/rooms/${id}/complete`);
                    if (res.data.success) {
                        await refreshUser();
                        fetchRoom();
                        setShowSummaryModal(true);
                        return;
                    }
                    break;
                } catch (err) {
                    const code = err.response?.data?.code;
                    if (code === 'SESSION_NOT_ENDED' && attempt < maxAttempts - 1) {
                        attempt += 1;
                        await new Promise((r) => setTimeout(r, 2000));
                        continue;
                    }
                    const msg = err.response?.data?.message || 'Failed to complete session';
                    toast.error(msg);
                    throw err;
                }
            }
        } finally {
            completingSessionRef.current = false;
        }
    }, [id, fetchRoom, refreshUser]);

    const handleAbortSession = useCallback(async () => {
        try {
            const res = await api.post(`/social/rooms/${id}/abort`);
            if (res.data.success) {
                toast('Session ended — no completion bonus was awarded.');
                await refreshUser();
                fetchRoom();
            }
        } catch (err) {
            toast.error('Could not abort session');
        }
    }, [id, fetchRoom, refreshUser]);

    const myStakedBattleTasks = useMemo(() => {
        const me = String(currentUser?._id || currentUser?.id || '');
        if (!me) return [];
        const src =
            battleParticipants.length > 0
                ? battleParticipants
                : room?.activeBattle?.participants || [];
        const p = src.find((x) => String(x.user?._id || x.user) === me);
        const raw = p?.battleTasks || [];
        return raw.filter((t) => t && t.status !== 'completed');
    }, [battleParticipants, room?.activeBattle?.participants, currentUser]);

    const handleToggleTaskStatus = useCallback(async (taskId) => {
        try {
            const task =
                myTasks.find((t) => t._id === taskId) ||
                myStakedBattleTasks.find((t) => String(t._id || t) === String(taskId));
            if (!task) return;
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            const meId = String(currentUser?._id || currentUser?.id);

            const applyLocalXp = (pts) => {
                setPointsPop({ show: true, points: pts });
                setTimeout(() => setPointsPop({ show: false, points: 0 }), 3000);
                toast.success(`Objective Secured! +${pts} XP`);
            };

            if (room.activeBattle) {
                const battleId = room.activeBattle._id || room.activeBattle;
                const res = await api.patch(`/social/battle/toggle-task/${battleId}`, { taskId });
                if (res.data.success) {
                    if (newStatus === 'completed') {
                        const src =
                            battleParticipants.length > 0
                                ? battleParticipants
                                : room.activeBattle?.participants || [];
                        const myParticipant = src.find((p) => {
                            const pid = p.user?._id || p.user?.id || p.user;
                            return String(pid) === meId;
                        });
                        const isAssigned =
                            myStakedBattleTasks.some((t) => String(t._id || t) === String(taskId)) ||
                            (myParticipant?.battleTasks || []).some((bt) =>
                                String(bt._id || bt) === String(taskId)
                            );
                        const pts = isAssigned ? 50 : 10;
                        applyLocalXp(pts);
                        setFinishedTasks(prev => [task, ...prev]);
                    }
                    await fetchBattleScores(battleId);
                    await refreshUser();
                    fetchRoom();
                    fetchRoomUserScores();
                    fetchMyTasks();
                }
            } else {
                const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
                if (res.data.success) {
                    if (newStatus === 'completed') {
                        setFinishedTasks(prev => [task, ...prev]);
                        applyLocalXp(10);
                    }
                    await refreshUser();
                    fetchMyTasks(); fetchRoom();
                    fetchRoomUserScores();
                }
            }
        } catch (err) { toast.error('Sync failed'); }
    }, [id, myTasks, myStakedBattleTasks, battleParticipants, room?.activeBattle, currentUser, fetchRoom, fetchMyTasks, fetchBattleScores, refreshUser, fetchRoomUserScores]);

    const handleStartSession = useCallback(async () => {
        try {
            const res = await api.post(`/social/rooms/${id}/start`, { duration: sessionDuration, type: 'battle' });
            if (res.data.success) {
                toast.success('Battle Synchronized. All operatives on standby.', { icon: <Zap className="text-amber-400" /> });
                setShowConfigModal(false); fetchRoom();
            }
        } catch (err) { toast.error('Neural uplink failed'); }
    }, [id, sessionDuration, fetchRoom]);

    const handleControl = useCallback(async (action) => {
        try {
            const res = await api.post(`/social/rooms/${id}/session/control`, { action });
            if (res.data.success) { toast.success(`Session ${action === 'pause' ? 'paused' : 'resumed'}`); fetchRoom(); }
        } catch (err) { toast.error(`Failed to ${action} session`); }
    }, [id, fetchRoom]);


    const me = useMemo(() => {
        if (!room?.members || !currentUser) return null;
        return room.members.find(p => {
            const pId = p.user?._id?.toString() || p.user?.id?.toString() || p.user?.toString();
            const cId = currentUser?._id?.toString() || currentUser?.id?.toString();
            return pId && cId && pId === cId;
        });
    }, [room?.members, currentUser]);


    const members = room?.members || [];
    const scoreMembers = (battleParticipants.length ? battleParticipants : (room?.activeBattle?.participants?.length ? room.activeBattle.participants : members)) || [];
    const battleParticipantsForGrid = useMemo(
        () =>
            battleParticipants.length > 0
                ? battleParticipants
                : room?.activeBattle?.participants || [],
        [battleParticipants, room?.activeBattle?.participants]
    );
    const messages = room?.messages || [];

    const assignmentSelfTarget = useMemo(
        () => String(targetUserId) === String(currentUser?._id || currentUser?.id),
        [targetUserId, currentUser]
    );
    const assignmentTargetName = useMemo(() => {
        if (!targetUserId) return '';
        const m = room?.members?.find((x) => String(x.user?._id || x.user) === String(targetUserId));
        return m?.user?.name || 'Member';
    }, [room?.members, targetUserId]);
    const assignedBattleTaskIds = useMemo(() => {
        if (!targetUserId) return new Set();
        const p = battleParticipants.find((x) => String(x.user?._id || x.user) === String(targetUserId));
        return new Set((p?.battleTasks || []).map((t) => String(t._id || t)));
    }, [battleParticipants, targetUserId]);
    const selectableMyStakeTasks = useMemo(
        () => myTasks.filter((t) => !assignedBattleTaskIds.has(String(t._id))),
        [myTasks, assignedBattleTaskIds]
    );
    const selectableMemberTasks = useMemo(
        () => (assigneeBundle.memberTasks || []).filter((t) => !assignedBattleTaskIds.has(String(t._id))),
        [assigneeBundle.memberTasks, assignedBattleTaskIds]
    );
    const selectableHostTasks = useMemo(
        () => (assigneeBundle.hostTasks || []).filter((t) => !assignedBattleTaskIds.has(String(t._id))),
        [assigneeBundle.hostTasks, assignedBattleTaskIds]
    );
    const hasSelectableForModal = assignmentSelfTarget
        ? selectableMyStakeTasks.length > 0
        : selectableMemberTasks.length + selectableHostTasks.length > 0;

    // ── MEMOIZED HUD SECTIONS ──────────────────────────────────────────────
    
    // 1. Stable Header Block
    const headerBlock = useMemo(() => (
        <header className="h-[4.5rem] sm:h-20 border-b border-[var(--border)]/10 flex items-center justify-between px-4 sm:px-8 lg:px-10 bg-[var(--surface)]/95 backdrop-blur-sm relative shrink-0 overflow-visible z-[100] font-outfit">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--primary)]/12 to-transparent" />

            <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                <button 
                  type="button"
                  onClick={() => setSidebarTacticalOpen(!sidebarTacticalOpen)}
                  className={`rounded-xl p-3 transition-colors active:scale-[0.98] ${
                    sidebarTacticalOpen 
                      ? 'bg-[var(--primary)] text-white shadow-sm' 
                      : 'bg-[var(--surface2)] border border-[var(--border)]/15 text-[var(--text)]/50 hover:text-[var(--text)]'
                  }`}
                  title="Tasks"
                >
                    <Zap size={18} />
                </button>

                <button 
                  type="button"
                  onClick={() => setSidebarIntelOpen(!sidebarIntelOpen)}
                  className={`rounded-xl p-3 transition-colors active:scale-[0.98] ${
                    sidebarIntelOpen 
                      ? 'bg-[var(--primary)] text-white shadow-sm' 
                      : 'bg-[var(--surface2)] border border-[var(--border)]/15 text-[var(--text)]/50 hover:text-[var(--text)]'
                  }`}
                  title="Chat"
                >
                    <MessageSquare size={18} />
                </button>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center py-2 max-w-[min(100%,14rem)] sm:max-w-none justify-center px-2">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-[0.2em] sm:tracking-[0.35em] text-[var(--text)] flex flex-wrap items-center justify-center gap-x-2 gap-y-0 m-0 leading-tight text-center font-outfit">
                    {room?.name ? (
                        <>
                            <span className="truncate max-w-[10rem] sm:max-w-none">{room.name.split(' ')[0]}</span>
                            <span className="text-[var(--primary)] truncate max-w-[10rem] sm:max-w-none">
                                {room.name.split(' ').slice(1).join(' ') || ''}
                            </span>
                        </>
                    ) : (
                        <>
                            <span>Squad</span>
                            <span className="text-[var(--primary)]">focus</span>
                        </>
                    )}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 font-inter text-[var(--text)]/45">
                    <span className="text-[9px] sm:text-[10px] font-medium tracking-wide">{members.length} in room</span>
                    <span className="text-[var(--border)]" aria-hidden>·</span>
                    <span className="text-[9px] sm:text-[10px] font-medium tracking-wide tabular-nums">{(room?.squadXP || 0).toLocaleString()} squad XP</span>
                </div>
            </div>

            <div className="relative z-10 shrink-0">
                <button 
                  type="button"
                  onClick={() => navigate('/squad')}
                  className="rounded-xl px-4 sm:px-5 py-2.5 bg-[var(--surface2)] border border-[var(--border)]/15 text-[var(--text)]/70 hover:text-red-600 hover:border-red-500/25 hover:bg-red-500/5 transition-colors flex items-center gap-2"
                >
                    <LogOut size={14} />
                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] hidden sm:inline">Leave</span>
                </button>
            </div>
        </header>
    ), [members.length, room?.league, room?.squadXP, room?.name, id, navigate, sidebarTacticalOpen, sidebarIntelOpen]);


    // 2. Stable Tactical Sidebar Block
    const tacticalSidebarBlock = useMemo(() => {
        return (
            <div className="w-80 border-r border-[var(--border)]/10 h-full overflow-hidden bg-[var(--surface)] font-inter">
                <TacticalSidebar 
                    myTasks={myTasks}
                    sessionStakedTasks={myStakedBattleTasks}
                    currentUserId={currentUser?._id || currentUser?.id}
                    selectedTaskIds={selectedTaskIds}
                    onToggleTaskStatus={handleToggleTaskStatus}
                    onOpenConfig={openTacticalConfig}
                    onClose={closeTacticalSidebar}
                    isHost={isHost}
                    hasActiveBattle={!!room?.activeBattle}
                />
            </div>
        );
    }, [myTasks, myStakedBattleTasks, currentUser, selectedTaskIds, handleToggleTaskStatus, openTacticalConfig, closeTacticalSidebar, isHost, room?.activeBattle]);

    // 3. Stable Main Interactive Zone Block
    const mainZoneBlock = useMemo(() => (
        <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 overflow-hidden relative bg-[var(--bg)] min-h-0 w-full h-full font-inter">
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute bottom-[-20%] left-[-10%] w-[120%] h-[55%] hud-grid-floor opacity-20" />
                <div className="absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-t from-[var(--bg)] to-transparent z-10" />
            </div>

            <div className={`flex-1 flex flex-col items-stretch justify-start gap-8 md:gap-10 pt-6 sm:pt-10 pb-8 sm:pb-16 relative z-10 overflow-y-auto pc-scrollbar transition-[padding] duration-300 min-h-0 ${
                sidebarTacticalOpen && sidebarIntelOpen
                    ? 'lg:pl-80 lg:pr-80'
                    : sidebarTacticalOpen
                        ? 'lg:pl-80'
                        : sidebarIntelOpen
                            ? 'lg:pr-80'
                            : ''
            }`}>
                <TimerDisplay 
                    isActive={room?.activeSession?.isActive}
                    startTime={room?.activeSession?.startTime}
                    duration={room?.activeSession?.durationMinutes}
                    isPaused={room?.activeSession?.isPaused}
                    isHost={isHost}
                    onControl={handleControl}
                    onComplete={handleCompleteSession}
                    onAbort={handleAbortSession}
                    onOpenConfig={openConfigModal}
                />

                <OperativeGrid 
                    members={scoreMembers}
                    currentUserId={currentUser?._id || currentUser?.id}
                    isHost={isHost}
                    hasActiveBattle={!!room?.activeBattle}
                    battleParticipants={battleParticipantsForGrid}
                    onAssignToMember={openTaskSelector}
                    onUnassignTask={isHost ? handleUnassignTask : undefined}
                    pointsPop={pointsPop}
                    scoreOverrideByUser={roomScoreByUser}
                />
            </div>
        </main>
    ), [sidebarTacticalOpen, sidebarIntelOpen, room?.activeSession, isHost, handleControl, handleCompleteSession, handleAbortSession, openConfigModal, scoreMembers, currentUser, room?.activeBattle, openTaskSelector, handleUnassignTask, pointsPop, roomScoreByUser, battleParticipantsForGrid]);


    // 4. Stable Intelligence Sidebar Block
    const intelligenceSidebarBlock = useMemo(() => {
        return (
            <div className="w-80 border-l border-[var(--border)]/10 h-full overflow-hidden bg-[var(--surface)] font-inter">
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
    }, [messages, currentUser, handleSendMessage, room?.activeBattle, room?.league, closeIntelSidebar]);

    if (loading || !currentUser) return <LoadingSpinner />;
    if (!room) return <div className="text-center py-20 text-[var(--text)]">Squad Room not found or expired.</div>;

    if (!loading && room && !me) {
        return (
            <div className="text-center py-20 flex flex-col items-center gap-4 bg-[var(--bg)] min-h-screen pt-40 font-inter">
                <p className="text-[var(--text)]/60 font-medium">Identity Error: You are not in this Room.</p>
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

            <div className="flex-1 overflow-hidden relative bg-[var(--bg)]">
                {/* Fixed Background Arena & HUD */}
                <div className="absolute inset-0 z-0">
                    {mainZoneBlock}
                </div>

                {/* Left Tactical Overlay */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 z-20 transition-[transform,opacity] duration-300 ease-in-out transform-gpu will-change-transform ${
                    sidebarTacticalOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                  }`}
                >
                    {tacticalSidebarBlock}
                </div>

                {/* Right Intelligence Overlay */}
                <div 
                  className={`absolute right-0 top-0 bottom-0 z-20 transition-[transform,opacity] duration-300 ease-in-out transform-gpu will-change-transform ${
                    sidebarIntelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                  }`}
                >
                    {intelligenceSidebarBlock}
                </div>
            </div>
            {/* Task Edit Modal (Strategic Planner) */}
            {showTaskEditModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowTaskEditModal(false)}
                        className="absolute inset-0 bg-black/80 transition-opacity duration-300"
                    />
                    <div
                        className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)]/10 rounded-3xl p-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-[transform,opacity] duration-300 transform-gpu will-change-transform scale-100 opacity-100"
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
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[var(--border)]/10 rounded-2xl bg-[var(--text)]/[0.01]">
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
                        className="absolute inset-0 bg-black/90 transition-opacity duration-300"
                    />
                    <div
                        className="relative w-full max-w-xl bg-gradient-to-br from-[var(--surface)] to-[var(--bg)] border border-emerald-500/20 rounded-3xl p-12 shadow-[0_0_100px_rgba(16,185,129,0.15)] text-center overflow-hidden transition-all duration-300 transform scale-100 opacity-100"
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
                        onClick={closeTaskSelector}
                        className="absolute inset-0 bg-black/85 transition-opacity duration-300"
                    />
                    <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)]/10 rounded-3xl p-8 sm:p-10 z-[111] shadow-2xl overflow-hidden transition-all duration-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 blur-[50px] rounded-full -mr-16 -mt-16" />
                        
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-1 font-outfit tracking-tight flex items-center gap-3">
                            <Target size={22} className="text-[var(--primary)] shrink-0" /> Session tasks
                        </h2>
                        <p className="text-[12px] text-[var(--text)]/50 font-inter mb-3">
                            {assignmentSelfTarget
                                ? 'Add your own tasks to this session (+50 XP when completed if staked).'
                                : (
                                    <>
                                        Pick <strong className="text-[var(--text)]/70">{assignmentTargetName}</strong>&apos;s open tasks, or delegate <strong className="text-[var(--text)]/70">your</strong> tasks to them. XP is shared when the task is completed.
                                    </>
                                )}
                        </p>
                        {!assignmentSelfTarget && (
                            <div className="mb-5 rounded-xl border border-[var(--border)]/20 bg-[var(--surface2)]/40 px-3.5 py-2.5 text-[11px] text-[var(--text)]/65 leading-relaxed font-inter">
                                The left panel is each person&apos;s own checklist. Tasks you assign here appear in their session list so they can complete them.
                            </div>
                        )}
                        
                        <div className="space-y-2 max-h-80 overflow-y-auto pc-scrollbar pr-2 min-h-[8rem]">
                            {assignLoading ? (
                                <div className="py-16 flex justify-center">
                                    <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                                </div>
                            ) : hasSelectableForModal ? (
                                <>
                                    {!assignmentSelfTarget && selectableHostTasks.length > 0 && (
                                        <>
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text)]/45 pt-1 pb-0.5">Your tasks (delegate)</p>
                                            {selectableHostTasks.map((task) => (
                                                <button
                                                    key={task._id}
                                                    type="button"
                                                    onClick={() => handleAssignTask(task._id)}
                                                    className="w-full p-4 rounded-xl bg-[var(--text)]/[0.03] border border-[var(--border)]/15 hover:border-[var(--primary)]/35 hover:bg-[var(--primary)]/5 transition-all text-left flex items-center gap-3 group"
                                                >
                                                    <div className="w-9 h-9 rounded-lg bg-[var(--surface2)] flex items-center justify-center text-[var(--primary)] shrink-0">
                                                        <Zap size={16} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-semibold text-[var(--text)] truncate">{task.title}</span>
                                                        {task.isBigTask && (
                                                            <span className="text-[10px] font-medium text-[var(--primary)]/70 mt-0.5">Pinned objective (+50)</span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {!assignmentSelfTarget && selectableMemberTasks.length > 0 && (
                                        <>
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text)]/45 pt-2 pb-0.5">
                                                {assignmentTargetName}&apos;s tasks
                                            </p>
                                            {selectableMemberTasks.map((task) => (
                                                <button
                                                    key={task._id}
                                                    type="button"
                                                    onClick={() => handleAssignTask(task._id)}
                                                    className="w-full p-4 rounded-xl bg-[var(--text)]/[0.03] border border-[var(--border)]/15 hover:border-[var(--primary)]/35 hover:bg-[var(--primary)]/5 transition-all text-left flex items-center gap-3 group"
                                                >
                                                    <div className="w-9 h-9 rounded-lg bg-[var(--surface2)] flex items-center justify-center text-[var(--primary)] shrink-0">
                                                        <Zap size={16} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-semibold text-[var(--text)] truncate">{task.title}</span>
                                                        {task.isBigTask && (
                                                            <span className="text-[10px] font-medium text-[var(--primary)]/70 mt-0.5">Pinned objective (+50)</span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {assignmentSelfTarget && selectableMyStakeTasks.map((task) => (
                                        <button
                                            key={task._id}
                                            type="button"
                                            onClick={() => handleAssignTask(task._id)}
                                            className="w-full p-4 rounded-xl bg-[var(--text)]/[0.03] border border-[var(--border)]/15 hover:border-[var(--primary)]/35 hover:bg-[var(--primary)]/5 transition-all text-left flex items-center gap-3 group"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-[var(--surface2)] flex items-center justify-center text-[var(--primary)] shrink-0">
                                                <Zap size={16} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13px] font-semibold text-[var(--text)] truncate">{task.title}</span>
                                                {task.isBigTask && (
                                                    <span className="text-[10px] font-medium text-[var(--primary)]/70 mt-0.5">Pinned objective (+50)</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="py-10 flex flex-col items-center justify-center gap-2 text-center px-2">
                                    <Activity size={28} className="text-[var(--text)]/15" />
                                    <p className="text-[12px] text-[var(--text)]/45 font-inter leading-relaxed">
                                        {assignmentSelfTarget ? (
                                            <>
                                                Nothing left to add: either every open task is already in this session, or you have no open tasks. Create tasks from the main Tasks page if needed.
                                            </>
                                        ) : (
                                            <>
                                                Nothing to stake: <strong className="text-[var(--text)]/65">{assignmentTargetName}</strong> has no open tasks, you have none to delegate, or everything is already in this session. Add tasks from <strong className="text-[var(--text)]/65">Tasks</strong> if needed, then try Assign again.
                                            </>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            type="button"
                            onClick={closeTaskSelector}
                            className="w-full mt-6 py-3 text-[11px] font-semibold uppercase text-[var(--text)]/40 hover:text-[var(--text)]/70 transition-colors tracking-wide"
                        >
                            Close
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
                            className="absolute inset-0 bg-black/90"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 12 }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-8 sm:p-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-14 h-14 rounded-xl bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center mb-5">
                                    <Timer className="text-[var(--primary)]" size={28} strokeWidth={2} />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight mb-2 font-outfit">
                                    Start squad focus session
                                </h2>
                                <p className="text-sm text-[var(--text)]/55 font-inter max-w-sm leading-relaxed">
                                    Choose how long this session runs. Everyone in the room will see the same timer.
                                </p>
                            </div>

                            <p className="text-xs font-medium text-[var(--text)]/45 mb-3 text-left">Duration</p>
                            <div className="grid grid-cols-3 gap-3 mb-8">
                                {[25, 50, 90].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => setSessionDuration(mins)}
                                        className={`rounded-xl border py-5 px-2 transition-colors font-inter ${
                                            sessionDuration === mins
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text)] ring-1 ring-[var(--primary)]/30'
                                                : 'border-[var(--border)] bg-[var(--surface2)]/50 text-[var(--text)]/70 hover:border-[var(--text)]/20 hover:bg-[var(--surface2)]'
                                        }`}
                                    >
                                        <span className="block text-2xl font-semibold tabular-nums">{mins}</span>
                                        <span className="block text-[11px] font-medium text-[var(--text)]/45 mt-1">min</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={closeConfigModal}
                                    className="order-2 sm:order-1 flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text)]/80 hover:bg-[var(--surface2)] transition-colors font-inter"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStartSession}
                                    className="order-1 sm:order-2 flex-[1.2] py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-95 transition-opacity shadow-sm font-inter flex items-center justify-center gap-2"
                                >
                                    <Zap size={18} className="opacity-90" />
                                    Start session
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
