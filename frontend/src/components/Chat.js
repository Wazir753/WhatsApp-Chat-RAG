import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chat.css';

const API_URL = 'http://localhost:8000';

function Chat({ filters }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        query: userMessage,
        filters: filters
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
        model: response.data.model,
        fallback: response.data.fallback
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.response?.data?.detail || 'Failed to get response'}`,
        sources: [],
        model: null,
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSource = (index) => {
    setExpandedSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatSimilarity = (score) => {
    return (score * 100).toFixed(1);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="empty-icon">💬</div>
            <h3>Start a conversation</h3>
            <p>Ask questions about your WhatsApp chat history</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.role === 'user' ? (
                <div className="user-message">{message.content}</div>
              ) : (
                <div className="assistant-message">
                  {message.error && (
                    <div className="error-badge">Error</div>
                  )}
                  {message.fallback && (
                    <div className="fallback-badge">Fallback Model</div>
                  )}
                  <div className="message-text">{message.content}</div>
                  {message.model && (
                    <div className="model-info">Model: {message.model}</div>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="sources-section">
                      <button
                        className="sources-toggle"
                        onClick={() => toggleSource(index)}
                      >
                        {expandedSources[index] ? '▼' : '▶'} Sources ({message.sources.length})
                      </button>
                      {expandedSources[index] && (
                        <div className="sources-list">
                          {message.sources.map((source, sourceIndex) => (
                            <div key={sourceIndex} className="source-item">
                              <div className="source-header">
                                <span className="source-similarity">
                                  {formatSimilarity(source.similarity)}% match
                                </span>
                                <span className="source-participants">
                                  {source.participants.join(', ')}
                                </span>
                              </div>
                              <div className="source-dates">
                                {new Date(source.date_start).toLocaleDateString()} - {new Date(source.date_end).toLocaleDateString()}
                              </div>
                              <div className="source-text">
                                {source.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="assistant-message loading">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your chat..."
          className="chat-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!input.trim() || isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
