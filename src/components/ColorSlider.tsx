import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'

interface ColorSliderProps {
    valueHex: string
    onChangeHex: (hex: string) => void
    label?: string
    allowHexEdit?: boolean
    layout?: 'row' | 'column'
}

// Converts a hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace('#', '')
    if (clean.length !== 6) return null
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
    return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (v: number) => v.toString(16).padStart(2, '0')
    return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(Math.max(0, Math.min(255, Math.round(g))))}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max - min)
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
        }
        h *= 60
    }
    return { h, s, l }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r1 = 0, g1 = 0, b1 = 0
    if (h < 60) { r1 = c; g1 = x; b1 = 0 }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0 }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c }
    else { r1 = c; g1 = 0; b1 = x }
    return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 }
}

const ColorSlider: React.FC<ColorSliderProps> = ({ valueHex, onChangeHex, label, allowHexEdit = true, layout = 'row' }) => {
    const [hue, setHue] = useState<number>(0)
    const baseSLRef = useRef<{ s: number; l: number }>({ s: 1, l: 0.5 })
    const hexLastTapTsRef = useRef<number>(0)

    // Sync internal hue/baseSL with incoming hex
    useEffect(() => {
        const rgb = hexToRgb(valueHex)
        if (!rgb) return
        const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)
        const baseS = s < 0.05 ? 0.9 : s
        const baseL = s < 0.05 ? 0.5 : l
        baseSLRef.current = { s: baseS, l: baseL }
        setHue(h)
    }, [valueHex])

    const currentHexFromHue = useMemo(() => {
        const { s, l } = baseSLRef.current
        const { r, g, b } = hslToRgb(hue, s, l)
        return rgbToHex(r, g, b)
    }, [hue])

    const handleHueChange = useCallback((newHue: number) => {
        setHue(newHue)
        const { s, l } = baseSLRef.current
        const { r, g, b } = hslToRgb(newHue, s, l)
        onChangeHex(rgbToHex(r, g, b))
    }, [onChangeHex])

    const normalizeHex = useCallback((val: string): string | null => {
        let v = val.trim()
        if (v.startsWith('#')) v = v.slice(1)
        v = v.toLowerCase()
        if (/^[0-9a-f]{3}$/.test(v)) {
            v = v.split('').map(c => c + c).join('')
        }
        if (!/^[0-9a-f]{6}$/.test(v)) return null
        return `#${v.toUpperCase()}`
    }, [])

    const promptHex = useCallback(() => {
        if (!allowHexEdit) return
        const currentHex = (valueHex || currentHexFromHue || '#FFFFFF').toUpperCase()
        const value = window.prompt('Enter hex color (e.g. #FF00FF or 0AF):', currentHex)
        if (value == null) return
        const normalized = normalizeHex(value)
        if (!normalized) return
        onChangeHex(normalized)
    }, [allowHexEdit, currentHexFromHue, normalizeHex, onChangeHex, valueHex])

    return (
        <div style={{ display: 'flex', flexDirection: layout === 'column' ? 'column' : 'row', alignItems: 'center', gap: '10px' }}>
            {label && (
                <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>{label}</div>
            )}
            <div
                style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: '1px solid #404040',
                    backgroundColor: currentHexFromHue,
                    boxShadow: `0 0 6px ${currentHexFromHue}`,
                }}
                title={currentHexFromHue}
            />
            <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={Math.round(hue)}
                onChange={(e) => handleHueChange(Number(e.target.value))}
                style={{
                    width: '180px',
                    WebkitAppearance: 'none',
                    height: '6px',
                    borderRadius: '4px',
                    background: 'linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                    outline: 'none',
                    border: '1px solid #303030',
                }}
            />
            {allowHexEdit && (
                <div
                    onDoubleClick={promptHex}
                    onTouchEnd={() => {
                        const now = performance.now()
                        if (now - hexLastTapTsRef.current < 300) {
                            promptHex()
                        }
                        hexLastTapTsRef.current = now
                    }}
                    style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ddd', cursor: 'text' }}
                    title="Double-click to edit hex"
                >
                    {currentHexFromHue.toUpperCase()}
                </div>
            )}
        </div>
    )
}

export default memo(ColorSlider, (prevProps, nextProps) => {
    // Only re-render if value or config changed
    return (
        prevProps.valueHex === nextProps.valueHex &&
        prevProps.label === nextProps.label &&
        prevProps.allowHexEdit === nextProps.allowHexEdit &&
        prevProps.layout === nextProps.layout
    )
})


