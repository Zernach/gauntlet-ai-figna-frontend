import { useRef, useEffect } from 'react'
import { Shape } from '../types/canvas'

interface MinimapProps {
    shapes: Shape[]
    canvasWidth: number
    canvasHeight: number
    viewportX: number // current viewport position in canvas coords
    viewportY: number
    viewportWidth: number // current viewport dimensions in canvas coords
    viewportHeight: number
    stageScale: number
    onNavigate?: (canvasX: number, canvasY: number) => void
}

const MINIMAP_SIZE = 200 // px
const MINIMAP_PADDING = 10 // px from edges

export default function Minimap({
    shapes,
    canvasWidth,
    canvasHeight,
    viewportX,
    viewportY,
    viewportWidth,
    viewportHeight,
    stageScale,
    onNavigate,
}: MinimapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

        // Set background
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

        // Calculate scale factor (canvas coords to minimap pixels)
        const scaleX = MINIMAP_SIZE / canvasWidth
        const scaleY = MINIMAP_SIZE / canvasHeight

        // Draw all shapes
        shapes.forEach((shape) => {
            const minimapX = shape.x * scaleX
            const minimapY = shape.y * scaleY

            ctx.globalAlpha = shape.opacity ?? 1
            ctx.fillStyle = shape.color

            if (shape.type === 'circle') {
                const radius = (shape.radius || 50) * scaleX
                ctx.beginPath()
                ctx.arc(minimapX, minimapY, Math.max(1, radius), 0, Math.PI * 2)
                ctx.fill()
            } else if (shape.type === 'text') {
                // Render text as a small rectangle
                const width = 40 * scaleX // approximate text width
                const height = 20 * scaleY // approximate text height
                ctx.fillRect(minimapX, minimapY, Math.max(2, width), Math.max(2, height))
            } else {
                // Rectangle or default
                const width = (shape.width || 100) * scaleX
                const height = (shape.height || 100) * scaleY
                ctx.fillRect(minimapX, minimapY, Math.max(2, width), Math.max(2, height))
            }
        })

        // Reset alpha
        ctx.globalAlpha = 1

        // Draw viewport indicator
        const vpX = viewportX * scaleX
        const vpY = viewportY * scaleY
        const vpW = viewportWidth * scaleX
        const vpH = viewportHeight * scaleY

        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.strokeRect(vpX, vpY, vpW, vpH)

        // Optional: Fill viewport with semi-transparent overlay
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
        ctx.fillRect(vpX, vpY, vpW, vpH)

        // Draw border around minimap
        ctx.strokeStyle = '#4a4a4a'
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)
    }, [shapes, canvasWidth, canvasHeight, viewportX, viewportY, viewportWidth, viewportHeight, stageScale])

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onNavigate) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top

        // Convert minimap coordinates back to canvas coordinates
        const canvasX = (clickX / MINIMAP_SIZE) * canvasWidth
        const canvasY = (clickY / MINIMAP_SIZE) * canvasHeight

        onNavigate(canvasX, canvasY)
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: `${MINIMAP_PADDING}px`,
                bottom: `${MINIMAP_PADDING}px`,
                zIndex: 10,
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                border: '1px solid #333',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#a0a0a0',
                }}
            >
                <span>Minimap</span>
                <span style={{ fontSize: '10px', color: '#666' }}>({shapes.length}) shapes</span>
            </div>
            <canvas
                ref={canvasRef}
                width={MINIMAP_SIZE}
                height={MINIMAP_SIZE}
                onClick={handleClick}
                style={{
                    display: 'block',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
            />
        </div>
    )
}

