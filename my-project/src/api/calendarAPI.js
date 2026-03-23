import client from './client';

const API_URL = '/calendar';

export const calendarAPI = {
    getEvents: (start, end) => client.get(`${API_URL}?start=${start}&end=${end}`),
    createBlock: (data) => client.post(`${API_URL}/blocks`, data),
    deleteBlock: (id) => client.delete(`${API_URL}/blocks/${id}`),
};
