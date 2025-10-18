import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export interface Canvas {
    id: string
    owner_id: string
    name: string
    description: string | null
    is_public: boolean
    background_color: string
    viewport_x: number
    viewport_y: number
    viewport_zoom: number
    created_at: string
    updated_at: string
    last_accessed_at: string | null
}

interface UseCanvasManagementReturn {
    canvases: Canvas[]
    currentCanvasId: string | null
    isLoadingCanvases: boolean
    isCreating: boolean
    isDeleting: boolean
    isSwitching: boolean
    fetchCanvases: () => Promise<void>
    createCanvas: (name: string, description?: string, backgroundColor?: string) => Promise<Canvas | null>
    deleteCanvas: (canvasId: string) => Promise<boolean>
    switchCanvas: (canvasId: string, wsRef: React.MutableRefObject<WebSocket | null>, onSuccess?: () => void) => Promise<boolean>
    setCurrentCanvasId: (canvasId: string) => void
    canvasSwitchResolverRef: React.MutableRefObject<((success: boolean) => void) | null>
}

const LAST_CANVAS_KEY = 'figna_last_canvas_id'

export function useCanvasManagement(): UseCanvasManagementReturn {
    const [canvases, setCanvases] = useState<Canvas[]>([])
    const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null)
    const [isLoadingCanvases, setIsLoadingCanvases] = useState(true) // Initialize as true since we fetch on mount
    const [isCreating, setIsCreating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSwitching, setIsSwitching] = useState(false)

    // Ref to store the resolver function for canvas switch Promise
    const canvasSwitchResolverRef = useRef<((success: boolean) => void) | null>(null)

    /**
     * Fetch all canvases accessible to the user
     */
    const fetchCanvases = useCallback(async () => {
        setIsLoadingCanvases(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setIsLoadingCanvases(false)
                return
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
            // Add timestamp to bust cache
            const cacheBuster = `?_t=${Date.now()}`
            const response = await fetch(`${API_URL}/canvas${cacheBuster}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch canvases')
            }

            const result = await response.json()

            // Ensure we always have an array
            let fetchedCanvases = result.data || []

            // If result.data is an object instead of an array, wrap it in an array
            if (!Array.isArray(fetchedCanvases) && typeof fetchedCanvases === 'object') {
                fetchedCanvases = [fetchedCanvases]
            }

            setCanvases(fetchedCanvases)

            // If no current canvas is set and we have canvases, check localStorage first
            // Use functional update to avoid dependency on currentCanvasId
            setCurrentCanvasId(prevId => {
                if (!prevId && fetchedCanvases.length > 0) {
                    // Try to load last viewed canvas from localStorage
                    const lastCanvasId = localStorage.getItem(LAST_CANVAS_KEY)

                    // If last canvas exists in fetched canvases, use it
                    if (lastCanvasId && fetchedCanvases.some((c: Canvas) => c.id === lastCanvasId)) {
                        return lastCanvasId
                    }

                    // Otherwise, default to first canvas
                    return fetchedCanvases[0].id
                }
                return prevId
            })
        } catch (error) {
            // Error handled silently
        } finally {
            setIsLoadingCanvases(false)
        }
    }, []) // Remove currentCanvasId dependency to prevent infinite loop

    /**
     * Create a new canvas
     */
    const createCanvas = useCallback(async (
        name: string,
        description?: string,
        backgroundColor?: string
    ): Promise<Canvas | null> => {
        setIsCreating(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                return null
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_URL}/canvas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description: description || '',
                    backgroundColor: backgroundColor || '#1a1a1a',
                    isPublic: false,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || 'Failed to create canvas')
            }

            const result = await response.json()
            const newCanvas = result.data

            // Add to canvases list
            setCanvases(prev => [newCanvas, ...prev])

            return newCanvas
        } catch (error) {
            return null
        } finally {
            setIsCreating(false)
        }
    }, [])

    /**
     * Delete a canvas
     */
    const deleteCanvas = useCallback(async (canvasId: string): Promise<boolean> => {
        setIsDeleting(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                return false
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_URL}/canvas/${canvasId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete canvas')
            }

            // Remove from canvases list
            setCanvases(prev => prev.filter(c => c.id !== canvasId))

            // If we deleted the current canvas, switch to another one
            if (currentCanvasId === canvasId) {
                const remaining = canvases.filter(c => c.id !== canvasId)
                if (remaining.length > 0) {
                    const newCanvasId = remaining[0].id
                    setCurrentCanvasId(newCanvasId)
                    localStorage.setItem(LAST_CANVAS_KEY, newCanvasId)
                } else {
                    setCurrentCanvasId(null)
                    localStorage.removeItem(LAST_CANVAS_KEY)
                }
            }

            return true
        } catch (error) {
            return false
        } finally {
            setIsDeleting(false)
        }
    }, [canvases, currentCanvasId])

    /**
     * Switch to a different canvas
     * Uses WebSocket SWITCH_CANVAS message for efficient canvas switching
     */
    const switchCanvas = useCallback(async (
        canvasId: string,
        wsRef: React.MutableRefObject<WebSocket | null>,
        onSuccess?: () => void
    ): Promise<boolean> => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return false
        }

        if (canvasId === currentCanvasId) {
            return true
        }
        setIsSwitching(true)

        // Optimistically update the current canvas ID BEFORE sending WebSocket message
        // This prevents race conditions and ensures the UI updates immediately
        setCurrentCanvasId(canvasId)

        return new Promise((resolve) => {
            // Store the resolver in the ref so CANVAS_SWITCHED handler can call it
            canvasSwitchResolverRef.current = (success: boolean) => {
                setIsSwitching(false)

                if (success) {
                    if (onSuccess) {
                        onSuccess()
                    }
                    resolve(true)
                } else {
                    // Revert the optimistic update on failure
                    setCurrentCanvasId(currentCanvasId)
                    resolve(false)
                }

                // Clear the resolver after use
                canvasSwitchResolverRef.current = null
            }

            // Send SWITCH_CANVAS message
            wsRef.current?.send(JSON.stringify({
                type: 'SWITCH_CANVAS',
                payload: { canvasId }
            }))

            // Timeout after 10 seconds (increased from 5 for reliability)
            setTimeout(() => {
                if (canvasSwitchResolverRef.current) {
                    canvasSwitchResolverRef.current(false)
                }
            }, 10000)
        })
    }, [currentCanvasId])

    // Fetch canvases on mount
    useEffect(() => {
        fetchCanvases()
    }, [fetchCanvases])

    // Save current canvas ID to localStorage whenever it changes
    useEffect(() => {
        if (currentCanvasId) {
            localStorage.setItem(LAST_CANVAS_KEY, currentCanvasId)
        }
    }, [currentCanvasId])

    return {
        canvases,
        currentCanvasId,
        isLoadingCanvases,
        isCreating,
        isDeleting,
        isSwitching,
        fetchCanvases,
        createCanvas,
        deleteCanvas,
        switchCanvas,
        setCurrentCanvasId,
        canvasSwitchResolverRef,
    }
}

