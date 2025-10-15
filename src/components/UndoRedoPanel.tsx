import React from 'react'

interface UndoRedoPanelProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

const buttonBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #404040',
  backgroundColor: '#2a2a2a',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
}

const buttonDisabled: React.CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
}

const UndoRedoPanel: React.FC<UndoRedoPanelProps> = ({ canUndo, canRedo, onUndo, onRedo }) => {
  return (
    <div style={{
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '8px',
      boxShadow: '0 8px 32px #1c1c1c66'
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title={canUndo ? 'Undo (⌘Z / Ctrl+Z)' : 'Nothing to undo'}
          style={{ ...buttonBase, ...(canUndo ? {} : buttonDisabled) }}
        >
          ⟲ Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title={canRedo ? 'Redo (⇧⌘Z / Ctrl+Y)' : 'Nothing to redo'}
          style={{ ...buttonBase, ...(canRedo ? {} : buttonDisabled) }}
        >
          ⟳ Redo
        </button>
      </div>
    </div>
  )
}

export default UndoRedoPanel


