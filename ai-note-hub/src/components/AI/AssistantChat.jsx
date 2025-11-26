import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader } from 'lucide-react';
import aiService from '../../services/ai';
import './AssistantChat.css';

function AssistantChat({ notes, currentNote, onClose }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'assistant',
            content: `Hello! I'm your AI assistant. I can help you with:
• Summarizing notes
• Searching for content
• Rewriting text
• Answering questions about your notes

What would you like help with?`,
            timestamp: Date.now(),
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    async function handleSendMessage() {
        if (!inputMessage.trim() || isProcessing) return;

        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            content: inputMessage,
            timestamp: Date.now(),
        };

        setMessages([...messages, userMessage]);
        setInputMessage('');
        setIsProcessing(true);

        try {
            const response = await aiService.chat(inputMessage, {
                notes,
                currentNote,
            });

            const assistantMessage = {
                id: messages.length + 2,
                type: 'assistant',
                content: response.response,
                timestamp: Date.now(),
                metadata: response,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage = {
                id: messages.length + 2,
                type: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }

    return (
        <div className="assistant-chat glass-card">
            <div className="chat-header">
                <div className="chat-title">
                    <Sparkles size={20} className="chat-icon" />
                    <h3>AI Assistant</h3>
                </div>
                <button className="btn-icon" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="chat-messages">
                {messages.map(message => (
                    <ChatMessage key={message.id} message={message} />
                ))}
                {isProcessing && (
                    <div className="message assistant-message processing">
                        <Loader size={16} className="spinner" />
                        <span>Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
                <textarea
                    className="chat-input"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about your notes..."
                    rows={1}
                    disabled={isProcessing}
                />
                <button
                    className="btn-primary send-button"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isProcessing}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}

function ChatMessage({ message }) {
    const isUser = message.type === 'user';

    return (
        <div className={`message ${message.type}-message`}>
            {!isUser && (
                <div className="message-avatar">
                    <Sparkles size={16} />
                </div>
            )}
            <div className="message-content">
                <div className="message-text">{message.content}</div>
            </div>
        </div>
    );
}

export default AssistantChat;
