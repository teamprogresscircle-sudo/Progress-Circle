import client from './client';

export const tasksAPI = {
    getAll: () => client.get('/tasks'),
    create: (task) => client.post('/tasks', task),
    update: (id, updates) => client.put(`/tasks/${id}`, updates),
    delete: (id) => client.delete(`/tasks/${id}`),
};
