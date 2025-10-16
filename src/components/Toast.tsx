import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export interface ToastMessage {
    id: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
    duration?: number
}

interface ToastProps {
    toast: ToastMessage
    onDismiss: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        const duration = toast.duration || 3000
        const timer = setTimeout(() => {
            setIsExiting(true)
            setTimeout(() => onDismiss(toast.id), 300) // Match animation duration
        }, duration)

        return () => clearTimeout(timer)
    }, [toast.id, toast.duration, onDismiss])

    const typeColors = {
        info: '#24ccff',
        warning: '#ffaa00',
        error: '#ff0040',
        success: '#72fa41',
    }

    const bgColor = typeColors[toast.type || 'info']

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#1a1a1a',
                border: `2px solid ${bgColor}`,
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: `0 4px 16px ${bgColor}40`,
                minWidth: '250px',
                maxWidth: '400px',
                opacity: isExiting ? 0 : 1,
                transform: isExiting ? 'translateY(10px)' : 'translateY(0)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
        >
            <div
                style={{
                    width: '4px',
                    height: '40px',
                    backgroundColor: bgColor,
                    borderRadius: '2px',
                }}
            />
            <div style={{ flex: 1, fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>
                {toast.message}
            </div>
            <button
                onClick={() => {
                    setIsExiting(true)
                    setTimeout(() => onDismiss(toast.id), 300)
                }}
                style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#888'
                }}
            >
                <X size={16} />
            </button>
        </div>
    )
}

interface ToastContainerProps {
    toasts: ToastMessage[]
    onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: '140px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none',
            }}
        >
            {toasts.map((toast) => (
                <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                    <Toast toast={toast} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    )
}

export default Toast

