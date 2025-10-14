import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import Canvas from './components/Canvas'
import AuthButton from './components/AuthButton'
import AuthModal from './components/AuthModal'

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
      {session ? <Canvas /> : null}

      <AuthButton
        isAuthenticated={!!session}
        onAuthClick={handleAuthClick}
        onSignOut={handleSignOut}
        connected={!!session}
      />

      {showAuthModal && (
        <AuthModal onClose={handleCloseModal} />
      )}
    </div>
  )
}

export default App
