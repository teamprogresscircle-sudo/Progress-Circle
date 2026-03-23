import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Zap, CheckCircle, Bell,
    MessageSquare, Shield, UserPlus, X, Target,
    Clock, Send, MoreHorizontal, UserCheck, UserX,
    TrendingUp, Award, BellOff, UserPlus2, Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { PageInsight } from '../components/PageInsight';
import { SquadConfigModal } from '../components/SquadConfigModal';

export function Squad() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showNotifCenter, setShowNotifCenter] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [roomName, setRoomName] = useState('');
    const [selectedInvitees, setSelectedInvitees] = useState([]);
    const [timeLeft, setTimeLeft] = useState(null);
    const [friendSearchTerm, setFriendSearchTerm] = useState('');
    const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
    const [stats, setStats] = useState({ sessionsWon: 0, squadXP: 0, rankProgression: 0, rankLabel: 'Active' });
    const [activity, setActivity] = useState([]);

    const chatEndRef = useRef(null);
    const timerIntervalRef = useRef(null);

    const fetchData = async () => {
        try {
            const [friendsRes, roomsRes, statsRes, activityRes, notifRes, lbRes] = await Promise.all([
                api.get('/social/friends'),
                api.get('/social/rooms'),
                api.get('/social/stats'),
                api.get('/social/activity'),
                api.get('/social/notifications'),
                api.get('/social/leaderboard')
            ]);
            setFriends(friendsRes.data?.data?.friends || []);
            setRequests(friendsRes.data?.data?.requests || []);
            setRooms(roomsRes.data?.data || []);
            setStats(statsRes.data?.data || { sessionsWon: 0, squadXP: 0, rankProgression: 0, rankLabel: 'Active' });
            setActivity(activityRes.data?.data || []);
            setGlobalLeaderboard(lbRes.data?.data || []);
            setNotifications(notifRes.data?.data || []);

            // Auto-sync activeRoom if it exists (Fetch full details for chat persistence)
            if (activeRoom) {
                try {
                    const fullRoom = await api.get(`/social/rooms/${activeRoom._id}`);
                    setActiveRoom(fullRoom.data.data);
                    setMessages(fullRoom.data.data.messages || []);
                } catch (e) {
                    console.error('Active room sync failed:', e);
                }
            }

            // Handle new notifications (Toast alerts)
            const recentNotifs = (notifRes.data?.data || []).filter(n => n?.status === 'pending' && !n?.isToasted);
            recentNotifs.forEach(async (n) => {
                if (n.type === 'room_invite') {
                    toast(`Squad Invite: ${n.message}`, {
                        action: {
                            label: 'View',
                            onClick: () => { setShowNotifCenter(true); }
                        }
                    });
                } else if (n.type === 'room_accepted') {
                    toast.success(n.message);
                }

                // Mark as toasted so it doesn't repeat
                try { await api.patch(`/social/notifications/${n._id}/toasted`); } catch (e) { }
            });
        } catch (error) {
            console.error('Squad sync error:', error);
            // toast.error('Failed to sync squad data.'); // Silencing to avoid spam
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeRoom?.activeSession?.isActive) {
            const updateTimer = () => {
                const start = new Date(activeRoom.activeSession.startTime).getTime();
                const now = new Date().getTime();
                const duration = activeRoom.activeSession.durationMinutes * 60 * 1000;
                const elapsed = now - start;
                const remaining = Math.max(0, duration - elapsed);

                if (remaining === 0 && activeRoom.activeSession.isActive) {
                    // Start completion if we are the host
                    if (String(activeRoom.host?._id || activeRoom.host) === String(user?._id || user?.id)) {
                        completeSession();
                    }
                    setTimeLeft('00:00');
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    return;
                }

                const mins = Math.floor(remaining / 1000 / 60);
                const secs = Math.floor((remaining / 1000) % 60);
                setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            };

            updateTimer();
            timerIntervalRef.current = setInterval(updateTimer, 1000);

            // Auto-update status to focusing
            const currentMember = activeRoom.members.find(m => m.user?._id === user._id);
            if (currentMember && currentMember.status !== 'focusing') {
                api.patch(`/social/rooms/${activeRoom._id}/status`, { status: 'focusing' });
            }
        } else {
            setTimeLeft(null);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

            // Reset status if it was focusing
            if (activeRoom) {
                const currentMember = activeRoom.members.find(m => m.user?._id === user._id);
                if (currentMember && currentMember.status === 'focusing') {
                    api.patch(`/social/rooms/${activeRoom._id}/status`, { status: 'idle' });
                }
            }
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [activeRoom?.activeSession?.isActive, activeRoom?.activeSession?.startTime]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await api.get(`/social/search?q=${searchQuery}`);
            setSearchResults(res.data?.data || []);
        } catch (error) {
            toast.error('User search failed.');
        }
    };

    const sendRequest = async (id) => {
        try {
            await api.post(`/social/friends/request/${id}`);
            toast.success('Friend request sent!');
            setShowSearchModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request.');
        }
    };

    const respondRequest = async (id, action) => {
        try {
            await api.post(`/social/friends/${action}/${id}`);
            toast.success(`Request ${action}ed!`);
            fetchData();
        } catch (error) {
            toast.error('Failed to respond to request.');
        }
    };

    const createRoom = async () => {
        if (!roomName) return toast.error('Enter a room name.');
        try {
            const res = await api.post('/social/rooms', {
                name: roomName,
                invitedFriends: selectedInvitees,
                isPrivate: true
            });
            setRooms([res.data.data, ...rooms]);
            setActiveRoom(res.data.data);
            setShowCreateModal(false);
            setRoomName('');
            setSelectedInvitees([]);
            toast.success('Squad Room created!');
        } catch (error) {
            toast.error('Failed to create room.');
        }
    };


    const leaveSquad = async () => {
        if (!activeRoom) return;
        try {
            await api.post(`/social/rooms/leave/${activeRoom._id}`);
            setRooms(prev => prev.filter(r => r._id !== activeRoom._id));
            setActiveRoom(null);
            setMessages([]);
        } catch (error) {
            toast.error('Failed to leave room.');
        }
    };

    const handleStartSession = async (config) => {
        try {
            const res = await api.post(`/social/rooms/${activeRoom._id}/start`, { duration: config.duration });
            if (res.data.success) {
                toast.success('Focus Protocol Initiated');
                setShowConfigModal(false);
                navigate(`/squad/focus/${activeRoom._id}`);
            }
        } catch (err) {
            toast.error('Failed to start session');
        }
    };

    const deleteRoom = async (roomId) => {
        const idToDelete = typeof roomId === 'string' ? roomId : activeRoom?._id;
        if (!idToDelete) return;
        try {
            await api.delete(`/social/rooms/${idToDelete}`);
            setRooms(prev => prev.filter(r => r._id !== idToDelete));
            if (activeRoom?._id === idToDelete) {
                setActiveRoom(null);
                setMessages([]);
            }
            toast.success('Room deleted successfully.');
        } catch (error) {
            toast.error('Failed to delete room.');
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage || !activeRoom) return;
        try {
            const res = await api.post(`/social/rooms/${activeRoom._id}/chat`, { text: newMessage });
            setMessages(res.data.data);
            setNewMessage('');
        } catch (error) {
            toast.error('Message failed to send.');
        }
    };

    const closeRoom = () => {
        setActiveRoom(null);
        setMessages([]);
    };

    const startSession = async (duration) => {
        try {
            const res = await api.post(`/social/rooms/${activeRoom._id}/start`, { duration });
            setActiveRoom(res.data.data);
            toast.success(`Session started for ${duration} min!`);
        } catch (error) {
            toast.error('Failed to start session.');
        }
    };

    const completeSession = async () => {
        if (!activeRoom || !activeRoom.activeSession?.isActive) return;
        try {
            const res = await api.post(`/social/rooms/${activeRoom._id}/complete`);
            toast.success(`Session Complete! +${res.data.rewards.xp} XP awarded.`);
            fetchData();
        } catch (error) {
            console.error('Completion error:', error);
        }
    };

    const acceptRoomInvite = async (roomId, notifId) => {
        try {
            await api.post(`/social/rooms/${roomId}/accept`);
            toast.success('Access granted. Neural link established.');
            fetchData();
            setShowNotifCenter(false);
        } catch (error) {
            toast.error('Sync failed.');
        }
    };

    const rejectRoomInvite = async (roomId, notifId) => {
        try {
            await api.post(`/social/rooms/${roomId}/reject`);
            toast.success('Signal ignored.');
            fetchData();
        } catch (error) {
            toast.error('Sync failed.');
        }
    };

    const inviteToRoom = async () => {
        if (selectedInvitees.length === 0) return;
        try {
            await api.post(`/social/rooms/${activeRoom._id}/invite`, { friendIds: selectedInvitees });
            toast.success('Reinforcements deployed!');
            setShowInviteModal(false);
            setSelectedInvitees([]);
            fetchData();
        } catch (error) {
            toast.error('Invitation failed.');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/social/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            toast.error('Failed to purge signal.');
        }
    };

    const clearAllNotifications = async () => {
        try {
            await api.delete('/social/notifications');
            setNotifications([]);
            toast.success('Neural link cleared.');
        } catch (error) {
            toast.error('Failed to clear signals.');
        }
    };

    const enterRoom = async (room) => {
        try {
            const res = await api.get(`/social/rooms/${room._id}`);
            setActiveRoom(res.data.data);
            setMessages(res.data.data.messages || []);
        } catch (error) {
            toast.error('Failed to access neural bridge.');
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "Y AGO";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "MO AGO";
        interval = seconds / 864000;
        if (interval > 1) return Math.floor(interval) + "D AGO";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "H AGO";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "M AGO";
        return Math.floor(seconds) + "S AGO";
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'task_completed': return { icon: CheckCircle, color: 'text-emerald-500' };
            case 'room_joined': return { icon: Users, color: 'text-indigo-500' };
            case 'battle_won': return { icon: Award, color: 'text-amber-500' };
            case 'rank_up': return { icon: TrendingUp, color: 'text-rose-500' };
            default: return { icon: Zap, color: 'text-primary' };
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading squad...</div>;

    return (
        <div className="space-y-6 max-w-6xl pb-20 mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-3xl font-black text-text flex items-center gap-3">
                        Squad <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-widest">Lite</span>
                    </h2>
                    <p className="text-sm text-muted">Work with friends. Stay accountable. Win together.</p>
                </div>
                <div className="flex items-center gap-3">


                    <PageInsight 
                        title="SQUAD COMMAND"
                        intro="The high-performance layer for collective focus. Synchronize with elite units to amplify productivity and climb the global ranks."
                        operations={[
                            { title: 'Neural Linkage', content: 'Connect with your most reliable partners and monitor their real-time operational status.' },
                            { title: 'Tactical Deployment', content: 'Join active focus rooms or architect your own private squad session for surgical precision.' },
                            { title: 'Arena Dominance', content: 'Compete in the global leagues. Accumulate Squad XP to ascend from Bronze to the Master Matrix.' }
                        ]}
                        neuralTip="Working in high-synchronicity squads can increase task completion velocity by up to 65% through social accountability."
                    />

                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="p-2 rounded-xl bg-surface2 hover:bg-surface3 border border-border/10 text-muted hover:text-text transition-all"
                    >
                        <UserPlus size={20} />
                    </button>
                </div>
            </div>

            {/* Top: Friends Carousel */}
            <div id="tour-squad-friends" className="flex items-center gap-4 overflow-x-auto pb-4 px-2 scrollbar-none">
                <button
                    onClick={() => setShowSearchModal(true)}
                    className="flex-shrink-0 w-16 h-16 rounded-2xl border-2 border-dashed border-border/20 flex flex-col items-center justify-center text-muted hover:border-primary/40 hover:text-primary transition-all group"
                >
                    <Plus size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold mt-1 uppercase">Invite</span>
                </button>

                {friends.map((friend) => (
                    <div key={friend._id} className="flex-shrink-0 flex flex-col items-center gap-1 group">
                        <div className="relative">
                            <AvatarDisplay avatarConfig={friend.avatarConfig} size="sm" showTitle={false} showPet={false} />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg ${Math.random() > 0.5 ? 'bg-emerald-500' : 'bg-surface3'
                                }`} />
                        </div>
                        <span className="text-[10px] font-bold text-muted group-hover:text-text transition-colors truncate w-16 text-center">
                            {friend.name?.split(' ')[0] || 'Friend'}
                        </span>
                    </div>
                ))}

                {requests.length > 0 && requests.map((req) => (
                    <div key={req._id} className="flex-shrink-0 bg-primary/5 border border-primary/20 rounded-2xl p-2 flex items-center gap-3">
                        <AvatarDisplay avatarConfig={req.sender.avatarConfig} size="xs" showTitle={false} showPet={false} />
                        <div>
                            <p className="text-[10px] font-bold leading-tight">{req.sender.name}</p>
                            <div className="flex gap-2 mt-1">
                                <button onClick={() => respondRequest(req.sender._id, 'accept')} className="p-1 rounded-md bg-emerald-500 text-white"><UserCheck size={10} /></button>
                                <button onClick={() => respondRequest(req.sender._id, 'reject')} className="p-1 rounded-md bg-rose-500 text-white"><UserX size={10} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main: Room Area (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Invitations Section */}
                    {(() => {
                        const userId = user?._id || user?.id;
                        const pendingInvites = rooms.filter(r => r.invitedUsers?.some(uid => (uid?._id || uid?.id || uid) === userId));

                        if (pendingInvites.length > 0 && !activeRoom) {
                            return (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-2">
                                        <Shield size={14} className="text-primary" /> Squad Invitations
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pendingInvites.map(room => (
                                            <div key={room._id} className="pc-card p-5 bg-primary/5 border-primary/20 flex flex-col justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-black text-lg">{room.name}</h4>
                                                        <p className="text-[10px] text-muted font-bold uppercase">Invited by {room.host?.name}</p>
                                                    </div>
                                                    <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black italic">PRIVATE</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => acceptRoomInvite(room._id)}
                                                        className="flex-1 py-2.5 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => rejectRoomInvite(room._id)}
                                                        className="px-4 py-2.5 bg-surface2 text-muted text-[10px] font-black uppercase rounded-xl hover:bg-rose-500/20 hover:text-rose-500 transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {!activeRoom ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-black uppercase tracking-wider text-muted">Active Rooms</h3>
                                <button
                                    id="tour-squad-create"
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                                >
                                    <Plus size={16} strokeWidth={3} /> CREATE SQUAD
                                </button>
                            </div>

                            <div id="tour-squad-rooms" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rooms.filter(r => {
                                    const userId = user?._id || user?.id;
                                    return r.members.some(m => (m.user?._id || m.user?.id || m.user) === userId);
                                }).length === 0 ? (
                                    <div className="col-span-2 pc-card py-16 text-center opacity-50 flex flex-col items-center justify-center gap-4">
                                        <Users size={48} className="text-muted" />
                                        <p className="text-sm max-w-xs">No active rooms found. Create one and invite your squad!</p>
                                    </div>
                                ) : (
                                    rooms.filter(r => {
                                        const userId = user?._id || user?.id;
                                        return r.members.some(m => (m.user?._id || m.user?.id || m.user) === userId);
                                    }).map((room) => {
                                        const isHost = String(room.host?._id || room.host?.id || room.host) === String(user?._id || user?.id);
                                        return (
                                        <motion.div
                                            key={room._id}
                                            whileHover={{ y: -4 }}
                                            className="pc-card group border-border/10 hover:border-primary/30 transition-all cursor-pointer p-5 flex flex-col justify-between"
                                            onClick={() => enterRoom(room)}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-black text-lg group-hover:text-primary transition-colors">{room.name}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                                room.league === 'Master' ? 'text-amber-400' :
                                                                room.league === 'Diamond' ? 'text-cyan-400' :
                                                                room.league === 'Platinum' ? 'text-indigo-400' :
                                                                room.league === 'Gold' ? 'text-yellow-500' :
                                                                room.league === 'Silver' ? 'text-slate-300' : 'text-orange-600'
                                                            }`}>{room.league || 'Bronze'}</span>
                                                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">• {room.squadXP?.toLocaleString() || 0} XP</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isHost && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteRoom(room._id);
                                                                }}
                                                                className="p-1 px-2 text-rose-500/70 hover:text-white hover:bg-rose-500 rounded-md transition-all text-[10px] font-black uppercase flex items-center gap-1"
                                                                title="Delete Room"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                        <div className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black italic">LIVE</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="flex -space-x-2">
                                                        {room.members.slice(0, 3).map(m => (
                                                            m.user && <AvatarDisplay key={m.user?._id || m.user} avatarConfig={m.user.avatarConfig || m.user?.avatarConfig} size="xs" showTitle={false} showPet={false} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-muted font-bold">{room.members.length} Squad Members</span>
                                                </div>
                                            </div>
                                            <button className="w-full py-2 bg-surface2 group-hover:bg-primary group-hover:text-white transition-all rounded-xl text-xs font-black uppercase">
                                                Join Squad
                                            </button>
                                        </motion.div>
                                    )})
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="pc-card overflow-hidden flex flex-col h-[700px] border-primary/20 bg-gradient-to-b from-primary/5 to-transparent shadow-2xl shadow-primary/5 relative">
                            {/* Room Header */}
                            <div className="px-6 py-4 border-b border-border/10 flex items-center justify-between bg-surface/50 backdrop-blur-xl z-10">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={closeRoom}
                                        className="p-2.5 bg-surface2 hover:bg-surface3 border border-border/10 rounded-xl transition-all text-muted hover:text-primary flex items-center gap-2 group"
                                        title="Back to Command Center"
                                    >
                                        <X size={18} className="group-hover:rotate-90 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back</span>
                                    </button>
                                    {String(activeRoom.host?._id || activeRoom.host?.id || activeRoom.host) === String(user?._id || user?.id) && (
                                        <button
                                            onClick={deleteRoom}
                                            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all text-rose-500 flex items-center gap-2"
                                            title="Delete Room"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Delete Room</span>
                                        </button>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-xl tracking-tight">{activeRoom.name}</h3>
                                            <Shield size={14} className="text-primary/50" />
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{activeRoom.league || 'Bronze'} LEAGUE</span>
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">• Secure Squad Channel</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {String(activeRoom.host?._id || activeRoom.host?.id || activeRoom.host) === String(user?._id || user?.id) && !activeRoom.activeSession?.isActive && (
                                        <button
                                            onClick={() => setShowConfigModal(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                        >
                                            <Zap size={16} fill="currentColor" strokeWidth={3} /> START SQUAD FOCUS
                                        </button>
                                    )}
                                    {activeRoom.activeSession?.isActive && (
                                        <button 
                                            onClick={() => navigate(`/squad/focus/${activeRoom._id}`)}
                                            className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black rounded-xl flex items-center gap-2 hover:bg-rose-500/20 transition-all cursor-pointer"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                            OPEN ACTIVE ARENA
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Main Room Body: Grid Layout */}
                            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                                {/* Left Side: Chat & Content */}
                                <div className="flex-1 flex flex-col min-w-0 border-r border-border/5">
                                    {/* Session Status Banner */}
                                    <div className="px-8 py-6 bg-surface/30 border-b border-border/5 flex items-center justify-between">
                                        <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            {activeRoom.activeSession?.isActive ? (
                                                <><div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> <span className="text-rose-500">Protocol Active in Arena</span></>
                                            ) : (
                                                <><span className="text-muted">Waiting for host to deploy session...</span></>
                                            )}
                                        </div>
                                    </div>

                                    {/* Chat Area */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-surface/5">
                                        {messages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                                                <MessageSquare size={32} />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-center">Encryption Active. <br /> Start your transmission.</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, i) => msg.sender && (
                                                <div key={i} className={`flex gap-3 ${msg.sender._id === user._id ? 'flex-row-reverse' : ''}`}>
                                                    <AvatarDisplay avatarConfig={msg.sender.avatarConfig} size="xs" showTitle={true} />
                                                    <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm ${msg.sender._id === user._id
                                                            ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
                                                            : 'bg-surface2 text-text rounded-tl-none border border-border/5'
                                                        }`}>
                                                        <p className="text-[9px] font-black uppercase opacity-60 mb-1.5 tracking-wider">
                                                            {msg.sender.name}
                                                        </p>
                                                        <p className="leading-relaxed font-medium">{msg.text}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    <form onSubmit={sendMessage} className="p-4 bg-surface/50 border-t border-border/10 flex gap-2">
                                        <input
                                            className="flex-1 bg-surface2 border border-border/10 p-3.5 rounded-2xl text-sm outline-none focus:border-primary/40 transition-all placeholder:text-muted/50"
                                            placeholder="Transmission code..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>

                                {/* Right Side: Members Sidebar */}
                                <div className="w-full lg:w-64 bg-surface3/20 flex flex-col overflow-hidden">
                                    {/* Sidebar Section: Dynamic Leaderboard or Stats */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                        {activeRoom.activeSession?.isActive && activeRoom.activeBattle ? (
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em] flex items-center gap-2">
                                                    <Zap size={12} fill="currentColor" /> Combat Leaderboard
                                                </h4>
                                                <div className="space-y-2">
                                                    {activeRoom.activeBattle.participants?.sort((a, b) => b.pointsEarned - a.pointsEarned).map((p, i) => {
                                                        const member = activeRoom.members.find(m => m.user?._id === (p.user?._id || p.user));
                                                        return (
                                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-[10px] font-black italic text-muted w-4">#{i + 1}</div>
                                                                    <p className="text-xs font-bold">{member?.user?.name || 'User'}</p>
                                                                </div>
                                                                <span className="text-xs font-black text-rose-500">{p.pointsEarned} <span className="text-[9px] opacity-60">PTS</span></span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2"><Users size={12} /> Squad Members</div>
                                                    {activeRoom.host === user._id && (
                                                        <button
                                                            onClick={() => setShowInviteModal(true)}
                                                            className="p-1 hover:bg-primary/10 text-primary rounded-md transition-all tooltip"
                                                            title="Add Reinforcements"
                                                        >
                                                            <UserPlus2 size={12} />
                                                        </button>
                                                    )}
                                                </h4>
                                                <div className="space-y-3">
                                                    {activeRoom.members.map((m) => m.user && (
                                                        <div key={m.user._id} className="flex items-center gap-3 group">
                                                            <div className="relative">
                                                                <AvatarDisplay avatarConfig={m.user.avatarConfig} size="xs" />
                                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg ${m.status === 'working' || m.status === 'focusing' ? 'bg-indigo-500' : 'bg-surface3'
                                                                    }`} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-bold text-text truncate leading-none mb-1">{m.user.name}</p>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${m.status === 'working' || m.status === 'focusing'
                                                                            ? 'bg-indigo-500/10 text-indigo-400'
                                                                            : 'bg-surface3 text-muted'
                                                                        }`}>
                                                                        {m.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sidebar Stats */}
                                    <div className="p-5 border-t border-border/10 bg-surface/50 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest">Squad Momentum</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-text">84%</span>
                                                <span className="text-[10px] text-emerald-500 font-bold font-mono">+12</span>
                                            </div>
                                        </div>
                                        <div className="h-1 bg-surface3 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-4/5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Stats & Activity (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Squad Stats */}
                    <div id="tour-squad-stats" className="pc-card p-6 bg-surface2/50 relative overflow-hidden group">
                        <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-text/5 group-hover:scale-110 transition-transform" />
                        <h3 className="font-black text-xs uppercase tracking-widest text-muted mb-4 border-b border-border/5 pb-2">Your Squad Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted uppercase">Sessions Won</p>
                                <p className="text-2xl font-black text-primary">{stats.sessionsWon}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted uppercase">Squad XP</p>
                                <p className="text-2xl font-black text-indigo-400">{(stats.squadXP / 1000).toFixed(1)}k</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-border/5">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase mb-2">
                                <span className="text-muted">Rank Progression</span>
                                <span className="text-indigo-400">{stats.rankLabel}</span>
                            </div>
                            <div className="h-2 bg-surface3 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.rankProgression}%` }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Simple Activity Feed */}
                    <div className="pc-card p-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                            <Award size={14} className="text-primary" /> Squad Activity
                        </h3>
                        <div className="space-y-6">
                            {activity.length === 0 ? (
                                <p className="text-[10px] text-center text-muted py-4 uppercase font-bold">No recent activity</p>
                            ) : (
                                activity.map((act, i) => {
                                    const { icon: Icon, color } = getActivityIcon(act.type);
                                    return (
                                        <div key={i} className="flex gap-3">
                                            <div className={`mt-0.5 p-1.5 rounded-lg bg-surface2 ${color}`}>
                                                <Icon size={12} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[11px] leading-tight text-text">
                                                    <span className="font-black">{act.user?._id === user._id ? 'You' : act.user?.name}</span> {act.details}
                                                </p>
                                                <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">{getTimeAgo(act.createdAt)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                        <h4 className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase mb-2">
                            <Zap size={14} fill="currentColor" /> Squad Pro-Tip
                        </h4>
                        <p className="text-[11px] text-muted leading-relaxed">
                            Focusing in a Room with 3+ friends scales your point gains by <span className="text-indigo-400 font-bold">1.5x</span>. Stay in the Top 1% to unlock exclusive Squad Tags.
                        </p>
                    </div>

                    {/* Global Squad Leaderboard */}
                    <div id="tour-squad-hall" className="pc-card p-6 bg-[#0D0D0F] border-white/5 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <Trophy size={64} className="text-white" />
                        </div>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2">
                                <Award size={14} className="animate-pulse" /> Top Tier Matrix
                            </h3>
                            <button 
                                onClick={() => navigate('/squad/leaderboard')}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black text-white/50 hover:text-white uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2"
                            >
                                Enter Arena <Zap size={10} fill="currentColor" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {globalLeaderboard.map((lb, i) => (
                                <div key={lb._id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500 text-white' :
                                                i === 1 ? 'bg-slate-300 text-slate-700' :
                                                    i === 2 ? 'bg-orange-400 text-white' : 'bg-surface3 text-muted'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold group-hover:text-amber-400 transition-colors uppercase tracking-wider">{lb.name}</p>
                                            <p className="text-[8px] text-muted font-black uppercase">{lb.memberCount} Members</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-white italic tracking-tight">{lb.squadXP?.toLocaleString() || 0} XP</p>
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                            <p className="text-[8px] font-black text-muted uppercase tracking-tighter">{lb.league || 'Bronze'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <SquadConfigModal 
                open={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                onConfirm={handleStartSession}
            />
            <AnimatePresence>
                {showInviteModal && activeRoom && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface pc-card p-8 w-full max-w-md border-primary/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black">Add Reinforcements</h3>
                                <button onClick={() => setShowInviteModal(false)} className="text-muted hover:text-text"><X /></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-2 block tracking-widest">Select Friends</label>

                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                        <input
                                            className="w-full bg-surface2 border border-border/10 p-2.5 pl-9 rounded-lg text-xs outline-none focus:border-primary/40 transition-all"
                                            placeholder="Search unit database..."
                                            value={friendSearchTerm}
                                            onChange={e => setFriendSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                                        {friends.filter(f => f.name.toLowerCase().includes(friendSearchTerm.toLowerCase())).length === 0 ? (
                                            <p className="text-[10px] text-muted font-bold italic py-2">No available operatives.</p>
                                        ) : (
                                            friends.filter(f =>
                                                f.name.toLowerCase().includes(friendSearchTerm.toLowerCase()) &&
                                                !activeRoom.members.some(m => m.user?._id === f._id)
                                            ).map(friend => (
                                                <div
                                                    key={friend._id}
                                                    onClick={() => {
                                                        setSelectedInvitees(prev =>
                                                            prev.includes(friend._id)
                                                                ? prev.filter(id => id !== friend._id)
                                                                : [...prev, friend._id]
                                                        )
                                                    }}
                                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedInvitees.includes(friend._id)
                                                            ? 'bg-primary/10 border-primary/30'
                                                            : 'bg-surface2 border-border/5 hover:border-border/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <AvatarDisplay avatarConfig={friend.avatarConfig} size="xs" />
                                                        <span className="text-sm font-bold">{friend.name}</span>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedInvitees.includes(friend._id)
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'border-border/20'
                                                        }`}>
                                                        {selectedInvitees.includes(friend._id) && <CheckCircle size={12} />}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={inviteToRoom}
                                        disabled={selectedInvitees.length === 0}
                                        className="w-full py-4 rounded-xl bg-primary text-white font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                                    >
                                        DEPLOY INVITATIONS
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showSearchModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface pc-card p-6 w-full max-w-md border-primary/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black">Find Friends</h3>
                                <button onClick={() => setShowSearchModal(false)} className="text-muted hover:text-text"><X /></button>
                            </div>
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                <input
                                    className="w-full bg-surface2 border border-border/10 p-3 pl-10 rounded-xl text-sm outline-none focus:border-primary transition-all"
                                    placeholder="Search by name, email, or User ID..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                                {searchResults.map((op) => (
                                    <div key={op._id} className="flex items-center justify-between p-3 rounded-xl bg-surface2 border border-border/5 group">
                                        <div className="flex items-center gap-3">
                                            <AvatarDisplay avatarConfig={op.avatarConfig} size="xs" />
                                            <div>
                                                <p className="text-sm font-bold">{op.name}</p>
                                                <p className="text-[10px] text-muted">@{op.email?.split('@')[0] || 'user'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => sendRequest(op._id)} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:scale-105 transition-all">CONNECT</button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface pc-card p-8 w-full max-w-md border-primary/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black">Create Squad</h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-text"><X /></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-2 block tracking-widest">Room Name</label>
                                    <input
                                        className="w-full bg-surface2 border border-border/10 p-4 rounded-xl text-lg font-bold outline-none focus:border-primary transition-all"
                                        placeholder="e.g. Deep Work"
                                        value={roomName}
                                        onChange={e => setRoomName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-2 block tracking-widest">Invite Friends</label>

                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                        <input
                                            className="w-full bg-surface2 border border-border/10 p-2.5 pl-9 rounded-lg text-xs outline-none focus:border-primary/40 transition-all"
                                            placeholder="Find friends to invite..."
                                            value={friendSearchTerm}
                                            onChange={e => setFriendSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                        {friends.filter(f => f.name.toLowerCase().includes(friendSearchTerm.toLowerCase())).length === 0 ? (
                                            <p className="text-[10px] text-muted font-bold italic py-2">No friends found to invite.</p>
                                        ) : (
                                            friends.filter(f => f.name.toLowerCase().includes(friendSearchTerm.toLowerCase())).map(friend => (
                                                <div
                                                    key={friend._id}
                                                    onClick={() => {
                                                        setSelectedInvitees(prev =>
                                                            prev.includes(friend._id)
                                                                ? prev.filter(id => id !== friend._id)
                                                                : [...prev, friend._id]
                                                        )
                                                    }}
                                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedInvitees.includes(friend._id)
                                                            ? 'bg-primary/10 border-primary/30'
                                                            : 'bg-surface2 border-border/5 hover:border-border/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <AvatarDisplay avatarConfig={friend.avatarConfig} size="xs" />
                                                        <span className="text-sm font-bold">{friend.name}</span>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedInvitees.includes(friend._id)
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'border-border/20'
                                                        }`}>
                                                        {selectedInvitees.includes(friend._id) && <CheckCircle size={12} />}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button onClick={createRoom} className="flex-1 py-4 rounded-xl bg-primary text-white font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                                        LAUNCH SQUAD
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

