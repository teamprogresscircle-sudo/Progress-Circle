import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request automatically
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally — clear token and redirect to login
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        // Handle Maintenance Mode (503 Service Unavailable)
        if (error.response?.status === 503 || error.response?.data?.maintenance) {
            // Only redirect if not already on maintenance page to avoid loops
            if (!window.location.pathname.includes('/maintenance')) {
                window.location.href = '/maintenance';
            }
        }
        
        return Promise.reject(error);
    }
);

export default client;
