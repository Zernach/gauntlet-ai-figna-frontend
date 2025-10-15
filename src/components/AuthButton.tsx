import { useMemo, useCallback } from 'react'

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
  // Memoize button style based on authentication state
  const buttonStyle = useMemo(() => ({
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    padding: '12px 24px',
    backgroundColor: isAuthenticated ? '#1a1a1a' : '#72fa41',
    color: isAuthenticated ? '#ffffff' : '#1c1c1c',
    border: isAuthenticated ? '1px solid #404040' : 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer' as const,
    boxShadow: isAuthenticated ? '0 4px 6px #1c1c1c80' : '0 4px 6px rgba(114, 250, 65, 0.3)',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center' as const,
    gap: '8px',
  }), [isAuthenticated])

  // Memoize connection indicator style
  const connectionIndicatorStyle = useMemo(() => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: connected ? '#72fa41' : '#ff0040',
    boxShadow: connected ? '0 0 4px #72fa41' : '0 0 4px #ff0040',
  }), [connected])

  // Memoize mouse enter handler
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    if (isAuthenticated) {
      e.currentTarget.style.boxShadow = '0 6px 8px #1c1c1cb3'
    } else {
      e.currentTarget.style.boxShadow = '0 6px 8px rgba(114, 250, 65, 0.5)'
    }
  }, [isAuthenticated])

  // Memoize mouse leave handler
  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(0)'
    if (isAuthenticated) {
      e.currentTarget.style.boxShadow = '0 4px 6px #1c1c1c80'
    } else {
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(114, 250, 65, 0.3)'
    }
  }, [isAuthenticated])

  if (isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={isAuthenticated ? onSignOut : onAuthClick}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isAuthenticated && (
        <span style={connectionIndicatorStyle} />
      )}
      {isAuthenticated ? 'Sign Out' : 'Sign In'}
    </button>
  )
}
