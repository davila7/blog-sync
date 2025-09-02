import React from 'react'
import BlogItem from './BlogItem'

const BlogList = ({ blogs, isLoading, onSync, syncStatus, onManualStatusChange }) => {
  if (isLoading) {
    return (
      <div className="terminal-command">
        <div style={{ fontSize: '12px', color: 'var(--text-warning)' }}>
          Loading posts...
        </div>
      </div>
    )
  }

  if (blogs.length === 0) {
    return (
      <div className="terminal-command">
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          No posts found
        </div>
      </div>
    )
  }

  return (
    <div className="terminal-list">
      {blogs.map((blog, index) => (
        <BlogItem
          key={blog.id}
          blog={blog}
          index={index}
          onSync={onSync}
          syncStatus={syncStatus}
          onManualStatusChange={onManualStatusChange}
        />
      ))}
    </div>
  )
}

export default BlogList