import React, { useState, useEffect } from 'react'
import cacheService from '../services/cacheService'

const CacheManager = ({ onRefresh, isLoading }) => {
  const [cacheInfo, setCacheInfo] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showFileInstructions, setShowFileInstructions] = useState(false)

  useEffect(() => {
    updateCacheInfo()
  }, [])

  const updateCacheInfo = async () => {
    const info = await cacheService.getCacheInfo()
    setCacheInfo(info)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      updateCacheInfo()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear the cache? This will force a complete reload.')) {
      await cacheService.clearCache()
      await updateCacheInfo()
      window.location.reload() // Reload to trigger fresh data load
    }
  }

  const handleExportCache = async () => {
    const success = await cacheService.exportCache()
    if (success) {
      alert('Cache exported successfully - check your Downloads folder')
    } else {
      alert('Error exporting cache')
    }
  }

  const handleImportCache = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const success = await cacheService.importCache(file)
          if (success) {
            alert('Cache imported successfully')
            await updateCacheInfo()
            window.location.reload()
          } else {
            alert('Error importing cache')
          }
        } catch (error) {
          alert(`Error importing cache: ${error.message}`)
        }
      }
    }
    input.click()
  }

  const handleDownloadTemplate = () => {
    const success = cacheService.downloadTemplate()
    if (success) {
      alert('Template downloaded - check your Downloads folder')
    } else {
      alert('Error downloading template')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'never'
    const now = new Date()
    const date = new Date(dateString)
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'less than 1 hour ago'
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  if (!cacheInfo) return null

  return (
    <div className="terminal-command" style={{ marginBottom: '16px' }}>
      <div className="terminal-flex space-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
            Cache Status
          </div>
          
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {cacheInfo.exists ? (
              <>
                <div>{cacheInfo.postCount} posts cached ({cacheInfo.sizeKB}KB)</div>
                <div>Updated: {formatTimeAgo(cacheInfo.lastUpdated)}</div>
                <div style={{ 
                  color: cacheInfo.isValid ? 'var(--text-success)' : 'var(--text-warning)' 
                }}>
                  Status: {cacheInfo.isValid ? 'Valid' : 'Expired'}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No cached data</div>
            )}
          </div>
        </div>

        <div className="terminal-flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`terminal-button ${isRefreshing ? 'warning' : ''}`}
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Sync new posts from Medium"
          >
            {isRefreshing ? 'Syncing...' : 'Sync New Posts'}
          </button>

          <button
            className="terminal-button"
            onClick={handleExportCache}
            title="Download cache as JSON file"
          >
            Export
          </button>

          <button
            className="terminal-button"
            onClick={handleImportCache}
            title="Import cache from JSON file"
          >
            Import
          </button>

          {cacheInfo?.exists && (
            <button
              className="terminal-button error"
              onClick={handleClearCache}
              title="Clear all cached data"
            >
              Clear Cache
            </button>
          )}

          <button
            className="terminal-button"
            onClick={() => setShowFileInstructions(!showFileInstructions)}
            title="Show file management instructions"
          >
            {showFileInstructions ? 'Hide Info' : 'File Info'}
          </button>
        </div>
      </div>

      {/* Cache details (expanded view) */}
      {cacheInfo?.exists && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '4px',
          fontSize: '10px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
            <div>Last sync: {formatDate(cacheInfo.lastUpdated)}</div>
            <div>Username: @{cacheInfo.username}</div>
            <div>Cache size: {cacheInfo.sizeKB}KB</div>
            <div>Posts: {cacheInfo.postCount}</div>
          </div>
        </div>
      )}

      {/* File management instructions */}
      {showFileInstructions && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(0, 255, 0, 0.05)',
          border: '1px solid rgba(0, 255, 0, 0.2)',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-success)' }}>
            📁 File-based Cache System
          </div>
          
          <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Cache files are stored in the <code>/data</code> directory:
          </div>
          
          <div style={{ marginBottom: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
            • <strong>Export</strong>: Downloads current cache as JSON file<br/>
            • <strong>Import</strong>: Uploads JSON file to restore cache<br/>
            • <strong>File Info</strong>: Shows this help information<br/>
            • Cache persists between sessions and app restarts
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              className="terminal-button"
              onClick={handleDownloadTemplate}
              style={{ fontSize: '10px' }}
            >
              Download Template
            </button>
          </div>
          
          <div style={{ 
            marginTop: '8px', 
            fontSize: '9px', 
            color: 'var(--text-muted)',
            fontStyle: 'italic' 
          }}>
            💡 Tip: Use Export to backup your posts, Import to restore them
          </div>
        </div>
      )}
    </div>
  )
}

export default CacheManager