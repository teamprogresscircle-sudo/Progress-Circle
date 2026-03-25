const User = require('../models/User');
const Battle = require('../models/Battle');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const SquadRoom = require('../models/SquadRoom');
const SquadActivity = require('../models/SquadActivity');

/** Decrypt mongoose-field-encryption fields on Task docs (no-op for plain objects missing the hook). */
const ensureDecrypted = (task) => {
    if (task && typeof task.decryptFieldsSync === 'function') {
        try {
            task.decryptFieldsSync();
        } catch (e) {
            // Already decrypted or failure
        }
    }
    return task;
};

const taskDocToPlain = (doc) => {
    if (!doc) return doc;
    ensureDecrypted(doc);
    if (doc.parentId && typeof doc.parentId === 'object' && doc.parentId.decryptFieldsSync) {
        ensureDecrypted(doc.parentId);
    }
    return doc.toObject ? doc.toObject() : doc;
};

// @desc    Search for users
// @route   GET /api/social/search
// @access  Private
exports.searchUsers = async (req, res, next) => {
    try {
        const query = req.query.q || req.query.query;
        if (!query) return res.status(200).json({ success: true, data: [] });

        // NEURAL FIREWALL: Sanitize regex input to prevent ReDoS
        const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Check if query is a valid MongoDB ObjectId
        const isId = /^[0-9a-fA-F]{24}$/.test(query);

        const users = await User.find({
            $or: [
                ...(isId ? [{ _id: query }] : []),
                { name: { $regex: sanitizedQuery, $options: 'i' } },
                { email: { $regex: sanitizedQuery, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }
        })
            .select('name avatar avatarConfig points streak socialStats')
            .limit(10);

        res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

// @desc    Send Friend Request
// @route   POST /api/social/friends/request/:id
// @access  Private
exports.sendFriendRequest = async (req, res, next) => {
    try {
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ success: false, message: "You cannot befriend yourself." });
        }

        const userToRequest = await User.findById(req.params.id);
        if (!userToRequest) return res.status(404).json({ success: false, message: "Operative not found." });

        // Check if already friends
        if (userToRequest.friends.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: "Already friends." });
        }

        // Check if request already exists
        const existingRequest = userToRequest.friendRequests.find(r => r.sender.toString() === req.user._id.toString());
        if (existingRequest) return res.status(400).json({ success: false, message: "Request already pending." });

        await User.findByIdAndUpdate(req.params.id, {
            $push: { friendRequests: { sender: req.user._id } }
        });

        // Create Notification
        await Notification.create({
            recipient: req.params.id,
            sender: req.user._id,
            type: 'friend_request',
            message: `${req.user.name} wants to connect with your squad.`
        });

        res.status(200).json({ success: true, message: `Friend request sent to ${userToRequest.name}` });
    } catch (err) { next(err); }
};

// @desc    Accept Friend Request
// @route   POST /api/social/friends/accept/:id (sender ID)
// @access  Private
exports.acceptFriendRequest = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const request = user.friendRequests.find(r => r.sender.toString() === req.params.id);

        if (!request) return res.status(404).json({ success: false, message: "Request not found." });

        // Add to both friends lists
        await User.findByIdAndUpdate(req.user._id, {
            $push: { friends: req.params.id },
            $pull: { friendRequests: { sender: req.params.id } }
        });
        await User.findByIdAndUpdate(req.params.id, {
            $push: { friends: req.user._id }
        });

        res.status(200).json({ success: true, message: "Friend request accepted." });
    } catch (err) { next(err); }
};

// @desc    Reject Friend Request
// @route   POST /api/social/friends/reject/:id
// @access  Private
exports.rejectFriendRequest = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { friendRequests: { sender: req.params.id } }
        });
        res.status(200).json({ success: true, message: "Request declined." });
    } catch (err) { next(err); }
};

// @desc    Remove Friend
// @route   DELETE /api/social/friends/:id
// @access  Private
exports.removeFriend = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { $pull: { friends: req.params.id } });
        await User.findByIdAndUpdate(req.params.id, { $pull: { friends: req.user._id } });
        res.status(200).json({ success: true, message: "Friend removed." });
    } catch (err) { next(err); }
};

// @desc    Get Friends List
// @route   GET /api/social/friends
// @access  Private
exports.getFriends = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'name avatar avatarConfig points streak lastActive socialStats')
            .populate('friendRequests.sender', 'name avatar avatarConfig');

        res.status(200).json({
            success: true,
            data: {
                friends: user.friends,
                requests: user.friendRequests
            }
        });
    } catch (err) { next(err); }
};

// ── UTILITIES ────────────────────────────────────────────────────────────────
const calculateLeague = (xp) => {
    if (xp >= 150000) return 'Master';
    if (xp >= 50000) return 'Diamond';
    if (xp >= 15000) return 'Platinum';
    if (xp >= 5000) return 'Gold';
    if (xp >= 1000) return 'Silver';
    return 'Bronze';
};

const refreshSquadScore = async (roomId) => {
    try {
        const room = await SquadRoom.findById(roomId).populate('members.user', 'xp points totalScore');
        if (!room) return;

        const totalXP = room.members.reduce((sum, m) => sum + (m.user?.totalScore || m.user?.xp || m.user?.points || 0), 0);
        room.squadXP = totalXP;
        room.squadPoints = totalXP;
        
        const newLeague = calculateLeague(totalXP);
        if (newLeague !== room.league) {
            room.league = newLeague;
            room.lastLeagueUpdate = new Date();
        }

        await room.save();
        return room;
    } catch (err) {
        console.error('Squad Score Refresh Failed:', err);
    }
};

/** $inc bypasses User pre('save'), so totalScore stays wrong. Load + .save() to recompute totalScore. */
const applyUserSquadPointsDelta = async (userId, delta) => {
    const user = await User.findById(userId);
    if (!user) return;
    user.socialStats = user.socialStats || {};
    user.socialStats.squadPoints = Math.max(0, (user.socialStats.squadPoints || 0) + delta);
    await user.save();
};

const applySessionCompletionRewards = async (userId, sessionDuration, xpReward) => {
    const user = await User.findById(userId);
    if (!user) return;
    user.totalFocusTime = (user.totalFocusTime || 0) + sessionDuration;
    user.points = (user.points || 0) + xpReward;
    user.xp = (user.xp || 0) + xpReward;
    user.socialStats = user.socialStats || {};
    user.socialStats.squadPoints = (user.socialStats.squadPoints || 0) + xpReward;
    await user.save();
};

// ── SQUAD ROOMS ──────────────────────────────────────────────────────────────

// @desc    Create Room
// @route   POST /api/social/rooms
// @access  Private
exports.createRoom = async (req, res, next) => {
    try {
        const { name, isPrivate = true, invitedFriends = [] } = req.body;
        const room = await SquadRoom.create({
            name,
            host: req.user._id,
            members: [{ user: req.user._id, status: 'idle' }],
            isPrivate,
            invitedUsers: invitedFriends
        });

        // Send invites
        for (const friendId of invitedFriends) {
            await Notification.create({
                recipient: friendId,
                sender: req.user._id,
                type: 'room_invite',
                refId: room._id,
                message: `${req.user.name} invited you to join the room: ${name}`
            });
        }

        await refreshSquadScore(room._id);

        const populatedRoom = await SquadRoom.findById(room._id)
            .populate('host', 'name avatar')
            .populate('members.user', 'name avatar avatarConfig');

        res.status(201).json({ success: true, data: populatedRoom });
    } catch (err) { next(err); }
};

// @desc    Join Room
// @route   POST /api/social/rooms/join/:id
// @access  Private
exports.joinRoom = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Room not found." });

        // Check if already in
        if (room.members.some(m => m.user.toString() === req.user._id.toString())) {
            return res.status(200).json({ success: true, data: room });
        }

        room.members.push({ user: req.user._id, status: 'idle' });
        await room.save();

        // Log Activity
        await SquadActivity.create({
            user: req.user._id,
            type: 'room_joined',
            details: `joined room "${room.name}"`
        });

        const populatedRoom = await SquadRoom.findById(room._id)
            .populate('host', 'name avatar')
            .populate('members.user', 'name avatar avatarConfig')
            .populate('messages.sender', 'name avatar avatarConfig');

        res.status(200).json({ success: true, data: populatedRoom });
    } catch (err) { next(err); }
};

// @desc    Get Rooms (Public and joined)
// @route   GET /api/social/rooms
// @access  Private
exports.getRooms = async (req, res, next) => {
    try {
        const rooms = await SquadRoom.find({
            $or: [
                { isPrivate: false },
                { 'members.user': req.user._id },
                { 'invitedUsers': req.user._id }
            ]
        }).populate('host', 'name avatar')
            .populate('members.user', 'name avatar avatarConfig xp points totalScore') // Added totalScore
            .populate('activeBattle')
            .sort({ updatedAt: -1 })
            .lean(); // Use lean for performance

        // Dynamically calculate squadXP based on current members' XP
        const formattedRooms = rooms.map(room => {
            const totalXP = room.members.reduce((sum, m) => sum + (m.user?.totalScore || m.user?.xp || m.user?.points || 0), 0);
            return {
                ...room,
                squadXP: totalXP,
                squadPoints: totalXP,
                league: calculateLeague(totalXP)
            };
        });

        res.status(200).json({ success: true, data: formattedRooms });
    } catch (err) { next(err); }
};

// @desc    Accept Room Invite
// @route   POST /api/social/rooms/:id/accept
// @access  Private
exports.acceptRoomInvite = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Room not found." });

        // Check if invited
        if (!room.invitedUsers.includes(req.user._id)) {
            return res.status(403).json({ success: false, message: "You are not invited to this room." });
        }

        // Move from invited to members
        room.invitedUsers = room.invitedUsers.filter(uid => uid.toString() !== req.user._id.toString());
        room.members.push({ user: req.user._id, status: 'idle' });
        await room.save();
        await refreshSquadScore(room._id);

        // Update Notification
        await Notification.findOneAndUpdate(
            { refId: room._id, recipient: req.user._id, type: 'room_invite' },
            { status: 'accepted' }
        );

        // Notify Host
        await Notification.create({
            recipient: room.host,
            sender: req.user._id,
            type: 'room_accepted',
            message: `${req.user.name} joined your room [${room.name}]`
        });

        const populatedRoom = await SquadRoom.findById(room._id)
            .populate('host', 'name avatar')
            .populate('members.user', 'name avatar avatarConfig');

        res.status(200).json({ success: true, data: populatedRoom });
    } catch (err) { next(err); }
};

// @desc    Reject Room Invite
// @route   POST /api/social/rooms/:id/reject
// @access  Private
exports.rejectRoomInvite = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Room not found." });

        room.invitedUsers = room.invitedUsers.filter(uid => uid.toString() !== req.user._id.toString());
        await room.save();

        // Mark Notification as handled
        await Notification.findOneAndUpdate(
            { refId: room._id, recipient: req.user._id, type: 'room_invite' },
            { status: 'rejected' }
        );

        res.status(200).json({ success: true, message: "Invite declined." });
    } catch (err) { next(err); }
};

// @desc    Leave Room
// @route   POST /api/social/rooms/leave/:id
// @access  Private
exports.leaveRoom = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Room not found." });

        room.members = room.members.filter(m => m.user.toString() !== req.user._id.toString());
        await room.save();
        await refreshSquadScore(room._id);

        res.status(200).json({ success: true, message: "Left room." });
    } catch (err) { next(err); }
};

// @desc    Delete Room
// @route   DELETE /api/social/rooms/:id
// @access  Private (Host only)
exports.deleteRoom = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Room not found." });

        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the host can delete this room." });
        }

        await SquadRoom.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: "Room deleted." });
    } catch (err) { next(err); }
};

// @desc    Send Message in Room
// @route   POST /api/social/rooms/:id/chat
// @access  Private
exports.sendRoomMessage = async (req, res, next) => {
    try {
        const { text } = req.body;
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Room not found." });

        room.messages.push({ sender: req.user._id, text, createdAt: new Date() });

        // Optimization: Cap message history at 100 to prevent document bloat
        if (room.messages.length > 100) {
            room.messages = room.messages.slice(-100);
        }
        await room.save();

        // Handle @mentions
        const mentionRegex = /@(\w+)/g;
        const matches = [...text.matchAll(mentionRegex)];
        if (matches.length > 0) {
            const usernames = matches.map(m => m[1]);
            const mentionedUsers = await User.find({ name: { $in: usernames } });

            for (const target of mentionedUsers) {
                if (target._id.toString() !== req.user._id.toString()) {
                    await Notification.create({
                        recipient: target._id,
                        sender: req.user._id,
                        type: 'room_invite', // Re-using type or should be 'room_mention'
                        message: `${req.user.name} mentioned you in ${room.name}`,
                        refId: room._id
                    });
                }
            }
        }

        const updatedRoom = await SquadRoom.findById(room._id).populate('messages.sender', 'name avatar');
        res.status(200).json({ success: true, data: updatedRoom.messages });
    } catch (err) { next(err); }
};

// @desc    Host: list a room member's open tasks (for staking in battle)
// @route   GET /api/social/rooms/:id/member-tasks/:userId
// @access  Private (room host only)
exports.getMemberTasksForRoomHost = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found.' });
        }
        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the room host can load member tasks.' });
        }
        const targetUserId = req.params.userId;
        const isMember = room.members.some((m) => m.user.toString() === targetUserId);
        if (!isMember) {
            return res.status(403).json({ success: false, message: 'User is not in this room.' });
        }
        const memberTasksDocs = await Task.find({
            userId: targetUserId,
            status: { $ne: 'completed' }
        })
            .populate('categoryId')
            .populate('parentId', 'title')
            .sort({ createdAt: -1 });

        const memberTasks = memberTasksDocs.map((d) => taskDocToPlain(d));

        let hostTasks = [];
        if (room.host.toString() !== targetUserId.toString()) {
            const hostTasksDocs = await Task.find({
                userId: room.host,
                status: { $ne: 'completed' }
            })
                .populate('categoryId')
                .populate('parentId', 'title')
                .sort({ createdAt: -1 });
            hostTasks = hostTasksDocs.map((d) => taskDocToPlain(d));
        }

        res.status(200).json({
            success: true,
            data: { memberTasks, hostTasks }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Single Room Details
// @route   GET /api/social/rooms/:id
// @access  Private
exports.getRoom = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Room not found." });
        
        // Refresh score to ensure accuracy
        await refreshSquadScore(room._id);
        
        const refreshedRoom = await SquadRoom.findById(room._id)
            .populate('host', 'name avatar')
            .populate('members.user', 'name avatar avatarConfig xp points totalScore socialStats')
            .populate('messages.sender', 'name avatar avatarConfig')
            .populate({
                path: 'activeBattle',
                populate: [
                    {
                        path: 'participants.user',
                        select: 'name avatar xp points totalScore socialStats'
                    },
                    {
                        path: 'participants.battleTasks',
                        model: 'Task'
                    }
                ]
            });

        // Build authoritative score list directly from User collection.
        const memberIds = (refreshedRoom.members || []).map((m) => m.user?._id || m.user).filter(Boolean);
        const users = await User.find({ _id: { $in: memberIds } })
            .select('name avatar xp points totalScore socialStats');

        const scoreById = new Map(
            users.map((u) => [
                u._id.toString(),
                {
                    userId: u._id,
                    name: u.name,
                    avatar: u.avatar,
                    totalScore: u.totalScore || 0,
                    points: u.points || 0,
                    xp: u.xp || 0,
                    squadPoints: u.socialStats?.squadPoints || 0
                }
            ])
        );

        const roomObj = refreshedRoom.toObject();
        roomObj.memberScores = (refreshedRoom.members || [])
            .map((m) => scoreById.get(String(m.user?._id || m.user)))
            .filter(Boolean);

        res.status(200).json({ success: true, data: roomObj });
    } catch (err) { next(err); }
};

// @desc    Update Member Status
// @route   PATCH /api/social/rooms/:id/status
// @access  Private
exports.updateMemberStatus = async (req, res, next) => {
    try {
        const { status } = req.body; // 'working', 'idle', 'away'
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Room not found." });

        const member = room.members.find(m => m.user.toString() === req.user._id.toString());
        if (member) {
            member.status = status;
            member.lastActive = new Date();
            await room.save();
        }

        res.status(200).json({ success: true, data: room });
    } catch (err) { next(err); }
};

// @desc    Start Room Session (shared timer)
// @route   POST /api/social/rooms/:id/start
// @access  Private (Host only)
exports.startRoomSession = async (req, res, next) => {
    try {
        const { duration, type = 'focus' } = req.body;
        const room = await SquadRoom.findById(req.params.id);

        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the host can start sessions." });
        }

        // Create Battle record for competitive tracking
        const battle = await Battle.create({
            participants: room.members.map(m => ({ user: m.user, pointsEarned: 0 })),
            host: req.user._id,
            roomId: room._id,
            status: 'active',
            startTime: new Date(),
            durationMinutes: duration,
            stake: duration * 2 // Squad bonus
        });

        room.activeBattle = battle._id;
        room.activeSession = {
            startTime: new Date(),
            durationMinutes: duration,
            type,
            isActive: true,
            isPaused: false
        };
        await room.save();

        const populatedRoom = await SquadRoom.findById(room._id)
            .populate('host', 'name avatar')
            .populate('members.user', 'name avatar avatarConfig')
            .populate('activeBattle');

        res.status(200).json({ success: true, data: populatedRoom });
    } catch (err) { next(err); }
};

// @desc    Pause / resume squad room session timer (host only)
// @route   POST /api/social/rooms/:id/session/control
// @access  Private (host)
exports.roomSessionControl = async (req, res, next) => {
    try {
        const { action } = req.body;
        const room = await SquadRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the host can control the session.' });
        }
        if (!room.activeSession?.isActive) {
            return res.status(400).json({ success: false, message: 'No active session.' });
        }
        if (action === 'pause') {
            room.activeSession.isPaused = true;
        } else if (action === 'resume') {
            room.activeSession.isPaused = false;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action.' });
        }
        await room.save();
        const populated = await SquadRoom.findById(room._id)
            .populate('host', 'name avatar')
            .populate('members.user', 'name avatar avatarConfig')
            .populate('activeBattle');
        res.status(200).json({ success: true, data: populated });
    } catch (err) {
        next(err);
    }
};

// @desc    Abort active session (host): end timer & battle with no completion XP
// @route   POST /api/social/rooms/:id/abort
// @access  Private (host)
exports.abortSquadSession = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id).populate('activeBattle');
        if (!room || !room.activeSession?.isActive) {
            return res.status(400).json({ success: false, message: 'No active session to abort.' });
        }
        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the host can abort the session.' });
        }

        if (room.activeBattle) {
            const battle = await Battle.findById(room.activeBattle._id || room.activeBattle);
            if (battle) {
                battle.status = 'cancelled';
                battle.endTime = new Date();
                battle.logs.push({
                    message: 'Session aborted by host (no completion bonus).',
                    timestamp: new Date()
                });
                await battle.save();
            }
        }

        room.members.forEach((member) => {
            member.status = 'idle';
        });

        room.activeSession.isActive = false;
        room.activeBattle = null;
        await room.save();
        await refreshSquadScore(room._id);

        res.status(200).json({
            success: true,
            message: 'Session ended without awarding completion XP.',
            abandoned: true
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Complete Room Session (award rewards)
// @route   POST /api/social/rooms/:id/complete
// @access  Private
exports.completeSquadSession = async (req, res, next) => {
    try {
        const room = await SquadRoom.findById(req.params.id).populate('activeBattle');
        if (!room || !room.activeSession?.isActive) {
            return res.status(400).json({ success: false, message: "No active session to complete." });
        }
        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the host can complete the session.' });
        }

        const sessionStart = room.activeSession.startTime;
        const plannedMinutes = room.activeSession.durationMinutes;
        if (!sessionStart || plannedMinutes == null) {
            return res.status(400).json({ success: false, message: 'Invalid session data.' });
        }
        const scheduledEndMs = new Date(sessionStart).getTime() + plannedMinutes * 60000;
        // Block early completion (same reward as full session). Small grace for clock skew / latency.
        const EARLY_GRACE_MS = 4000;
        if (Date.now() < scheduledEndMs - EARLY_GRACE_MS) {
            return res.status(400).json({
                success: false,
                code: 'SESSION_NOT_ENDED',
                message: 'Completion rewards unlock only after the scheduled session time has finished.'
            });
        }

        const sessionDuration = plannedMinutes;
        const xpReward = sessionDuration * 2 + 50; // Base + Squad Bonus

        // Update Battle status
        if (room.activeBattle) {
            const battle = await Battle.findById(room.activeBattle._id || room.activeBattle);
            if (battle) {
                battle.status = 'completed';
                battle.endTime = new Date();
                await battle.save();
            }
        }

        const participantIds = room.members.map(m => m.user?._id || m.user);
        for (const uid of participantIds) {
            if (!uid) continue;
            await applySessionCompletionRewards(uid, sessionDuration, xpReward);
        }

        room.members.forEach(member => {
            member.totalFocusTime += sessionDuration;
            member.status = 'idle';
        });

        room.activeSession.isActive = false;
        room.activeBattle = null;
        await room.save();
        await refreshSquadScore(room._id);

        res.status(200).json({
            success: true,
            message: "Session completed!",
            rewards: { xp: xpReward }
        });
    } catch (err) { next(err); }
};

// @desc    Get Global Squad Leaderboard
// @route   GET /api/social/leaderboard
// @access  Private
exports.getGlobalSquadLeaderboard = async (req, res, next) => {
    try {
        // Find all rooms and populate users to get accurate XP
        const squads = await SquadRoom.find({})
            .populate('members.user', 'xp points totalScore')
            .lean();

        // Calculate current XP for each squad and format
        const leaderboard = squads.map(room => {
            const totalXP = room.members.reduce((sum, m) => sum + (m.user?.totalScore || m.user?.xp || m.user?.points || 0), 0);
            return {
                ...room,
                squadXP: totalXP,
                squadPoints: totalXP, // compatibility
                memberCount: room.members.length,
                league: calculateLeague(totalXP)
            };
        });

        // Sort by XP
        const sorted = leaderboard.sort((a, b) => b.squadXP - a.squadXP).slice(0, 50);
        
        // Add rankings
        const ranked = sorted.map((s, idx) => ({ ...s, rank: idx + 1 }));

        res.status(200).json({ success: true, data: ranked });
    } catch (err) { next(err); }
};


// @desc    Invite a user to a Focus Battle
// @route   POST /api/social/battle/invite
// @access  Private (Pro)
exports.inviteToBattle = async (req, res, next) => {
    try {
        if (req.user.plan !== 'premium') {
            return res.status(403).json({ success: false, message: "Advanced Battles are for pro members!" });
        }

        const { opponentId, duration = 25, isMultiday = false, tasks = [] } = req.body;

        // Ensure mutual following if required (Simplified for now: just notified)
        const opponent = await User.findById(opponentId);
        if (!opponent) return res.status(404).json({ success: false, message: "Peer not found" });

        const battle = await Battle.create({
            participants: [
                { user: req.user._id, battleTasks: tasks },
                { user: opponentId }
            ],
            host: req.user._id,
            status: 'pending',
            durationMinutes: isMultiday ? 0 : duration,
            isMultiday
        });

        // Create Notification
        await Notification.create({
            recipient: opponentId,
            sender: req.user._id,
            type: 'battle_invite',
            refId: battle._id,
            message: `${req.user.name} challenged you to a Focus Battle!`
        });

        res.status(201).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};

// @desc    Accept/Reject Battle
// @route   POST /api/social/battle/respond/:id
// @access  Private
exports.respondToBattle = async (req, res, next) => {
    try {
        const { action } = req.body; // 'accept' or 'reject'
        const battle = await Battle.findById(req.params.id);

        if (!battle) return res.status(404).json({ success: false, message: "Battle session not found" });
        if (battle.participants[1].user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: "Not authorized" });
        }

        if (action === 'accept') {
            if (battle.status === 'pending') {
                battle.status = 'active';
                battle.startTime = new Date();
                battle.endTime = battle.isMultiday ? null : new Date(Date.now() + battle.durationMinutes * 60000);

                battle.logs.push({
                    message: "Protocol Activated. Strategic alignment complete.",
                    timestamp: new Date()
                });

                await battle.save();

                // Only create join notification once if not already active
                const existingNotif = await Notification.findOne({
                    recipient: battle.host,
                    sender: req.user._id,
                    type: 'battle_accepted',
                    refId: battle._id
                });

                if (!existingNotif) {
                    await Notification.create({
                        recipient: battle.host,
                        sender: req.user._id,
                        type: 'battle_accepted',
                        refId: battle._id,
                        message: `${req.user.name} has entered the Arena!`
                    });
                }
            }
        } else {
            battle.status = 'cancelled';
            await battle.save();
        }

        // Mark notification as handled
        await Notification.findOneAndUpdate(
            { refId: battle._id, recipient: req.user._id },
            { status: action === 'accept' ? 'accepted' : 'rejected' }
        );

        res.status(200).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};

// @desc    Host Controls: Pause/Resume/End
// @route   PATCH /api/social/battle/control/:id
// @access  Private (Host)
exports.controlBattle = async (req, res, next) => {
    try {
        const { action } = req.body; // 'pause', 'resume', 'end'
        const battle = await Battle.findById(req.params.id);

        if (battle.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the host can control battle state" });
        }

        if (action === 'pause') {
            battle.status = 'paused';
            battle.paused = true;
            battle.breakSessions.push({ start: new Date() });
        } else if (action === 'resume') {
            battle.status = 'active';
            battle.paused = false;
            // Close last break session
            const lastBreak = battle.breakSessions[battle.breakSessions.length - 1];
            if (lastBreak && !lastBreak.end) lastBreak.end = new Date();
        } else if (action === 'end') {
            battle.status = 'completed';
            battle.endTime = new Date();

            // Determine winner (simplified: person with most points in battle)
            let winnerId = null;
            let maxPoints = -1;
            battle.participants.forEach(p => {
                if (p.pointsEarned > maxPoints) {
                    maxPoints = p.pointsEarned;
                    winnerId = p.user;
                }
            });

            if (winnerId) {
                battle.winner = winnerId;
                // Update User Stats
                await User.findByIdAndUpdate(winnerId, { $inc: { 'socialStats.battlesWon': 1 } });

                // Log Activity
                await SquadActivity.create({
                    user: winnerId,
                    type: 'battle_won',
                    details: 'won a Focus Battle 🔥'
                });
            }
        }

        await battle.save();
        res.status(200).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};

// @desc    Get All Notifications
// @route   GET /api/social/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id, status: 'pending' })
            .populate('sender', 'name avatar')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: notifications });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user productivity trajectory
// @route   GET /api/social/trajectory/:id
// @access  Private
exports.getTrajectory = async (req, res, next) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

        // Mock data for 7 days if history is empty to ensure visual polish
        let history = targetUser.socialStats?.dailyPoints || [];
        if (history.length < 7) {
            const now = new Date();
            const mockHistory = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                // Base on current points with some variance
                const points = Math.max(0, targetUser.points - (i * 200) + Math.floor(Math.random() * 100));
                mockHistory.push({ date, points });
            }
            history = mockHistory;
        }

        res.status(200).json({ success: true, data: history });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single battle details
// @route   GET /api/social/battle/:id
// @access  Private
exports.getBattle = async (req, res, next) => {
    try {
        const battle = await Battle.findById(req.params.id)
            .populate('participants.user', 'name avatar xp points totalScore socialStats')
            .populate('participants.battleTasks')
            .populate('messages.sender', 'name avatar');

        if (!battle) return res.status(404).json({ success: false, message: "Battle not found" });

        // Ensure all populated tasks are decrypted
        battle.participants.forEach(p => {
            p.battleTasks = p.battleTasks.map(t => ensureDecrypted(t));
        });

        res.status(200).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};

// @desc    Send chat message in battle
// @route   POST /api/social/battle/chat/:id
// @access  Private
exports.sendBattleMessage = async (req, res, next) => {
    try {
        const { message } = req.body;
        const battle = await Battle.findById(req.params.id);

        if (!battle) return res.status(404).json({ success: false, message: "Battle not found" });

        const isParticipant = battle.participants.some(p => p.user.toString() === req.user._id.toString());
        if (!isParticipant) return res.status(403).json({ success: false, message: "Unauthorized signal transmission" });

        battle.messages.push({
            sender: req.user._id,
            message: message
        });

        await battle.save();

        const updatedBattle = await Battle.findById(battle._id)
            .populate('participants.user', 'name avatar')
            .populate('participants.battleTasks')
            .populate('messages.sender', 'name avatar');

        res.status(200).json({ success: true, data: updatedBattle });
    } catch (err) {
        next(err);
    }
};

// @desc    Get active battles for current user
exports.getActiveBattles = async (req, res, next) => {
    try {
        const battles = await Battle.find({
            participants: { $elemMatch: { user: req.user._id } },
            status: { $in: ['active', 'paused', 'pending'] }
        }).populate('participants.user', 'name avatar');

        res.status(200).json({ success: true, data: battles });
    } catch (err) {
        next(err);
    }
};

// @desc    Get discoverable active battles
// @route   GET /api/social/battle/discover
// @access  Private
exports.getDiscoverableBattles = async (req, res, next) => {
    try {
        const battles = await Battle.find({
            'participants.user': { $ne: req.user._id },
            status: 'active'
        }).populate('host', 'name avatar');

        res.status(200).json({ success: true, data: battles });
    } catch (err) {
        next(err);
    }
};

// @desc    Add task to active battle (Host can assign to anyone)
// @route   POST /api/social/battle/add-task/:id
// @access  Private
exports.addTaskToBattle = async (req, res, next) => {
    try {
        const { taskId, targetUserId } = req.body; // targetUserId optional, defaults to self
        const battle = await Battle.findById(req.params.id);

        if (!battle || battle.status === 'completed' || battle.status === 'cancelled') {
            return res.status(400).json({ success: false, message: "Arena is not active." });
        }

        const isHost = battle.host.toString() === req.user._id.toString();
        const effectiveTarget = isHost && targetUserId ? targetUserId : req.user._id;

        const participant = battle.participants.find(p => p.user.toString() === effectiveTarget.toString());
        if (!participant) return res.status(404).json({ success: false, message: "Target user is not in this Arena." });

        if (!participant.battleTasks.includes(taskId)) {
            participant.battleTasks.push(taskId);

            const task = await Task.findById(taskId);
            const targetUser = await User.findById(effectiveTarget);

            battle.logs.push({
                message: isHost && targetUserId && targetUserId !== req.user._id.toString()
                    ? `Host assigned mission [${task?.title || 'Unknown'}] to ${targetUser?.name}`
                    : `${req.user.name} staked mission: [${task?.title || 'Unknown'}]`,
                timestamp: new Date()
            });

            await battle.save();
        }

        res.status(200).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};

// @desc    Host: remove a task from a participant's session list (unassign)
// @route   POST /api/social/battle/remove-task/:id
// @access  Private (host only)
exports.removeTaskFromBattle = async (req, res, next) => {
    try {
        const { taskId, targetUserId } = req.body;
        const battle = await Battle.findById(req.params.id);

        if (!battle || battle.status === 'completed' || battle.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Arena is not active.' });
        }
        if (battle.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the host can remove session assignments.' });
        }

        const participant = battle.participants.find((p) => p.user.toString() === targetUserId.toString());
        if (!participant) {
            return res.status(404).json({ success: false, message: 'Target user is not in this Arena.' });
        }

        const had = participant.battleTasks.some((tid) => tid.toString() === taskId.toString());
        if (!had) {
            return res.status(400).json({ success: false, message: 'Task is not in this session for that user.' });
        }

        participant.battleTasks = participant.battleTasks.filter((tid) => tid.toString() !== taskId.toString());

        const taskDoc = await Task.findById(taskId);
        ensureDecrypted(taskDoc);
        const targetUser = await User.findById(targetUserId).select('name');
        battle.logs.push({
            message: `Host removed [${taskDoc?.title || 'task'}] from ${targetUser?.name || 'operative'}'s session`,
            timestamp: new Date()
        });

        await battle.save();
        res.status(200).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};

// @desc    Extend battle time
// @route   PATCH /api/social/battle/extend/:id
// @access  Private (Host)
exports.extendBattleTime = async (req, res, next) => {
    try {
        const { minutes } = req.body;
        const battle = await Battle.findById(req.params.id);

        if (battle.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the host can adjust the temporal sequence." });
        }

        if (battle.status !== 'completed') {
            const currentEnd = battle.endTime ? new Date(battle.endTime) : new Date();
            battle.endTime = new Date(currentEnd.getTime() + minutes * 60000);

            battle.logs.push({
                message: `Temporal extension deployed: +${minutes} minutes.`,
                timestamp: new Date()
            });

            await battle.save();
        }

        res.status(200).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};


// @desc    Toggle task status within battle
// @route   PATCH /api/social/battle/toggle-task/:id
// @access  Private
exports.toggleTaskStatus = async (req, res, next) => {
    try {
        const { taskId } = req.body;
        const battle = await Battle.findById(req.params.id);

        const participant = battle.participants.find(p => p.user.toString() === req.user._id.toString());
        if (!participant) return res.status(403).json({ success: false, message: "Not a participant." });

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ success: false, message: "Task not found." });

        const isOwner = task.userId.toString() === req.user._id.toString();
        let isStaked = participant.battleTasks.some(btId => btId.toString() === taskId.toString());
        if (!isStaked) {
            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'This task is not staked for you in this battle. Ask the host to assign it, or use Stake on your row.'
                });
            }
            participant.battleTasks.push(taskId);
        }
        const pointsAwarded = isStaked ? 50 : 10;

        const oldStatus = task.status;
        const newStatus = oldStatus === 'completed' ? 'pending' : 'completed';

        task.status = newStatus;
        task.completedAt = newStatus === 'completed' ? new Date() : null;
        await task.save();

        const hostParticipant = battle.participants.find(p => p.user.toString() === battle.host.toString());
        const hostIsCompleter = battle.host.toString() === req.user._id.toString();

        if (newStatus === 'completed') {
            participant.tasksCompleted += 1;
            participant.pointsEarned += pointsAwarded;
            if (hostParticipant && !hostIsCompleter) {
                hostParticipant.pointsEarned += pointsAwarded;
            }

            battle.logs.push({
                message: `Target Neutralized: ${req.user.name} finished [${task.title}] - +${pointsAwarded} XP`,
                timestamp: new Date()
            });
        } else {
            participant.tasksCompleted = Math.max(0, participant.tasksCompleted - 1);
            participant.pointsEarned = Math.max(0, participant.pointsEarned - pointsAwarded);
            if (hostParticipant && !hostIsCompleter) {
                hostParticipant.pointsEarned = Math.max(0, hostParticipant.pointsEarned - pointsAwarded);
            }
        }

        await battle.save();

        if (battle.roomId) {
            const inc = newStatus === 'completed' ? pointsAwarded : -pointsAwarded;
            await applyUserSquadPointsDelta(req.user._id, inc);
            if (!hostIsCompleter) {
                await applyUserSquadPointsDelta(battle.host, inc);
            }
            await refreshSquadScore(battle.roomId);
        }

        res.status(200).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};

// @desc    Join an active battle
// @route   POST /api/social/battle/join/:id
// @access  Private
exports.joinBattle = async (req, res, next) => {
    try {
        const battle = await Battle.findById(req.params.id);
        if (!battle) return res.status(404).json({ success: false, message: "Arena not found." });

        const isAlreadyIn = battle.participants.some(p => p.user.toString() === req.user._id.toString());
        if (isAlreadyIn) return res.status(400).json({ success: false, message: "Identity already synced with this Arena." });

        battle.participants.push({ user: req.user._id });
        battle.logs.push({
            message: `${req.user.name} has breached the Arena perimeter!`,
            timestamp: new Date()
        });

        await battle.save();
        res.status(200).json({ success: true, data: battle });
    } catch (err) {
        next(err);
    }
};
// @desc    Clear all synergy data for the current user
// @route   DELETE /api/social/clear-synergy
// @access  Private
exports.clearSynergyData = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // 1. Reset user synergy points and stats
        await User.findByIdAndUpdate(userId, {
            $set: {
                'socialStats.synergyPoints': 0,
                'socialStats.orbsSent': 0,
                'socialStats.battlesWon': 0
            }
        });

        // 2. Delete all synergy tasks owned by this user
        await Task.deleteMany({ userId, isSynergyTask: true });

        // 3. Handle battles
        // Cancel battles where user is host
        await Battle.updateMany(
            { host: userId, status: { $in: ['pending', 'active', 'paused'] } },
            { $set: { status: 'cancelled' } }
        );

        // Remove user from battles where they are a participant but not host
        await Battle.updateMany(
            {
                'participants.user': userId,
                host: { $ne: userId },
                status: { $in: ['pending', 'active', 'paused'] }
            },
            { $pull: { participants: { user: userId } } }
        );

        res.status(200).json({
            success: true,
            message: "Synergy data purged. Neural collaborative nodes reset."
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Squad Performance Stats
// @route   GET /api/social/stats
// @access  Private
exports.getSquadStats = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        // Calculate Rank Progression (Mock algorithm based on points)
        const points = user.points || 0;
        const rankPercent = Math.min(99, Math.floor((points / 10000) * 100));

        res.status(200).json({
            success: true,
            data: {
                sessionsWon: user.socialStats?.battlesWon || 0,
                squadXP: user.socialStats?.squadPoints || 0,
                rankProgression: rankPercent,
                rankLabel: points > 5000 ? 'Top 1%' : 'Active'
            }
        });
    } catch (err) { next(err); }
};

// @desc    Get Squad Activity Feed
// @route   GET /api/social/activity
// @access  Private
exports.getSquadActivity = async (req, res, next) => {
    try {
        // Get user and friends to see their activity
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        const userIds = [req.user._id, ...(user.friends || [])];

        const activities = await SquadActivity.find({ user: { $in: userIds } })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: activities
        });
    } catch (err) { next(err); }
};
// @desc    Get Notifications for the current user
// @route   GET /api/social/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'name avatar avatarConfig')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ success: true, data: notifications });
    } catch (err) { next(err); }
};

// @desc    Mark notification as toasted
// @route   PATCH /api/social/notifications/:id/toasted
// @access  Private
exports.markNotificationToasted = async (req, res, next) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isToasted: true });
        res.status(200).json({ success: true });
    } catch (err) { next(err); }
};

// @desc    Invite additional friends to an existing room
// @route   POST /api/social/rooms/:id/invite
// @access  Private (Host)
exports.inviteToRoom = async (req, res, next) => {
    try {
        const { friendIds } = req.body;
        const room = await SquadRoom.findById(req.params.id);

        if (!room) return res.status(404).json({ success: false, message: "Room not found." });
        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the squad leader can deploy reinforcements." });
        }

        const newInvites = [];
        for (const friendId of friendIds) {
            // Check if already a member or already invited
            const isMember = room.members.some(m => m.user.toString() === friendId);
            const isInvited = room.invitedUsers.includes(friendId);

            if (!isMember && !isInvited) {
                room.invitedUsers.push(friendId);
                newInvites.push(friendId);

                // Create Notification
                await Notification.create({
                    recipient: friendId,
                    sender: req.user._id,
                    type: 'room_invite',
                    refId: room._id,
                    message: `${req.user.name} invited you to the squad: ${room.name}`
                });
            }
        }

        if (newInvites.length > 0) {
            await room.save();
        }

        res.status(200).json({ success: true, message: `${newInvites.length} invite(s) sent.`, data: room });
    } catch (err) { next(err); }
};

// @desc    Clear all notifications
// @route   DELETE /api/social/notifications
// @access  Private
exports.clearNotifications = async (req, res, next) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });
        res.status(200).json({ success: true, message: 'Notifications cleared.' });
    } catch (err) { next(err); }
};

// @desc    Delete single notification
// @route   DELETE /api/social/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
    try {
        const notif = await Notification.findById(req.params.id);
        if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });

        if (notif.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        await notif.deleteOne();
        res.status(200).json({ success: true, message: 'Notification deleted.' });
    } catch (err) { next(err); }
};
// getGlobalSquadLeaderboard moved and consolidated above
