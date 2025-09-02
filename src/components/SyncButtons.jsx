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
      
      setTimeout(() => {
        setBulkSyncStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[platform]
          return newStatus
        })
      }, 3000)
    } catch (error) {
      setBulkSyncStatus(prev => ({ ...prev, [platform]: 'error' }))
      
      setTimeout(() => {
        setBulkSyncStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[platform]
          return newStatus
        })
      }, 5000)
    }
  }

  const renderBulkSyncButton = (platform, displayName) => {
    const stats = getSyncStats()
    const status = bulkSyncStatus[platform]
    const isDisabled = isLoading || status === 'syncing' || stats[platform].pending === 0
    
    let buttonText = `Sync All to ${displayName}`
    
    if (stats[platform].pending === 0) {
      buttonText = `All ${displayName} Synced`
    } else {
      switch (status) {
        case 'syncing':
          buttonText = `Syncing to ${displayName}...`
          break
        case 'success':
          buttonText = `${displayName} Sync Complete`
          break
        case 'error':
          buttonText = `${displayName} Sync Failed`
          break
      }
    }

    return (
      <button
        className={`terminal-button ${stats[platform].pending === 0 || status === 'success' ? 'primary' : ''}`}
        onClick={() => handleBulkSync(platform)}
        disabled={isDisabled}
      >
        {buttonText} ({stats[platform].pending} pending)
      </button>
    )
  }

  if (isLoading || blogs.length === 0) {
    return null
  }

  return (
    <div className="terminal-command">
      <div className="terminal-grid two-columns">
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '6px',
          padding: '16px'
        }}>
          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>
            Dev.to
          </div>
          {renderBulkSyncButton('devto', 'Dev.to')}
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '6px',
          padding: '16px'
        }}>
          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>
            Hashnode
          </div>
          {renderBulkSyncButton('hashnode', 'Hashnode')}
        </div>
      </div>
    </div>
  )
}

export default SyncButtons