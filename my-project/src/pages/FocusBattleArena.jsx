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

export default function FocusBattleArena() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [battle, setBattle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isHost, setIsHost] = useState(false);
    const [myTasks, setMyTasks] = useState([]);
    const [showTaskSelector, setShowTaskSelector] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [extending, setExtending] = useState(false);
    const [targetUserId, setTargetUserId] = useState(null); // For host assignment

    useEffect(() => {
        fetchBattle();
        fetchMyTasks();
        const interval = setInterval(fetchBattle, 3000); 
        return () => clearInterval(interval);
    }, [id]);

    const handleSendMessage = async (e) => {
        if (e.key !== 'Enter' || !messageInput.trim()) return;
        try {
            const res = await api.post(`/social/battle/chat/${id}`, { message: messageInput });
            if (res.data.success) {
                setBattle(res.data.data);
                setMessageInput('');
            }
        } catch (err) {
            toast.error('Message failed to send');
        }
    };

    const handleExtend = async (mins) => {
        try {
            const res = await api.patch(`/social/battle/extend/${id}`, { minutes: mins });
            if (res.data.success) {
                setBattle(res.data.data);
                toast.success(`Session extended by ${mins}m`);
                setExtending(false);
            }
        } catch (err) {
            toast.error('Extension failed');
        }
    };

    const handleToggleTask = async (taskId) => {
        try {
            const res = await api.patch(`/social/battle/toggle-task/${id}`, { taskId });
            if (res.data.success) {
                setBattle(res.data.data);
                const taskFinished = res.data.data.participants.find(p => p.user?._id === (currentUser?._id || currentUser?.id))?.battleTasks.find(t => t._id === taskId)?.status === 'completed';
                if (taskFinished) toast.success('Task Finished! +50 Points');
            }
        } catch (err) {
            toast.error('Sync failed');
        }
    };

    const fetchMyTasks = async () => {
        try {
            const res = await api.get('/tasks');
            if (res.data.success) setMyTasks(res.data.data.filter(t => t.status !== 'completed'));
        } catch (err) {
            console.error('Failed to fetch tasks');
        }
    };

    const fetchBattle = async () => {
        if (!currentUser) return; 
        try {
            const res = await api.get(`/social/battle/${id}`);
            if (res.data.success) {
                const b = res.data.data;
                setBattle(b);
                const hostId = b.host?._id || b.host;
                setIsHost(hostId?.toString() === (currentUser?._id || currentUser?.id)?.toString());
                
                if (b.status === 'active' && b.endTime) {
                    const remaining = Math.max(0, Math.floor((new Date(b.endTime) - new Date()) / 1000));
                    setTimeLeft(remaining);
                }
            }
        } catch (err) {
            console.error('Failed to sync battle state');
        } finally {
            setLoading(false);
        }
    };

    const handleControl = async (action) => {
        try {
            const res = await api.patch(`/social/battle/control/${id}`, { action });
            if (res.data.success) {
                setBattle(res.data.data);
                toast.success(`Focus ${action}ed`);
            }
        } catch (err) {
            toast.error('Command failed');
        }
    };

    const handleAddTask = async (taskId) => {
        try {
            const res = await api.post(`/social/battle/add-task/${id}`, { 
                taskId, 
                targetUserId: targetUserId || currentUser?._id || currentUser?.id 
            });
            if (res.data.success) {
                toast.success('Task added to Room');
                fetchBattle();
            }
        } catch (err) {
            toast.error('Deployment failed');
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading || !currentUser) return <LoadingSpinner />;
    if (!battle) return <div className="text-center py-20">Battle session not found or expired.</div>;

    const me = battle.participants.find(p => {
        const pId = p.user?._id?.toString() || p.user?.id?.toString() || p.user?.toString();
        const cId = currentUser?._id?.toString() || currentUser?.id?.toString();
        return pId && cId && pId === cId;
    });

    if (!me) {
        return (
            <div className="text-center py-20 flex flex-col items-center gap-4">
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
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                        <Swords size={18} />
                    </div>
                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">Focus Room <span className="text-muted opacity-50 underline decoration-rose-500/50 underline-offset-4">ID-{id.slice(-4)}</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${battle.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                        <span className="text-[10px] font-black uppercase text-muted tracking-widest">{battle.status}</span>
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
                            <span className="text-[9px] font-black text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">{me.tasksCompleted} DONE</span>
                        </div>
                        <div className="space-y-3">
                            {me.battleTasks?.length > 0 ? me.battleTasks.map((task) => (
                                <div 
                                    key={task._id} 
                                    className={`p-4 rounded-2xl bg-white/[0.03] border flex items-center gap-3 transition-all group ${
                                        task.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-white/5 hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <button 
                                        onClick={() => handleToggleTask(task._id)}
                                        className={`p-1.5 rounded-lg transition-all ${
                                            task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/20 hover:text-white/40'
                                        }`}
                                    >
                                        <CheckSquare size={14} />
                                    </button>
                                    <span className={`text-xs font-bold truncate ${task.status === 'completed' ? 'text-white/40 line-through' : 'text-white'}`}>
                                        {task.title}
                                    </span>
                                </div>
                            )) : (
                                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                    <p className="text-[10px] font-black text-muted uppercase">No Tasks Assigned</p>
                                </div>
                            )}
                            <Button 
                                variant="ghost" 
                                className="w-full text-[10px] h-11 border-dashed bg-white/[0.02] border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30" 
                                icon={Zap}
                                onClick={() => { setTargetUserId(currentUser?._id || currentUser?.id); setShowTaskSelector(true); }}
                            >
                                Add Task
                            </Button>
                        </div>
                    </div>

                    {/* Shared Intelligence: Other Participants */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={14} className="text-rose-400" /> Room Activity
                        </h3>
                        <div className="space-y-8">
                            {battle.participants.filter(p => (p.user?._id || p.user?.id || p.user) !== (currentUser?._id || currentUser?.id)).map((peer) => (
                                <div key={peer._id} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={peer.user?.avatar} name={peer.user?.name} size="xs" />
                                            <span className="text-[11px] font-black text-white uppercase tracking-tighter">{peer.user?.name}</span>
                                        </div>
                                        <span className="text-[9px] font-black text-rose-400">{peer.pointsEarned} XP</span>
                                    </div>
                                    <div className="space-y-2">
                                        {peer.battleTasks?.length > 0 ? peer.battleTasks.map((t) => (
                                            <div key={t._id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.01] border border-white/5">
                                                <div className={`w-1 h-1 rounded-full ${t.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                                                <span className={`text-[10px] font-bold truncate flex-1 ${t.status === 'completed' ? 'text-white/20 line-through' : 'text-white/60'}`}>{t.title}</span>
                                            </div>
                                        )) : (
                                            <p className="text-[9px] text-center text-muted font-bold italic py-2">No active tasks...</p>
                                        )}
                                        {isHost && (
                                            <button 
                                                onClick={() => { setTargetUserId(peer.user?._id); setShowTaskSelector(true); }}
                                                className="w-full py-1.5 rounded-lg border border-dashed border-white/10 text-[8px] font-black uppercase text-muted hover:text-rose-400 hover:border-rose-400/30 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={10} /> Assign Task
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center: The Grand Arena Grid */}
                <div className="lg:col-span-2 relative flex flex-col p-8 overflow-y-auto pc-scrollbar">
                     <div className="max-w-3xl mx-auto w-full space-y-12">
                        {/* Timer UI */}
                        <div className="text-center space-y-4">
                            <motion.div 
                                animate={{ 
                                    scale: battle.status === 'active' ? [1, 1.01, 1] : 1,
                                    color: timeLeft < 300 ? ['#ffffff', '#f43f5e', '#ffffff'] : '#ffffff'
                                }}
                                transition={{ repeat: Infinity, duration: timeLeft < 300 ? 1 : 2 }}
                                className="text-9xl font-black tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                {formatTime(timeLeft)}
                            </motion.div>
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Focus Session In Progress</p>
                                {isHost && (
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={() => handleExtend(10)}
                                            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase text-muted hover:text-white hover:border-indigo-500/50 transition-all"
                                        >
                                            +10m Extension
                                        </button>
                                        <button 
                                            onClick={() => handleExtend(25)}
                                            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase text-muted hover:text-white hover:border-indigo-500/50 transition-all"
                                        >
                                            +25m Session
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Roster Grid */}
                        <div className={`grid gap-6 ${battle.participants.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {battle.participants.map((p) => {
                                const isCurrentUser = (p.user?._id || p.user?.id || p.user) === (currentUser?._id || currentUser?.id);
                                return (
                                    <motion.div 
                                        key={p._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex flex-col items-center gap-4 p-6 rounded-3xl bg-white/[0.02] border transition-all ${
                                            isCurrentUser ? 'border-indigo-500/30 bg-indigo-500/[0.02]' : 'border-white/5'
                                        }`}
                                    >
                                        <div className="relative">
                                            <Avatar src={p.user?.avatar} name={p.user?.name} size="lg" />
                                            {battle.host?.toString() === p.user?._id?.toString() && (
                                                <div className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-500 shadow-lg border-2 border-[#0D0D0F]">
                                                    <Shield size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center w-full">
                                            <h4 className="text-xs font-black text-white uppercase truncate">{p.user?.name}</h4>
                                            <div className="flex items-center justify-between mt-3 mb-1 px-1">
                                                <span className="text-[9px] font-black text-muted">{p.pointsEarned} XP</span>
                                                <span className="text-[9px] font-black text-indigo-400">{p.tasksCompleted}/{p.battleTasks?.length || 0}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${p.battleTasks?.length ? (p.tasksCompleted / p.battleTasks.length) * 100 : 0}%` }}
                                                    className={`h-full ${isCurrentUser ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-rose-500/50'}`}
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
                                {battle.status === 'paused' ? (
                                    <Button icon={Play} onClick={() => handleControl('resume')} className="bg-emerald-600 shadow-lg shadow-emerald-600/20 px-8 py-6 text-sm">Resume Focus</Button>
                                ) : (
                                    <Button icon={Pause} onClick={() => handleControl('pause')} variant="secondary" className="px-8 py-6 text-sm">Pause Session</Button>
                                )}
                                <Button icon={X} onClick={() => handleControl('end')} className="bg-rose-600 shadow-lg shadow-rose-600/20 px-8 py-6 text-sm">End Room</Button>
                            </div>
                        )}
                     </div>
                </div>

                {/* Right Sidebar: Signal Log & Comms */}
                <div className="lg:col-span-1 border-l border-white/5 p-6 flex flex-col overflow-hidden bg-[#09090A]">
                    <div className="flex-1 space-y-6 overflow-y-auto pc-scrollbar pr-2">
                        <div className="space-y-4">
                             <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                <Activity size={14} className="text-rose-400" /> Room Activity
                            </h3>
                            <div className="space-y-3">
                                {[...(battle.logs || [])].reverse().slice(0, 10).map((log, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-3">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                        <p className="text-[9px] font-bold text-white/40 italic">{log.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5 max-h-[50%] flex flex-col overflow-hidden">
                            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                <MessageSquare size={14} className="text-indigo-400" /> Room Chat
                            </h3>
                            <div className="flex-1 space-y-4 overflow-y-auto pc-scrollbar pr-2">
                                {battle.messages?.map((msg, i) => {
                                    const isMe = (msg.sender?._id || msg.sender) === (currentUser?._id || currentUser?.id);
                                    return (
                                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-bold ${
                                                isMe ? 'bg-indigo-500 text-white rounded-tr-none shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-white/5 text-white/80 rounded-tl-none border border-white/5'
                                            }`}>
                                                {!isMe && <p className="text-[8px] opacity-40 uppercase mb-1">{msg.sender?.name}</p>}
                                                {msg.message}
                                            </div>
                                            <span className="text-[7px] text-muted font-black uppercase mt-1 tracking-widest">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                                placeholder="Send a message..."
                                className="pc-input w-full pl-11 h-12 text-xs font-bold bg-white/[0.02] focus:bg-white/[0.05]"
                            />
                         </div>
                    </div>
                </div>
            </div>

            {/* Task Selection Modal Overlay */}
            <AnimatePresence>
                {showTaskSelector && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTaskSelector(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0D0D0F] border border-white/10 rounded-3xl p-8 z-[61] shadow-2xl"
                        >
                            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                                <Target size={20} className="text-indigo-500" /> Assign Task
                            </h2>
                            <div className="space-y-2 max-h-80 overflow-y-auto pc-scrollbar pr-2">
                                {myTasks.filter(t => !me.battleTasks.some(bt => bt._id === t._id)).map(task => (
                                    <button 
                                        key={task._id}
                                        onClick={() => { handleAddTask(task._id); setShowTaskSelector(false); }}
                                        className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted group-hover:text-indigo-400 transition-colors">
                                            <Zap size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-white truncate">{task.title}</span>
                                    </button>
                                ))}
                                {myTasks.length === 0 && <p className="text-center py-8 text-xs text-muted font-bold">No tasks available to assign.</p>}
                            </div>
                            <Button variant="secondary" className="w-full mt-6 h-12" onClick={() => setShowTaskSelector(false)}>Cancel</Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
