import client from './client';

export const leaderboardAPI = {
    get: () => client.get('/leaderboard'),
};
