import axios from 'axios';

const CHAT_API_URL = 'http://localhost:8001';

const chatService = {
    // Send a message to the AI
    sendMessage: async (message, conversationHistory = [], userContext = null) => {
        try {
            const response = await axios.post(`${CHAT_API_URL}/chat`, {
                message,
                conversation_history: conversationHistory,
                user_context: userContext
            });
            return response.data;
        } catch (error) {
            console.error('Chat service error:', error);
            throw error;
        }
    },

    // Check AI service health
    checkHealth: async () => {
        try {
            const response = await axios.get(`${CHAT_API_URL}/health`);
            return response.data;
        } catch (error) {
            console.error('Health check error:', error);
            return { status: 'error', ollama: 'disconnected' };
        }
    }
};

export default chatService;