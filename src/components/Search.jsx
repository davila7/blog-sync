import React, { useState } from 'react'

const Search = ({ searchTerm, onSearchChange, totalBlogs, filteredCount }) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    onSearchChange('')
  }

  return (
    <div className="terminal-command">
      <div className="terminal-command-header">
        <h2 className="terminal-command-title">
          <span className="terminal-prompt">></span>
          <strong>search</strong>
          <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>
            --query "{searchTerm || 'all'}"
          </span>
        </h2>
      </div>
      <p className="terminal-command-subtitle">
        Filter blog posts by title, description, or tags
      </p>

      <div className="terminal-input-container">
        <div className="terminal-input-wrapper">
          <span className="terminal-prompt">></span>
          <input
            type="text"
            className="terminal-input"
            placeholder="Type to search posts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {isFocused && (
            <span className="terminal-cursor">_</span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {searchTerm && (
            <button 
              className="terminal-button"
              onClick={handleClear}
              title="Clear search"
            >
              <span>✗</span>
            </button>
          )}
          
          <div style={{ 
            color: 'var(--text-muted)', 
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            lineHeight: '1.2'
          }}>
            <div>
              {filteredCount} / {totalBlogs}
            </div>
            <div style={{ fontSize: '10px' }}>
              posts
            </div>
          </div>
        </div>
      </div>

      {searchTerm && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px 12px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '4px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <div className="terminal-flex" style={{ gap: '8px' }}>
            <span className="terminal-prompt success">→</span>
            <span>
              Found {filteredCount} post{filteredCount !== 1 ? 's' : ''} matching "{searchTerm}"
            </span>
          </div>
        </div>
      )}

      {/* Search shortcuts info */}
      <div style={{ 
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(0, 255, 0, 0.05)',
        border: '1px solid rgba(0, 255, 0, 0.2)',
        borderRadius: '4px',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <div className="terminal-flex" style={{ gap: '16px', flexWrap: 'wrap' }}>
          <div><code>tag:react</code> - Search by tag</div>
          <div><code>title:hooks</code> - Search in title</div>
          <div><code>desc:guide</code> - Search in description</div>
        </div>
      </div>
    </div>
  )
}

export default Search