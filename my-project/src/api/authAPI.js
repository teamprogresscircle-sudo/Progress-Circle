import client from './client';

export const authAPI = {
    register: (name, email, password, gender = '', ref = '') =>
        client.post('/auth/register', { name, email, password, gender, ref }),

    login: (email, password) =>
        client.post('/auth/login', { email, password }),

    getMe: () => client.get('/auth/me'),
    updateMe: (data) => client.put('/auth/me', data),
};
