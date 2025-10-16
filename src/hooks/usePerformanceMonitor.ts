import { useState, useRef, useEffect } from 'react'

export function usePerformanceMonitor() {
    const [fps, setFps] = useState(60)
    const fpsRef = useRef<number[]>([])
    const lastFrameTimeRef = useRef(performance.now())

    useEffect(() => {
        let frameId: number

        const measureFps = () => {
            const now = performance.now()
            const delta = now - lastFrameTimeRef.current
            lastFrameTimeRef.current = now

            if (delta > 0) {
                const currentFps = 1000 / delta
                fpsRef.current.push(currentFps)

                // Keep only last 60 frames
                if (fpsRef.current.length > 60) {
                    fpsRef.current.shift()
                }

                // Update FPS display every 30 frames
                if (fpsRef.current.length % 30 === 0) {
                    const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
                    setFps(Math.round(avgFps))
                }
            }

            frameId = requestAnimationFrame(measureFps)
        }

        frameId = requestAnimationFrame(measureFps)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return { fps }
}

