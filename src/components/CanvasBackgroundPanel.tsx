import ColorSlider from './ColorSlider'

interface CanvasBackgroundPanelProps {
  isOpen: boolean
  position: { top: number; left: number } | null
  valueHex: string
  onChangeHex: (hex: string) => void
}

export default function CanvasBackgroundPanel({
  isOpen,
  position,
  valueHex,
  onChangeHex,
}: CanvasBackgroundPanelProps) {
  if (!isOpen) return null

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
        boxShadow: '0 8px 32px #1c1c1c66'
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

