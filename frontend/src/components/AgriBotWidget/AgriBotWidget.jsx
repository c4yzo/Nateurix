import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './AgriBotWidget.scss';

const AgriBotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hi! I'm Nateurix AgriBot 🌱. Need help with plants, farming, or gardening?" }] }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = useMemo(() => {
        return userInfoString ? JSON.parse(userInfoString) : null;
    }, [userInfoString]);

    // Don't render anything if the user isn't logged in
    if (!userInfo) return null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', parts: [{ text: inputValue }] };
        const newMessages = [...messages, userMsg];

        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // Don't send the very first welcome message as part of history to save tokens
            const historyToSend = newMessages.slice(1, -1);

            const { data } = await axios.post('/api/bot/ask-agribot', {
                prompt: inputValue,
                history: historyToSend
            }, config);

            setMessages([...newMessages, { role: 'model', parts: [{ text: data.text }] }]);
        } catch (error) {
            console.error("Bot Error:", error);
            setMessages([...newMessages, { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now. Please try again later." }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`agribot-widget ${isOpen ? 'open' : ''}`}>
            {!isOpen && (
                <button className="agribot-trigger glass-panel" onClick={() => setIsOpen(true)}>
                    <span className="bot-icon">🌱</span>
                </button>
            )}

            {isOpen && (
                <div className="agribot-window glass-panel">
                    <div className="agribot-header">
                        <div className="header-info">
                            <span className="bot-avatar">🌱</span>
                            <div>
                                <h4>AgriBot</h4>
                                <p>Online</p>
                            </div>
                        </div>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>&times;</button>
                    </div>

                    <div className="agribot-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message-bubble ${msg.role}`}>
                                <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-bubble model loading">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="agribot-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask about farming..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !inputValue.trim()} className="send-btn">
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AgriBotWidget;
