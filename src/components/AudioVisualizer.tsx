import { useEffect, useRef, memo } from 'react'

interface AudioVisualizerProps {
    audioContext: AudioContext | null
    analyserNode: AnalyserNode | null
    label: string
    color: string
    isProcessing?: boolean
    isMuted?: boolean
    onToggleMute?: () => void
}

function AudioVisualizer({ audioContext, analyserNode, label, color, isProcessing = false, isMuted = false, onToggleMute }: AudioVisualizerProps) {
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
        <>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '200px',
                }}
            >
                <div
                    onClick={onToggleMute}
                    style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: isMuted ? '#ff9632' : color,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        textAlign: 'center',
                        textShadow: isMuted ? '0 0 10px #ff963280' : `0 0 10px ${color}80`,
                        cursor: onToggleMute ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: onToggleMute ? (isMuted ? 'rgba(255, 150, 50, 0.1)' : 'rgba(100, 200, 255, 0.1)') : 'transparent',
                        border: onToggleMute ? (isMuted ? '1px solid #ff963240' : '1px solid #64c8ff40') : '1px solid transparent',
                        minHeight: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                        if (onToggleMute) {
                            e.currentTarget.style.backgroundColor = isMuted ? 'rgba(255, 150, 50, 0.2)' : 'rgba(100, 200, 255, 0.2)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (onToggleMute) {
                            e.currentTarget.style.backgroundColor = isMuted ? 'rgba(255, 150, 50, 0.1)' : 'rgba(100, 200, 255, 0.1)'
                            e.currentTarget.style.transform = 'scale(1)'
                        }
                    }}
                >
                    {onToggleMute ? (isMuted ? '🔇 ' + label + ' (Muted)' : '🎤 ' + label) : label}
                </div>
                <div
                    style={{
                        backgroundColor: 'rgba(10, 10, 30, 0.5)',
                        borderRadius: '10px',
                        padding: '8px',
                        border: isMuted ? '1px solid #ff963240' : `1px solid ${color}40`,
                        boxShadow: isMuted
                            ? '0 0 15px #ff963220, inset 0 0 15px rgba(0, 0, 0, 0.3)'
                            : `0 0 15px ${color}20, inset 0 0 15px rgba(0, 0, 0, 0.3)`,
                        position: 'relative',
                        overflow: 'hidden',
                        opacity: isMuted ? 0.6 : 1,
                        transition: 'all 0.3s ease',
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

                    {/* Processing Indicator Overlay */}
                    {isProcessing && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                backgroundColor: 'rgba(255, 200, 100, 0.95)',
                                border: '2px solid #ffc864',
                                borderRadius: '16px',
                                boxShadow: '0 0 25px rgba(255, 200, 100, 0.7), 0 4px 12px rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(6px)',
                                zIndex: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    border: '2px solid rgba(0, 0, 0, 0.2)',
                                    borderTop: '2px solid rgba(0, 0, 0, 0.8)',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                }}
                            />
                            <span style={{
                                color: 'rgba(0, 0, 0, 0.9)',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '1.2px',
                                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                            }}>
                                Processing
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

// Memoize to prevent unnecessary re-renders
export default memo(AudioVisualizer)

