import React, { useState, useEffect } from 'react'

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [connectionStatus, setConnectionStatus] = useState('online')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getSystemInfo = () => {
    const platform = navigator.platform || 'Unknown'
    const userAgent = navigator.userAgent
    let os = 'Unknown OS'
    
    if (userAgent.indexOf('Win') !== -1) os = 'Windows'
    else if (userAgent.indexOf('Mac') !== -1) os = 'macOS'
    else if (userAgent.indexOf('Linux') !== -1) os = 'Linux'
    else if (userAgent.indexOf('Android') !== -1) os = 'Android'
    else if (userAgent.indexOf('iPhone') !== -1) os = 'iOS'

    return { platform, os }
  }

  const systemInfo = getSystemInfo()

  return (
    <div className="terminal-header">
      <div className="terminal-dots">
        <div className="terminal-dot close"></div>
        <div className="terminal-dot minimize"></div>
        <div className="terminal-dot maximize"></div>
      </div>
      
      <div className="terminal-title">
        blog-sync@{systemInfo.os.toLowerCase()}:~$ 
        <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>
          [{formatTime(currentTime)}]
        </span>
      </div>

      <div className="terminal-flex" style={{ marginLeft: 'auto', gap: '16px', fontSize: '12px' }}>
        <div className={`terminal-status ${connectionStatus}`}>
          <div className="terminal-status-dot"></div>
          {connectionStatus.toUpperCase()}
        </div>
        
        <div style={{ color: 'var(--text-muted)' }}>
          {systemInfo.platform}
        </div>
      </div>
    </div>
  )
}

export default Header