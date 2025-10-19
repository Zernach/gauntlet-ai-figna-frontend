import { useCallback } from 'react'
import type { Shape, ActiveUser } from '../types/canvas'
import { USER_COLORS } from '../types/canvas'

interface UseCanvasUtilsProps {
  containerRef?: React.RefObject<HTMLDivElement | null>
  currentUserId: string | null
  currentUserColor: string
  currentTime: number
  activeUsers: ActiveUser[]
  setCanvasBgPanelPos?: React.Dispatch<React.SetStateAction<{ top: number; left: number } | null>>
}

export function useCanvasUtils({
  containerRef,
  currentUserId,
  currentUserColor,
  currentTime,
  activeUsers,
  setCanvasBgPanelPos,
}: UseCanvasUtilsProps) {

  // Helper function to calculate remaining lock seconds
  const getRemainingLockSeconds = useCallback((lockedAt?: string | null): number | null => {
    if (!lockedAt) return null
    const lockTime = new Date(lockedAt).getTime()
    const elapsed = (currentTime - lockTime) / 1000
    const remaining = Math.max(0, 10 - elapsed)
    return remaining > 0 ? remaining : null
  }, [currentTime])

  // Helper function to get user color by user ID
  const getUserColor = useCallback((userId: string): string => {
    // First check if it's the current user
    if (userId === currentUserId) {
      return currentUserColor
    }
    // Check active users
    const user = activeUsers.find(u => u.userId === userId)
    if (user) {
      return user.color
    }
    // Fallback: calculate color from user ID
    const colorIndex = parseInt(userId.slice(0, 8), 16) % USER_COLORS.length
    return USER_COLORS[colorIndex]
  }, [currentUserId, currentUserColor, activeUsers])

  // Normalize shape fields (ensure snake_case for lock fields)
  const normalizeShape = useCallback((s: any): Shape => {
    const locked_at = s.locked_at !== undefined ? s.locked_at : (s.lockedAt !== undefined ? s.lockedAt : null)
    const locked_by = s.locked_by !== undefined ? s.locked_by : (s.lockedBy !== undefined ? s.lockedBy : null)
    const z_index = s.z_index !== undefined ? s.z_index : (s.zIndex !== undefined ? s.zIndex : 0)
    const textContent = s.textContent !== undefined ? s.textContent : (s.text_content !== undefined ? s.text_content : undefined)
    const fontSize = s.fontSize !== undefined ? s.fontSize : (s.font_size !== undefined ? s.font_size : undefined)
    const opacity = s.opacity !== undefined ? s.opacity : undefined
    const shadowColor = s.shadowColor !== undefined ? s.shadowColor : (s.shadow_color !== undefined ? s.shadow_color : undefined)
    const shadowStrength = s.shadowStrength !== undefined ? s.shadowStrength : (s.shadow_strength !== undefined ? s.shadow_strength : undefined)
    const borderRadius = s.borderRadius !== undefined ? s.borderRadius : (s.border_radius !== undefined ? s.border_radius : undefined)
    const imageUrl = s.imageUrl !== undefined ? s.imageUrl : (s.image_url !== undefined ? s.image_url : undefined)
    const iconName = s.iconName !== undefined ? s.iconName : (s.icon_name !== undefined ? s.icon_name : undefined)
    const fontFamily = s.fontFamily !== undefined ? s.fontFamily : (s.font_family !== undefined ? s.font_family : undefined)
    const fontWeight = s.fontWeight !== undefined ? s.fontWeight : (s.font_weight !== undefined ? s.font_weight : undefined)
    const textAlign = s.textAlign !== undefined ? s.textAlign : (s.text_align !== undefined ? s.text_align : undefined)
    const strokeColor = s.strokeColor !== undefined ? s.strokeColor : (s.stroke_color !== undefined ? s.stroke_color : undefined)
    const strokeWidth = s.strokeWidth !== undefined ? s.strokeWidth : (s.stroke_width !== undefined ? s.stroke_width : undefined)
    const groupId = s.groupId !== undefined ? s.groupId : (s.group_id !== undefined ? s.group_id : undefined)
    return {
      ...s,
      locked_at,
      locked_by,
      z_index,
      zIndex: z_index,
      textContent,
      fontSize,
      fontFamily,
      fontWeight,
      textAlign,
      opacity,
      shadowColor,
      shadowStrength,
      borderRadius,
      imageUrl,
      iconName,
      strokeColor,
      strokeWidth,
      groupId,
      group_id: groupId,
    }
  }, [])

  // Recompute canvas background panel position when opened or on resize
  const computeCanvasBgPanelPosition = useCallback(() => {
    if (!setCanvasBgPanelPos || !containerRef) return

    const container = containerRef.current
    const btn = typeof document !== 'undefined' ? document.getElementById('canvas-bg-btn') : null
    const panel = typeof document !== 'undefined' ? document.getElementById('main-control-panel') : null
    if (!container || !btn || !panel) return
    const cRect = container.getBoundingClientRect()
    const bRect = btn.getBoundingClientRect()
    const pRect = panel.getBoundingClientRect()
    const gap = 12
    const top = Math.round(bRect.top - cRect.top)
    const left = Math.round(pRect.right - cRect.left + gap)
    setCanvasBgPanelPos({ top, left })
  }, [containerRef, setCanvasBgPanelPos])

  return {
    getRemainingLockSeconds,
    getUserColor,
    normalizeShape,
    computeCanvasBgPanelPosition,
  }
}

