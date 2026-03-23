import client from './client';

export const categoriesAPI = {
    getAll: () => client.get('/categories'),
    create: (category) => client.post('/categories', category),
    update: (id, updates) => client.put(`/categories/${id}`, updates),
    delete: (id) => client.delete(`/categories/${id}`),
};
