import React, { useState } from 'react';
import axios from 'axios';
import './Upload.css';

const API_URL = 'http://localhost:8000';

function Upload({ onUploadComplete, embeddingProgress }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [isEmbedding, setIsEmbedding] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.endsWith('.txt')) {
      setUploadError('Please upload a .txt file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setUploadStats(response.data);
      setIsUploading(false);
      
      await triggerEmbedding();
    } catch (error) {
      setUploadError(error.response?.data?.detail || 'Upload failed');
      setIsUploading(false);
    }
  };

  const triggerEmbedding = async () => {
    setIsEmbedding(true);
    try {
      await axios.post(`${API_URL}/embed`);
    } catch (error) {
      setUploadError(error.response?.data?.detail || 'Embedding failed');
    }
  };

  const handleContinue = () => {
    if (uploadStats) {
      onUploadComplete(uploadStats);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2 className="upload-title">Upload WhatsApp Export</h2>
        <p className="upload-subtitle">Drag and drop your WhatsApp .txt export file here</p>

        {!uploadStats && (
          <div
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              className="upload-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="upload-label">
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                {isDragging ? 'Drop the file here' : 'Click to browse or drag and drop'}
              </p>
              <p className="upload-hint">Only .txt files are supported</p>
            </label>
          </div>
        )}

        {isUploading &&-uploadStats && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {uploadError && (
          <div className="upload-error">
            <p>{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="error-dismiss">
              Dismiss
            </button>
          </div>
        )}

        {uploadStats && (
          <div className="upload-stats">
            <h3 className="stats-title">Upload Complete!</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Messages:</span>
                <span className="stat-value">{uploadStats.total_messages}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Participants:</span>
                <span className="stat-value">{uploadStats.participants.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Date Range:</span>
                <span className="stat-value">
                  {uploadStats.date_range.start?.split('T')[0]} - {uploadStats.date_range.end?.split('T')[0]}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Most Active:</span>
                <span className="stat-value">{uploadStats.most_active_participant || 'N/A'}</span>
              </div>
            </div>

            {isEmbedding || embeddingProgress.is_embedding ? (
              <div className="embedding-status">
                <p className="embedding-text">
                  Embedding chunks: {embeddingProgress.progress} / {embeddingProgress.total} 
                  ({embeddingProgress.percentage.toFixed(1)}%)
                </p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${embeddingProgress.percentage}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <button onClick={handleContinue} className="continue-btn">
                Continue to Chat
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;
