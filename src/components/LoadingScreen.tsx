interface LoadingScreenProps {
  currentUserId: string | null
  canvasId: string | null
}

export default function LoadingScreen({ currentUserId, canvasId }: LoadingScreenProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      pointerEvents: 'none',
    }}>
      <div style={{
        backgroundColor: 'rgba(26, 26, 26, 0.7)',
        padding: '24px 32px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(64, 64, 64, 0.5)',
        textAlign: 'center',
        pointerEvents: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #404040',
            borderTop: '3px solid #24ccff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#ffffff' }}>
              Canvas Loading...
            </h2>
            <p style={{ color: '#b0b0b0', fontSize: '14px', margin: 0 }}>
              {!currentUserId
                ? 'Please sign in to access the canvas.'
                : !canvasId
                  ? 'Initializing canvas...'
                  : 'Connecting to WebSocket...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

