import api from './api';

const authService = {
    // Sign up
    signup: async (userData) => {
        const response = await api.post('/api/auth/signup', userData);
        return response.data;
    },

    // Login
    login: async (credentials) => {
        const response = await api.post('/api/auth/login', credentials);
        return response.data;
    },

    // Logout
    logout: async () => {
        const response = await api.post('/api/auth/logout');
        return response.data;
    },

    // Check session
    checkSession: async () => {
        const response = await api.get('/api/auth/session');
        return response.data;
    }
};

export default authService;