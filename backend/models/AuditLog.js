const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        actionType: {
            type: String,
            required: true,
            enum: [
                'UPDATE_USER',
                'RESET_POINTS',
                'DELETE_USER',
                'REWARD_ALL',
                'UPDATE_SETTINGS',
                'GRANT_SUBSCRIPTION',
                'UPDATE_PRICING',
                'CREATE_PROMO',
                'UPDATE_PROMO',
                'DELETE_PROMO',
                'SYSTEM_ALERT',
                'SYNC_SCORES'
            ],
            index: true,
        },
        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
