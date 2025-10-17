import React, { memo } from 'react'
import { LogOut } from 'lucide-react'
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor'

interface ActiveUser {
  userId: string
  username: string
  displayName: string
  email: string
  color: string
}

interface PresencePanelProps {
  currentUserEmail: string
  currentUserColor: string
  uniqueActiveUsers: ActiveUser[]
  onlineUsersCount: number
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  reconnectAttempts: number
  queuedOperationsCount: number
  onSignOut: () => void
}

function PresencePanel({
  currentUserEmail,
  currentUserColor,
  uniqueActiveUsers,
  onlineUsersCount,
  connectionState,
  reconnectAttempts,
  queuedOperationsCount,
  onSignOut,
}: PresencePanelProps) {
  // Move performance monitoring to this component to prevent canvas re-renders
  const { fps } = usePerformanceMonitor()
  const [showSignOutTooltip, setShowSignOutTooltip] = React.useState(false)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const emailRef = React.useRef<HTMLDivElement>(null)

  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showSignOutTooltip &&
        tooltipRef.current &&
        emailRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        !emailRef.current.contains(e.target as Node)
      ) {
        setShowSignOutTooltip(false)
      }
    }

    if (showSignOutTooltip) {
      // Add a small delay to prevent immediate closing from the triggering click
      const timeout = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 10)

      return () => {
        clearTimeout(timeout)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSignOutTooltip])

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSignOutTooltip) {
        setShowSignOutTooltip(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showSignOutTooltip])

  const handleSignOutClick = () => {
    setShowSignOutTooltip(false)
    onSignOut()
  }

  return (
    <div id="presence-panel" style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 10,
      backgroundColor: '#1a1a1a',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px #1c1c1c80',
      border: '1px solid #404040',
      minWidth: '200px',
    }}>
      {/* Active Users Section */}
      {onlineUsersCount > 1 && (
        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#ffffff' }}>
          Active users ({onlineUsersCount})
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        {/* Current user - clickable */}
        <div
          ref={emailRef}
          onClick={() => setShowSignOutTooltip(!showSignOutTooltip)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '4px',
            margin: '-4px',
            borderRadius: '4px',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: currentUserColor,
            boxShadow: `0 0 4px ${currentUserColor}`,
          }} />
          <span style={{ fontSize: '13px', color: '#ffffff' }}>{currentUserEmail} (you)</span>
        </div>
        {/* Other users */}
        {uniqueActiveUsers.map(user => (
          <div key={user.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: user.color,
              boxShadow: `0 0 4px ${user.color}`,
            }} />
            <span style={{ fontSize: '13px', color: '#ffffff' }}>
              {user.email || user.username || 'Unknown User'}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: '#404040',
        margin: '12px -16px 12px -16px'
      }} />

      {/* Connection Status Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor:
            connectionState === 'connected' ? '#00ff00' :
              connectionState === 'reconnecting' ? '#ffaa00' :
                connectionState === 'connecting' ? '#24ccff' :
                  '#ff0000',
          boxShadow: `0 0 8px ${connectionState === 'connected' ? '#00ff00' :
            connectionState === 'reconnecting' ? '#ffaa00' :
              connectionState === 'connecting' ? '#24ccff' :
                '#ff0000'
            }`,
          animation: connectionState === 'reconnecting' || connectionState === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }} />
        <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>
          {connectionState === 'connected' ? (
            <>
              Connected{' '}
              <span style={{ fontSize: '11px', color: '#888', fontWeight: 400, display: 'inline-block', minWidth: '55px', fontFamily: 'monospace' }}>
                ({fps} FPS)
              </span>
            </>
          ) :
            connectionState === 'reconnecting' ? `Reconnecting... (attempt ${reconnectAttempts})` :
              connectionState === 'connecting' ? 'Connecting...' :
                'Disconnected'}
        </span>
        {queuedOperationsCount > 0 && (
          <span style={{ fontSize: '11px', color: '#888' }}>
            ({queuedOperationsCount} queued)
          </span>
        )}
      </div>

      {/* Sign Out Tooltip */}
      {showSignOutTooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: '0',
            right: '100%',
            marginRight: '8px',
            zIndex: 1000,
            backgroundColor: '#1a1a1a',
            border: '1px solid #404040',
            borderRadius: '8px',
            boxShadow: '0 8px 32px #1c1c1c99',
            minWidth: '160px',
            padding: '6px 0',
            backdropFilter: 'blur(10px)',
          }}
        >
          <button
            onClick={handleSignOutClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px'
            }}>
              <LogOut size={16} />
            </div>
            <span>Sign out?</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Memoize to prevent unnecessary re-renders when FPS updates
export default memo(PresencePanel)

