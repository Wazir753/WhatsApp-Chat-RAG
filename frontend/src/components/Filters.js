import React from 'react';
import './Filters.css';

function Filters({ participants, onFilterChange, filters }) {
  const handleParticipantChange = (e) => {
    onFilterChange({ ...filters, participant: e.target.value });
  };

  const handleDateStartChange = (e) => {
    onFilterChange({ ...filters, date_start: e.target.value });
  };

  const handleDateEndChange = (e) => {
    onFilterChange({ ...filters, date_end: e.target.value });
  };

  const handleKeywordChange = (e) => {
    onFilterChange({ ...filters, keyword: e.target.value });
  };

  const handleClearFilters = () => {
    onFilterChange({ participant: '', date_start: '', date_end: '', keyword: '' });
  };

  const hasActiveFilters = filters.participant || filters.date_start || filters.date_end || filters.keyword;

  return (
    <div className="filters-sidebar">
      <h3 className="filters-title">Filters</h3>
      
      <div className="filter-group">
        <label className="filter-label">Participant</label>
        <select
          className="filter-select"
          value={filters.participant}
          onChange={handleParticipantChange}
        >
          <option value="">All Participants</option>
          {participants.map((participant, index) => (
            <option key={index} value={participant}>
              {participant}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Date Range Start</label>
        <input
          type="date"
          className="filter-input"
          value={filters.date_start}
          onChange={handleDateStartChange}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Date Range End</label>
        <input
          type="date"
          className="filter-input"
          value={filters.date_end}
          onChange={handleDateEndChange}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Keyword</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Search keyword..."
          value={filters.keyword}
          onChange={handleKeywordChange}
        />
      </div>

      {hasActiveFilters && (
        <button className="clear-filters-btn" onClick={handleClearFilters}>
          Clear All Filters
        </button>
      )}

      <div className="filter-info">
        <p className="filter-info-text">
          Filters apply to RAG search to narrow down relevant messages.
        </p>
      </div>
    </div>
  );
}

export default Filters;
