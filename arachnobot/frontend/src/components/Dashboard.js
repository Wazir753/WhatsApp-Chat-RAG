import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = 'http://localhost:8000';

function Dashboard({ stats }) {
  const [activities, setActivities] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const connectWebSocket = () => {
    const websocket = new WebSocket('ws://localhost:8000/ws/activity');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setActivities(prev => [data, ...prev].slice(0, 50));
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    websocket.onclose = () => {
      console.log('WebSocket closed, reconnecting in 5s...');
      setTimeout(connectWebSocket, 5000);
    };
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatSender = (sender) => {
    if (sender.includes('@')) {
      return sender.split('@')[0];
    }
    return sender;
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card spider-web-card">
          <h3 className="stat-title">Total Messages Handled</h3>
          <div className="stat-value">{stats?.total_queries || 0}</div>
          <div className="stat-label">Queries processed</div>
        </div>

        <div className="stat-card spider-web-card">
          <h3 className="stat-title">Contacts Indexed</h3>
          <div className="stat-value">{stats?.total_contacts || 0}</div>
          <div className="stat-label">In knowledge base</div>
        </div>

        <div className="stat-card spider-web-card">
          <h3 className="stat-title">Avg Response Time</h3>
          <div className="stat-value">{stats?.avg_response_time || 0}s</div>
          <div className="stat-label">Per query</div>
        </div>

        <div className="stat-card spider-web-card">
          <h3 className="stat-title">Uptime</h3>
          <div className="stat-value">{formatUptime(stats?.uptime_seconds || 0)}</div>
          <div className="stat-label">Since start</div>
        </div>
      </div>

      <div className="activity-section">
        <h2 className="section-title">🕷️ Live Activity Feed</h2>
        <div className="activity-table-container spider-web-card">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Query</th>
                <th>Response Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-activity">No recent activity</td>
                </tr>
              ) : (
                activities.map((activity, index) => (
                  <tr key={index}>
                    <td>{formatSender(activity.sender)}</td>
                    <td className="query-cell">{activity.query.substring(0, 50)}...</td>
                    <td>{activity.response_time.toFixed(2)}s</td>
                    <td>
                      <span className={`status-badge ${activity.status}`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
