import React, { memo } from 'react'
import {
    Square,
    Circle,
    Type,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    MousePointer2,
    Lasso,
    Grid3x3,
    X,
    SquareDashedMousePointer,
    Image as ImageIcon,
    Smile,
    Star
} from 'lucide-react'
import ColorSlider from './ColorSlider'

interface ControlPanelProps {
    onAddRectangle: () => void
    onAddCircle: () => void
    onAddText: () => void
    onAddImage: () => void
    onAddIcon: () => void
    onZoomIn: () => void
    onZoomOut: () => void
    onResetView: () => void
    onZoomInHold: () => void
    onZoomOutHold: () => void
    onStopZoomHold: () => void
    stageScale: number
    canvasBgHex: string
    onCanvasBgChange: (hex: string) => void
    lassoMode: boolean
    onToggleLassoMode: () => void
    rectMode: boolean
    onToggleRectMode: () => void
    onCollapse?: () => void
}

const ControlButton: React.FC<{
    onClick: () => void
    onPointerDown?: () => void
    onPointerUp?: () => void
    onPointerLeave?: () => void
    onPointerCancel?: () => void
    onBlur?: () => void
    icon: React.ReactNode
    label: string
    variant?: 'primary' | 'secondary' | 'accent'
    className?: string
    id?: string
    isExpanded?: boolean
    buttonRef?: React.RefObject<HTMLButtonElement>
}> = ({
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onBlur,
    icon,
    label,
    variant = 'primary',
    className = '',
    id,
    isExpanded = true,
    buttonRef
}) => {
        const baseStyles: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: isExpanded ? '12px 16px' : '12px',
            borderWidth: '0',
            borderStyle: 'solid',
            borderColor: 'transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: isExpanded ? '120px' : '44px',
            width: isExpanded ? 'auto' : '44px',
            height: '44px',
            position: 'relative',
            overflow: 'hidden',
        }

        const variantStyles: Record<string, React.CSSProperties> = {
            primary: {
                backgroundColor: '#72fa41',
                color: '#1c1c1c',
                boxShadow: '0 2px 8px rgba(114, 250, 65, 0.3)',
            },
            secondary: {
                backgroundColor: '#2a2a2a',
                color: '#ffffff',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#404040',
                boxShadow: '0 2px 8px #1c1c1c4d',
            },
            accent: {
                backgroundColor: '#24ccff',
                color: '#1c1c1c',
                boxShadow: '0 2px 8px rgba(36, 204, 255, 0.3)',
            }
        }

        const hoverStyles: React.CSSProperties = {
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: variant === 'primary'
                ? '0 6px 20px rgba(114, 250, 65, 0.5), 0 0 20px rgba(114, 250, 65, 0.2)'
                : variant === 'accent'
                    ? '0 6px 20px rgba(36, 204, 255, 0.5), 0 0 20px rgba(36, 204, 255, 0.2)'
                    : '0 6px 16px rgba(255, 255, 255, 0.15), 0 0 15px rgba(255, 255, 255, 0.05)',
            backgroundColor: variant === 'primary'
                ? '#8cff5e'
                : variant === 'accent'
                    ? '#3dd9ff'
                    : '#353535',
            borderColor: variant === 'secondary' ? '#505050' : undefined,
        }

        const [isHovered, setIsHovered] = React.useState(false)

        return (
            <button
                ref={buttonRef}
                id={id}
                onClick={onClick}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerLeave={() => {
                    setIsHovered(false)
                    onPointerLeave?.()
                }}
                onPointerCancel={() => {
                    setIsHovered(false)
                    onPointerCancel?.()
                }}
                onBlur={onBlur}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    ...baseStyles,
                    ...variantStyles[variant],
                    ...(isHovered ? hoverStyles : {}),
                }}
                className={className}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    flexShrink: 0
                }}>
                    {icon}
                </div>
                <span style={{
                    display: isExpanded ? 'inline' : 'none',
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    whiteSpace: 'nowrap'
                }}>{label}</span>
            </button>
        )
    }

const ControlPanel: React.FC<ControlPanelProps> = ({
    onAddRectangle,
    onAddCircle,
    onAddText,
    onAddImage,
    onAddIcon,
    onZoomIn,
    onZoomOut,
    onResetView,
    onZoomInHold,
    onZoomOutHold,
    onStopZoomHold,
    stageScale,
    canvasBgHex,
    onCanvasBgChange,
    lassoMode,
    onToggleLassoMode,
    rectMode,
    onToggleRectMode,
    onCollapse
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [showCanvasColorSlider, setShowCanvasColorSlider] = React.useState(false)
    const [shapeMenuPosition, setShapeMenuPosition] = React.useState<{ x: number; y: number } | null>(null)
    const shapeButtonRef = React.useRef<HTMLButtonElement>(null)

    // Dismiss color slider when control panel collapses
    React.useEffect(() => {
        if (!isExpanded) {
            setShowCanvasColorSlider(false)
        }
    }, [isExpanded])

    const handleShapeButtonClick = React.useCallback(() => {
        if (shapeButtonRef.current) {
            const rect = shapeButtonRef.current.getBoundingClientRect()
            setShapeMenuPosition({
                x: rect.right + 10,
                y: rect.top
            })
        }
    }, [])

    return (
        <div style={{
            position: 'absolute',
            top: '112px',
            left: '20px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            {/* Main Control Panel */}
            <div
                id="main-control-panel"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => {
                    setIsExpanded(false)
                    onCollapse?.()
                }}
                style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px #1c1c1c66',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    width: 'fit-content',
                    minWidth: isExpanded ? '200px' : 'auto',
                    maxWidth: isExpanded ? 'auto' : '76px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                {/* Shape Tools Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <ControlButton
                        buttonRef={shapeButtonRef}
                        id="shape-btn"
                        onClick={handleShapeButtonClick}
                        icon={<Star size={18} />}
                        label="Shape"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />

                    <ControlButton
                        onClick={onAddText}
                        icon={<Type size={18} />}
                        label="Text"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />

                    <ControlButton
                        onClick={onAddImage}
                        icon={<ImageIcon size={18} />}
                        label="Image"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />

                    <ControlButton
                        onClick={onAddIcon}
                        icon={<Smile size={18} />}
                        label="Icon"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />

                    {/* Canvas background color */}
                    {!showCanvasColorSlider ? (
                        <ControlButton
                            id="canvas-bg-btn"
                            onClick={() => setShowCanvasColorSlider(true)}
                            icon={<Grid3x3 size={18} />}
                            label="Canvas"
                            variant="secondary"
                            isExpanded={isExpanded}
                        />
                    ) : (
                        <div style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px'
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#888',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Background
                                </div>
                                <button
                                    onClick={() => setShowCanvasColorSlider(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '20px',
                                        height: '20px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        color: '#888',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#2a2a2a'
                                        e.currentTarget.style.color = '#fff'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.color = '#888'
                                    }}
                                    title="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <ColorSlider
                                valueHex={canvasBgHex}
                                onChangeHex={onCanvasBgChange}
                                allowHexEdit={true}
                                layout="column"
                            />
                        </div>
                    )}

                    {/* Lasso Mode Toggle */}
                    <ControlButton
                        onClick={onToggleLassoMode}
                        icon={<Lasso size={18} />}
                        label={lassoMode ? "Lasso: ON" : "Lasso: OFF"}
                        variant={lassoMode ? "accent" : "secondary"}
                        isExpanded={isExpanded}
                    />

                    {/* Rectangle Selection Mode Toggle */}
                    <ControlButton
                        onClick={onToggleRectMode}
                        icon={<SquareDashedMousePointer size={18} />}
                        label={rectMode ? "Rect: ON" : "Rect: OFF"}
                        variant={rectMode ? "accent" : "secondary"}
                        isExpanded={isExpanded}
                    />
                </div>

                {/* Divider */}
                <div style={{
                    height: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    margin: '4px 0',
                    opacity: isExpanded ? 1 : 0.5,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />

                {/* Navigation Tools Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <ControlButton
                        onClick={onZoomIn}
                        onPointerDown={onZoomInHold}
                        onPointerUp={onStopZoomHold}
                        onPointerLeave={onStopZoomHold}
                        onPointerCancel={onStopZoomHold}
                        onBlur={onStopZoomHold}
                        icon={<ZoomIn size={18} />}
                        label="Zoom In"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />

                    <ControlButton
                        onClick={onZoomOut}
                        onPointerDown={onZoomOutHold}
                        onPointerUp={onStopZoomHold}
                        onPointerLeave={onStopZoomHold}
                        onPointerCancel={onStopZoomHold}
                        onBlur={onStopZoomHold}
                        icon={<ZoomOut size={18} />}
                        label="Zoom Out"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />

                    <ControlButton
                        onClick={onResetView}
                        icon={<RotateCcw size={18} />}
                        label="Re-center"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />
                </div>
            </div>

            {/* Zoom Indicator */}
            <div style={{
                backgroundColor: 'rgba(26, 26, 26, 0.9)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 4px 16px #1c1c1c4d',
                width: 'fit-content',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}>
                <MousePointer2 size={16} />
                <span>{Math.round(stageScale * 100)}%</span>
            </div>

            {/* Shape Menu - rendered inline like ContextMenu */}
            {shapeMenuPosition && (
                <ShapeMenu
                    x={shapeMenuPosition.x}
                    y={shapeMenuPosition.y}
                    onClose={() => setShapeMenuPosition(null)}
                    onAddRectangle={onAddRectangle}
                    onAddCircle={onAddCircle}
                />
            )}
        </div>
    )
}

// ShapeMenu MenuItem component - matches ContextMenu pattern
const ShapeMenuItem: React.FC<{
    icon: React.ReactNode
    label: string
    onClick: () => void
}> = memo(({ icon, label, onClick }) => {
    const [isHovered, setIsHovered] = React.useState(false)

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                width: '100%',
                backgroundColor: isHovered ? '#2a2a2a' : 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                textAlign: 'left',
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

ShapeMenuItem.displayName = 'ShapeMenuItem'

// ShapeMenu component - matches ContextMenu pattern exactly
const ShapeMenu: React.FC<{
    x: number
    y: number
    onClose: () => void
    onAddRectangle: () => void
    onAddCircle: () => void
}> = memo(({ x, y, onClose, onAddRectangle, onAddCircle }) => {
    const menuRef = React.useRef<HTMLDivElement>(null)

    // Close menu when clicking outside - matches ContextMenu
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

    // Close on escape - matches ContextMenu
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    // Wrap handlers to close menu after action - matches ContextMenu pattern
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
                minWidth: '180px',
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
                Shapes
            </div>
            <ShapeMenuItem
                icon={<Square size={16} />}
                label="Rectangle"
                onClick={handleAction(onAddRectangle)}
            />
            <ShapeMenuItem
                icon={<Circle size={16} />}
                label="Circle"
                onClick={handleAction(onAddCircle)}
            />
        </div>
    )
})

// Memoize to prevent unnecessary re-renders
export default memo(ControlPanel)
