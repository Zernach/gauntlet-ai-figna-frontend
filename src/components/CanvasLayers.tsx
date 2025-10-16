import { memo } from 'react'
import { Layer, Rect, Text as KonvaText, Circle as KonvaCircle } from 'react-konva'
import CanvasShape from './CanvasShape'
import CanvasCursor from './CanvasCursor'
import type { Shape, Cursor } from '../types/canvas'

export interface ShapeRenderProps {
  shape: Shape
  strokeColor: string
  strokeWidth: number
  isPressable: boolean
  isDraggable: boolean
  remainingSeconds: number | null
}

interface CanvasLayersProps {
  canvasWidth: number
  canvasHeight: number
  canvasBgHex: string
  shapeRenderProps: ShapeRenderProps[]
  selectedIds: string[]
  stageScale: number
  cursorsArray: Cursor[]
  isDrawingLasso: boolean
  lassoStart: { x: number; y: number } | null
  lassoEnd: { x: number; y: number } | null
  activeUsers: any[]
  currentUserId: string | null
  onShapeClick: (id: string) => void
  onDragStart: (shapeId: string) => void
  onDragMove: (shapeId: string, x: number, y: number) => void
  onDragEnd: (shapeId: string) => void
  onResizeStart: (id: string) => void
  onResizeMove: (id: string, updates: any) => void
  onResizeEnd: (id: string, updates: any) => void
  onRotateStart: (id: string) => void
  onRotateMove: (id: string, rotation: number) => void
  onRotateEnd: (id: string, rotation: number) => void
  onTextDoubleClick: (id: string, currentText: string) => void
  onContextMenu: (e: any, shapeId: string) => void
  onCanvasContextMenu: (e: any) => void
  getUserColor: (userId: string) => string
}

function CanvasLayers({
  canvasWidth,
  canvasHeight,
  canvasBgHex,
  shapeRenderProps,
  selectedIds,
  stageScale,
  cursorsArray,
  isDrawingLasso,
  lassoStart,
  lassoEnd,
  activeUsers,
  currentUserId,
  onShapeClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onRotateStart,
  onRotateMove,
  onRotateEnd,
  onTextDoubleClick,
  onContextMenu,
  onCanvasContextMenu,
  getUserColor,
}: CanvasLayersProps) {
  return (
    <>
      {/* Background Layer - listens for canvas context menu */}
      <Layer>
        {/* Canvas Background */}
        <Rect
          id="canvas-background"
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill={canvasBgHex}
          onContextMenu={onCanvasContextMenu}
        />

        {/* Canvas Border */}
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          stroke="#404040"
          strokeWidth={2}
          listening={false}
        />
      </Layer>

      {/* Shapes Layer - separate layer prevents re-renders of other elements */}
      <Layer>
        {shapeRenderProps.map(props => (
          <CanvasShape
            key={props.shape.id}
            shape={props.shape}
            strokeColor={props.strokeColor}
            strokeWidth={props.strokeWidth}
            isPressable={props.isPressable}
            isDraggable={props.isDraggable}
            isSelected={selectedIds.includes(props.shape.id)}
            canResize={props.isDraggable}
            remainingSeconds={props.remainingSeconds}
            stageScale={stageScale}
            onShapeClick={onShapeClick}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onResizeStart={onResizeStart}
            onResizeMove={onResizeMove}
            onResizeEnd={onResizeEnd}
            onRotateStart={onRotateStart}
            onRotateMove={onRotateMove}
            onRotateEnd={onRotateEnd}
            onTextDoubleClick={onTextDoubleClick}
            onContextMenu={onContextMenu}
          />
        ))}

        {/* Last Edited Labels - show for recently edited shapes */}
        {shapeRenderProps.map(props => {
          const shape = props.shape
          const lastModifiedAt = shape.last_modified_at
          const lastModifiedBy = shape.last_modified_by

          // Only show for shapes edited in the last 3 seconds
          if (!lastModifiedAt || !lastModifiedBy || Date.now() - lastModifiedAt > 3000) {
            return null
          }

          // Don't show for shapes edited by current user
          if (lastModifiedBy === currentUserId) {
            return null
          }

          const user = activeUsers.find(u => u.userId === lastModifiedBy)
          const userName = user?.email?.split('@')[0] || user?.username || 'Unknown'
          const userColor = getUserColor(lastModifiedBy)

          // Position label above shape
          const labelY = shape.type === 'circle'
            ? shape.y - (shape.radius || 50) - 20 / stageScale
            : shape.y - 20 / stageScale

          return (
            <KonvaText
              key={`label-${shape.id}`}
              x={shape.x}
              y={labelY}
              text={`edited by ${userName}`}
              fontSize={12 / stageScale}
              fill={userColor}
              opacity={Math.max(0, 1 - (Date.now() - lastModifiedAt) / 3000)}
              listening={false}
            />
          )
        })}
      </Layer>

      {/* Cursors Layer - separate layer prevents re-renders when cursors move */}
      <Layer listening={false}>
        {cursorsArray.map(cursor => (
          <CanvasCursor key={cursor.userId} cursor={cursor} />
        ))}
      </Layer>

      {/* Lasso Layer - visualization for lasso selection */}
      {isDrawingLasso && lassoStart && lassoEnd && (
        <Layer listening={false}>
          <KonvaCircle
            x={lassoStart.x}
            y={lassoStart.y}
            radius={Math.sqrt((lassoEnd.x - lassoStart.x) ** 2 + (lassoEnd.y - lassoStart.y) ** 2)}
            stroke="#24ccff"
            strokeWidth={2 / stageScale}
            dash={[10 / stageScale, 5 / stageScale]}
            listening={false}
          />
          <KonvaCircle
            x={lassoStart.x}
            y={lassoStart.y}
            radius={5 / stageScale}
            fill="#24ccff"
            listening={false}
          />
        </Layer>
      )}
    </>
  )
}

// Memoize to prevent unnecessary re-renders when cursors or other props change
export default memo(CanvasLayers)

