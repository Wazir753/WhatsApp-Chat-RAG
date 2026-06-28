import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './KnowledgeBase.css';

const API_URL = 'http://localhost:8000';

function KnowledgeBase() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API_URL}/contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const fetchContactChunks = async (contactName) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/contacts/${contactName}/chunks`);
      setChunks(response.data.chunks);
      setSelectedContact(contactName);
    } catch (error) {
      console.error('Failed to fetch chunks:', error);
    } finally {
      setLoading(false);
    }
  };

  const reindexContact = async (contactName) => {
    try {
      await axios.post(`${API_URL}/contacts/${contactName}/reindex`);
      alert(`${contactName} chunks deleted. Re-sync needed from bridge.`);
      fetchContacts();
      if (selectedContact === contactName) {
        setSelectedContact(null);
        setChunks([]);
      }
    } catch (error) {
      console.error('Reindex failed:', error);
      alert('Failed to reindex contact');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="knowledge-base">
      <div className="kb-header">
        <h2 className="kb-title">🕷️ Knowledge Base</h2>
        <input
          type="text"
          className="search-input"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="kb-content">
        <div className="contacts-list spider-web-card">
          <h3 className="list-title">Indexed Contacts ({filteredContacts.length})</h3>
          <div className="contacts-container">
            {filteredContacts.length === 0 ? (
              <p className="no-data">No contacts indexed yet</p>
            ) : (
              filteredContacts.map((contact, index) => (
                <div
                  key={index}
                  className={`contact-item ${selectedContact === contact.name ? 'active' : ''}`}
                  onClick={() => fetchContactChunks(contact.name)}
                >
                  <div className="contact-name">{contact.name}</div>
                  <div className="contact-count">{contact.message_count} messages</div>
                  <button
                    className="reindex-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      reindexContact(contact.name);
                    }}
                  >
                    Re-index
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedContact && (
          <div className="chunks-view spider-web-card">
            <div className="chunks-header">
              <h3 className="list-title">Chunks: {selectedContact}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setSelectedContact(null);
                  setChunks([]);
                }}
              >
                ✕
              </button>
            </div>
            <div className="chunks-container">
              {loading ? (
                <p className="loading">Loading chunks...</p>
              ) : chunks.length === 0 ? (
                <p className="no-data">No chunks found</p>
              ) : (
                chunks.map((chunk, index) => (
                  <div key={index} className="chunk-item">
                    <div className="chunk-meta">
                      <span className="chunk-contact">{chunk.metadata.contact}</span>
                      <span className="chunk-date">{formatDate(chunk.metadata.date)}</span>
                      <span className="chunk-direction">{chunk.metadata.direction}</span>
                    </div>
                    <div className="chunk-text">{chunk.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
