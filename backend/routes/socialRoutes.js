const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    searchUsers, getFriends,
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend,
    createRoom, getRooms, getRoom, joinRoom, acceptRoomInvite, rejectRoomInvite,
    inviteToRoom, leaveRoom, deleteRoom, sendRoomMessage, updateMemberStatus, startRoomSession, completeSquadSession,
    getGlobalSquadLeaderboard, getNotifications, markNotificationToasted, clearNotifications, deleteNotification, clearSynergyData,
    inviteToBattle, respondToBattle, getActiveBattles, getBattle, toggleTaskStatus, addTaskToBattle,
    getSquadStats, getSquadActivity
} = require('../controllers/socialController');

// ── Friends ──────────────────────────────────────────────────────────────────
router.get('/search', protect, searchUsers);
router.get('/friends', protect, getFriends);
router.post('/friends/request/:id', protect, sendFriendRequest);
router.post('/friends/accept/:id', protect, acceptFriendRequest);
router.post('/friends/reject/:id', protect, rejectFriendRequest);
router.delete('/friends/:id', protect, removeFriend);
router.get('/stats', protect, getSquadStats);
router.get('/activity', protect, getSquadActivity);

// ── Rooms ────────────────────────────────────────────────────────────────────
router.route('/rooms').get(protect, getRooms).post(protect, createRoom);
router.get('/leaderboard', protect, getGlobalSquadLeaderboard);
router.post('/rooms/join/:id', protect, joinRoom);
router.post('/rooms/:id/accept', protect, acceptRoomInvite);
router.post('/rooms/:id/reject', protect, rejectRoomInvite);
router.post('/rooms/leave/:id', protect, leaveRoom);
router.delete('/rooms/:id', protect, deleteRoom);
router.post('/rooms/:id/start', protect, startRoomSession);
router.post('/rooms/:id/complete', protect, completeSquadSession);
router.get('/rooms/:id', protect, getRoom);
router.post('/rooms/:id/chat', protect, sendRoomMessage);
router.patch('/rooms/:id/status', protect, updateMemberStatus);

// ── Battles & Notifications ──────────────────────────────────────────────────
router.post('/battle/invite', protect, inviteToBattle);
router.get('/battle/active', protect, getActiveBattles);
router.post('/battle/add-task/:id', protect, addTaskToBattle);
router.post('/battle/respond/:id', protect, respondToBattle);
router.patch('/battle/toggle-task/:id', protect, toggleTaskStatus);
router.get('/battle/:id', protect, getBattle);

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/toasted', protect, markNotificationToasted);
router.delete('/notifications', protect, clearNotifications);
router.delete('/notifications/:id', protect, deleteNotification);
router.post('/rooms/:id/invite', protect, inviteToRoom);
router.delete('/clear-squad', protect, clearSynergyData);

module.exports = router;

