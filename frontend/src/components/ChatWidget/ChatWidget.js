import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import './ChatWidget.css';

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isOnline, setIsOnline] = useState(false);
    const messagesEndRef = useRef(null);

    // Check AI service health on mount
    useEffect(() => {
        checkServiceHealth();
    }, []);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial greeting when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = user 
                ? `Hello ${user.name}! 👋 I'm your AI travel assistant. How can I help you find the perfect property today?`
                : "Hello! 👋 I'm your AI travel assistant. How can I help you today?";
            
            setMessages([{
                role: 'assistant',
                content: greeting,
                timestamp: new Date()
            }]);

            setSuggestions([
                "Show me properties in Paris",
                "What's your cancellation policy?",
                "Help me plan a trip"
            ]);
        }
    }, [isOpen, user]);

    const checkServiceHealth = async () => {
        const health = await chatService.checkHealth();
        setIsOnline(health.ollama === 'connected');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (messageText = null) => {
        const textToSend = messageText || inputMessage.trim();
        
        if (!textToSend) return;

        // Add user message
        const userMessage = {
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setSuggestions([]);

        try {
            // Prepare conversation history for API
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Prepare user context
            const userContext = user ? {
                name: user.name,
                user_type: user.userType,
                email: user.email
            } : null;

            // Call AI service
            const response = await chatService.sendMessage(
                textToSend,
                conversationHistory,
                userContext
            );

            // Add assistant message
            const assistantMessage = {
                role: 'assistant',
                content: response.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
            setSuggestions(response.suggestions || []);

        } catch (error) {
            console.error('Error sending message:', error);
            
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please make sure the AI service is running and try again.',
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        handleSendMessage(suggestion);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const clearChat = () => {
        setMessages([]);
        setSuggestions([]);
    };

    return (
        <div className="chat-widget">
            {/* Chat Button */}
            <button 
                className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={toggleChat}
                title="AI Travel Assistant"
            >
                {isOpen ? '✕' : '💬'}
                {!isOpen && <span className="chat-badge"></span>}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-avatar">🤖</div>
                            <div className="chat-title">
                                <h3>AI Travel Assistant</h3>
                                <span className={`status ${isOnline ? 'online' : 'offline'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                        <div className="chat-actions">
                            <button 
                                onClick={toggleChat}
                                className="chat-action-btn"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.map((message, index) => (
                            <div 
                                key={index}
                                className={`chat-message ${message.role} ${message.isError ? 'error' : ''}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="message-avatar">🤖</div>
                                )}
                                <div className="message-content">
                                    <p>{message.content}</p>
                                    <span className="message-time">
                                        {message.timestamp.toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </span>
                                </div>
                                {message.role === 'user' && (
                                    <div className="message-avatar user">
                                        {user?.name?.charAt(0).toUpperCase() || '👤'}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="chat-message assistant">
                                <div className="message-avatar">🤖</div>
                                <div className="message-content typing">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chat-input-container">
                        <textarea
                            className="chat-input"
                            placeholder="Ask me anything about properties, bookings..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            rows="1"
                            disabled={isLoading}
                        />
                        <button 
                            className="chat-send-btn"
                            onClick={() => handleSendMessage()}
                            disabled={isLoading || !inputMessage.trim()}
                        >
                            {isLoading ? '⏳' : '➤'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;