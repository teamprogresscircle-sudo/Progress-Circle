import client from './client';

export const adminAPI = {
    getStatus: () => client.get('/admin/status'),
    getStats: () => client.get('/admin/stats'),
    getUsers: () => client.get('/admin/users'),
    updateUser: (id, data) => client.put(`/admin/users/${id}`, data),
    getSettings: () => client.get('/admin/settings'),
    updateSettings: (data) => client.put('/admin/settings', data),
    rewardAll: (data) => client.post('/admin/reward-all', data),
    resetPoints: (id) => client.put(`/admin/users/${id}/reset-points`),
    deleteUser: (id) => client.delete(`/admin/users/${id}`),
    grantSubscription: (id, days) => client.post(`/admin/users/${id}/grant-subscription`, { days }),
    getPricing: () => client.get('/admin/pricing'),
    updatePricing: (data) => client.put('/admin/pricing', data),

    // Promo Codes
    getPromoCodes: () => client.get('/promocodes'),
    createPromoCode: (data) => client.post('/promocodes', data),
    updatePromoCode: (id, data) => client.put(`/promocodes/${id}`, data),
    deletePromoCode: (id) => client.delete(`/promocodes/${id}`),

    // Analytics & Logs
    getAnalyticsSubscriptions: () => client.get('/admin/analytics/subscriptions'),
    getPaymentLogs: (page = 1, limit = 50) => client.get(`/admin/analytics/payments?page=${page}&limit=${limit}`),
    getAuditLogs: (page = 1, limit = 50) => client.get(`/admin/audit-logs?page=${page}&limit=${limit}`),
    getUserDeepDive: (id) => client.get(`/admin/users/${id}/deep-dive`),
    syncScores: () => client.post('/admin/sync-scores'),
};
