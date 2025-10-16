import { useEffect, useState, memo } from 'react'
import ColorSlider from './ColorSlider'

interface CanvasBackgroundPanelProps {
  isOpen: boolean
  position: { top: number; left: number } | null
  valueHex: string
  onChangeHex: (hex: string) => void
}

function CanvasBackgroundPanel({
  isOpen,
  position,
  valueHex,
  onChangeHex,
}: CanvasBackgroundPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // When opening, render immediately and then trigger fade-in
      setShouldRender(true)
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      // When closing, trigger fade-out first
      setIsVisible(false)
      // Wait for transition to complete before unrendering
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: position ? `${position.top}px` : '20px',
        left: position ? `${position.left}px` : 'calc(20px + 200px + 12px)',
        zIndex: 11,
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        border: '1px solid #404040',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: '0 8px 32px #1c1c1c66',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        Canvas Background
      </div>
      <ColorSlider
        valueHex={valueHex}
        onChangeHex={onChangeHex}
        allowHexEdit={true}
        layout="row"
      />
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(CanvasBackgroundPanel)

