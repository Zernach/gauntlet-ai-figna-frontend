import { useState, useCallback } from 'react'

export interface ToastMessage {
    id: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
    duration: number
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([])

    const showToast = useCallback((
        message: string,
        type: 'info' | 'warning' | 'error' | 'success' = 'info',
        duration = 3000
    ) => {
        const id = `${Date.now()}-${Math.random()}`
        setToasts(prev => [...prev, { id, message, type, duration }])
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return {
        toasts,
        showToast,
        dismissToast
    }
}

