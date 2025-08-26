import React, { useState } from 'react'

const SyncButtons = ({ blogs, onBulkSync, isLoading }) => {
  const [bulkSyncStatus, setBulkSyncStatus] = useState({})

  const getSyncStats = () => {
    const devtoSynced = blogs.filter(blog => blog.synced.devto).length
    const hashnodeSynced = blogs.filter(blog => blog.synced.hashnode).length
    const devtoPending = blogs.length - devtoSynced
    const hashnodePending = blogs.length - hashnodeSynced
    
    return {
      devto: { synced: devtoSynced, pending: devtoPending },
      hashnode: { synced: hashnodeSynced, pending: hashnodePending }
    }
  }

  const handleBulkSync = async (platform) => {
    setBulkSyncStatus(prev => ({ ...prev, [platform]: 'syncing' }))
    
    try {
      await onBulkSync(platform)
      setBulkSyncStatus(prev => ({ ...prev, [platform]: 'success' }))
      
      // Clear success status after 3 seconds
      setTimeout(() => {
        setBulkSyncStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[platform]
          return newStatus
        })
      }, 3000)
    } catch (error) {
      setBulkSyncStatus(prev => ({ ...prev, [platform]: 'error' }))
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setBulkSyncStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[platform]
          return newStatus
        })
      }, 5000)
    }
  }

  const renderBulkSyncButton = (platform, displayName, emoji, color = '') => {
    const stats = getSyncStats()
    const status = bulkSyncStatus[platform]
    const isDisabled = isLoading || status === 'syncing' || stats[platform].pending === 0
    
    let buttonClass = `terminal-button ${color}`
    let buttonText = `Sync All to ${displayName}`
    let buttonEmoji = emoji
    
    if (stats[platform].pending === 0) {
      buttonText = `All ${displayName} Synced`
      buttonEmoji = '✓'
      buttonClass = 'terminal-button primary'
    } else {
      switch (status) {
        case 'syncing':
          buttonClass = 'terminal-button warning'
          buttonText = `Syncing to ${displayName}...`
          buttonEmoji = '⟳'
          break
        case 'success':
          buttonClass = 'terminal-button primary'
          buttonText = `${displayName} Sync Complete`
          buttonEmoji = '✓'
          break
        case 'error':
          buttonClass = 'terminal-button error'
          buttonText = `${displayName} Sync Failed`
          buttonEmoji = '✗'
          break
      }
    }

    return (
      <button
        className={buttonClass}
        onClick={() => handleBulkSync(platform)}
        disabled={isDisabled}
        title={`${buttonText} (${stats[platform].pending} posts pending)`}
      >
        <span style={{ 
          animation: status === 'syncing' ? 'spin 1s linear infinite' : 'none',
          display: 'inline-block'
        }}>
          {buttonEmoji}
        </span>
        {buttonText}
        {stats[platform].pending > 0 && status !== 'syncing' && (
          <span style={{ 
            marginLeft: '6px',
            padding: '2px 6px',
            background: 'var(--bg-primary)',
            borderRadius: '3px',
            fontSize: '10px',
            border: '1px solid var(--border-primary)'
          }}>
            {stats[platform].pending}
          </span>
        )}
      </button>
    )
  }

  const stats = getSyncStats()
  const totalPending = stats.devto.pending + stats.hashnode.pending

  if (isLoading) {
    return null
  }

  return (
    <div className="terminal-command">
      <div className="terminal-command-header">
        <h2 className="terminal-command-title">
          <span className="terminal-prompt warning">⚡</span>
          <strong>bulk-sync</strong>
          <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>
            --pending {totalPending} --platforms devto,hashnode
          </span>
        </h2>
      </div>
      <p className="terminal-command-subtitle">
        Synchronize all posts to external platforms in batch mode
      </p>

      <div className="terminal-grid two-columns">
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '6px',
          padding: '16px'
        }}>
          <div className="terminal-flex space-between" style={{ marginBottom: '12px' }}>
            <div className="terminal-flex" style={{ gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🚀</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Dev.to</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Developer community platform
                </div>
              </div>
            </div>
            <div className="terminal-flex column" style={{ alignItems: 'flex-end', gap: '4px' }}>
              <div className={`terminal-status ${stats.devto.synced > 0 ? 'online' : 'offline'}`}>
                <div className="terminal-status-dot"></div>
                <span style={{ fontSize: '10px' }}>
                  {stats.devto.synced}/{blogs.length}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            {renderBulkSyncButton('devto', 'Dev.to', '🚀')}
          </div>
          
          <div style={{ 
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Synced: {stats.devto.synced}</span>
            <span>Pending: {stats.devto.pending}</span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '6px',
          padding: '16px'
        }}>
          <div className="terminal-flex space-between" style={{ marginBottom: '12px' }}>
            <div className="terminal-flex" style={{ gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📝</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Hashnode</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Blogging platform for developers
                </div>
              </div>
            </div>
            <div className="terminal-flex column" style={{ alignItems: 'flex-end', gap: '4px' }}>
              <div className={`terminal-status ${stats.hashnode.synced > 0 ? 'online' : 'offline'}`}>
                <div className="terminal-status-dot"></div>
                <span style={{ fontSize: '10px' }}>
                  {stats.hashnode.synced}/{blogs.length}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            {renderBulkSyncButton('hashnode', 'Hashnode', '📝')}
          </div>
          
          <div style={{ 
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Synced: {stats.hashnode.synced}</span>
            <span>Pending: {stats.hashnode.pending}</span>
          </div>
        </div>
      </div>

      {/* Sync status overview */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(0, 255, 0, 0.05)',
        border: '1px solid rgba(0, 255, 0, 0.2)',
        borderRadius: '4px'
      }}>
        <div className="terminal-flex space-between">
          <div className="terminal-flex" style={{ gap: '8px' }}>
            <span className="terminal-prompt success">$</span>
            <span style={{ fontSize: '12px' }}>
              Sync Status: {totalPending === 0 ? 'All posts synchronized' : `${totalPending} posts pending sync`}
            </span>
          </div>
          
          <div className="terminal-flex" style={{ gap: '12px', fontSize: '11px' }}>
            <div>
              <span style={{ color: 'var(--text-success)' }}>✓</span> 
              Completed: {(stats.devto.synced + stats.hashnode.synced)}
            </div>
            <div>
              <span style={{ color: 'var(--text-warning)' }}>⟳</span> 
              Pending: {totalPending}
            </div>
          </div>
        </div>
      </div>

      {/* Command examples */}
      <div style={{
        marginTop: '12px',
        padding: '12px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        fontSize: '11px'
      }}>
        <div style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
          Equivalent commands:
        </div>
        <div className="terminal-flex column" style={{ gap: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
          <div>
            <span className="terminal-prompt">$</span>
            <code style={{ color: 'var(--text-secondary)' }}>
              blog-sync --bulk --platform devto --filter unsync
            </code>
          </div>
          <div>
            <span className="terminal-prompt">$</span>
            <code style={{ color: 'var(--text-secondary)' }}>
              blog-sync --bulk --platform hashnode --filter unsync
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyncButtons