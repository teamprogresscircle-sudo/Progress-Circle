import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(undefined);

const DEFAULTS = {
    dark: {
        bg: '#0b0d12',
        surface: '#151824',
        surface2: '#1e2132',
        text: '#f8fafc',
        primaryColor: '#6366f1',
        accentColor: '#8b5cf6',
    },
    light: {
        bg: '#f8fafc',
        surface: '#ffffff',
        surface2: '#f1f5f9',
        text: '#0f172a',
        primaryColor: '#6366f1',
        accentColor: '#8b5cf6',
    }
};

export function ThemeProvider({ children }) {
    const { user } = useAuth();
    const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');
    const [theme, setTheme] = useState({
        primaryColor: '#6366f1',
        accentColor: '#8b5cf6',
        bg: '',
        surface: '',
        mode: 'dark',
        glassmorphism: true,
    });

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '99, 102, 241';
    };

    useEffect(() => {
        if (user?.themePreferences) {
            setTheme(user.themePreferences);
            if (user.themePreferences.mode) {
                setDark(user.themePreferences.mode === 'dark');
            }
        }
    }, [user]);

    useEffect(() => {
        const root = document.documentElement;
        const currentDefaults = dark ? DEFAULTS.dark : DEFAULTS.light;
        
        root.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');

        // Core dynamic colors
        root.style.setProperty('--primary', theme.primaryColor || currentDefaults.primaryColor);
        root.style.setProperty('--accent', theme.accentColor || currentDefaults.accentColor);
        root.style.setProperty('--primary-rgb', hexToRgb(theme.primaryColor || currentDefaults.primaryColor));

        // Full-site vibe injection
        root.style.setProperty('--bg', theme.bg || currentDefaults.bg);
        root.style.setProperty('--surface', theme.surface || currentDefaults.surface);
        root.style.setProperty('--surface2', theme.surface2 || currentDefaults.surface2);
        root.style.setProperty('--text', theme.text || currentDefaults.text);
    }, [dark, theme]);

    const toggleDark = () => {
        const newDark = !dark;
        setDark(newDark);
        setTheme(prev => ({ ...prev, bg: '', surface: '', surface2: '', mode: newDark ? 'dark' : 'light' }));
    };
    
    const updateTheme = (newTheme) => {
        setTheme(prev => ({ ...prev, ...newTheme }));
        if (newTheme.mode) {
            setDark(newTheme.mode === 'dark');
        }
    };

    const resetToDefaults = () => {
        const currentDefaults = dark ? DEFAULTS.dark : DEFAULTS.light;
        setTheme({
            ...currentDefaults,
            mode: dark ? 'dark' : 'light',
            glassmorphism: true
        });
        return { ...currentDefaults, mode: dark ? 'dark' : 'light', glassmorphism: true };
    };

    return (
        <ThemeContext.Provider value={{ dark, toggleDark, theme, updateTheme, resetToDefaults }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
