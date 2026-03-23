import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { tasksAPI } from '../api/tasksAPI';
import { habitsAPI } from '../api/habitsAPI';
import { goalsAPI } from '../api/goalsAPI';
import { leaderboardAPI } from '../api/leaderboardAPI';
import { categoriesAPI } from '../api/categoriesAPI';
import { sessionsAPI } from '../api/sessionsAPI';
import { calendarAPI } from '../api/calendarAPI';
import { useAuth } from './AuthContext';

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
    const { isAuthenticated, refreshUser, user } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [habits, setHabits] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [calendarCache, setCalendarCache] = useState({});

    const shownAlerts = useRef(new Set());

    // Fetch all data
    const fetchAll = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const [
                tasksRes, habitsRes, leaderboardRes, categoriesRes, activeSessionRes, sessionsRes, calendarRes
            ] = await Promise.all([
                tasksAPI.getAll(),
                habitsAPI.getAll(),
                leaderboardAPI.get(),
                categoriesAPI.getAll(),
                sessionsAPI.getActive(),
                sessionsAPI.getAll(),
                calendarAPI.getEvents(dayjs().startOf('month').toISOString(), dayjs().endOf('month').toISOString()),
            ]);
            const fetchedTasks = tasksRes.data.data.map(normalizeId);
            
            // Hybrid Sorting: Check localStorage first, then DB 'position', then fallback
            const localOrder = JSON.parse(localStorage.getItem(`task_order_${user?._id || user?.id}`) || '[]');
            setTasks(fetchedTasks.sort((a, b) => {
                if (localOrder.length > 0) {
                    const idxA = localOrder.indexOf(a.id);
                    const idxB = localOrder.indexOf(b.id);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                }
                return (a.position || 0) - (b.position || 0);
            }));
            setHabits(habitsRes.data.data.map(normalizeId));
            setLeaderboard(leaderboardRes.data.data);
            setCategories(categoriesRes.data.data.map(normalizeId));
            setActiveSession(activeSessionRes.data.data.data ? normalizeId(activeSessionRes.data.data.data) : null);
            setSessions(sessionsRes.data.data.data.map(normalizeId));
            setCalendarEvents(calendarRes.data.data);
        } catch (error) {
            console.error('Failed to fetch data:', error.message);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);


    const normalizeId = (item) => ({ ...item, id: item._id });

    // ─── Tasks ─────────────────────────────────────────────────────────────────
    const addTask = async (task) => {
        // Put new tasks at the top
        const res = await tasksAPI.create({ ...task, position: 0 });
        const newTask = normalizeId(res.data.data);
        setTasks((prev) => {
            const updated = [newTask, ...prev];
            // Update localStorage to reflect the new top task
            localStorage.setItem(`task_order_${user?._id || user?.id}`, JSON.stringify(updated.map(t => t.id)));
            return updated;
        });
        if (refreshUser) await refreshUser();
    };

    const updateTask = async (id, updates) => {
        const res = await tasksAPI.update(id, updates);
        setTasks((prev) => prev.map((t) => (t.id === id ? normalizeId(res.data.data) : t)));
        if (updates.status && refreshUser) await refreshUser();
    };

    const deleteTask = async (id) => {
        await tasksAPI.delete(id);
        setTasks((prev) => {
            const updated = prev.filter((t) => t.id !== id);
            localStorage.setItem(`task_order_${user?._id || user?.id}`, JSON.stringify(updated.map(t => t.id)));
            return updated;
        });
    };

    const reorderTasks = async (reorderedTasks) => {
        setTasks(reorderedTasks);

        // 1. Persist to LocalStorage for immediate cross-session reliability
        localStorage.setItem(`task_order_${user?._id || user?.id}`, JSON.stringify(reorderedTasks.map(t => t.id)));

        // 2. Persist to DB using 'position' field
        try {
            const updates = reorderedTasks
                .filter(t => !t.parentId)
                .map((task, index) => {
                    return tasksAPI.update(task.id, { position: index });
                });
            
            await Promise.all(updates);
            toast.success('Order synced to cloud');
        } catch (error) {
            console.error('Failed to persist task order:', error);
            // LocalStorage fallback will still keep the order on this device
            toast.info('Saved locally - sync pending');
        }
    };

    // ─── Habits ─────────────────────────────────────────────────────────────
    const addHabit = async (habit) => {
        const res = await habitsAPI.create(habit);
        setHabits((prev) => [normalizeId(res.data.data), ...prev]);
    };

    const toggleHabit = async (id) => {
        const res = await habitsAPI.toggle(id);
        const updated = normalizeId(res.data.data);
        setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
        return updated;
    };

    const deleteHabit = async (id) => {
        await habitsAPI.delete(id);
        setHabits((prev) => prev.filter((h) => h.id !== id));
    };

    // ─── Categories ──────────────────────────────────────────────────────────
    const addCategory = async (data) => {
        const res = await categoriesAPI.create(data);
        setCategories((prev) => [normalizeId(res.data.data), ...prev]);
    };

    const updateCategory = async (id, data) => {
        const res = await categoriesAPI.update(id, data);
        setCategories((prev) => prev.map((c) => (c.id === id ? normalizeId(res.data.data) : c)));
    };

    const deleteCategory = async (id) => {
        await categoriesAPI.delete(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
    };

    // ─── Sessions ────────────────────────────────────────────────────────────
    const startSession = async (data) => {
        const res = await sessionsAPI.start(data);
        setActiveSession(normalizeId(res.data.data.data));
    };

    const endSession = async (notes, sessionId) => {
        const sid = sessionId || activeSession?.id || activeSession?._id;
        if (!sid) return;
        const res = await sessionsAPI.end(sid, { notes });
        setActiveSession(null);
        if (res.data.treeAdded) {
            toast.success(`✨ Fantastic work! You just grew a new ${res.data.treeAdded}!`, {
                description: 'Check your Focus Farm to see it.',
                duration: 5000,
            });
        }
        await fetchAll();
        if (refreshUser) await refreshUser();
    };

    const logManual = async (data) => {
        await sessionsAPI.logManual(data);
        await fetchAll();
    };

    const fetchCalendarEvents = async (start, end) => {
        const cacheKey = `${start}_${end}`;
        if (calendarCache[cacheKey]) {
            setCalendarEvents(calendarCache[cacheKey]);
            return;
        }

        try {
            const res = await calendarAPI.getEvents(start, end);
            const events = res.data.data;
            setCalendarEvents(events);
            setCalendarCache((prev) => ({ ...prev, [cacheKey]: events }));
        } catch (error) {
            console.error('Failed to fetch calendar events:', error);
        }
    };

    const addCalendarBlock = async (data) => {
        await calendarAPI.createBlock(data);
        setCalendarCache({}); // Invalidate cache
        const refreshDate = data.startTime || data.date || dayjs();
        const start = dayjs(refreshDate).startOf('month').toISOString();
        const end = dayjs(refreshDate).endOf('month').toISOString();
        await fetchCalendarEvents(start, end);
        await refreshUser();
    };

    const deleteCalendarBlock = async (id) => {
        const blockId = id.includes('-') ? id.split('-')[1] : id;
        await calendarAPI.deleteBlock(blockId);
        setCalendarCache({}); // Invalidate cache
        await fetchAll();
    };

    return (
        <DataContext.Provider
            value={{
                tasks, habits, categories, leaderboard, sessions, calendarEvents,
                addTask, updateTask, deleteTask, reorderTasks,
                addHabit, toggleHabit, deleteHabit,
                addCategory, updateCategory, deleteCategory,
                activeSession, startSession, endSession, logManual,
                addCalendarBlock, deleteCalendarBlock, fetchCalendarEvents,
                refreshData: fetchAll,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
