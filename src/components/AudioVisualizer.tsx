import { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
    audioContext: AudioContext | null
    analyserNode: AnalyserNode | null
    label: string
    color: string
}

export default function AudioVisualizer({ audioContext, analyserNode, label, color }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number>()

    useEffect(() => {
        if (!analyserNode || !audioContext) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const dpr = window.devicePixelRatio || 1
        const width = 200
        const height = 50
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.scale(dpr, dpr)

        // Configure analyser
        analyserNode.fftSize = 64 // Small FFT for mini chart
        const bufferLength = analyserNode.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw)

            analyserNode.getByteFrequencyData(dataArray)

            // Clear canvas with fade effect
            ctx.fillStyle = 'rgba(5, 5, 15, 0.3)'
            ctx.fillRect(0, 0, width, height)

            // Draw frequency bars
            const barWidth = width / bufferLength
            const gap = 2
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * height

                // Create gradient for bars
                const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
                gradient.addColorStop(0, color)
                gradient.addColorStop(0.5, `${color}CC`)
                gradient.addColorStop(1, `${color}40`)

                ctx.fillStyle = gradient

                // Draw main bar
                ctx.fillRect(x, height - barHeight, barWidth - gap, barHeight)

                // Draw glow effect on top
                if (barHeight > height * 0.3) {
                    ctx.shadowBlur = 10
                    ctx.shadowColor = color
                    ctx.fillStyle = color
                    ctx.fillRect(x, height - barHeight, barWidth - gap, 2)
                    ctx.shadowBlur = 0
                }

                x += barWidth
            }
        }

        draw()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [analyserNode, audioContext, color])

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '200px',
            }}
        >
            <div
                style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: color,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    textAlign: 'center',
                    textShadow: `0 0 10px ${color}80`,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    backgroundColor: 'rgba(10, 10, 30, 0.5)',
                    borderRadius: '10px',
                    padding: '8px',
                    border: `1px solid ${color}40`,
                    boxShadow: `0 0 15px ${color}20, inset 0 0 15px rgba(0, 0, 0, 0.3)`,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Grid overlay for sci-fi effect */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent)',
                        backgroundSize: '20px 20px',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />
                <canvas
                    ref={canvasRef}
                    style={{
                        display: 'block',
                        borderRadius: '6px',
                        position: 'relative',
                        zIndex: 2,
                    }}
                />
            </div>
        </div>
    )
}

