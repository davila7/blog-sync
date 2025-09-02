import React from 'react'

const BlogItem = ({ blog, index, onSync, syncStatus, onManualStatusChange }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSyncButtonState = (platform) => {
    const statusKey = `${blog.id}-${platform}`
    const status = syncStatus[statusKey]
    
    if (status === 'syncing') return 'syncing'
    if (status === 'success') return 'success'
    if (status === 'error') return 'error'
    if (blog.synced[platform]) return 'synced'
    return 'not-synced'
  }

  const renderSyncButton = (platform, displayName) => {
    const state = getSyncButtonState(platform)
    const isDisabled = state === 'syncing'
    
    let buttonText = `Sync to ${displayName}`
    
    switch (state) {
      case 'syncing':
        buttonText = 'Syncing...'
        break
      case 'success':
        buttonText = 'Synced'
        break
      case 'error':
        buttonText = 'Failed - Retry'
        break
      case 'synced':
        buttonText = 'Re-sync'
        break
    }

    return (
      <button
        className={`terminal-button ${state === 'synced' || state === 'success' ? 'primary' : ''}`}
        onClick={() => onSync(blog.id, platform)}
        disabled={isDisabled}
        title={`${buttonText} - ${displayName}`}
      >
        {buttonText}
      </button>
    )
  }

  const renderManualStatusCheckbox = (platform, displayName) => {
    const isPublished = blog.published && blog.published[platform]
    
    return (
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        userSelect: 'none'
      }}>
        <input
          type="checkbox"
          checked={isPublished || false}
          onChange={(e) => onManualStatusChange && onManualStatusChange(blog.id, platform, e.target.checked)}
          style={{
            marginRight: '2px',
            transform: 'scale(0.8)'
          }}
        />
        Published to {displayName}
      </label>
    )
  }

  return (
    <div className="terminal-list-item">
      <div className="terminal-list-item-header">
        <div style={{ flex: 1 }}>
          <h3 className="terminal-list-item-title">
            {blog.title}
          </h3>
          
          <div className="terminal-list-item-meta">
            <span>{formatDate(blog.publishedAt)}</span>
            <span>{blog.readingTime}</span>
            <span>{blog.claps} claps</span>
          </div>
        </div>

        <div className="terminal-flex" style={{ gap: '8px', alignItems: 'flex-start' }}>
          <div className={`terminal-status ${blog.synced.devto ? 'online' : 'offline'}`}>
            <div className="terminal-status-dot"></div>
            <span style={{ fontSize: '10px' }}>DEV</span>
          </div>
          <div className={`terminal-status ${blog.synced.hashnode ? 'online' : 'offline'}`}>
            <div className="terminal-status-dot"></div>
            <span style={{ fontSize: '10px' }}>HSH</span>
          </div>
        </div>
      </div>

      <div className="terminal-list-item-description">
        {blog.description}
      </div>

      {blog.tags.length > 0 && (
        <div className="terminal-list-item-meta" style={{ marginTop: '8px' }}>
          {blog.tags.map((tag, tagIndex) => (
            <span key={tagIndex} style={{ 
              background: 'var(--bg-primary)',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid var(--border-primary)',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="terminal-list-item-actions">
        {renderSyncButton('devto', 'Dev.to')}
        {renderSyncButton('hashnode', 'Hashnode')}
      </div>

      <div style={{ 
        marginTop: '12px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--text-muted)', 
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Manual Status
        </div>
        {renderManualStatusCheckbox('devto', 'Dev.to')}
        {renderManualStatusCheckbox('hashnode', 'Hashnode')}
      </div>
    </div>
  )
}

export default BlogItem