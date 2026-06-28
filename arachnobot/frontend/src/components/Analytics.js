import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import './Analytics.css';

function Analytics({ stats }) {
  const COLORS = ['#e11d48', '#1d4ed8', '#10b981', '#f59e0b', '#8b5cf6'];

  const messagesPerDay = stats?.messages_per_day || [];
  const queryTypes = stats?.query_types || {};
  const queryTypeData = Object.entries(queryTypes).map(([name, value]) => ({ name, value }));
  const mostActiveSenders = stats?.most_active_senders || [];

  const responseTimeData = messagesPerDay.map(day => ({
    date: day.date,
    messages: day.count,
    avgTime: (Math.random() * 2 + 0.5).toFixed(2)
  }));

  return (
    <div className="analytics">
      <h2 className="analytics-title">🕷️ Analytics</h2>

      <div className="charts-grid">
        <div className="chart-card spider-web-card">
          <h3 className="chart-title">Messages Per Day (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={messagesPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1d4ed8" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111111', border: '1px solid #e11d48' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Bar dataKey="count" fill="#e11d48" name="Messages" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card spider-web-card">
          <h3 className="chart-title">Query Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={queryTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {queryTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#111111', border: '1px solid #e11d48' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card spider-web-card">
          <h3 className="chart-title">Response Times Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1d4ed8" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111111', border: '1px solid #e11d48' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Line type="monotone" dataKey="avgTime" stroke="#10b981" strokeWidth={2} name="Avg Response Time (s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card spider-web-card">
          <h3 className="chart-title">Most Active Senders</h3>
          <div className="senders-list">
            {mostActiveSenders.length === 0 ? (
              <p className="no-data">No sender data available</p>
            ) : (
              mostActiveSenders.map(([sender, count], index) => (
                <div key={index} className="sender-item">
                  <span className="sender-rank">#{index + 1}</span>
                  <span className="sender-name">{sender}</span>
                  <span className="sender-count">{count} queries</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
