import axios from 'axios';

const getBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) return '/api';
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json'
    }
});

console.log('--- API CONFIG ---');
console.log('Base URL:', api.defaults.baseURL);
console.log('Environment:', import.meta.env.MODE);
console.log('------------------');

// Add Token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle Errors (e.g., token expired)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Optional: Logout user if 401 comes from a protected route (not login)
            if (!error.config.url.includes('/auth/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        // Retry logic for 502/503/504 or Network Error (likely cold start)
        const config = error.config;
        if (!config || !config.retry) {
            config.retry = 0;
        }

        // Retry up to 2 times for network errors or 5xx server errors
        if (config.retry < 2 && (!error.response || (error.response.status >= 500 && error.response.status < 600))) {
            config.retry += 1;
            console.log(`Retrying request found error (Attempt ${config.retry})...`);
            
            // Wait 2 seconds before retrying
            const backoff = new Promise(resolve => setTimeout(resolve, 2000));
            return backoff.then(() => api(config));
        }

        return Promise.reject(error);
    }
);

export default api;
