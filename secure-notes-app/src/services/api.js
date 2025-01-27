import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Modified request interceptor
api.interceptors.request.use(async (config) => {
    // For non-GET requests, get a fresh CSRF token
    if (config.method !== 'get') {
        try {
            const { data } = await axios.get('http://localhost:5000/api/auth/csrf-token', { withCredentials: true });
            config.headers['X-CSRF-Token'] = data.csrfToken;
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
        }
    }
    return config;
}, error => Promise.reject(error));

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const message = error.response.data?.message || 'Too many attempts. Please try again later.';
            const err = new Error(message);
            err.retryAfter = retryAfter;
            return Promise.reject(err);
        }
        return Promise.reject(error);
    }
);

const getCsrfToken = async () => {
    try {
        const response = await api.get('/auth/csrf-token');
        return response.data.csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        throw error;
    }
};

const logout = async () => {
    try {
        await api.post('/auth/logout');
        // Clear any stored tokens/data
        localStorage.removeItem('token');
        // Clear any stored headers
        api.defaults.headers['Authorization'] = null;
        api.defaults.headers['X-CSRF-Token'] = null;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

// Single export statement for all exports
export {
    getCsrfToken,
    logout
};

export default api;
