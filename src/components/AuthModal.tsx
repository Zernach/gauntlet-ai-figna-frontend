import { useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [mode, email, password])

  const toggleMode = useCallback(() => {
    setMode(mode === 'login' ? 'signup' : 'login')
  }, [mode])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Memoize text values that depend on mode
  const modalTitle = useMemo(() => mode === 'login' ? 'Sign In' : 'Sign Up', [mode])
  const submitButtonText = useMemo(() => loading ? 'Loading...' : modalTitle, [loading, modalTitle])
  const toggleText = useMemo(() => mode === 'login' ? "Don't have an account? " : 'Already have an account? ', [mode])
  const toggleButtonText = useMemo(() => mode === 'login' ? 'Sign Up' : 'Sign In', [mode])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={handleModalClick}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '32px',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid #404040',
        }}
      >
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
          {modalTitle}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #404040',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#2a2a2a',
                color: '#ffffff',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #404040',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#2a2a2a',
                color: '#ffffff',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#2a1a1a',
                color: '#ff0040',
                borderRadius: '6px',
                fontSize: '14px',
                border: '1px solid #ff0040',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#24ccff',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              boxShadow: '0 4px 6px rgba(36, 204, 255, 0.3)',
            }}
          >
            {submitButtonText}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#b0b0b0' }}>
          {toggleText}
          <button
            onClick={toggleMode}
            style={{
              color: '#72fa41',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {toggleButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}
