import { useState, useRef, useEffect, useCallback } from 'react'
import { getVoiceRelayUrl } from '../lib/api'
import { useAgenticToolCalling } from '../hooks/useAgenticToolCalling'
import AudioVisualizer from './AudioVisualizer'
import { performanceMonitor } from '../lib/performanceMonitor'

interface RealtimeVoicePanelProps {
    session: any
    onRegisterTools?: (registerFn: (tools: any) => void) => void
    viewportCenter?: { x: number; y: number }
    canvasShapes?: any[]
}

export default function RealtimeVoicePanel({ session, onRegisterTools, viewportCenter, canvasShapes = [] }: RealtimeVoicePanelProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isProcessingCommand, setIsProcessingCommand] = useState(false)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const audioElementRef = useRef<HTMLAudioElement | null>(null)
    const dataChannelRef = useRef<RTCDataChannel | null>(null)

    // Audio visualization state
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
    const [userAnalyser, setUserAnalyser] = useState<AnalyserNode | null>(null)
    const [agentAnalyser, setAgentAnalyser] = useState<AnalyserNode | null>(null)

    // Agentic tool calling
    const { tools, registerTools, executeTool } = useAgenticToolCalling()
    const pendingToolCallRef = useRef<{ call_id: string; name: string; arguments: string } | null>(null)
    const executedCallIdsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        // Create audio element for playback
        if (!audioElementRef.current) {
            audioElementRef.current = document.createElement('audio')
            audioElementRef.current.autoplay = true
        }

        // Register tools with parent
        if (onRegisterTools) {
            onRegisterTools(registerTools)
        }

        return () => {
            handleDisconnect()
        }
    }, [onRegisterTools, registerTools])

    // Helper function to generate shape context description
    const generateShapeContext = (shapes: any[]) => {
        if (shapes.length === 0) {
            return 'The canvas is currently empty.'
        }

        const shapeDescriptions = shapes.map(shape => {
            let desc = `- Shape ID "${shape.id}": ${shape.type}`

            if (shape.type === 'text' && (shape.textContent || shape.text_content)) {
                desc += ` with text "${shape.textContent || shape.text_content}"`
            }

            if (shape.x !== undefined && shape.y !== undefined) {
                desc += ` at position (${Math.round(shape.x)}, ${Math.round(shape.y)})`
            }

            if (shape.color) {
                desc += `, color ${shape.color}`
            }

            if (shape.width && shape.height) {
                desc += `, size ${Math.round(shape.width)}x${Math.round(shape.height)}`
            } else if (shape.radius) {
                desc += `, radius ${Math.round(shape.radius)}`
            }

            return desc
        }).join('\n')

        return `Current objects on canvas (${shapes.length} total):\n${shapeDescriptions}`
    }

    // Update session with viewport center and canvas shapes when they change
    useEffect(() => {
        if (isConnected && dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            const DEBUG = false;
            const centerX = viewportCenter ? Math.round(viewportCenter.x) : 25000;
            const centerY = viewportCenter ? Math.round(viewportCenter.y) : 25000;
            const shapeContext = generateShapeContext(canvasShapes);

            const instructions = `You are a helpful AI assistant that can manipulate shapes on a collaborative canvas. The canvas is 50000x50000 pixels (coordinates from 0 to 50000). The user's current viewport is centered at (${centerX}, ${centerY}).

IMPORTANT SHAPE CREATION GUIDELINES:
- When creating a SINGLE shape without explicit coordinates, place it at the viewport center (${centerX}, ${centerY}) for best visibility.
- When creating MULTIPLE shapes (e.g., "three circles", "five rectangles", "create 3 shapes"):
  * ALWAYS calculate specific x and y coordinates for each shape to space them properly
  * NEVER place multiple shapes at the same coordinates - they will stack and be invisible
  * For horizontal spacing: Use 300-400 pixel spacing between shapes (e.g., x positions: ${centerX - 400}, ${centerX}, ${centerX + 400})
  * For vertical spacing: Use 300-400 pixel spacing between shapes (e.g., y positions: ${centerY - 400}, ${centerY}, ${centerY + 400})
  * For grid layouts: Arrange shapes in rows and columns with appropriate spacing
  * Always specify explicit x and y coordinates for each shape in the shapes array
- When asked to space shapes "evenly" or "horizontally" or "vertically", distribute them with consistent spacing relative to the viewport center
- Default to horizontal arrangement unless the user specifies otherwise

${shapeContext}

When the user refers to objects by their content (like "the Hello World text" or "the red circle"), use the shape IDs from the list above to identify and modify them. You can use updateShapes with an array of shape updates to modify existing objects. Always pass an array to updateShapes, even for a single shape: updateShapes({shapes: [{shapeId: "id", color: "#FF0000"}]})`

            const sessionUpdatePayload = {
                type: 'session.update',
                session: {
                    instructions
                }
            };

            if (DEBUG) console.log('📍 Updating session:', { x: centerX, y: centerY, shapeCount: canvasShapes.length });
            dataChannelRef.current.send(JSON.stringify(sessionUpdatePayload));
        }
    }, [viewportCenter, canvasShapes, isConnected])

    // Handle function call from OpenAI - optimized for <50ms execution
    const handleFunctionCall = useCallback((callId: string, name: string, args: string) => {
        const DEBUG = false; // Set to true for debugging

        // Start performance monitoring
        performanceMonitor.startTimer(`voiceAgent_${name}`);

        try {
            // Fast path: parse and execute immediately
            const parsedArgs = JSON.parse(args);
            const result = executeTool(name, parsedArgs);

            // Send response immediately if channel is ready
            const dc = dataChannelRef.current;
            if (dc?.readyState === 'open') {
                // Pre-build payload structure for speed
                dc.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                        type: 'function_call_output',
                        call_id: callId,
                        output: JSON.stringify(result)
                    }
                }));
            } else if (DEBUG) {
                console.warn('⚠️ Data channel not ready');
            }

            // End performance monitoring
            const duration = performanceMonitor.endTimer(`voiceAgent_${name}`);
            if (DEBUG && duration !== null) {
                console.log(`⚡ Tool ${name} executed in ${duration.toFixed(2)}ms`);
            }

            // Command processing complete
            setIsProcessingCommand(false);
        } catch (error) {
            // Fast error path
            const dc = dataChannelRef.current;
            if (dc?.readyState === 'open') {
                dc.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                        type: 'function_call_output',
                        call_id: callId,
                        output: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : 'Function call failed'
                        })
                    }
                }));
            }
            performanceMonitor.endTimer(`voiceAgent_${name}`);
            if (DEBUG) console.error('❌ Error:', error);
            // Command processing complete even on error
            setIsProcessingCommand(false);
        }
    }, [executeTool])

    const handleDisconnect = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
            peerConnectionRef.current = null
        }
        if (dataChannelRef.current) {
            dataChannelRef.current.close()
            dataChannelRef.current = null
        }
        if (audioContext) {
            audioContext.close()
            setAudioContext(null)
        }
        setUserAnalyser(null)
        setAgentAnalyser(null)
        // Clear executed call IDs to prevent memory leaks
        executedCallIdsRef.current.clear()
        pendingToolCallRef.current = null
        setIsConnected(false)
        setIsSpeaking(false)
        setIsProcessingCommand(false)
    }

    const handleStartVoice = async () => {
        const DEBUG = false; // Set to true for debugging

        if (!session) {
            setError('Please sign in to use voice assistant');
            return;
        }

        if (isConnected) {
            if (DEBUG) console.log('🛑 Disconnecting...');
            handleDisconnect();
            return;
        }

        if (DEBUG) console.log('🚀 Starting voice assistant...');
        setIsLoading(true);
        setError(null);

        try {
            const { relayUrl } = await getVoiceRelayUrl();
            if (DEBUG) console.log('✅ Relay URL obtained');

            // Create audio context for visualization
            const ctx = new AudioContext();
            setAudioContext(ctx);

            // Create RTCPeerConnection
            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;

            // Set up audio element to receive remote audio
            const audioEl = audioElementRef.current;
            if (audioEl) {
                pc.ontrack = (e) => {
                    if (DEBUG) console.log('🎵 Received remote audio track');
                    audioEl.srcObject = e.streams[0];

                    // Set up agent audio analyser
                    const agentSource = ctx.createMediaStreamSource(e.streams[0]);
                    const agentAnalyserNode = ctx.createAnalyser();
                    agentAnalyserNode.smoothingTimeConstant = 0.8;
                    agentSource.connect(agentAnalyserNode);
                    setAgentAnalyser(agentAnalyserNode);
                };
            }

            // Add local audio track from microphone
            const ms = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            pc.addTrack(ms.getTracks()[0]);

            // Set up user audio analyser
            const userSource = ctx.createMediaStreamSource(ms);
            const userAnalyserNode = ctx.createAnalyser();
            userAnalyserNode.smoothingTimeConstant = 0.8;
            userSource.connect(userAnalyserNode);
            setUserAnalyser(userAnalyserNode);

            // Set up data channel for sending/receiving events
            const dc = pc.createDataChannel('oai-events');
            dataChannelRef.current = dc;

            dc.addEventListener('open', () => {
                if (DEBUG) console.log('🔌 Data channel opened');
                setIsConnected(true);
                setIsLoading(false);

                // Send session update to configure the session with tools
                const centerX = viewportCenter?.x ?? 25000
                const centerY = viewportCenter?.y ?? 25000
                const shapeContext = generateShapeContext(canvasShapes)

                const instructions = `You are a helpful AI assistant that can manipulate shapes on a collaborative canvas. The canvas is 50000x50000 pixels (coordinates from 0 to 50000). The user's current viewport is centered at (${Math.round(centerX)}, ${Math.round(centerY)}).

IMPORTANT SHAPE CREATION GUIDELINES:
- When creating a SINGLE shape without explicit coordinates, place it at the viewport center (${Math.round(centerX)}, ${Math.round(centerY)}) for best visibility.
- When creating MULTIPLE shapes (e.g., "three circles", "five rectangles", "create 3 shapes"):
  * ALWAYS calculate specific x and y coordinates for each shape to space them properly
  * NEVER place multiple shapes at the same coordinates - they will stack and be invisible
  * For horizontal spacing: Use 300-400 pixel spacing between shapes (e.g., x positions: ${Math.round(centerX) - 400}, ${Math.round(centerX)}, ${Math.round(centerX) + 400})
  * For vertical spacing: Use 300-400 pixel spacing between shapes (e.g., y positions: ${Math.round(centerY) - 400}, ${Math.round(centerY)}, ${Math.round(centerY) + 400})
  * For grid layouts: Arrange shapes in rows and columns with appropriate spacing
  * Always specify explicit x and y coordinates for each shape in the shapes array
- When asked to space shapes "evenly" or "horizontally" or "vertically", distribute them with consistent spacing relative to the viewport center
- Default to horizontal arrangement unless the user specifies otherwise

${shapeContext}

When the user refers to objects by their content (like "the Hello World text" or "the red circle"), use the shape IDs from the list above to identify and modify them. You can use updateShapes with an array of shape updates to modify existing objects. Always pass an array to updateShapes, even for a single shape: updateShapes({shapes: [{shapeId: "id", color: "#FF0000"}]})`

                const sessionUpdatePayload = {
                    type: 'session.update',
                    session: {
                        turn_detection: { type: 'server_vad' },
                        input_audio_transcription: { model: 'whisper-1' },
                        tools: tools,
                        tool_choice: 'auto',
                        instructions
                    }
                };
                if (DEBUG) console.log('📨 Sending session update:', { toolCount: tools.length });
                dc.send(JSON.stringify(sessionUpdatePayload));
            });

            dc.addEventListener('message', (e) => {
                const DEBUG = false; // Set to true for debugging

                try {
                    const event = JSON.parse(e.data);
                    const eventType = event.type;

                    // Fast path: handle most common events with minimal processing
                    switch (eventType) {
                        case 'response.audio.delta':
                        case 'response.audio_transcript.delta':
                            setIsSpeaking(true);
                            return;

                        case 'response.done':
                        case 'response.audio.done':
                            setIsSpeaking(false);
                            return;

                        case 'input_audio_buffer.speech_started':
                        case 'input_audio_buffer.speech_stopped':
                            return; // Skip noisy events

                        case 'session.updated':
                            if (DEBUG) console.log('✅ Session updated');
                            return;

                        case 'response.output_item.added':
                            if (event.item?.type === 'function_call') {
                                pendingToolCallRef.current = {
                                    call_id: event.item.call_id || '',
                                    name: event.item.name || '',
                                    arguments: ''
                                };
                                // Show loading spinner when command starts
                                setIsProcessingCommand(true);
                            }
                            return;

                        case 'response.function_call_arguments.delta':
                            // Fast path: accumulate arguments
                            if (!pendingToolCallRef.current) {
                                pendingToolCallRef.current = {
                                    call_id: event.call_id,
                                    name: event.name || '',
                                    arguments: ''
                                };
                            }
                            if (event.call_id) pendingToolCallRef.current.call_id = event.call_id;
                            if (event.name) pendingToolCallRef.current.name = event.name;
                            pendingToolCallRef.current.arguments += event.delta;
                            return;

                        case 'response.function_call_arguments.done':
                            // Execute immediately
                            const toolCall = pendingToolCallRef.current;
                            if (toolCall?.name && toolCall.call_id && !executedCallIdsRef.current.has(toolCall.call_id)) {
                                handleFunctionCall(toolCall.call_id, toolCall.name, toolCall.arguments);
                                executedCallIdsRef.current.add(toolCall.call_id);
                                pendingToolCallRef.current = null;
                            }
                            return;

                        case 'response.output_item.done':
                            // Fallback execution path
                            if (event.item?.type === 'function_call') {
                                const { call_id, name, arguments: args } = event.item;
                                if (call_id && name && args && !executedCallIdsRef.current.has(call_id)) {
                                    handleFunctionCall(call_id, name, args);
                                    executedCallIdsRef.current.add(call_id);
                                    pendingToolCallRef.current = null;
                                }
                            }
                            return;

                        case 'error':
                            if (DEBUG) console.error('❌ OpenAI error:', event);
                            return;

                        default:
                            if (DEBUG) console.log('📥 Event:', eventType);
                    }
                } catch (err) {
                    if (DEBUG) console.error('❌ Parse error:', err);
                }
            })

            dc.addEventListener('close', () => {
                if (DEBUG) console.log('🔌 Data channel closed');
                handleDisconnect();
            });

            dc.addEventListener('error', (e) => {
                if (DEBUG) console.error('❌ Data channel error:', e);
                setError('Connection error occurred');
                handleDisconnect();
            });

            // Create and set local description (SDP offer)
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Send the offer to OpenAI and get back the answer
            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2024-12-17';
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${relayUrl}`,
                    'Content-Type': 'application/sdp',
                },
            });

            if (!sdpResponse.ok) {
                const errorText = await sdpResponse.text();
                if (DEBUG) console.error('❌ Failed to connect:', sdpResponse.status, errorText);
                throw new Error(`Failed to connect to OpenAI: ${sdpResponse.statusText}`);
            }

            const answerSdp = await sdpResponse.text();
            await pc.setRemoteDescription({
                type: 'answer',
                sdp: answerSdp,
            });
            if (DEBUG) console.log('🎉 Voice assistant ready!');
        } catch (err) {
            if (DEBUG) console.error('❌ Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to start voice assistant');
            handleDisconnect();
            setIsLoading(false);
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, rgba(10, 10, 35, 0.95) 0%, rgba(20, 10, 40, 0.95) 50%, rgba(10, 10, 35, 0.95) 100%)',
                border: '2px solid transparent',
                borderRadius: '20px',
                padding: '20px 32px',
                boxShadow: 'none',
                backdropFilter: 'blur(20px)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '24px',
                overflow: 'hidden',
            }}
            className="voice-panel-space"
        >
            {/* Animated background stars */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 20% 50%, rgba(100, 50, 200, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(50, 100, 255, 0.1) 0%, transparent 50%)',
                    animation: 'pulse 4s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            />

            {/* Border glow effect */}
            <div
                style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    background: 'linear-gradient(90deg, #6432c8 0%, #3264ff 25%, #c832c8 50%, #3264ff 75%, #6432c8 100%)',
                    backgroundSize: '300% 100%',
                    animation: 'borderFlow 6s linear infinite',
                    borderRadius: '20px',
                    zIndex: -2,
                    opacity: 0.6,
                }}
            />

            {/* Title Section */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '140px',
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #a0f0ff 0%, #c8a0ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        textShadow: '0 0 20px rgba(160, 240, 255, 0.5)',
                    }}
                >
                    Voice Assistant
                </h3>
                {isConnected && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            backgroundColor: isSpeaking ? 'rgba(200, 100, 255, 0.15)' : 'rgba(100, 200, 255, 0.15)',
                            border: `1px solid ${isSpeaking ? '#c864ff' : '#64c8ff'}`,
                            borderRadius: '20px',
                            boxShadow: isSpeaking ? '0 0 20px rgba(200, 100, 255, 0.4)' : '0 0 20px rgba(100, 200, 255, 0.4)',
                        }}
                    >
                        <div
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: isSpeaking ? '#c864ff' : '#64c8ff',
                                animation: 'pulse 1.5s ease-in-out infinite',
                                boxShadow: isSpeaking ? '0 0 10px #c864ff' : '0 0 10px #64c8ff',
                            }}
                        />
                        <span style={{
                            color: isSpeaking ? '#c864ff' : '#64c8ff',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}>
                            {isSpeaking ? 'AI Active' : 'Listening'}
                        </span>
                    </div>
                )}
            </div>

            {/* Audio Visualizers */}
            {isConnected && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '16px',
                        flex: 1,
                    }}
                >
                    <AudioVisualizer
                        audioContext={audioContext}
                        analyserNode={userAnalyser}
                        label="Your Voice"
                        color="#64c8ff"
                    />
                    <AudioVisualizer
                        audioContext={audioContext}
                        analyserNode={agentAnalyser}
                        label="Agent Voice"
                        color="#c864ff"
                        isProcessing={isProcessingCommand}
                    />
                </div>
            )}

            {/* Control Button */}
            <button
                onClick={handleStartVoice}
                disabled={isLoading}
                style={{
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#ffffff',
                    background: isLoading
                        ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.5), rgba(150, 150, 150, 0.5))'
                        : isConnected
                            ? 'linear-gradient(135deg, rgba(255, 50, 100, 0.8), rgba(200, 0, 50, 0.8))'
                            : 'linear-gradient(135deg, rgba(100, 50, 200, 0.6), rgba(50, 100, 255, 0.6))',
                    border: isLoading
                        ? '2px solid rgba(150, 150, 150, 0.5)'
                        : isConnected
                            ? '2px solid #ff3264'
                            : '2px solid #6432c8',
                    borderRadius: '12px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textShadow: isLoading
                        ? 'none'
                        : isConnected
                            ? '0 0 10px rgba(255, 50, 100, 0.8)'
                            : '0 0 20px rgba(100, 200, 255, 0.8)',
                    boxShadow: isLoading
                        ? 'none'
                        : isConnected
                            ? '0 0 30px rgba(255, 50, 100, 0.4)'
                            : '0 0 30px rgba(100, 50, 200, 0.4)',
                    minWidth: '120px',
                }}
                className={!isLoading && !isConnected ? 'space-button' : ''}
                onMouseEnter={(e) => {
                    if (!isLoading) {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = isConnected
                            ? '0 0 40px rgba(255, 50, 100, 0.6)'
                            : '0 0 40px rgba(100, 50, 200, 0.6)'
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isLoading) {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = isConnected
                            ? '0 0 30px rgba(255, 50, 100, 0.4)'
                            : '0 0 30px rgba(100, 50, 200, 0.4)'
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
                            background: 'linear-gradient(45deg, transparent 30%, rgba(100, 200, 255, 0.4) 50%, rgba(200, 100, 255, 0.4) 55%, transparent 70%)',
                            animation: 'shimmer 3s infinite',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                    {isLoading ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
                </span>
            </button>

            {error && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(255, 50, 100, 0.2)',
                        border: '1px solid #ff3264',
                        borderRadius: '8px',
                        color: '#ff6496',
                        fontSize: '12px',
                        fontWeight: 600,
                        textAlign: 'center',
                        boxShadow: '0 0 20px rgba(255, 50, 100, 0.3)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {error}
                </div>
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
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(0.95);
            }
          }
          
          @keyframes borderFlow {
            0% {
              background-position: 0% 0;
            }
            100% {
              background-position: 300% 0;
            }
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          
          .space-button::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(
              90deg,
              #6432c8 0%,
              #3264ff 25%,
              #c832c8 50%,
              #3264ff 75%,
              #6432c8 100%
            );
            background-size: 300% 100%;
            animation: borderFlow 4s linear infinite;
            border-radius: 14px;
            z-index: -1;
            opacity: 0.4;
          }
          
        `}
            </style>
        </div>
    )
}

