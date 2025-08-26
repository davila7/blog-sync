import React from 'react'

const BlogItem = ({ blog, index, onSync, syncStatus }) => {
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

  const renderSyncButton = (platform, displayName, emoji) => {
    const state = getSyncButtonState(platform)
    const isDisabled = state === 'syncing'
    
    let buttonClass = 'terminal-button'
    let buttonText = `Sync to ${displayName}`
    let buttonEmoji = emoji
    
    switch (state) {
      case 'syncing':
        buttonClass = 'terminal-button warning'
        buttonText = 'Syncing...'
        buttonEmoji = '⟳'
        break
      case 'success':
        buttonClass = 'terminal-button primary'
        buttonText = 'Sync Complete'
        buttonEmoji = '✓'
        break
      case 'error':
        buttonClass = 'terminal-button error'
        buttonText = 'Sync Failed'
        buttonEmoji = '✗'
        break
      case 'synced':
        buttonClass = 'terminal-button primary'
        buttonText = 'Re-sync'
        buttonEmoji = '↻'
        break
    }

    return (
      <button
        className={buttonClass}
        onClick={() => onSync(blog.id, platform)}
        disabled={isDisabled}
        title={`${buttonText} - ${displayName}`}
      >
        <span style={{ 
          animation: state === 'syncing' ? 'spin 1s linear infinite' : 'none',
          display: 'inline-block'
        }}>
          {buttonEmoji}
        </span>
        {buttonText}
      </button>
    )
  }

  return (
    <div className="terminal-list-item">
      <div className="terminal-list-item-header">
        <div style={{ flex: 1 }}>
          <h3 className="terminal-list-item-title">
            <span style={{ 
              color: 'var(--text-muted)', 
              fontSize: '12px', 
              marginRight: '8px' 
            }}>
              [{(index + 1).toString().padStart(2, '0')}]
            </span>
            {blog.title}
          </h3>
          
          <div className="terminal-list-item-meta">
            <span>📅 {formatDate(blog.publishedAt)}</span>
            <span>⏱️ {blog.readingTime}</span>
            <span>👏 {blog.claps}</span>
            <span>💬 {blog.responses}</span>
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

      <div className="terminal-list-item-meta" style={{ marginTop: '12px' }}>
        <span style={{ color: 'var(--text-accent)' }}>
          Tags:
        </span>
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

      <div className="terminal-list-item-actions">
        {renderSyncButton('devto', 'Dev.to', '🚀')}
        {renderSyncButton('hashnode', 'Hashnode', '📝')}
        
        <button 
          className="terminal-button"
          onClick={() => window.open(`https://medium.com/@user/post-${blog.id}`, '_blank')}
          title="View on Medium"
        >
          <span>🔗</span>
          View Original
        </button>
      </div>

      {/* Command line representation */}
      <div style={{ 
        marginTop: '12px',
        padding: '8px 12px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        color: 'var(--text-muted)',
        overflow: 'hidden'
      }}>
        <div className="terminal-flex" style={{ gap: '4px' }}>
          <span className="terminal-prompt">$</span>
          <code style={{ color: 'var(--text-secondary)' }}>
            sync --post-id {blog.id} --platforms {blog.synced.devto ? 'devto✓' : 'devto✗'},{blog.synced.hashnode ? 'hashnode✓' : 'hashnode✗'}
          </code>
        </div>
      </div>
    </div>
  )
}

export default BlogItem