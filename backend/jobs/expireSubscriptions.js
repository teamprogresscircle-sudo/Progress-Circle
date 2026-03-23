/**
 * expireSubscriptions.js
 * Cron job — runs daily at 00:05 AM.
 * Downgrades users whose subscription period has ended to 'free'.
 */

const cron = require('node-cron');
const User = require('../models/User');
const PaymentLog = require('../models/PaymentLog');

const runExpireJob = async () => {
    try {
        const now = new Date();
        console.log(`[Cron] Running subscription expiration check at ${now.toISOString()}`);

        const expiredUsers = await User.find({
            plan: 'premium',
            'subscription.status': { $in: ['active', 'cancelled'] },
            'subscription.currentPeriodEnd': { $lt: now },
        });

        if (expiredUsers.length === 0) {
            console.log('[Cron] No expired subscriptions found.');
            return;
        }

        console.log(`[Cron] Found ${expiredUsers.length} expired subscription(s). Downgrading...`);

        for (const user of expiredUsers) {
            await User.findByIdAndUpdate(user._id, {
                plan: 'free',
                'subscription.status': 'expired',
            });

            // Log expiration
            await PaymentLog.create({
                userId: user._id,
                orderId: user.subscription?.paymobOrderId || 'cron-expiry',
                amount: 0,
                currency: 'EGP',
                status: 'voided',
                billingCycle: user.subscription?.billingCycle || '',
                source: 'cron',
                rawPaymobResponse: { reason: 'Subscription period ended', expiredAt: user.subscription?.currentPeriodEnd },
            });

            console.log(`[Cron] Downgraded user ${user._id} (${user.email}) to free.`);
        }

        console.log(`[Cron] Expiration job complete. ${expiredUsers.length} user(s) downgraded.`);
    } catch (err) {
        console.error('[Cron] Expiration job error:', err.message);
    }
};

const startExpireJob = () => {
    // Run at 00:05 every day
    cron.schedule('5 0 * * *', runExpireJob, {
        timezone: 'Africa/Cairo',
    });
    console.log('[Cron] Subscription expiration job scheduled (daily at 00:05 Cairo time).');

    // Run once on startup to catch any missed expirations
    runExpireJob();
};

module.exports = { startExpireJob };
