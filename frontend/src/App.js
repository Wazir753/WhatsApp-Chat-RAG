import React, { useState, useEffect } from 'react';
import Upload from './components/Upload';
import Chat from './components/Chat';
import Stats from './components/Stats';
import Filters from './components/Filters';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadStats, setUploadStats] = useState(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState({ is_embedding: false, progress: 0, total: 0, percentage: 0 });
  const [filters, setFilters] = useState({ participant: '', date_start: '', date_end: '', keyword: '' });

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkEmbeddingProgress, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setIsEmbedded(response.data.collection_count > 0);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const checkEmbeddingProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/embed/progress`);
      setEmbeddingProgress(response.data);
      if (!response.data.is_embedding && response.data.total > 0) {
        setIsEmbedded(true);
      }
    } catch (error) {
      console.error('Progress check failed:', error);
    }
  };

  const handleUploadComplete = (stats) => {
    setUploadStats(stats);
    setActiveTab('chat');
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleReset = async () => {
    try {
      await axios.delete(`${API_URL}/reset`);
      setUploadStats(null);
      setIsEmbedded(false);
      setActiveTab('upload');
      setFilters({ participant: '', date_start: '', date_end: '', keyword: '' });
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Failed to reset database');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">WhatsApp Chat RAG</h1>
        <div className="header-actions">
          {isEmbedded && (
            <button className="reset-btn" onClick={handleReset}>
              Reset Database
            </button>
          )}
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload
        </button>
        <button
          className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          disabled={!isEmbedded}
        >
          Chat
        </button>
        <button
          className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
          disabled={!uploadStats}
        >
          Stats
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'upload' && (
          <Upload 
            onUploadComplete={handleUploadComplete}
            embeddingProgress={embeddingProgress}
          />
        )}
        
        {activeTab === 'chat' && (
          <div className="chat-container">
            <Filters 
              participants={uploadStats?.participants || []}
              onFilterChange={handleFilterChange}
              filters={filters}
            />
            <Chat filters={filters} />
          </div>
        )}
        
        {activeTab === 'stats' && uploadStats && (
          <Stats stats={uploadStats} />
        )}
      </main>

      {embeddingProgress.is_embedding && (
        <div className="embedding-progress-overlay">
          <div className="embedding-progress-content">
            <h2>Embedding Chunks...</h2>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${embeddingProgress.percentage}%` }}
              ></div>
            </div>
            <p>{embeddingProgress.progress} / {embeddingProgress.total} chunks ({embeddingProgress.percentage.toFixed(1)}%)</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
