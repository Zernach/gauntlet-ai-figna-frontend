import { useState, useEffect } from 'react'
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {session ? <Canvas /> : null}

      <AuthButton
        isAuthenticated={!!session}
        onAuthClick={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        connected={!!session}
      />

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}

export default App
