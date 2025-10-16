import React from 'react'
import {
    Square,
    Circle,
    Type,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    MousePointer2,
    Lasso
} from 'lucide-react'

interface ControlPanelProps {
    onAddRectangle: () => void
    onAddCircle: () => void
    onAddText: () => void
    onZoomIn: () => void
    onZoomOut: () => void
    onResetView: () => void
    onZoomInHold: () => void
    onZoomOutHold: () => void
    onStopZoomHold: () => void
    stageScale: number
    onToggleCanvasBg: () => void
    lassoMode: boolean
    onToggleLassoMode: () => void
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
    isExpanded = true
}) => {
        const baseStyles: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: isExpanded ? '12px 16px' : '12px 8px',
            border: 'none',
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
                border: '1px solid #404040',
                boxShadow: '0 2px 8px #1c1c1c4d',
            },
            accent: {
                backgroundColor: '#24ccff',
                color: '#1c1c1c',
                boxShadow: '0 2px 8px rgba(36, 204, 255, 0.3)',
            }
        }

        const hoverStyles: React.CSSProperties = {
            transform: 'translateY(-1px)',
            boxShadow: variant === 'primary'
                ? '0 4px 12px rgba(114, 250, 65, 0.4)'
                : variant === 'accent'
                    ? '0 4px 12px rgba(36, 204, 255, 0.4)'
                    : '0 4px 12px #1c1c1c66',
        }

        const [isHovered, setIsHovered] = React.useState(false)

        return (
            <button
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
    onZoomIn,
    onZoomOut,
    onResetView,
    onZoomInHold,
    onZoomOutHold,
    onStopZoomHold,
    stageScale,
    onToggleCanvasBg,
    lassoMode,
    onToggleLassoMode
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false)

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
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
                onMouseLeave={() => setIsExpanded(false)}
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
                    minWidth: isExpanded ? '200px' : 'auto',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                {/* Shape Tools Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        opacity: isExpanded ? 1 : 0,
                        pointerEvents: isExpanded ? 'auto' : 'none',
                        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}>
                        Shapes
                    </div>

                    <ControlButton
                        onClick={onAddRectangle}
                        icon={<Square size={18} />}
                        label="Rectangle"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />

                    <ControlButton
                        onClick={onAddCircle}
                        icon={<Circle size={18} />}
                        label="Circle"
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

                    {/* Canvas background color */}
                    <ControlButton
                        id="canvas-bg-btn"
                        onClick={onToggleCanvasBg}
                        icon={<Square size={18} />}
                        label="Canvas"
                        variant="secondary"
                        isExpanded={isExpanded}
                    />

                    {/* Lasso Mode Toggle */}
                    <ControlButton
                        onClick={onToggleLassoMode}
                        icon={<Lasso size={18} />}
                        label={lassoMode ? "Lasso: ON" : "Lasso: OFF"}
                        variant={lassoMode ? "accent" : "secondary"}
                        isExpanded={isExpanded}
                    />
                </div>

                {/* Divider */}
                <div style={{
                    height: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    margin: '4px 0',
                    opacity: isExpanded ? 1 : 0.5,
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />

                {/* Navigation Tools Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        opacity: isExpanded ? 1 : 0,
                        pointerEvents: isExpanded ? 'auto' : 'none',
                        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}>
                        Navigation
                    </div>

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
                        label="Reset View"
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
        </div>
    )
}

export default ControlPanel
