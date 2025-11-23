import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../redux/hooks';
import chatService from '../../services/chatService';
import './ChatWidget.css';

const ChatWidget = () => {
    // Use custom hook instead of direct useSelector
    const { isAuthenticated, user } = useAuth();
    
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        // Only add welcome message if chat is opened and no messages exist
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 1,
                    text: `Hello${user ? ` ${user.name}` : ''}! 👋 I'm your AI travel assistant. How can I help you today?`,
                    sender: 'bot',
                    timestamp: new Date()
                }
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user]); // messages.length intentionally excluded to prevent re-triggering

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);

        try {
            // Build conversation history for context
            const conversationHistory = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            // Add user context from Redux
            const userContext = {
                name: user?.name,
                userType: user?.userType,
                isAuthenticated
            };

            const response = await chatService.sendMessage(
                inputMessage,
                conversationHistory,
                userContext
            );
            
            const botMessage = {
                id: messages.length + 2,
                text: response.reply || response.response || 'I received your message!',
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            
            const errorMessage = {
                id: messages.length + 2,
                text: 'Sorry, I encountered an error. Please try again.',
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const quickReplies = [
        'Show me properties in New York',
        'What are my bookings?',
        'Help me find a beachfront property',
        'Show properties under $200/night'
    ];

    const handleQuickReply = (reply) => {
        setInputMessage(reply);
    };

    // Don't show chat widget if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle chat"
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Widget */}
            {isOpen && (
                <div className="chat-widget">
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="bot-avatar">🤖</div>
                            <div>
                                <h3>AI Travel Assistant</h3>
                                <span className="status-indicator">● Online</span>
                            </div>
                        </div>
                        <button
                            className="chat-close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                            >
                                {message.sender === 'bot' && (
                                    <div className="message-avatar">🤖</div>
                                )}
                                <div className="message-content">
                                    <p>{message.text}</p>
                                    <span className="message-time">
                                        {message.timestamp.toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </span>
                                </div>
                                {message.sender === 'user' && (
                                    <div className="message-avatar user">
                                        {user?.name?.charAt(0).toUpperCase() || '👤'}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {loading && (
                            <div className="message bot-message">
                                <div className="message-avatar">🤖</div>
                                <div className="message-content">
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

                    {/* Quick Replies */}
                    {messages.length <= 1 && (
                        <div className="quick-replies">
                            <p className="quick-replies-label">Quick suggestions:</p>
                            <div className="quick-replies-buttons">
                                {quickReplies.map((reply, index) => (
                                    <button
                                        key={index}
                                        className="quick-reply-btn"
                                        onClick={() => handleQuickReply(reply)}
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form className="chat-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="chat-input"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="chat-send-btn"
                            disabled={!inputMessage.trim() || loading}
                            aria-label="Send message"
                        >
                            {loading ? '⏳' : '➤'}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatWidget;