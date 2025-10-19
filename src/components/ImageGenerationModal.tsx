import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, X } from 'lucide-react'

interface ImageGenerationModalProps {
    onClose: () => void
    onGenerate: (prompt: string, options: ImageGenerationOptions) => void
    isGenerating?: boolean
}

export interface ImageGenerationOptions {
    style: 'vivid' | 'natural'
    size: '1024x1024' | '1024x1792' | '1792x1024'
    quality: 'standard' | 'hd'
}

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
    onClose,
    onGenerate,
    isGenerating = false
}) => {
    const [prompt, setPrompt] = useState('')
    const [style, setStyle] = useState<'vivid' | 'natural'>('vivid')
    const [size, setSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1792x1024')
    const [quality, setQuality] = useState<'standard' | 'hd'>('hd')
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        // Focus input on mount
        inputRef.current?.focus()

        // Close on escape
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (prompt.trim() && !isGenerating) {
            onGenerate(prompt.trim(), { style, size, quality })
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    width: '100%',
                    maxWidth: '600px',
                    padding: '0',
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 24px',
                        borderBottom: '1px solid #2a2a2a',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={24} color="#24ccff" />
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#ffffff' }}>
                            Generate Image with AI
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888888',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {/* Prompt Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#cccccc',
                            }}
                        >
                            Describe the image you want to generate
                        </label>
                        <textarea
                            ref={inputRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A futuristic cityscape at sunset with flying cars..."
                            disabled={isGenerating}
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '12px',
                                backgroundColor: '#0a0a0a',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#24ccff')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#404040')}
                        />
                    </div>

                    {/* Options Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '16px',
                            marginBottom: '24px',
                        }}
                    >
                        {/* Style */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#cccccc',
                                }}
                            >
                                Style
                            </label>
                            <select
                                value={style}
                                onChange={(e) => setStyle(e.target.value as 'vivid' | 'natural')}
                                disabled={isGenerating}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid #404040',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            >
                                <option value="vivid">Vivid</option>
                                <option value="natural">Natural</option>
                            </select>
                        </div>

                        {/* Orientation */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#cccccc',
                                }}
                            >
                                Orientation
                            </label>
                            <select
                                value={size}
                                onChange={(e) => setSize(e.target.value as '1024x1024' | '1024x1792' | '1792x1024')}
                                disabled={isGenerating}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid #404040',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            >
                                <option value="1024x1024">Square</option>
                                <option value="1024x1792">Portrait</option>
                                <option value="1792x1024">Landscape</option>
                            </select>
                        </div>

                        {/* Quality */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#cccccc',
                                }}
                            >
                                Quality
                            </label>
                            <select
                                value={quality}
                                onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                                disabled={isGenerating}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid #404040',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            >
                                <option value="standard">Standard</option>
                                <option value="hd">HD</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isGenerating}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'transparent',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                color: '#cccccc',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: isGenerating ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isGenerating) {
                                    e.currentTarget.style.backgroundColor = '#2a2a2a'
                                }
                            }}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!prompt.trim() || isGenerating}
                            style={{
                                padding: '10px 24px',
                                backgroundColor: prompt.trim() && !isGenerating ? '#24ccff' : '#1a4a5a',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: prompt.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                            onMouseEnter={(e) => {
                                if (prompt.trim() && !isGenerating) {
                                    e.currentTarget.style.backgroundColor = '#1aa3d9'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (prompt.trim() && !isGenerating) {
                                    e.currentTarget.style.backgroundColor = '#24ccff'
                                }
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <div
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid #ffffff',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                        }}
                                    />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Add keyframes animation */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default ImageGenerationModal

