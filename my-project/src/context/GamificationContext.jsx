import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

    const saveAvatar = useCallback(async (config) => {
        await gamificationAPI.saveAvatar(config);
        await refresh();
        if (refreshUser) await refreshUser();
        if (refreshData) await refreshData();
    }, [refresh, refreshUser, refreshData]);

    const buyItem = useCallback(async (itemId) => {
        await gamificationAPI.buyItem(itemId);
        await refresh();
        if (refreshUser) await refreshUser();
        if (refreshData) await refreshData();
    }, [refresh, refreshUser, refreshData]);

    const contextValue = useMemo(() => ({
        gamData, loading, refresh, saveAvatar, buyItem
    }), [gamData, loading, refresh, saveAvatar, buyItem]);

    return (
        <GamificationContext.Provider value={contextValue}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const ctx = useContext(GamificationContext);
    if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
    return ctx;
}
