import React, { useState, useEffect, memo } from 'react'
import ColorSlider from './ColorSlider'

interface ShapeSelectionPanelProps {
    selectedShape: {
        id: string
        type: string
        color: string
        rotation?: number
        opacity?: number
        shadowColor?: string
        shadowStrength?: number
        fontFamily?: string
        fontWeight?: string
    }
    onChangeColor: (hex: string) => void
    onChangeOpacity: (opacity01: number) => void
    onCommitRotation: (rotationDeg: number) => void
    onChangeShadowColor: (hex: string) => void
    onChangeShadowStrength: (strength: number) => void
    onChangeFontFamily: (family: string) => void
    onChangeFontWeight: (weight: string) => void
}

const ShapeSelectionPanel: React.FC<ShapeSelectionPanelProps> = ({
    selectedShape,
    onChangeColor,
    onChangeOpacity,
    onCommitRotation,
    onChangeShadowColor,
    onChangeShadowStrength,
    onChangeFontFamily,
    onChangeFontWeight,
}) => {
    const [rotationInput, setRotationInput] = useState<string>('0')
    const [opacityPct, setOpacityPct] = useState<number>(100)
    const [shadowStrength, setShadowStrength] = useState<number>(0)

    useEffect(() => {
        setRotationInput(String(Math.round(selectedShape.rotation ?? 0)))
        setOpacityPct(Math.round(((selectedShape.opacity ?? 1) * 100)))
        setShadowStrength(Math.max(0, Math.round(selectedShape.shadowStrength ?? 0)))
    }, [selectedShape])

    const isText = selectedShape.type === 'text'

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 20,
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid #404040',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 8px 32px #1c1c1c66',
            minWidth: '260px',
            color: '#fff',
        }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Selection
            </div>

            {/* Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <ColorSlider
                    valueHex={selectedShape.color}
                    onChangeHex={onChangeColor}
                    allowHexEdit={true}
                    label="Color"
                    layout="row"
                />
            </div>

            {/* Opacity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '70px' }}>Opacity</div>
                <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={opacityPct}
                    onChange={(e) => {
                        const pct = Number(e.target.value)
                        setOpacityPct(pct)
                        onChangeOpacity(pct / 100)
                    }}
                    style={{ width: '160px' }}
                />
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ddd', width: '36px', textAlign: 'right' }}>{opacityPct}%</div>
            </div>

            {/* Rotation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '70px' }}>Rotation</div>
                <input
                    type="number"
                    value={rotationInput}
                    onChange={(e) => {
                        setRotationInput(e.target.value)
                        const num = Number(e.target.value)
                        if (!Number.isNaN(num)) onCommitRotation(num)
                    }}
                    style={{
                        width: '100px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                    }}
                />
                <div style={{ fontSize: '12px', color: '#ccc' }}>deg</div>
            </div>

            {/* Shadow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Shadow</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ColorSlider
                        valueHex={selectedShape.shadowColor || '#1c1c1c'}
                        onChangeHex={onChangeShadowColor}
                        allowHexEdit={true}
                        label="Color"
                        layout="row"
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '70px' }}>Strength</div>
                    <input
                        type="range"
                        min={0}
                        max={50}
                        step={1}
                        value={shadowStrength}
                        onChange={(e) => {
                            const v = Number(e.target.value)
                            setShadowStrength(v)
                            onChangeShadowStrength(v)
                        }}
                        style={{ width: '160px' }}
                    />
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ddd', width: '36px', textAlign: 'right' }}>{shadowStrength}</div>
                </div>
            </div>

            {/* Font controls (only for text) */}
            {isText && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '70px' }}>Font</div>
                        <select
                            value={selectedShape.fontFamily ?? 'Inter'}
                            onChange={(e) => onChangeFontFamily(e.target.value)}
                            style={{
                                backgroundColor: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                width: '160px',
                            }}
                        >
                            <option value="Inter">Inter</option>
                            <option value="Arial">Arial</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Comic Sans MS">Comic Sans MS</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '70px' }}>Weight</div>
                        <select
                            value={selectedShape.fontWeight ?? 'normal'}
                            onChange={(e) => onChangeFontWeight(e.target.value)}
                            style={{
                                backgroundColor: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                width: '160px',
                            }}
                        >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="300">300</option>
                            <option value="400">400</option>
                            <option value="500">500</option>
                            <option value="600">600</option>
                            <option value="700">700</option>
                            <option value="800">800</option>
                            <option value="900">900</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    )
}

// Memoize to prevent unnecessary re-renders
export default memo(ShapeSelectionPanel)


