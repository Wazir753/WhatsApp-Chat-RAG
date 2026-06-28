import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import './Stats.css';

function Stats({ stats }) {
  const hourData = Object.entries(stats.message_count_by_hour || {})
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const timeData = Object.entries(stats.message_count_over_time || {})
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const participantData = Object.entries(stats.message_count_by_participant || {})
    .map(([participant, count]) => ({ participant, count }))
    .sort((a, b) => b.count - a.count);

  const topWords = stats.top_words || [];

  return (
    <div className="stats-container">
      <h2 className="stats-header">Conversation Analytics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="stat-card-title">Most Active Participant</h3>
          <div className="stat-card-content">
            <span className="stat-highlight">{stats.most_active_participant || 'N/A'}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Total Messages</h3>
          <div className="stat-card-content">
            <span className="stat-highlight">{stats.total_messages}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Total Participants</h3>
          <div className="stat-card-content">
            <span className="stat-highlight">{stats.participants?.length || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Date Range</h3>
          <div className="stat-card-content">
            <span className="stat-date">
              {stats.date_range?.start?.split('T')[0]} - {stats.date_range?.end?.split('T')[0]}
            </span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3 className="chart-title">Messages by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" />
              <XAxis dataKey="hour" stroke="#a0a0b0" />
              <YAxis stroke="#a0a0b0" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #3d3d5c' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Bar dataKey="count" fill="#7c3aed" name="Messages" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Messages Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" />
              <XAxis dataKey="date" stroke="#a0a0b0" />
              <YAxis stroke="#a0a0b0" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #3d3d5c' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} name="Messages" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Messages by Participant</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={participantData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" />
              <XAxis type="number" stroke="#a0a0b0" />
              <YAxis dataKey="participant" type="category" width={100} stroke="#a0a0b0" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #3d3d5c' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Bar dataKey="count" fill="#7c3aed" name="Messages" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Top 10 Most Used Words</h3>
          <div className="words-list">
            {topWords.length > 0 ? (
              topWords.map(([word, count], index) => (
                <div key={index} className="word-item">
                  <span className="word-rank">#{index + 1}</span>
                  <span className="word-text">{word}</span>
                  <span className="word-count">{count} times</span>
                </div>
              ))
            ) : (
              <p className="no-data">No word data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;
