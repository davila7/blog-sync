import React from 'react'

const ScrapingStatus = ({ isLoading, error, postsCount, username }) => {
  const enableScraping = import.meta.env.VITE_ENABLE_SCRAPING === 'true'
  const hasUsername = !!username

  if (isLoading) {
    return (
      <div className="terminal-command" style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-warning)' }}>
          Loading posts...
        </div>
      </div>
    )
  }

  if (error && !error.includes('mock data')) {
    return (
      <div className="terminal-command" style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-error)' }}>
          {error}
        </div>
        {(!enableScraping || !hasUsername) && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Configure VITE_MEDIUM_USERNAME in .env to enable scraping
          </div>
        )}
      </div>
    )
  }

  if (error?.includes('Successfully loaded')) {
    return (
      <div className="terminal-command" style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-success)' }}>
          Loaded {postsCount} posts from @{username}
        </div>
      </div>
    )
  }

  return null
}

export default ScrapingStatus