import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { gamificationAPI } from '../api/gamificationAPI';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';

const GamificationContext = createContext(undefined);

export function GamificationProvider({ children }) {
    const { isAuthenticated, refreshUser } = useAuth();
    const { refreshData } = useData();
    const [gamData, setGamData] = useState(null);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await gamificationAPI.getData();
            setGamData(res.data.data);
        } catch (e) {
            console.error('Gamification fetch failed:', e.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => { refresh(); }, [refresh]);

    const saveAvatar = async (config) => {
        await gamificationAPI.saveAvatar(config);
        await refresh();
        if (refreshUser) await refreshUser();
        if (refreshData) await refreshData();
    };

    const buyItem = async (itemId) => {
        await gamificationAPI.buyItem(itemId);
        await refresh();
        if (refreshUser) await refreshUser();
        if (refreshData) await refreshData();
    };

    return (
        <GamificationContext.Provider value={{ gamData, loading, refresh, saveAvatar, buyItem }}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const ctx = useContext(GamificationContext);
    if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
    return ctx;
}
