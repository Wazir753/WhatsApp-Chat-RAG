import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import KnowledgeBase from './components/KnowledgeBase';
import BotSettings from './components/BotSettings';
import Analytics from './components/Analytics';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [botOnline, setBotOnline] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Stats fetch failed:', error);
    }
  };

  const toggleBot = async () => {
    try {
      const response = await axios.post(`${API_URL}/bot/toggle`);
      setBotOnline(response.data.online);
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">🕷️ ArachnoBot Dashboard</h1>
          <span className={`bot-status ${botOnline ? 'online' : 'offline'}`}>
            {botOnline ? '● Online' : '● Offline'}
          </span>
        </div>
        <button className="toggle-btn" onClick={toggleBot}>
          {botOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          Knowledge Base
        </button>
        <button
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Bot Settings
        </button>
        <button
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard stats={stats} />}
        {activeTab === 'knowledge' && <KnowledgeBase />}
        {activeTab === 'settings' && <BotSettings />}
        {activeTab === 'analytics' && <Analytics stats={stats} />}
      </main>
    </div>
  );
}

export default App;
