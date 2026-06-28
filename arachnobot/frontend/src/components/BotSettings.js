import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BotSettings.css';

const API_URL = 'http://localhost:8000';

function BotSettings() {
  const [settings, setSettings] = useState({
    bot_name: 'ArachnoBot 🕷️',
    bot_status: 'Your AI assistant — ask me anything 🧠',
    auto_reply: true,
    typing_indicator: true,
    response_delay: 1.5
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/settings`, settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/png') {
      setAvatarFile(file);
      alert('Avatar selected. Note: Avatar update requires bridge restart to take effect.');
    } else {
      alert('Please select a PNG file');
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSliderChange = (e) => {
    setSettings(prev => ({ ...prev, response_delay: parseFloat(e.target.value) }));
  };

  return (
    <div className="bot-settings">
      <h2 className="settings-title">🕷️ Bot Settings</h2>

      <div className="settings-grid">
        <div className="setting-card spider-web-card">
          <h3 className="card-title">Profile</h3>
          <div className="setting-group">
            <label className="setting-label">Bot Name</label>
            <input
              type="text"
              className="setting-input"
              value={settings.bot_name}
              onChange={(e) => setSettings(prev => ({ ...prev, bot_name: e.target.value }))}
            />
          </div>
          <div className="setting-group">
            <label className="setting-label">Status Message</label>
            <input
              type="text"
              className="setting-input"
              value={settings.bot_status}
              onChange={(e) => setSettings(prev => ({ ...prev, bot_status: e.target.value }))}
            />
          </div>
          <div className="setting-group">
            <label className="setting-label">Avatar (PNG)</label>
            <input
              type="file"
              accept="image/png"
              onChange={handleAvatarUpload}
              className="file-input"
            />
            {avatarFile && <span className="file-name">{avatarFile.name}</span>}
          </div>
        </div>

        <div className="setting-card spider-web-card">
          <h3 className="card-title">Behavior</h3>
          <div className="setting-group toggle-group">
            <label className="setting-label">Auto Reply</label>
            <button
              className={`toggle-switch ${settings.auto_reply ? 'on' : 'off'}`}
              onClick={() => handleToggle('auto_reply')}
            >
              {settings.auto_reply ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="setting-group toggle-group">
            <label className="setting-label">Typing Indicator</label>
            <button
              className={`toggle-switch ${settings.typing_indicator ? 'on' : 'off'}`}
              onClick={() => handleToggle('typing_indicator')}
            >
              {settings.typing_indicator ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="setting-group">
            <label className="setting-label">Response Delay: {settings.response_delay}s</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={settings.response_delay}
              onChange={handleSliderChange}
              className="range-slider"
            />
          </div>
        </div>

        <div className="setting-card spider-web-card">
          <h3 className="card-title">Current Status</h3>
          <div className="status-info">
            <div className="status-item">
              <span className="status-label">Name:</span>
              <span className="status-value">{settings.bot_name}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Status:</span>
              <span className="status-value">{settings.bot_status}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Auto Reply:</span>
              <span className={`status-value ${settings.auto_reply ? 'enabled' : 'disabled'}`}>
                {settings.auto_reply ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Typing:</span>
              <span className={`status-value ${settings.typing_indicator ? 'enabled' : 'disabled'}`}>
                {settings.typing_indicator ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

export default BotSettings;
