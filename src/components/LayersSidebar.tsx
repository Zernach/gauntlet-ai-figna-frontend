import { useState, useRef, useEffect, useMemo } from 'react'
import { FolderOpen, Edit3, Trash2 } from 'lucide-react'
import type { Shape } from '../types/canvas'
import type { Canvas } from '../hooks/useCanvasManagement'

// Context Menu Item Component
const ContextMenuItem: React.FC<{
    icon: React.ReactNode
    label: string
    onClick: () => void
    disabled?: boolean
}> = ({ icon, label, onClick, disabled }) => {
    const [isHovered, setIsHovered] = useState(false)

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
                height: '16px',
            }}>
                {icon}
            </div>
            <span>{label}</span>
        </button>
    )
}

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

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasId: string; canvasName: string } | null>(null)
    const [renamingCanvasId, setRenamingCanvasId] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState('')

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
        // Don't close if context menu is open or renaming is active
        if (contextMenu || renamingCanvasId) {
            return
        }
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

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(null)
        }
        if (contextMenu) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [contextMenu])

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

    // Handle canvas context menu
    const handleCanvasContextMenu = (e: React.MouseEvent, canvasId: string, canvasName: string) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            canvasId,
            canvasName,
        })
    }

    // Handle rename canvas
    const handleRenameCanvas = (canvasId: string, canvasName: string) => {
        // Find the canvas to check if it's public
        const canvas = canvases.find(c => c.id === canvasId)

        // Prevent renaming of public canvas
        if (canvas?.is_public) {
            alert('The public canvas cannot be renamed')
            setContextMenu(null)
            return
        }

        setRenamingCanvasId(canvasId)
        setRenameValue(canvasName)
        setContextMenu(null)
    }

    const handleRenameSubmit = (canvasId: string) => {
        // TODO: Add onRenameCanvas prop and handler
        // For now, just close the rename input
        console.log('Rename canvas:', canvasId, 'to:', renameValue)
        setRenamingCanvasId(null)
        setRenameValue('')
    }

    // Handle canvas deletion with confirmation
    const handleDeleteCanvas = (canvasId: string, canvasName: string) => {
        // Find the canvas to check if it's public
        const canvas = canvases.find(c => c.id === canvasId)

        // Prevent deletion of public canvas
        if (canvas?.is_public) {
            alert('The public canvas cannot be deleted')
            setContextMenu(null)
            return
        }

        if (canvases.length <= 1) {
            alert('Cannot delete your last canvas.')
            return
        }

        if (confirm(`Delete "${canvasName}"? This cannot be undone.`)) {
            onDeleteCanvas?.(canvasId)
        }
        setContextMenu(null)
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
                    background: '#1a1a1a',
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
                    e.currentTarget.style.background = '#252525'
                    e.currentTarget.style.boxShadow = '4px 0 16px rgba(100, 50, 200, 0.3), 2px 0 12px rgba(0, 0, 0, 0.4)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1a1a1a'
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
                    background: '#1a1a1a',
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
                        background: '#1a1a1a',
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
                                            background: 'linear-gradient(180deg, #06b6d4 0%, #0891b2 100%)',
                                            borderRadius: '2px',
                                            boxShadow: '0 0 8px rgba(6, 182, 212, 0.5)',
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
                                        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
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
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.5)'
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
                                    background: '#1a1a1a',
                                    borderRadius: '8px',
                                    border: '1px solid #404040',
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
                                    const isRenaming = renamingCanvasId === canvas.id

                                    return (
                                        <div key={canvas.id}>
                                            {isRenaming ? (
                                                <div style={{
                                                    padding: '10px 12px',
                                                    marginBottom: '6px',
                                                    background: 'rgba(6, 182, 212, 0.1)',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(6, 182, 212, 0.3)',
                                                }}>
                                                    <input
                                                        type="text"
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && renameValue.trim()) {
                                                                handleRenameSubmit(canvas.id)
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setRenamingCanvasId(null)
                                                                setRenameValue('')
                                                            }
                                                        }}
                                                        autoFocus
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 8px',
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
                                                            onClick={() => handleRenameSubmit(canvas.id)}
                                                            disabled={!renameValue.trim()}
                                                            style={{
                                                                flex: 1,
                                                                padding: '4px',
                                                                background: renameValue.trim() ? '#06b6d4' : '#404040',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                color: '#ffffff',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                cursor: renameValue.trim() ? 'pointer' : 'not-allowed',
                                                            }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setRenamingCanvasId(null)
                                                                setRenameValue('')
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '4px',
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
                                            ) : (
                                                <div
                                                    onClick={() => !isSwitching && onSwitchCanvas?.(canvas.id)}
                                                    onContextMenu={(e) => handleCanvasContextMenu(e, canvas.id, canvas.name)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '10px 12px',
                                                        marginBottom: '6px',
                                                        background: isActive
                                                            ? 'rgba(6, 182, 212, 0.2)'
                                                            : 'transparent',
                                                        border: isActive
                                                            ? '1px solid rgba(6, 182, 212, 0.5)'
                                                            : '1px solid transparent',
                                                        borderRadius: '8px',
                                                        cursor: isSwitching ? 'wait' : 'pointer',
                                                        transition: 'all 0.2s',
                                                        boxShadow: isActive
                                                            ? '0 2px 12px rgba(6, 182, 212, 0.3)'
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
                                                    {!canvas.is_public && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            fontSize: '12px',
                                                            color: '#888',
                                                            marginLeft: '8px',
                                                        }}>
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                            </svg>
                                                            <span>Private</span>
                                                        </div>
                                                    )}
                                                </div>
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
                                background: 'linear-gradient(180deg, #06b6d4 0%, #0891b2 100%)',
                                borderRadius: '2px',
                                boxShadow: '0 0 8px rgba(6, 182, 212, 0.5)',
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
                                                ? 'rgba(132, 204, 22, 0.2)'
                                                : 'transparent',
                                            border: isSelected
                                                ? '1px solid rgba(132, 204, 22, 0.5)'
                                                : '1px solid transparent',
                                            borderRadius: '8px',
                                            cursor: isLocked && shape.locked_by !== currentUserId ? 'not-allowed' : 'grab',
                                            opacity: isBeingDragged ? 0.4 : 1,
                                            transform: isBeingDragged ? 'scale(0.98)' : 'scale(1)',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            boxShadow: isSelected
                                                ? '0 2px 12px rgba(132, 204, 22, 0.3), 0 0 0 1px rgba(132, 204, 22, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                                : 'none',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected && (!isLocked || shape.locked_by === currentUserId)) {
                                                e.currentTarget.style.background = 'rgba(40, 40, 40, 0.8)'
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
                        background: '#1a1a1a',
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

                {/* Copyright */}
                <a
                    href="https://archlife.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'block',
                        padding: '12px 20px',
                        fontSize: '11px',
                        color: '#777',
                        textAlign: 'center',
                        lineHeight: '1.2',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        background: '#1a1a1a',
                        borderTop: '1px solid rgba(64, 64, 64, 0.3)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a2a2a'
                        e.currentTarget.style.color = '#aaa'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a'
                        e.currentTarget.style.color = '#777'
                    }}
                >
                    {new Date().getFullYear()}© Archlife Industries Software
                </a>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px #1c1c1c99',
                        minWidth: '200px',
                        padding: '6px 0',
                        backdropFilter: 'blur(10px)',
                        zIndex: 9999,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Section Header */}
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

                    {/* Open Option */}
                    <ContextMenuItem
                        icon={<FolderOpen size={16} />}
                        label="Open"
                        onClick={() => {
                            if (contextMenu.canvasId !== currentCanvasId && onSwitchCanvas) {
                                onSwitchCanvas(contextMenu.canvasId)
                            }
                            setContextMenu(null)
                        }}
                        disabled={contextMenu.canvasId === currentCanvasId}
                    />

                    {/* Only show rename and delete options for non-public canvases */}
                    {!canvases.find(c => c.id === contextMenu.canvasId)?.is_public && (
                        <>
                            {/* Rename Option */}
                            <ContextMenuItem
                                icon={<Edit3 size={16} />}
                                label="Rename"
                                onClick={() => handleRenameCanvas(contextMenu.canvasId, contextMenu.canvasName)}
                            />

                            {/* Separator */}
                            <div style={{
                                height: '1px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                margin: '4px 0',
                            }} />

                            {/* Delete Option */}
                            <ContextMenuItem
                                icon={<Trash2 size={16} />}
                                label="Delete"
                                onClick={() => handleDeleteCanvas(contextMenu.canvasId, contextMenu.canvasName)}
                                disabled={canvases.length <= 1}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

