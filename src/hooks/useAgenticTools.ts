import { useEffect } from 'react'
import type { Shape } from '../types/canvas'
import Konva from 'konva'
import { arrangeInRow, arrangeInColumn, arrangeInGrid, alignHorizontally, alignVertically } from '../utils/layoutUtils'
import { PATTERN_REGISTRY } from '../utils/patternTemplates'
import { secureRequest } from '../lib/secureApi'
import type { GenerateComplexDesignParams, GenerateComplexDesignResult, GenerateDesignVariationParams, GenerateDesignVariationResult } from './useAgenticToolCalling'

interface UseAgenticToolsParams {
  onToolsReady?: (tools: any) => void
  currentUserId: string | null
  canvasId: string | null
  wsRef: React.MutableRefObject<WebSocket | null>
  stageRef: React.RefObject<Konva.Stage>
  shapesRef: React.MutableRefObject<Shape[]>
  selectedIdsRef: React.MutableRefObject<string[]>
  createShapesRef: React.MutableRefObject<((shapesData: any[]) => void) | null>
  handleDeleteShapesRef: React.MutableRefObject<((shapeIds: string[]) => void) | null>
  unlockShapesRef: React.MutableRefObject<((shapeIds: string[]) => void) | null>
  sendMessage: (message: any) => void
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  viewportWidth: number
  viewportHeight: number
}

export function useAgenticTools({
  onToolsReady,
  currentUserId,
  canvasId,
  wsRef,
  stageRef,
  shapesRef,
  selectedIdsRef,
  createShapesRef,
  handleDeleteShapesRef,
  unlockShapesRef,
  sendMessage,
  setSelectedIds,
  viewportWidth,
  viewportHeight,
}: UseAgenticToolsParams) {
  // Provide tool implementations to voice agent - optimized for <50ms execution
  useEffect(() => {
    if (onToolsReady && currentUserId && canvasId) {
      const tools = {
        createShapes: (params: any) => {

          if (!wsRef.current || !canvasId || !currentUserId) {
            const error = 'Cannot create shapes: Canvas not ready';
            console.error('❌ [createShapes] Error:', error);
            throw new Error(error);
          }
          if (createShapesRef.current) {
            createShapesRef.current(params.shapes);
          } else {
            console.error('❌ [createShapes] createShapesRef.current is null!');
          }
        },
        updateShapes: (params: any) => {
          if (!wsRef.current) {
            throw new Error('Cannot update shapes: WebSocket not ready');
          }
          // Fast path: direct batch update
          sendMessage({
            type: 'SHAPES_BATCH_UPDATE',
            payload: {
              updates: params.shapes.map((shape: any) => ({
                id: shape.shapeId,
                data: {
                  x: shape.x,
                  y: shape.y,
                  width: shape.width,
                  height: shape.height,
                  radius: shape.radius,
                  color: shape.color,
                  textContent: shape.textContent,
                  fontSize: shape.fontSize,
                  opacity: shape.opacity,
                  rotation: shape.rotation,
                  borderRadius: shape.borderRadius
                }
              }))
            }
          });
        },
        deleteShape: (params: any) => {
          if (!wsRef.current || !handleDeleteShapesRef.current) {
            throw new Error('Cannot delete shape: Canvas not ready');
          }
          handleDeleteShapesRef.current(params.shapeIds);
        },
        deleteAllShapes: () => {
          if (!wsRef.current || !handleDeleteShapesRef.current) {
            throw new Error('Cannot delete shapes: Canvas not ready');
          }
          const allShapeIds = shapesRef.current.map(s => s.id);
          if (allShapeIds.length > 0) {
            handleDeleteShapesRef.current(allShapeIds);
          }
        },
        selectShapes: (params: any) => {
          setSelectedIds(params.shapeIds);
          // Lock shapes in batch
          params.shapeIds.forEach((id: string) => {
            sendMessage({
              type: 'SHAPE_UPDATE',
              payload: { shapeId: id, updates: { isLocked: true } }
            });
          });
        },
        clearSelection: () => {
          if (unlockShapesRef.current && selectedIdsRef.current.length > 0) {
            unlockShapesRef.current(selectedIdsRef.current);
          }
          setSelectedIds([]);
        },
        duplicateShapes: (params: any) => {
          if (!wsRef.current) {
            throw new Error('Cannot duplicate shape: WebSocket not ready');
          }
          const offsetX = params.offsetX || 50;
          const offsetY = params.offsetY || 50;
          params.shapeIds.forEach((shapeId: string) => {
            const shape = shapesRef.current.find(s => s.id === shapeId);
            if (shape) {
              const newShape = {
                ...shape,
                x: shape.x + offsetX,
                y: shape.y + offsetY
              };
              delete (newShape as any).id;
              delete (newShape as any).locked_at;
              delete (newShape as any).locked_by;
              delete (newShape as any).created_at;
              delete (newShape as any).updated_at;
              sendMessage({
                type: 'SHAPE_CREATE',
                payload: newShape
              });
            }
          });
        },
        groupShapes: (_params: any) => {
          // TODO: Implement grouping logic
        },
        getCanvasState: () => {
          // Fast path: direct map without logging
          return {
            shapes: shapesRef.current.map(shape => ({
              id: shape.id,
              type: shape.type,
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              radius: shape.radius,
              color: shape.color,
              textContent: shape.textContent || shape.text_content,
            })),
            selectedIds: selectedIdsRef.current
          };
        },
        bringToFront: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          const maxZ = Math.max(...shapesRef.current.map(s => s.zIndex || 0), 0);
          params.shapeIds.forEach((shapeId: string, index: number) => {
            sendMessage({
              type: 'SHAPE_UPDATE',
              payload: { shapeId, updates: { zIndex: maxZ + 1 + index } }
            });
          });
        },
        sendToBack: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          const minZ = Math.min(...shapesRef.current.map(s => s.zIndex || 0), 0);
          params.shapeIds.forEach((shapeId: string, index: number) => {
            sendMessage({
              type: 'SHAPE_UPDATE',
              payload: { shapeId, updates: { zIndex: minZ - params.shapeIds.length + index } }
            });
          });
        },
        moveForward: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          params.shapeIds.forEach((shapeId: string) => {
            const shape = shapesRef.current.find(s => s.id === shapeId);
            if (shape) {
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { zIndex: (shape.zIndex || 0) + 1 } }
              });
            }
          });
        },
        moveBackward: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          params.shapeIds.forEach((shapeId: string) => {
            const shape = shapesRef.current.find(s => s.id === shapeId);
            if (shape) {
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { zIndex: (shape.zIndex || 0) - 1 } }
              });
            }
          });
        },
        arrangeInRow: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          const shapes = params.shapeIds.map((id: string) =>
            shapesRef.current.find(s => s.id === id)
          ).filter((s: any) => s);
          if (shapes.length === 0) return;
          const startX = params.startX ?? (stageRef.current ?
            (-stageRef.current.x() + viewportWidth / 2) / stageRef.current.scaleX() : 25000);
          const startY = params.startY ?? (stageRef.current ?
            (-stageRef.current.y() + viewportHeight / 2) / stageRef.current.scaleY() : 25000);
          const positions = arrangeInRow(shapes, startX, startY, params.spacing || 300);
          params.shapeIds.forEach((shapeId: string, index: number) => {
            if (positions[index]) {
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { x: positions[index].x, y: positions[index].y } }
              });
            }
          });
        },
        arrangeInColumn: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          const shapes = params.shapeIds.map((id: string) =>
            shapesRef.current.find(s => s.id === id)
          ).filter((s: any) => s);
          if (shapes.length === 0) return;
          const startX = params.startX ?? (stageRef.current ?
            (-stageRef.current.x() + viewportWidth / 2) / stageRef.current.scaleX() : 25000);
          const startY = params.startY ?? (stageRef.current ?
            (-stageRef.current.y() + viewportHeight / 2) / stageRef.current.scaleY() : 25000);
          const positions = arrangeInColumn(shapes, startX, startY, params.spacing || 300);
          params.shapeIds.forEach((shapeId: string, index: number) => {
            if (positions[index]) {
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { x: positions[index].x, y: positions[index].y } }
              });
            }
          });
        },
        arrangeInGrid: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          const startX = params.startX ?? (stageRef.current ?
            (-stageRef.current.x() + viewportWidth / 2) / stageRef.current.scaleX() : 25000);
          const startY = params.startY ?? (stageRef.current ?
            (-stageRef.current.y() + viewportHeight / 2) / stageRef.current.scaleY() : 25000);
          const positions = arrangeInGrid(
            params.shapeIds.length,
            startX,
            startY,
            params.spacing || 300,
            params.spacing || 300,
            params.columns
          );
          params.shapeIds.forEach((shapeId: string, index: number) => {
            if (positions[index]) {
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { x: positions[index].x, y: positions[index].y } }
              });
            }
          });
        },
        createPattern: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          const patternFunction = PATTERN_REGISTRY[params.patternType];
          if (!patternFunction) throw new Error(`Unknown pattern: ${params.patternType}`);
          const x = params.x ?? (stageRef.current ?
            (-stageRef.current.x() + viewportWidth / 2) / stageRef.current.scaleX() : 25000);
          const y = params.y ?? (stageRef.current ?
            (-stageRef.current.y() + viewportHeight / 2) / stageRef.current.scaleY() : 25000);
          const shapes = patternFunction(x, y, params.options || {});
          if (createShapesRef.current) {
            createShapesRef.current(shapes);
          }
        },
        alignShapes: (params: any) => {
          if (!wsRef.current) throw new Error('WebSocket not ready');
          const shapes = params.shapeIds.map((id: string) =>
            shapesRef.current.find(s => s.id === id)
          ).filter((s: any) => s);
          if (shapes.length === 0) return;
          const alignment = params.alignment;
          const isHorizontal = ['left', 'center', 'right'].includes(alignment);
          if (isHorizontal) {
            let referenceX: number;
            if (alignment === 'center') {
              referenceX = shapes.reduce((sum: number, s: any) => sum + s.x + (s.width || s.radius || 100) / 2, 0) / shapes.length;
            } else if (alignment === 'left') {
              referenceX = Math.min(...shapes.map((s: any) => s.x));
            } else {
              referenceX = Math.max(...shapes.map((s: any) => s.x + (s.width || s.radius * 2 || 200)));
            }
            const newXPositions = alignHorizontally(shapes, alignment, referenceX);
            params.shapeIds.forEach((shapeId: string, index: number) => {
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { x: newXPositions[index] } }
              });
            });
          } else {
            let referenceY: number;
            if (alignment === 'middle') {
              referenceY = shapes.reduce((sum: number, s: any) => sum + s.y + (s.height || s.radius || 100) / 2, 0) / shapes.length;
            } else if (alignment === 'top') {
              referenceY = Math.min(...shapes.map((s: any) => s.y));
            } else {
              referenceY = Math.max(...shapes.map((s: any) => s.y + (s.height || s.radius * 2 || 150)));
            }
            const newYPositions = alignVertically(shapes, alignment, referenceY);
            params.shapeIds.forEach((shapeId: string, index: number) => {
              sendMessage({
                type: 'SHAPE_UPDATE',
                payload: { shapeId, updates: { y: newYPositions[index] } }
              });
            });
          }
        },
        generateComplexDesign: async (params: GenerateComplexDesignParams): Promise<GenerateComplexDesignResult> => {
          if (!wsRef.current || !createShapesRef.current) {
            return { success: false, error: 'Canvas not ready' };
          }

          try {
            // Get current viewport center
            const viewportCenterX = stageRef.current ?
              (-stageRef.current.x() + viewportWidth / 2) / stageRef.current.scaleX() : 25000;
            const viewportCenterY = stageRef.current ?
              (-stageRef.current.y() + viewportHeight / 2) / stageRef.current.scaleY() : 25000;

            // Call the backend API to generate the complex design
            const response = await secureRequest<{
              success: boolean;
              design: {
                shapes: any[];
                description: string;
                metadata: {
                  shapeCount: number;
                  estimatedComplexity: string;
                  designStyle: string;
                };
              };
            }>('/voice/create-complex-design', {
              method: 'POST',
              body: {
                description: params.description,
                style: params.style,
                colorScheme: params.colorScheme,
                complexity: params.complexity,
                viewport: {
                  centerX: viewportCenterX,
                  centerY: viewportCenterY
                }
              },
              requiresCSRF: true
            });

            if (response.success && response.design) {
              // Create all the shapes from the design
              if (createShapesRef.current) {
                await createShapesRef.current(response.design.shapes);
              }

              return {
                success: true,
                shapeCount: response.design.metadata.shapeCount
              };
            } else {
              return {
                success: false,
                error: 'Failed to generate design'
              };
            }
          } catch (error) {
            console.error('Error generating complex design:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
        generateDesignVariation: async (params: GenerateDesignVariationParams): Promise<GenerateDesignVariationResult> => {
          if (!wsRef.current || !createShapesRef.current) {
            return { success: false, error: 'Canvas not ready' };
          }

          try {
            // Get all current shapes from canvas
            const currentShapes = shapesRef.current.map(shape => ({
              type: shape.type,
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              radius: shape.radius,
              color: shape.color,
              textContent: shape.textContent || shape.text_content,
              fontSize: shape.fontSize || shape.font_size,
              fontFamily: shape.fontFamily || shape.font_family,
              fontWeight: shape.fontWeight || shape.font_weight,
              opacity: shape.opacity,
              rotation: shape.rotation,
              borderRadius: shape.borderRadius || shape.border_radius,
              zIndex: shape.zIndex
            }));

            // Call the backend API to generate the variation
            const response = await secureRequest<{
              success: boolean;
              design: {
                shapes: any[];
                description: string;
                metadata: {
                  shapeCount: number;
                  estimatedComplexity: string;
                  designStyle: string;
                };
              };
            }>('/voice/generate-design-variation', {
              method: 'POST',
              body: {
                originalShapes: currentShapes,
                variationRequest: params.variationRequest
              },
              requiresCSRF: true
            });

            if (response.success && response.design) {
              // Delete all existing shapes first
              if (handleDeleteShapesRef.current) {
                const allShapeIds = shapesRef.current.map(s => s.id);
                if (allShapeIds.length > 0) {
                  handleDeleteShapesRef.current(allShapeIds);
                }
              }

              // Small delay to ensure deletion is processed
              await new Promise(resolve => setTimeout(resolve, 100));

              // Create all the new shapes from the variation
              if (createShapesRef.current) {
                await createShapesRef.current(response.design.shapes);
              }

              return {
                success: true,
                shapeCount: response.design.metadata.shapeCount
              };
            } else {
              return {
                success: false,
                error: 'Failed to generate design variation'
              };
            }
          } catch (error) {
            console.error('Error generating design variation:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      }

      onToolsReady(tools);
    }
  }, [onToolsReady, currentUserId, canvasId, viewportWidth, viewportHeight, wsRef, stageRef, createShapesRef, handleDeleteShapesRef, sendMessage, shapesRef])
}

