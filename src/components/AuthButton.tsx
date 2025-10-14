interface AuthButtonProps {
  isAuthenticated: boolean
  onAuthClick: () => void
  onSignOut: () => void
  connected: boolean
}

export default function AuthButton({
  isAuthenticated,
  onAuthClick,
  onSignOut,
  connected,
}: AuthButtonProps) {
  return (
    <button
      onClick={isAuthenticated ? onSignOut : onAuthClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: isAuthenticated ? '#10b981' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      {isAuthenticated && (
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: connected ? '#34d399' : '#ef4444',
          }}
        />
      )}
      {isAuthenticated ? 'Sign Out' : 'Sign In'}
    </button>
  )
}
