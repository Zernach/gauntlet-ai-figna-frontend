import React from 'react'
import {
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Copy,
    Scissors,
    Clipboard,
    CopyPlus,
    Trash2,
    Palette,
    Group,
    Ungroup
} from 'lucide-react'
import ColorSlider from './ColorSlider'

interface ContextMenuProps {
    x: number
    y: number
    mode: 'shape' | 'canvas'
    onClose: () => void
    onSendToFront?: () => void
    onSendToBack?: () => void
    onMoveForward?: () => void
    onMoveBackward?: () => void
    onCopy?: () => void
    onCut?: () => void
    onPaste: () => void
    onDuplicate?: () => void
    onDelete?: () => void
    onGroup?: () => void
    onUngroup?: () => void
    hasPasteData: boolean
    canvasBgHex?: string
    onChangeCanvasBg?: (hex: string) => void
    selectedCount?: number
    hasGroupedShapes?: boolean
}

// Move MenuItem outside to prevent recreation on every render
const MenuItem: React.FC<{
    icon: React.ReactNode
    label: string
    onClick: () => void
    disabled?: boolean
}> = React.memo(({ icon, label, onClick, disabled }) => {
    const [isHovered, setIsHovered] = React.useState(false)

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                width: '100%',
                backgroundColor: isHovered && !disabled ? '#2a2a2a' : 'transparent',
                border: 'none',
                color: disabled ? '#666666' : '#ffffff',
                fontSize: '13px',
                fontWeight: '500',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
                textAlign: 'left',
                opacity: disabled ? 0.5 : 1,
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
})

MenuItem.displayName = 'MenuItem'

// Move Divider outside as well
const Divider: React.FC = React.memo(() => (
    <div style={{
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        margin: '4px 0'
    }} />
))

Divider.displayName = 'Divider'

const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    mode,
    onClose,
    onSendToFront,
    onSendToBack,
    onMoveForward,
    onMoveBackward,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onDelete,
    onGroup,
    onUngroup,
    hasPasteData,
    canvasBgHex,
    onChangeCanvasBg,
    selectedCount = 1,
    hasGroupedShapes = false
}) => {
    const menuRef = React.useRef<HTMLDivElement>(null)
    const [showBgColorPicker, setShowBgColorPicker] = React.useState(false)

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

    // Wrap handlers to close menu after action
    const handleAction = React.useCallback((action: () => void) => {
        return () => {
            action()
            onClose()
        }
    }, [onClose])

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
            {mode === 'shape' ? (
                <>
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
                        onClick={handleAction(onSendToFront!)}
                    />
                    <MenuItem
                        icon={<ArrowUp size={16} />}
                        label="Move Forward"
                        onClick={handleAction(onMoveForward!)}
                    />
                    <MenuItem
                        icon={<ArrowDown size={16} />}
                        label="Move Backward"
                        onClick={handleAction(onMoveBackward!)}
                    />
                    <MenuItem
                        icon={<ArrowDownToLine size={16} />}
                        label="Send to Back"
                        onClick={handleAction(onSendToBack!)}
                    />

                    <Divider />

                    {/* Group/Ungroup section */}
                    {(selectedCount >= 2 || hasGroupedShapes) && (
                        <>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#888',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '8px 16px 6px',
                            }}>
                                Group
                            </div>
                            {selectedCount >= 2 && (
                                <MenuItem
                                    icon={<Group size={16} />}
                                    label="Group"
                                    onClick={handleAction(onGroup!)}
                                />
                            )}
                            {hasGroupedShapes && (
                                <MenuItem
                                    icon={<Ungroup size={16} />}
                                    label="Ungroup"
                                    onClick={handleAction(onUngroup!)}
                                />
                            )}
                            <Divider />
                        </>
                    )}

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
                        onClick={handleAction(onCut!)}
                    />
                    <MenuItem
                        icon={<Copy size={16} />}
                        label="Copy"
                        onClick={handleAction(onCopy!)}
                    />
                    <MenuItem
                        icon={<Clipboard size={16} />}
                        label="Paste"
                        onClick={handleAction(onPaste)}
                        disabled={!hasPasteData}
                    />
                    <MenuItem
                        icon={<CopyPlus size={16} />}
                        label="Duplicate"
                        onClick={handleAction(onDuplicate!)}
                    />
                    <MenuItem
                        icon={<Trash2 size={16} />}
                        label="Delete"
                        onClick={handleAction(onDelete!)}
                    />
                </>
            ) : (
                <>
                    {/* Background Color Section - Always visible */}
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        padding: '8px 16px 6px',
                    }}>
                        Canvas
                    </div>
                    <MenuItem
                        icon={<Palette size={16} />}
                        label="Background Color"
                        onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                    />

                    {/* Color Picker - Inline */}
                    {showBgColorPicker && canvasBgHex && onChangeCanvasBg && (
                        <div style={{
                            padding: '12px 16px',
                            backgroundColor: '#222',
                            borderTop: '1px solid #333',
                            borderBottom: '1px solid #333',
                        }}>
                            <ColorSlider
                                valueHex={canvasBgHex}
                                onChangeHex={onChangeCanvasBg}
                                layout="column"
                                allowHexEdit={true}
                            />
                        </div>
                    )}

                    {hasPasteData && (
                        <>
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
                                icon={<Clipboard size={16} />}
                                label="Paste"
                                onClick={handleAction(onPaste)}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default ContextMenu

