import client from './client';

export const habitsAPI = {
    getAll: () => client.get('/habits'),
    create: (habit) => client.post('/habits', habit),
    toggle: (id) => client.put(`/habits/${id}/toggle`),
    delete: (id) => client.delete(`/habits/${id}`),
};
