import React, { useState, useEffect } from 'react'
import devtoApi from '../services/devtoApi'
import hashnodeApi from '../services/hashnodeApi'

const ApiStatus = () => {
  const [apiStatus, setApiStatus] = useState({
    devto: { configured: false, validated: false, error: null },
    hashnode: { configured: false, validated: false, error: null }
  })
  const [isValidating, setIsValidating] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    checkApiConfiguration()
  }, [])

  const checkApiConfiguration = async () => {
    const devtoConfigured = devtoApi.isConfigured()
    const hashnodeConfigured = hashnodeApi.isConfigured()
    
    setApiStatus({
      devto: { 
        configured: devtoConfigured, 
        validated: false, 
        error: null 
      },
      hashnode: { 
        configured: hashnodeConfigured, 
        validated: false, 
        error: null 
      }
    })

    // If APIs are configured, validate them
    if (devtoConfigured || hashnodeConfigured) {
      await validateApis()
    }
  }

  const validateApis = async () => {
    setIsValidating(true)
    const newStatus = { ...apiStatus }

    // Validate Dev.to API
    if (devtoApi.isConfigured()) {
      try {
        await devtoApi.getUserInfo()
        newStatus.devto = { configured: true, validated: true, error: null }
      } catch (error) {
        newStatus.devto = { configured: true, validated: false, error: error.message }
      }
    }

    // Validate Hashnode API
    if (hashnodeApi.isConfigured()) {
      try {
        await hashnodeApi.getUserInfo()
        newStatus.hashnode = { configured: true, validated: true, error: null }
      } catch (error) {
        newStatus.hashnode = { configured: true, validated: false, error: error.message }
      }
    }

    setApiStatus(newStatus)
    setIsValidating(false)
  }

  const getStatusIcon = (status) => {
    if (!status.configured) return '⚪'
    if (isValidating) return '🔄'
    if (status.validated) return '✅'
    if (status.error) return '❌'
    return '⚪'
  }

  const getStatusText = (platform, status) => {
    if (!status.configured) return 'Not configured'
    if (isValidating) return 'Validating...'
    if (status.validated) return 'Key format valid (needs backend for sync)'
    if (status.error) return `Error: ${status.error}`
    return 'Unknown'
  }

  const getStatusColor = (status) => {
    if (!status.configured) return 'var(--text-muted)'
    if (status.validated) return 'var(--text-success)'
    if (status.error) return 'var(--text-error)'
    return 'var(--text-warning)'
  }

  return (
    <div className="terminal-command" style={{ marginBottom: '16px' }}>
      <div className="terminal-flex space-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            API Configuration Status
          </div>
          
          <div style={{ fontSize: '11px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px',
              color: getStatusColor(apiStatus.devto)
            }}>
              <span style={{ marginRight: '8px' }}>{getStatusIcon(apiStatus.devto)}</span>
              <span style={{ marginRight: '8px', fontWeight: '600' }}>Dev.to:</span>
              <span>{getStatusText('devto', apiStatus.devto)}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: getStatusColor(apiStatus.hashnode)
            }}>
              <span style={{ marginRight: '8px' }}>{getStatusIcon(apiStatus.hashnode)}</span>
              <span style={{ marginRight: '8px', fontWeight: '600' }}>Hashnode:</span>
              <span>{getStatusText('hashnode', apiStatus.hashnode)}</span>
            </div>
          </div>
        </div>

        <div className="terminal-flex" style={{ gap: '8px' }}>
          <button
            className="terminal-button"
            onClick={validateApis}
            disabled={isValidating}
            title="Validate API keys"
          >
            {isValidating ? 'Validating...' : 'Validate APIs'}
          </button>
          
          <button
            className="terminal-button"
            onClick={() => setShowHelp(!showHelp)}
            title="Show configuration help"
          >
            {showHelp ? 'Hide Help' : 'Setup Help'}
          </button>
        </div>
      </div>

      {/* Configuration Help */}
      {showHelp && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(0, 255, 0, 0.05)',
          border: '1px solid rgba(0, 255, 0, 0.2)',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-success)' }}>
            🔑 API Configuration Guide
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Dev.to Setup:
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              1. Go to <a href="https://dev.to/settings/extensions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-success)' }}>https://dev.to/settings/extensions</a>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              2. Generate API key → Add to .env: <code>VITE_DEVTO_API_KEY=your_key</code>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Hashnode Setup:
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              1. Go to <a href="https://hashnode.com/settings/developer" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-success)' }}>https://hashnode.com/settings/developer</a>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              2. Generate token → Add to .env: <code>VITE_HASHNODE_API_KEY=your_token</code>
            </div>
          </div>
          
          <div style={{ 
            fontSize: '9px', 
            color: 'var(--text-warning)',
            fontStyle: 'italic',
            borderTop: '1px solid rgba(255, 255, 0, 0.1)',
            paddingTop: '8px',
            marginTop: '8px'
          }}>
            ⚠️ <strong>CORS Limitation:</strong> Browser apps cannot directly call Dev.to/Hashnode APIs.
            <br/>
            To enable real sync, you need a backend server to proxy the API calls.
            <br/>
            For now, use this app to organize posts and copy them manually to the platforms.
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiStatus