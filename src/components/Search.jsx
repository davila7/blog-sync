import React from 'react'

const Search = ({ searchTerm, onSearchChange, totalBlogs, filteredCount }) => {
  const handleClear = () => {
    onSearchChange('')
  }

  return (
    <div className="terminal-command">
      <div className="terminal-input-container">
        <div className="terminal-input-wrapper">
          <input
            type="text"
            className="terminal-input"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="terminal-button"
              onClick={handleClear}
              title="Clear search"
            >
              ✗
            </button>
          )}
        </div>
        
        <div style={{ 
          color: 'var(--text-muted)', 
          fontSize: '12px',
          marginLeft: '8px'
        }}>
          {filteredCount} / {totalBlogs} posts
        </div>
      </div>
    </div>
  )
}

export default Search