import React from 'react'
import BlogItem from './BlogItem'

const BlogList = ({ blogs, isLoading, onSync, syncStatus }) => {
  if (isLoading) {
    return (
      <div className="terminal-command">
        <div className="terminal-command-header">
          <h2 className="terminal-command-title">
            <span className="terminal-prompt warning">⟳</span>
            <strong>fetch</strong>
            <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>
              --source medium.com --format json
            </span>
          </h2>
        </div>
        <p className="terminal-command-subtitle">
          Loading blog posts from Medium
        </p>

        <div className="terminal-loading" style={{ padding: '24px', justifyContent: 'center' }}>
          <div className="terminal-loading-spinner"></div>
          <span className="terminal-loading-text">
            Fetching posts<span className="loading-dots"></span>
          </span>
        </div>

        {/* Loading skeleton */}
        <div className="terminal-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="terminal-list-item" style={{ opacity: 0.3 }}>
              <div className="terminal-list-item-header">
                <div>
                  <div style={{ 
                    height: '16px', 
                    width: '300px', 
                    background: 'var(--border-primary)', 
                    borderRadius: '2px', 
                    marginBottom: '8px' 
                  }}></div>
                  <div style={{ 
                    height: '12px', 
                    width: '450px', 
                    background: 'var(--border-primary)', 
                    borderRadius: '2px' 
                  }}></div>
                </div>
              </div>
              <div style={{ 
                height: '12px', 
                width: '200px', 
                background: 'var(--border-primary)', 
                borderRadius: '2px',
                margin: '12px 0' 
              }}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (blogs.length === 0) {
    return (
      <div className="terminal-command">
        <div className="terminal-command-header">
          <h2 className="terminal-command-title">
            <span className="terminal-prompt error">✗</span>
            <strong>search</strong>
            <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>
              --results 0
            </span>
          </h2>
        </div>
        <p className="terminal-command-subtitle">
          No blog posts found matching your criteria
        </p>

        <div style={{ 
          padding: '32px', 
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <div style={{ marginBottom: '8px' }}>No posts available</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Try adjusting your search criteria or check your Medium connection
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="terminal-command">
      <div className="terminal-command-header">
        <h2 className="terminal-command-title">
          <span className="terminal-prompt success">✓</span>
          <strong>list</strong>
          <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>
            --count {blogs.length} --sort date-desc
          </span>
        </h2>
      </div>
      <p className="terminal-command-subtitle">
        Available blog posts ready for synchronization
      </p>

      <div className="terminal-list">
        {blogs.map((blog, index) => (
          <BlogItem 
            key={blog.id}
            blog={blog}
            index={index}
            onSync={onSync}
            syncStatus={syncStatus}
          />
        ))}
      </div>

      <div style={{ 
        marginTop: '16px',
        padding: '12px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="terminal-flex" style={{ gap: '8px' }}>
          <span className="terminal-prompt">$</span>
          <span>Showing {blogs.length} post{blogs.length !== 1 ? 's' : ''}</span>
        </div>
        
        <div className="terminal-flex" style={{ gap: '16px' }}>
          <div className="terminal-status">
            <div className="terminal-status-dot" style={{ background: 'var(--text-success)' }}></div>
            Synced: {blogs.filter(b => b.synced.devto || b.synced.hashnode).length}
          </div>
          <div className="terminal-status">
            <div className="terminal-status-dot" style={{ background: 'var(--text-warning)' }}></div>
            Pending: {blogs.filter(b => !b.synced.devto || !b.synced.hashnode).length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogList