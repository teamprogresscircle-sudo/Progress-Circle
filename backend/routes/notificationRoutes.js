const express = require('express');
const router = express.Router();
const { 
    getNotifications, 
    markAsRead, 
    markAllRead, 
    deleteNotification,
    subscribePush,
    unsubscribePush
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Web Push
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);

module.exports = router;
