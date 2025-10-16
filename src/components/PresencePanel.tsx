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
  maxReconnectAttempts: number
  queuedOperationsCount: number
  fps: number
  shapesCount: number
  onSignOut: () => void
}

export default function PresencePanel({
  currentUserEmail,
  currentUserColor,
  uniqueActiveUsers,
  onlineUsersCount,
  connectionState,
  reconnectAttempts,
  maxReconnectAttempts,
  queuedOperationsCount,
  fps,
  shapesCount,
  onSignOut,
}: PresencePanelProps) {
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
      <button
        onClick={onSignOut}
        title="Sign out"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2a2a2a',
          color: '#ffffff',
          border: '1px solid #404040',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          lineHeight: 1,
        }}
      >
        ⎋
      </button>

      {/* Active Users Section */}
      <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#ffffff' }}>
        Online ({onlineUsersCount})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        {/* Current user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        marginBottom: '8px',
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
          {connectionState === 'connected' ? 'Connected' :
            connectionState === 'reconnecting' ? `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})` :
              connectionState === 'connecting' ? 'Connecting...' :
                'Disconnected'}
        </span>
        {queuedOperationsCount > 0 && (
          <span style={{ fontSize: '11px', color: '#888' }}>
            ({queuedOperationsCount} queued)
          </span>
        )}
      </div>

      {/* Performance Stats Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px',
        color: '#888',
      }}>
        <span style={{ minWidth: '45px', display: 'inline-block' }}>
          {fps} FPS
        </span>
        <span>|</span>
        <span>
          {shapesCount} shapes
        </span>
      </div>
    </div>
  )
}

