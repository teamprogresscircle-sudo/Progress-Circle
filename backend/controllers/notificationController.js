const Notification = require('../models/Notification');
const User = require('../models/User');
const webpush = require('web-push');

// Configure Web Push with VAPID keys from environment
webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:admin@progresscircle.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort('-createdAt')
            .limit(50)
            .populate('sender', 'name avatar');

        res.status(200).json({
            success: true,
            data: notifications,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { status: 'read' },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, status: 'pending' },
            { status: 'read' }
        );

        res.status(200).json({
            success: true,
            message: 'All neural nodes cleared.',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user.id,
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Notification node removed.',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
// @access  Private
exports.subscribePush = async (req, res, next) => {
    try {
        const subscription = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Operative not found.' });
        }

        // Check if subscription already exists
        const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Neural push bridge established.',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Unsubscribe from push notifications
// @route   POST /api/notifications/unsubscribe
// @access  Private
exports.unsubscribePush = async (req, res, next) => {
    try {
        const { endpoint } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Operative not found.' });
        }

        user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Neural push bridge terminated.',
        });
    } catch (error) {
        next(error);
    }
};

// Internal Helper to create system notifications and send push
exports.createSystemNotification = async (recipientId, type, message, refId = null) => {
    try {
        // 1. Create In-App Notification
        await Notification.create({
            recipient: recipientId,
            sender: null,
            type,
            message,
            refId
        });

        // 2. Dispatch Push Notification if subscriptions exist
        const user = await User.findById(recipientId);
        if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
            const payload = JSON.stringify({
                title: 'Progress Circle Alert',
                body: message,
                icon: '/logo192.png', // Fallback icon
                data: { url: refId ? `/${type}/${refId}` : '/' }
            });

            const pushPromises = user.pushSubscriptions.map(sub => 
                webpush.sendNotification(sub, payload).catch(err => {
                    console.error('Push failed for endpoint:', sub.endpoint, err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Mark for cleanup (optional logic to remove invalid subs)
                        return { cleanup: sub.endpoint };
                    }
                })
            );

            const results = await Promise.all(pushPromises);
            
            // Cleanup stale subscriptions
            const staleEndpoints = results.filter(r => r && r.cleanup).map(r => r.cleanup);
            if (staleEndpoints.length > 0) {
                user.pushSubscriptions = user.pushSubscriptions.filter(sub => !staleEndpoints.includes(sub.endpoint));
                await user.save();
            }
        }
    } catch (error) {
        console.error('Failed to create system notification / push:', error);
    }
};
