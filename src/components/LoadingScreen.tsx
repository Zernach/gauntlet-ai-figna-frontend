interface LoadingScreenProps {
  currentUserId: string | null
  canvasId: string | null
  wsRef: React.MutableRefObject<WebSocket | null>
}

export default function LoadingScreen({ currentUserId, canvasId, wsRef }: LoadingScreenProps) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 4px 16px #1c1c1c80',
        border: '1px solid #404040',
        maxWidth: '400px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#ffffff' }}>
          Canvas Loading...
        </h2>
        <p style={{ color: '#b0b0b0', marginBottom: '24px' }}>
          {!currentUserId
            ? 'Please sign in to access the canvas.'
            : !canvasId
              ? 'Initializing canvas...'
              : 'Connecting to WebSocket...'}
        </p>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #404040',
          borderTop: '4px solid #24ccff',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    </div>
  )
}

