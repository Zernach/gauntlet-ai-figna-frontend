import { useState, useRef, useEffect } from 'react'
import { getVoiceRelayUrl } from '../lib/api'

interface RealtimeVoicePanelProps {
    session: any
}

export default function RealtimeVoicePanel({ session }: RealtimeVoicePanelProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const audioElementRef = useRef<HTMLAudioElement | null>(null)
    const dataChannelRef = useRef<RTCDataChannel | null>(null)

    useEffect(() => {
        // Create audio element for playback
        if (!audioElementRef.current) {
            audioElementRef.current = document.createElement('audio')
            audioElementRef.current.autoplay = true
        }

        return () => {
            handleDisconnect()
        }
    }, [])

    const handleDisconnect = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
            peerConnectionRef.current = null
        }
        if (dataChannelRef.current) {
            dataChannelRef.current.close()
            dataChannelRef.current = null
        }
        setIsConnected(false)
        setIsSpeaking(false)
    }

    const handleStartVoice = async () => {
        if (!session) {
            setError('Please sign in to use voice assistant')
            return
        }

        if (isConnected) {
            handleDisconnect()
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Get the relay URL/ephemeral token from backend
            const { relayUrl } = await getVoiceRelayUrl()
            console.log('OpenAI Relay URL received')

            // Create RTCPeerConnection
            const pc = new RTCPeerConnection()
            peerConnectionRef.current = pc

            // Set up audio element to receive remote audio
            const audioEl = audioElementRef.current
            if (audioEl) {
                pc.ontrack = (e) => {
                    console.log('Received remote audio track')
                    audioEl.srcObject = e.streams[0]
                }
            }

            // Add local audio track from microphone
            const ms = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            })
            pc.addTrack(ms.getTracks()[0])

            // Set up data channel for sending/receiving events
            const dc = pc.createDataChannel('oai-events')
            dataChannelRef.current = dc

            dc.addEventListener('open', () => {
                console.log('Data channel opened')
                setIsConnected(true)
                setIsLoading(false)

                // Send session update to configure the session
                dc.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                        turn_detection: { type: 'server_vad' },
                        input_audio_transcription: { model: 'whisper-1' }
                    }
                }))
            })

            dc.addEventListener('message', (e) => {
                try {
                    const event = JSON.parse(e.data)
                    console.log('Received event:', event.type)

                    // Track when AI is speaking
                    if (event.type === 'response.audio.delta' || event.type === 'response.audio_transcript.delta') {
                        setIsSpeaking(true)
                    } else if (event.type === 'response.done' || event.type === 'response.audio.done') {
                        setIsSpeaking(false)
                    }

                    // Handle transcripts
                    if (event.type === 'conversation.item.input_audio_transcription.completed') {
                        console.log('User said:', event.transcript)
                    }
                    if (event.type === 'response.audio_transcript.delta') {
                        console.log('AI response:', event.delta)
                    }
                } catch (err) {
                    console.error('Failed to parse message:', err)
                }
            })

            dc.addEventListener('close', () => {
                console.log('Data channel closed')
                handleDisconnect()
            })

            dc.addEventListener('error', (e) => {
                console.error('Data channel error:', e)
                setError('Connection error occurred')
                handleDisconnect()
            })

            // Create and set local description (SDP offer)
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)

            // Send the offer to OpenAI and get back the answer
            const baseUrl = 'https://api.openai.com/v1/realtime'
            const model = 'gpt-4o-realtime-preview-2024-12-17'
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${relayUrl}`,
                    'Content-Type': 'application/sdp',
                },
            })

            if (!sdpResponse.ok) {
                throw new Error(`Failed to connect to OpenAI: ${sdpResponse.statusText}`)
            }

            const answerSdp = await sdpResponse.text()
            await pc.setRemoteDescription({
                type: 'answer',
                sdp: answerSdp,
            })

            console.log('WebRTC connection established')
        } catch (err) {
            console.error('Failed to start voice:', err)
            setError(err instanceof Error ? err.message : 'Failed to start voice assistant')
            handleDisconnect()
            setIsLoading(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '24px',
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                border: '1px solid #404040',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                minWidth: '240px',
            }}
        >
            <h3
                style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#ffffff',
                    textAlign: 'center',
                }}
            >
                Voice Assistant
            </h3>

            {isConnected && (
                <div
                    style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: 'rgba(114, 250, 65, 0.1)',
                        border: '1px solid #72fa41',
                        borderRadius: '8px',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#72fa41',
                                animation: isSpeaking ? 'blink 1s ease-in-out infinite' : 'none',
                            }}
                        />
                        <span style={{ color: '#72fa41', fontSize: '14px', fontWeight: 600 }}>
                            {isSpeaking ? 'AI Speaking...' : 'Listening...'}
                        </span>
                    </div>
                </div>
            )}

            <button
                onClick={handleStartVoice}
                disabled={isLoading}
                style={{
                    width: '100%',
                    padding: '24px',
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#ffffff',
                    background: isLoading
                        ? 'linear-gradient(135deg, #666666, #888888)'
                        : isConnected
                            ? 'linear-gradient(135deg, #ff4444, #cc0000)'
                            : 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    border: isLoading
                        ? 'none'
                        : isConnected
                            ? '2px solid #ff4444'
                            : '2px solid transparent',
                    borderRadius: '12px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textShadow: isLoading || isConnected ? 'none' : '0 0 10px rgba(114, 250, 65, 0.5)',
                }}
                className={!isLoading && !isConnected ? 'shimmer-button' : ''}
                onMouseEnter={(e) => {
                    if (!isLoading) {
                        e.currentTarget.style.transform = 'scale(1.05)'
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isLoading) {
                        e.currentTarget.style.transform = 'scale(1)'
                    }
                }}
            >
                {!isLoading && !isConnected && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'linear-gradient(45deg, transparent 30%, rgba(114, 250, 65, 0.3) 50%, rgba(36, 204, 255, 0.3) 55%, transparent 70%)',
                            animation: 'shimmer 3s infinite',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                    {isLoading ? 'Connecting...' : isConnected ? 'STOP' : 'START'}
                </span>
            </button>

            {error && (
                <p
                    style={{
                        marginTop: '12px',
                        color: '#ff4444',
                        fontSize: '12px',
                        textAlign: 'center',
                    }}
                >
                    {error}
                </p>
            )}

            <style>
                {`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }
            100% {
              transform: translateX(100%) translateY(100%) rotate(45deg);
            }
          }
          
          @keyframes blink {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
          
          .shimmer-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              linear-gradient(90deg, 
                rgba(114, 250, 65, 0.1) 0%, 
                rgba(114, 250, 65, 0.4) 20%,
                rgba(36, 204, 255, 0.4) 40%,
                rgba(114, 250, 65, 0.4) 60%,
                rgba(114, 250, 65, 0.1) 100%
              );
            background-size: 200% 100%;
            animation: shimmer-border 2s linear infinite;
            border-radius: 12px;
            pointer-events: none;
          }
          
          @keyframes shimmer-border {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          
          .shimmer-button::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(
              45deg,
              #72fa41 0%,
              #24ccff 25%,
              #72fa41 50%,
              #24ccff 75%,
              #72fa41 100%
            );
            background-size: 300% 300%;
            animation: shimmer-gradient 4s linear infinite;
            border-radius: 14px;
            z-index: -1;
            opacity: 0.6;
          }
          
          @keyframes shimmer-gradient {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 300% 50%;
            }
          }
        `}
            </style>
        </div>
    )
}

