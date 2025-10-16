import type { Shape } from '../types/canvas'

// Normalize shape fields (ensure snake_case for lock fields)
export function normalizeShape(shape: any): Shape {
  return {
    ...shape,
    locked_at: shape.locked_at ?? shape.lockedAt ?? null,
    locked_by: shape.locked_by ?? shape.lockedBy ?? null,
    z_index: shape.z_index ?? shape.zIndex ?? 0,
    text_content: shape.text_content ?? shape.textContent,
    font_size: shape.font_size ?? shape.fontSize,
    font_family: shape.font_family ?? shape.fontFamily,
    font_weight: shape.font_weight ?? shape.fontWeight,
    text_align: shape.text_align ?? shape.textAlign,
  }
}

// Helper function to calculate remaining lock seconds
export function getRemainingLockSeconds(shape: Shape): number {
  if (!shape.locked_at) return 0
  const lockTime = new Date(shape.locked_at).getTime()
  const elapsed = (Date.now() - lockTime) / 1000
  return Math.max(0, 10 - elapsed)
}

// Check if a shape is locked by another user
export function isLockedByOther(shape: Shape, currentUserId: string | null): boolean {
  if (!shape.locked_at || !shape.locked_by) return false
  if (shape.locked_by === currentUserId) return false
  return getRemainingLockSeconds(shape) > 0
}

// Get user color by user ID
export function getUserColor(userId: string, userColors: string[]): string {
  const colorIndex = parseInt(userId.slice(0, 8), 16) % userColors.length
  return userColors[colorIndex]
}

