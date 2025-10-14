import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import Canvas from './components/Canvas'
import AuthButton from './components/AuthButton'
import AuthModal from './components/AuthModal'
import { useWebSocket } from './hooks/useWebSocket'
import { createCanvas, getCanvases } from './lib/api'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const { connect, disconnect, connected } = useWebSocket()

  const initializeCanvas = async () => {
    try {
      // Try to get existing canvases
      const response = await getCanvases()

      if (response.data && response.data.length > 0) {
        // Use the first canvas
        const canvas = response.data[0]
        connect(canvas.id)
      } else {
        // Create a new canvas
        const response = await createCanvas('My Canvas')
        if (response.data) {
          connect(response.data.id)
        }
      }
    } catch (error) {
      console.error('Failed to initialize canvas:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        initializeCanvas()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      // Connect to WebSocket when user logs in
      if (session) {
        setShowAuthModal(false)
        initializeCanvas()
      } else {
        disconnect()
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas />

      <AuthButton
        isAuthenticated={!!session}
        onAuthClick={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        connected={connected}
      />

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}

export default App
