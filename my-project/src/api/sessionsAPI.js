import client from './client';

export const sessionsAPI = {
    start: (data) => client.post('/sessions/start', data),
    logManual: (data) => client.post('/sessions/manual', data),
    end: (id, data) => client.patch(`/sessions/end/${id}`, data),
    getActive: () => client.get('/sessions/active'),
    getAll: () => client.get('/sessions'),
};
