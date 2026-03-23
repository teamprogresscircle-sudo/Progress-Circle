import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${BASE}/gamification` });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const gamificationAPI = {
    getData: () => api.get('/'),
    saveAvatar: (config) => api.put('/avatar', config),
    buyItem: (itemId) => api.post('/buy', { itemId }),
    getCommunity: () => api.get('/community'),
    getShop: () => api.get('/shop'),
    testTree: () => api.post('/test-tree'),
};
