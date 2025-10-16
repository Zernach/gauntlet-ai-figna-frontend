import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import Canvas from './components/Canvas'
import AuthButton from './components/AuthButton'
import AuthModal from './components/AuthModal'
import RealtimeVoicePanel from './components/RealtimeVoicePanel'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (session) {
        setShowAuthModal(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const handleAuthClick = useCallback(() => {
    setShowAuthModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowAuthModal(false)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#0a0a0a' }}>
      {session ? <Canvas /> : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.1,
                background: 'linear-gradient(90deg, #72fa41, #24ccff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Figna 🎨
            </h1>
            <p
              style={{
                marginTop: '16px',
                color: '#b0b0b0',
                fontSize: 'clamp(16px, 2.2vw, 24px)',
                fontWeight: 500,
              }}
            >
              Collaborative Canvas in Realtime
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
              <a
                href="https://github.com/Zernach/gauntlet-ai-figna-frontend"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #404040',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: '0 2px 8px #1c1c1c80',
                }}
                title="View Frontend on GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.866-.014-1.699-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.464-1.11-1.464-.907-.62.069-.607.069-.607 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.646.35-1.087.636-1.337-2.221-.253-4.555-1.111-4.555-4.945 0-1.091.39-1.985 1.029-2.684-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.563 9.563 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.026 2.748-1.026.545 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.684 0 3.842-2.337 4.689-4.566 4.938.359.309.678.919.678 1.853 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.481A10.004 10.004 0 0 0 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Frontend
              </a>

              <a
                href="https://github.com/Zernach/gauntlet-ai-figna-backend"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #404040',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: '0 2px 8px #1c1c1c80',
                }}
                title="View Backend on GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.866-.014-1.699-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.464-1.11-1.464-.907-.62.069-.607.069-.607 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.646.35-1.087.636-1.337-2.221-.253-4.555-1.111-4.555-4.945 0-1.091.39-1.985 1.029-2.684-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.563 9.563 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.026 2.748-1.026.545 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.684 0 3.842-2.337 4.689-4.566 4.938.359.309.678.919.678 1.853 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.481A10.004 10.004 0 0 0 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Backend
              </a>
            </div>
          </div>
        </div>
      )}

      <AuthButton
        isAuthenticated={!!session}
        onAuthClick={handleAuthClick}
        onSignOut={handleSignOut}
        connected={!!session}
      />

      {showAuthModal && (
        <AuthModal onClose={handleCloseModal} />
      )}

      {session && <RealtimeVoicePanel session={session} />}
    </div>
  )
}

export default App
