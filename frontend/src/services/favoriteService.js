import api from "./api";

const favoriteService = {
  
  getFavorites: async () => {
    const response = await api.get("/favorites"); 
    return response.data;
  },

  addFavorite: async (propertyId) => {
    const response = await api.post(`/favorites/${propertyId}`);
    return response.data;
  },

  removeFavorite: async (propertyId) => {
    const response = await api.delete(`/favorites/${propertyId}`);
    return response.data;
  },

  checkFavorite: async (propertyId) => {
    const response = await api.get(`/favorites/${propertyId}/check`);
    return response.data;
  }

};

export default favoriteService;