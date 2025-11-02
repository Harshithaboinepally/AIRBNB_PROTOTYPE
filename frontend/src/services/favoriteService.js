import api from './api';

const favoriteService = {
    // Get favorites
    getFavorites: async () => {
        const response = await api.get('/api/favorites');
        return response.data;
    },

    // Add to favorites
    addFavorite: async (propertyId) => {
        const response = await api.post(`/api/favorites/${propertyId}`);
        return response.data;
    },

    // Remove from favorites
    removeFavorite: async (propertyId) => {
        const response = await api.delete(`/api/favorites/${propertyId}`);
        return response.data;
    },

    // Check if favorited
    checkFavorite: async (propertyId) => {
        const response = await api.get(`/api/favorites/${propertyId}/check`);
        return response.data;
    }
};

export default favoriteService;