interface ReconnectionOverlayProps {
  reconnectAttempts: number
  maxReconnectAttempts: number
  queuedOperationsCount: number
}

export default function ReconnectionOverlay({ 
  reconnectAttempts, 
  maxReconnectAttempts, 
  queuedOperationsCount 
}: ReconnectionOverlayProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1c1c1cb3',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px #1c1c1ccc',
        border: '1px solid #404040',
        textAlign: 'center',
        maxWidth: '400px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #404040',
          borderTop: '4px solid #24ccff',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 1s linear infinite',
        }} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>
          Reconnecting to server...
        </h3>
        <p style={{ color: '#b0b0b0', fontSize: '14px', marginBottom: '12px' }}>
          Attempt {reconnectAttempts} of {maxReconnectAttempts}
        </p>
        {queuedOperationsCount > 0 && (
          <p style={{ color: '#888', fontSize: '12px' }}>
            {queuedOperationsCount} operation(s) queued and will sync on reconnection
          </p>
        )}
      </div>
    </div>
  )
}

