/**
 * subscriptionController.js
 * Handles PayMob subscription flow:
 *  - createOrder      → Initiate PayMob order & return iframe URL
 *  - handleWebhook    → Verify HMAC, log event, upgrade user
 *  - verifyPayment    → Dual-check via PayMob API (used after redirect)
 *  - getStatus        → Return current plan/subscription info
 *  - cancelSubscription → Cancel (keeps access until period end)
 */

const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const PaymentLog = require('../models/PaymentLog');

const GlobalSettings = require('../models/GlobalSettings');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PAYMOB_API_URL = 'https://accept.paymob.com/api';

const getPeriodEnd = (billingCycle) => {
    const now = new Date();
    if (billingCycle === 'yearly') {
        now.setFullYear(now.getFullYear() + 1);
    } else {
        now.setMonth(now.getMonth() + 1);
    }
    return now;
};

const getAmount = async (billingCycle) => {
    try {
        const settings = await GlobalSettings.getSettings();
        return billingCycle === 'yearly'
            ? settings.yearlyPriceCents || parseInt(process.env.PREMIUM_PRICE_YEARLY_CENTS || '129900')
            : settings.monthlyPriceCents || parseInt(process.env.PREMIUM_PRICE_MONTHLY_CENTS || '14900');
    } catch {
        return billingCycle === 'yearly'
            ? parseInt(process.env.PREMIUM_PRICE_YEARLY_CENTS || '129900')
            : parseInt(process.env.PREMIUM_PRICE_MONTHLY_CENTS || '14900');
    }
};

// ─── 1. Create PayMob Order ───────────────────────────────────────────────────

exports.createOrder = async (req, res) => {
    try {
        const { billingCycle = 'monthly' } = req.body;
        const user = req.user;

        if (!['monthly', 'yearly'].includes(billingCycle)) {
            return res.status(400).json({ success: false, message: 'Invalid billing cycle.' });
        }

        // Use promo price override if set, otherwise use standard pricing
        let amountCents = user.subscriptionPriceOverrideCents || await getAmount(billingCycle);
        const usedOverride = !!user.subscriptionPriceOverrideCents;

        // Step 1: Auth token
        const authRes = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
            api_key: process.env.PAYMOB_API_KEY,
        });
        const authToken = authRes.data.token;

        // Step 2: Create order
        const orderRes = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
            auth_token: authToken,
            delivery_needed: false,
            amount_cents: amountCents,
            currency: 'EGP',
            merchant_order_id: `${user._id}_${Date.now()}`,
            items: [
                {
                    name: `Progress Circle Premium (${billingCycle})`,
                    amount_cents: amountCents,
                    description: `Premium subscription - ${billingCycle}`,
                    quantity: 1,
                },
            ],
        });
        const orderId = orderRes.data.id;

        // Step 3: Payment key
        const paymentKeyRes = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
            auth_token: authToken,
            amount_cents: amountCents,
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                apartment: 'NA',
                email: user.email,
                floor: 'NA',
                first_name: user.name.split(' ')[0] || 'User',
                last_name: user.name.split(' ')[1] || 'NA',
                street: 'NA',
                building: 'NA',
                phone_number: '+20000000000',
                shipping_method: 'NA',
                postal_code: 'NA',
                city: 'NA',
                country: 'EGY',
                state: 'NA',
            },
            currency: 'EGP',
            integration_id: parseInt(process.env.PAYMOB_INTEGRATION_ID),
        });
        const paymentToken = paymentKeyRes.data.token;

        // Save a pending log
        await PaymentLog.create({
            userId: user._id,
            orderId: String(orderId),
            amount: amountCents,
            currency: 'EGP',
            status: 'pending',
            billingCycle,
            source: 'checkout',
            ipAddress: req.ip,
        });

        // Update user's pending order id; clear promo price override once used
        const updatePayload = {
            'subscription.paymobOrderId': String(orderId),
            'subscription.billingCycle': billingCycle,
        };
        if (usedOverride) updatePayload.subscriptionPriceOverrideCents = null;

        await User.findByIdAndUpdate(user._id, updatePayload);

        const iframeId = process.env.PAYMOB_IFRAME_ID;
        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;

        res.json({ success: true, iframeUrl, orderId });
    } catch (err) {
        console.error('[Subscription] createOrder error:', err?.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Failed to create payment order.' });
    }
};

// ─── 2. Webhook Handler (PayMob → Backend) ───────────────────────────────────

exports.handleWebhook = async (req, res) => {
    try {
        const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
        const receivedHmac = req.query.hmac;

        if (!receivedHmac) {
            return res.status(401).json({ success: false, message: 'Missing HMAC.' });
        }

        // Build HMAC concatenation string per PayMob docs
        const obj = req.body.obj || {};
        const hmacFields = [
            obj.amount_cents,
            obj.created_at,
            obj.currency,
            obj.error_occured,
            obj.has_parent_transaction,
            obj.id,
            obj.integration_id,
            obj.is_3d_secure,
            obj.is_auth,
            obj.is_capture,
            obj.is_refunded,
            obj.is_standalone_payment,
            obj.is_voided,
            obj.order?.id,
            obj.owner,
            obj.pending,
            obj.source_data?.pan,
            obj.source_data?.sub_type,
            obj.source_data?.type,
            obj.success,
        ];

        const hmacString = hmacFields.map((v) => (v === null || v === undefined ? '' : String(v))).join('');
        const calculatedHmac = crypto.createHmac('sha512', hmacSecret).update(hmacString).digest('hex');

        if (calculatedHmac !== receivedHmac) {
            console.warn('[Webhook] HMAC mismatch — possible fraud attempt');
            return res.status(401).json({ success: false, message: 'Invalid HMAC signature.' });
        }

        const orderId = String(obj.order?.id || '');
        const isSuccess = obj.success === true || obj.success === 'true';
        const status = isSuccess ? 'success' : 'failed';

        // Find user by orderId
        const user = await User.findOne({ 'subscription.paymobOrderId': orderId });

        if (!user) {
            console.warn(`[Webhook] No user found for order ${orderId}`);
            return res.status(200).json({ success: false, message: 'User not found.' });
        }

        const billingCycle = user.subscription?.billingCycle || 'monthly';

        // Log the event
        await PaymentLog.create({
            userId: user._id,
            orderId,
            transactionId: String(obj.id || ''),
            amount: obj.amount_cents || 0,
            currency: obj.currency || 'EGP',
            status,
            billingCycle,
            source: 'webhook',
            rawPaymobResponse: req.body,
        });

        if (isSuccess) {
            const periodEnd = getPeriodEnd(billingCycle);
            await User.findByIdAndUpdate(user._id, {
                plan: 'premium',
                'subscription.status': 'active',
                'subscription.currentPeriodEnd': periodEnd,
                'subscription.paymobTransactionId': String(obj.id || ''),
            });
            console.log(`[Webhook] Upgraded user ${user._id} to premium until ${periodEnd}`);
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('[Webhook] Error:', err.message);
        res.status(500).json({ success: false, message: 'Webhook processing error.' });
    }
};

// ─── 3. Dual Verification (called from frontend after redirect) ───────────────

exports.verifyPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const user = req.user;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID required.' });
        }

        // Get auth token
        const authRes = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
            api_key: process.env.PAYMOB_API_KEY,
        });
        const authToken = authRes.data.token;

        // Fetch transactions for order
        const txRes = await axios.get(
            `${PAYMOB_API_URL}/ecommerce/orders/${orderId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        const orderData = txRes.data;
        const transactions = orderData.transactions || [];
        const successTx = transactions.find((tx) => tx.success === true);

        const isVerified = !!successTx;
        const status = isVerified ? 'success' : 'failed';

        // Log verification attempt
        await PaymentLog.create({
            userId: user._id,
            orderId: String(orderId),
            transactionId: String(successTx?.id || ''),
            amount: orderData.amount_cents || 0,
            currency: orderData.currency || 'EGP',
            status,
            billingCycle: user.subscription?.billingCycle || 'monthly',
            source: 'verification',
            rawPaymobResponse: orderData,
            ipAddress: req.ip,
        });

        if (isVerified && user.plan !== 'premium') {
            const billingCycle = user.subscription?.billingCycle || 'monthly';
            const periodEnd = getPeriodEnd(billingCycle);
            await User.findByIdAndUpdate(user._id, {
                plan: 'premium',
                'subscription.status': 'active',
                'subscription.currentPeriodEnd': periodEnd,
                'subscription.paymobTransactionId': String(successTx.id),
            });
            console.log(`[Verify] Upgraded user ${user._id} to premium via direct verification.`);
        }

        const updatedUser = await User.findById(user._id).select('plan subscription');
        res.json({ success: true, verified: isVerified, plan: updatedUser.plan, subscription: updatedUser.subscription });
    } catch (err) {
        console.error('[Verify] Error:', err?.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Verification failed.' });
    }
};

// ─── 4. Get Status ────────────────────────────────────────────────────────────

exports.getStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('plan subscription');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const isActive =
            user.plan === 'premium' &&
            user.subscription?.status === 'active' &&
            user.subscription?.currentPeriodEnd &&
            new Date(user.subscription.currentPeriodEnd) > new Date();

        res.json({
            success: true,
            plan: user.plan,
            subscription: {
                status: user.subscription?.status || 'inactive',
                billingCycle: user.subscription?.billingCycle || '',
                currentPeriodEnd: user.subscription?.currentPeriodEnd || null,
                isActive,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to get subscription status.' });
    }
};

// ─── 5. Cancel Subscription ──────────────────────────────────────────────────

exports.cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        if (user.plan !== 'premium') {
            return res.status(400).json({ success: false, message: 'No active premium subscription.' });
        }

        await User.findByIdAndUpdate(user._id, {
            'subscription.status': 'cancelled',
        });

        res.json({
            success: true,
            message: `Your subscription has been cancelled. You'll retain Premium access until ${user.subscription?.currentPeriodEnd?.toLocaleDateString()}.`,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to cancel subscription.' });
    }
};

// ─── 6. Public Pricing ────────────────────────────────────────────────────────

exports.getPublicPricing = async (req, res) => {
    try {
        const settings = await GlobalSettings.getSettings();
        res.json({
            success: true,
            monthlyPriceCents: settings.monthlyPriceCents,
            yearlyPriceCents: settings.yearlyPriceCents,
            features: settings.features || []
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to get pricing.' });
    }
};
