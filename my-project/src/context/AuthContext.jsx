import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/authAPI';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // wait until we verify token

    // On mount: try to restore session from localStorage token
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await authAPI.getMe();
                setUser(res.data.data);
            } catch {
                localStorage.removeItem('token'); // expired / invalid token
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = async (email, password) => {
        const res = await authAPI.login(email, password);
        const { token, user: userData } = res.data.data;
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const register = async (name, email, password, gender = '', ref = '') => {
        const res = await authAPI.register(name, email, password, gender, ref);
        const { token, user: userData } = res.data.data;
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const res = await authAPI.getMe();
            setUser(res.data.data);
            return res.data.data;
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const updateUser = async (data) => {
        const res = await authAPI.updateMe(data);
        setUser(res.data.data);
        return res.data.data;
    };

    // Show nothing while we're restoring the session
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500 text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, refreshUser, updateUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}