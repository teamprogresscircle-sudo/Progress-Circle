import client from './client';

export const goalsAPI = {
    getAll: () => client.get('/goals'),
    create: (goal) => client.post('/goals', goal),
    update: (id, updates) => client.put(`/goals/${id}`, updates),
    delete: (id) => client.delete(`/goals/${id}`),
};
