import { useState, useRef, useEffect, useMemo } from 'react'
import type { Shape } from '../types/canvas'
import type { Canvas } from '../hooks/useCanvasManagement'

interface LayersSidebarProps {
    shapes: Shape[]
    selectedIds: string[]
    onReorderLayers: (reorderedShapeIds: string[]) => void
    onSelectShape: (shapeId: string) => void
    currentUserId: string | null
    getUserColor: (userId: string) => string
    // Canvas management props
    canvases?: Canvas[]
    currentCanvasId?: string | null
    onSwitchCanvas?: (canvasId: string) => void
    onCreateCanvas?: (name: string) => void
    onDeleteCanvas?: (canvasId: string) => void
    isSwitching?: boolean
    isCreating?: boolean
}

export default function LayersSidebar({
    shapes,
    selectedIds,
    onReorderLayers,
    onSelectShape,
    currentUserId,
    getUserColor,
    canvases = [],
    currentCanvasId = null,
    onSwitchCanvas,
    onCreateCanvas,
    onDeleteCanvas,
    isSwitching = false,
    isCreating = false,
}: LayersSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
    const [optimisticOrder, setOptimisticOrder] = useState<Shape[] | null>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Canvas creation state
    const [isCreatingCanvas, setIsCreatingCanvas] = useState(false)
    const [newCanvasName, setNewCanvasName] = useState('')

    // Sort shapes by z-index (highest to lowest = top to bottom in UI)
    const sortedShapes = useMemo(() => {
        // Use optimistic order during drag, otherwise sort by z-index
        if (optimisticOrder) return optimisticOrder

        return [...shapes].sort((a, b) => {
            const aZ = a.z_index ?? a.zIndex ?? 0
            const bZ = b.z_index ?? b.zIndex ?? 0
            return bZ - aZ // Descending order
        })
    }, [shapes, optimisticOrder])

    // Handle mouse enter/leave for hover behavior
    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        setIsOpen(true)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false)
        }, 300) // Small delay before closing
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // Drag and drop handlers with optimistic updates
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index)
        e.dataTransfer.effectAllowed = 'move'
        // Set a transparent drag image to avoid default browser drag preview
        const img = new Image()
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        e.dataTransfer.setDragImage(img, 0, 0)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return

        // Update optimistic order in real-time
        const newOrder = [...sortedShapes]
        const [removed] = newOrder.splice(draggedIndex, 1)
        newOrder.splice(index, 0, removed)

        setOptimisticOrder(newOrder)
        setDragOverIndex(index)
        setDraggedIndex(index) // Update dragged index to new position
    }

    const handleDragEnd = () => {
        if (optimisticOrder) {
            // Convert to shape IDs and send to parent
            const reorderedIds = optimisticOrder.map(s => s.id)
            onReorderLayers(reorderedIds)
        }

        // Reset drag state
        setDraggedIndex(null)
        setDragOverIndex(null)
        // Clear optimistic order after a brief delay to allow smooth transition
        setTimeout(() => setOptimisticOrder(null), 100)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        handleDragEnd()
    }

    // Get shape display name
    const getShapeDisplayName = (shape: Shape): string => {
        if (shape.type === 'text') {
            const text = shape.text_content || shape.textContent || 'Text'
            return text.length > 20 ? text.substring(0, 20) + '...' : text
        }
        return shape.type.charAt(0).toUpperCase() + shape.type.slice(1)
    }

    // Get shape icon
    const getShapeIcon = (shape: Shape): string => {
        switch (shape.type) {
            case 'rectangle': return '▭'
            case 'circle': return '●'
            case 'text': return 'T'
            default: return '◼'
        }
    }

    // Handle canvas creation
    const handleCreateCanvas = () => {
        if (newCanvasName.trim() && onCreateCanvas) {
            onCreateCanvas(newCanvasName.trim())
            setNewCanvasName('')
            setIsCreatingCanvas(false)
        }
    }

    // Handle canvas deletion with confirmation
    const handleDeleteCanvas = (canvasId: string, canvasName: string) => {
        if (canvases.length <= 1) {
            alert('Cannot delete your last canvas.')
            return
        }

        if (confirm(`Delete "${canvasName}"? This cannot be undone.`)) {
            onDeleteCanvas?.(canvasId)
        }
    }

    return (
        <div
            ref={sidebarRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                height: '100vh',
                zIndex: 1100,
                pointerEvents: 'all',
            }}
        >
            {/* Tab that's always visible */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: '16px',
                    width: '28px',
                    height: '88px',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                    border: '1px solid #404040',
                    borderLeft: 'none',
                    borderTopRightRadius: '12px',
                    borderBottomRightRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isOpen
                        ? '4px 0 16px rgba(100, 50, 200, 0.2), 2px 0 8px rgba(0, 0, 0, 0.4)'
                        : '2px 0 8px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #252525 0%, #2a2a2a 100%)'
                    e.currentTarget.style.boxShadow = '4px 0 16px rgba(100, 50, 200, 0.3), 2px 0 12px rgba(0, 0, 0, 0.4)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)'
                    e.currentTarget.style.boxShadow = isOpen
                        ? '4px 0 16px rgba(100, 50, 200, 0.2), 2px 0 8px rgba(0, 0, 0, 0.4)'
                        : '2px 0 8px rgba(0, 0, 0, 0.3)'
                }}
            >
                <div
                    style={{
                        color: isOpen ? '#a0f0ff' : '#b0b0b0',
                        fontSize: '20px',
                        fontWeight: 600,
                        transform: 'rotate(-90deg)',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        transition: 'color 0.3s ease',
                    }}
                >
                    ☰
                </div>
            </div>

            {/* Sidebar panel that slides out */}
            <div
                style={{
                    position: 'absolute',
                    left: isOpen ? 0 : '-300px',
                    top: 0,
                    width: '300px',
                    height: '100vh',
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    borderRight: '1px solid rgba(100, 50, 200, 0.15)',
                    transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isOpen ? '8px 0 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(100, 50, 200, 0.1)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(10px)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '24px 20px 20px',
                        borderBottom: '1px solid rgba(64, 64, 64, 0.5)',
                        background: 'linear-gradient(180deg, rgba(100, 50, 200, 0.08) 0%, rgba(50, 100, 255, 0.04) 50%, transparent 100%)',
                    }}
                >
                    {/* Figna Title */}
                    <h1
                        style={{
                            margin: '0 0 24px 0',
                            fontSize: '32px',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            background: 'linear-gradient(90deg, #72fa41, #24ccff)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Figna 🎨
                    </h1>

                    {/* Canvases Section */}
                    {canvases.length > 0 && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                        style={{
                                            width: '4px',
                                            height: '20px',
                                            background: 'linear-gradient(180deg, #ff6b35 0%, #f7931e 100%)',
                                            borderRadius: '2px',
                                            boxShadow: '0 0 8px rgba(255, 107, 53, 0.5)',
                                        }}
                                    />
                                    <h3
                                        style={{
                                            margin: 0,
                                            color: '#ffffff',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        Canvases
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsCreatingCanvas(true)}
                                    disabled={isCreating}
                                    style={{
                                        background: 'linear-gradient(135deg, #6432c8 0%, #3264ff 100%)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        color: '#ffffff',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: isCreating ? 'not-allowed' : 'pointer',
                                        opacity: isCreating ? 0.6 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isCreating) {
                                            e.currentTarget.style.transform = 'scale(1.05)'
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 50, 200, 0.4)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    {isCreating ? 'Creating...' : '+ New'}
                                </button>
                            </div>

                            {/* Canvas Creation Input */}
                            {isCreatingCanvas && (
                                <div style={{
                                    marginBottom: '12px',
                                    padding: '12px',
                                    background: 'rgba(100, 50, 200, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(100, 50, 200, 0.3)',
                                }}>
                                    <input
                                        type="text"
                                        value={newCanvasName}
                                        onChange={(e) => setNewCanvasName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateCanvas()
                                            if (e.key === 'Escape') {
                                                setIsCreatingCanvas(false)
                                                setNewCanvasName('')
                                            }
                                        }}
                                        placeholder="Canvas name..."
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            background: '#2a2a2a',
                                            border: '1px solid #404040',
                                            borderRadius: '4px',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleCreateCanvas}
                                            disabled={!newCanvasName.trim()}
                                            style={{
                                                flex: 1,
                                                padding: '6px',
                                                background: newCanvasName.trim() ? '#6432c8' : '#404040',
                                                border: 'none',
                                                borderRadius: '4px',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: newCanvasName.trim() ? 'pointer' : 'not-allowed',
                                            }}
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsCreatingCanvas(false)
                                                setNewCanvasName('')
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '6px',
                                                background: '#404040',
                                                border: 'none',
                                                borderRadius: '4px',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Canvas List */}
                            <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                                {canvases.map((canvas) => {
                                    const isActive = canvas.id === currentCanvasId
                                    return (
                                        <div
                                            key={canvas.id}
                                            onClick={() => !isSwitching && onSwitchCanvas?.(canvas.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 12px',
                                                marginBottom: '6px',
                                                background: isActive
                                                    ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(247, 147, 30, 0.1) 100%)'
                                                    : 'transparent',
                                                border: isActive
                                                    ? '1px solid rgba(255, 107, 53, 0.4)'
                                                    : '1px solid transparent',
                                                borderRadius: '8px',
                                                cursor: isSwitching ? 'wait' : 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: isActive
                                                    ? '0 2px 12px rgba(255, 107, 53, 0.2)'
                                                    : 'none',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isActive && !isSwitching) {
                                                    e.currentTarget.style.background = 'rgba(40, 40, 40, 0.8)'
                                                    e.currentTarget.style.borderColor = 'rgba(64, 64, 64, 0.5)'
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isActive) {
                                                    e.currentTarget.style.background = 'transparent'
                                                    e.currentTarget.style.borderColor = 'transparent'
                                                }
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    color: '#ffffff',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {canvas.name}
                                                    {isActive && ' ✓'}
                                                </div>
                                            </div>
                                            {!isActive && canvases.length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteCanvas(canvas.id, canvas.name)
                                                    }}
                                                    style={{
                                                        background: 'rgba(255, 68, 68, 0.2)',
                                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                                        borderRadius: '4px',
                                                        padding: '4px 8px',
                                                        color: '#ff4444',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 68, 68, 0.3)'
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Separator */}
                            <div style={{
                                height: '1px',
                                background: 'linear-gradient(90deg, transparent 0%, rgba(100, 50, 200, 0.3) 50%, transparent 100%)',
                                marginBottom: '20px',
                            }} />
                        </>
                    )}

                    {/* Layers Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div
                            style={{
                                width: '4px',
                                height: '20px',
                                background: 'linear-gradient(180deg, #6432c8 0%, #3264ff 100%)',
                                borderRadius: '2px',
                                boxShadow: '0 0 8px rgba(100, 50, 200, 0.5)',
                            }}
                        />
                        <h3
                            style={{
                                margin: 0,
                                color: '#ffffff',
                                fontSize: '16px',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                            }}
                        >
                            Layers
                        </h3>
                    </div>
                    <p
                        style={{
                            margin: '0 0 0 14px',
                            color: '#808080',
                            fontSize: '12px',
                            fontWeight: 500,
                        }}
                    >
                        {shapes.length} {shapes.length === 1 ? 'layer' : 'layers'}
                    </p>
                </div>

                {/* Layers list */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        padding: '8px',
                    }}
                >
                    {sortedShapes.length === 0 ? (
                        <div
                            style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: '#808080',
                                fontSize: '14px',
                            }}
                        >
                            No layers yet.
                            <br />
                            Add shapes to see them here.
                        </div>
                    ) : (
                        sortedShapes.map((shape, index) => {
                            const isSelected = selectedIds.includes(shape.id)
                            const isLocked = !!shape.locked_at && !!shape.locked_by
                            const lockColor = isLocked && shape.locked_by ? getUserColor(shape.locked_by) : undefined
                            const isBeingDragged = draggedIndex === index
                            const isDragTarget = dragOverIndex === index

                            return (
                                <div
                                    key={shape.id}
                                    style={{
                                        position: 'relative',
                                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: isDragTarget ? 'translateY(4px)' : 'translateY(0)',
                                    }}
                                >
                                    {/* Drop indicator - shown above the target */}
                                    {isDragTarget && draggedIndex !== null && draggedIndex !== index && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: -4,
                                                left: 12,
                                                right: 12,
                                                height: '3px',
                                                background: 'linear-gradient(90deg, transparent 0%, #6432c8 20%, #3264ff 50%, #c8a0ff 80%, transparent 100%)',
                                                borderRadius: '2px',
                                                zIndex: 10,
                                                boxShadow: '0 0 12px rgba(100, 50, 200, 0.8), 0 0 6px rgba(50, 100, 255, 0.6)',
                                                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                            }}
                                        />
                                    )}

                                    <div
                                        draggable={!isLocked || shape.locked_by === currentUserId}
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDrop={handleDrop}
                                        onClick={() => onSelectShape(shape.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '12px 14px',
                                            marginBottom: '6px',
                                            background: isSelected
                                                ? 'linear-gradient(135deg, rgba(100, 50, 200, 0.15) 0%, rgba(50, 100, 255, 0.1) 100%)'
                                                : 'transparent',
                                            border: isSelected
                                                ? '1px solid rgba(100, 50, 200, 0.4)'
                                                : '1px solid transparent',
                                            borderRadius: '8px',
                                            cursor: isLocked && shape.locked_by !== currentUserId ? 'not-allowed' : 'grab',
                                            opacity: isBeingDragged ? 0.4 : 1,
                                            transform: isBeingDragged ? 'scale(0.98)' : 'scale(1)',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            boxShadow: isSelected
                                                ? '0 2px 12px rgba(100, 50, 200, 0.3), 0 0 0 1px rgba(100, 50, 200, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                                : 'none',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected && (!isLocked || shape.locked_by === currentUserId)) {
                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(40, 40, 40, 0.8) 0%, rgba(30, 30, 30, 0.6) 100%)'
                                                e.currentTarget.style.borderColor = 'rgba(64, 64, 64, 0.5)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.borderColor = 'transparent'
                                            }
                                        }}
                                    >
                                        {/* Drag handle indicator */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '3px',
                                                opacity: 0.4,
                                                transition: 'opacity 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '0.8'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '0.4'
                                            }}
                                        >
                                            <div style={{ width: '12px', height: '2px', background: '#666', borderRadius: '1px' }} />
                                            <div style={{ width: '12px', height: '2px', background: '#666', borderRadius: '1px' }} />
                                            <div style={{ width: '12px', height: '2px', background: '#666', borderRadius: '1px' }} />
                                        </div>

                                        {/* Shape icon */}
                                        <div
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: `linear-gradient(135deg, ${shape.color} 0%, ${shape.color}dd 100%)`,
                                                borderRadius: shape.type === 'circle' ? '50%' : '6px',
                                                fontSize: '16px',
                                                fontWeight: 700,
                                                color: '#ffffff',
                                                flexShrink: 0,
                                                boxShadow: `0 2px 8px ${shape.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                            }}
                                        >
                                            {getShapeIcon(shape)}
                                        </div>

                                        {/* Shape info */}
                                        <div
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: '#ffffff',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    letterSpacing: '0.2px',
                                                }}
                                            >
                                                {getShapeDisplayName(shape)}
                                            </div>
                                            <div
                                                style={{
                                                    color: '#808080',
                                                    fontSize: '11px',
                                                    marginTop: '3px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {shape.type} • z:{shape.z_index ?? shape.zIndex ?? 0}
                                            </div>
                                        </div>

                                        {/* Lock indicator */}
                                        {isLocked && (
                                            <div
                                                style={{
                                                    fontSize: '16px',
                                                    color: lockColor || '#ff4444',
                                                    flexShrink: 0,
                                                    filter: 'drop-shadow(0 0 4px currentColor)',
                                                }}
                                                title={shape.locked_by === currentUserId ? 'Locked by you' : 'Locked by another user'}
                                            >
                                                🔒
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer with tip */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderTop: '1px solid rgba(64, 64, 64, 0.5)',
                        background: 'linear-gradient(180deg, transparent 0%, rgba(100, 50, 200, 0.04) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '14px',
                            filter: 'drop-shadow(0 0 4px rgba(100, 50, 200, 0.5))',
                        }}
                    >
                        💡
                    </div>
                    <div
                        style={{
                            fontSize: '12px',
                            color: '#999',
                            fontWeight: 500,
                        }}
                    >
                        Drag layers to reorder
                    </div>
                </div>
            </div>
        </div>
    )
}

