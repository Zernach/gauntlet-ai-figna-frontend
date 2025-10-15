import React from 'react'
import {
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Copy,
    Scissors,
    Clipboard,
    CopyPlus
} from 'lucide-react'

interface ContextMenuProps {
    x: number
    y: number
    onClose: () => void
    onSendToFront: () => void
    onSendToBack: () => void
    onMoveForward: () => void
    onMoveBackward: () => void
    onCopy: () => void
    onCut: () => void
    onPaste: () => void
    onDuplicate: () => void
    hasPasteData: boolean
}

const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    onClose,
    onSendToFront,
    onSendToBack,
    onMoveForward,
    onMoveBackward,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    hasPasteData
}) => {
    const menuRef = React.useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        // Add a small delay to prevent immediate closing from the triggering click
        const timeout = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
        }, 10)

        return () => {
            clearTimeout(timeout)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    // Close on escape
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    const MenuItem: React.FC<{
        icon: React.ReactNode
        label: string
        onClick: () => void
        disabled?: boolean
    }> = ({ icon, label, onClick, disabled }) => {
        return (
            <button
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        onClick()
                        onClose()
                    }
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: disabled ? '#666666' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s ease',
                    textAlign: 'left',
                    opacity: disabled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.backgroundColor = '#2a2a2a'
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px'
                }}>
                    {icon}
                </div>
                <span>{label}</span>
            </button>
        )
    }

    const Divider = () => (
        <div style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            margin: '4px 0'
        }} />
    )

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                left: `${x}px`,
                top: `${y}px`,
                zIndex: 1000,
                backgroundColor: '#1a1a1a',
                border: '1px solid #404040',
                borderRadius: '8px',
                boxShadow: '0 8px 32px #1c1c1c99',
                minWidth: '200px',
                padding: '6px 0',
                backdropFilter: 'blur(10px)',
            }}
        >
            <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '8px 16px 6px',
            }}>
                Layer
            </div>
            <MenuItem
                icon={<ArrowUpToLine size={16} />}
                label="Send to Front"
                onClick={onSendToFront}
            />
            <MenuItem
                icon={<ArrowUp size={16} />}
                label="Move Forward"
                onClick={onMoveForward}
            />
            <MenuItem
                icon={<ArrowDown size={16} />}
                label="Move Backward"
                onClick={onMoveBackward}
            />
            <MenuItem
                icon={<ArrowDownToLine size={16} />}
                label="Send to Back"
                onClick={onSendToBack}
            />

            <Divider />

            <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '8px 16px 6px',
            }}>
                Clipboard
            </div>
            <MenuItem
                icon={<Scissors size={16} />}
                label="Cut"
                onClick={onCut}
            />
            <MenuItem
                icon={<Copy size={16} />}
                label="Copy"
                onClick={onCopy}
            />
            <MenuItem
                icon={<Clipboard size={16} />}
                label="Paste"
                onClick={onPaste}
                disabled={!hasPasteData}
            />
            <MenuItem
                icon={<CopyPlus size={16} />}
                label="Duplicate"
                onClick={onDuplicate}
            />
        </div>
    )
}

export default ContextMenu

