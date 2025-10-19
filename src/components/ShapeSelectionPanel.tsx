import React, { useState, useEffect, memo, useMemo, useRef } from 'react'
import ColorSlider from './ColorSlider'

interface ShapeSelectionPanelProps {
    selectedShape: {
        id: string
        type: string
        color: string
        x: number
        y: number
        width?: number
        height?: number
        radius?: number
        rotation?: number
        opacity?: number
        shadowColor?: string
        shadowStrength?: number
        borderRadius?: number
        fontFamily?: string
        fontWeight?: string
        imageUrl?: string
        iconName?: string
    }
    onChangeColor: (hex: string) => void
    onChangeOpacity: (opacity01: number) => void
    onCommitRotation: (rotationDeg: number) => void
    onChangeShadowColor: (hex: string) => void
    onChangeShadowStrength: (strength: number) => void
    onChangeBorderRadius?: (borderRadius: number) => void
    onChangeFontFamily: (family: string) => void
    onChangeFontWeight: (weight: string) => void
    onChangeImageUrl?: (url: string) => void
    onChangeIconName?: (iconName: string) => void
    onChangeX?: (x: number) => void
    onChangeY?: (y: number) => void
    onChangeWidth?: (width: number) => void
    onChangeHeight?: (height: number) => void
    onChangeRadius?: (radius: number) => void
    isDraggingOpacityRef?: React.MutableRefObject<boolean>
    isDraggingShadowStrengthRef?: React.MutableRefObject<boolean>
    isDraggingBorderRadiusRef?: React.MutableRefObject<boolean>
}

const ShapeSelectionPanel: React.FC<ShapeSelectionPanelProps> = ({
    selectedShape,
    onChangeColor,
    onChangeOpacity,
    onCommitRotation,
    onChangeShadowColor,
    onChangeShadowStrength,
    onChangeBorderRadius,
    onChangeFontFamily,
    onChangeFontWeight,
    onChangeImageUrl,
    onChangeIconName,
    onChangeX,
    onChangeY,
    onChangeWidth,
    onChangeHeight,
    onChangeRadius,
    isDraggingOpacityRef,
    isDraggingShadowStrengthRef,
    isDraggingBorderRadiusRef,
}) => {
    const [rotationInput, setRotationInput] = useState<string>('0')
    const [opacityPct, setOpacityPct] = useState<number>(100)
    const [shadowStrength, setShadowStrength] = useState<number>(0)
    const [borderRadius, setBorderRadius] = useState<number>(0)
    const [xInput, setXInput] = useState<string>('0')
    const [yInput, setYInput] = useState<string>('0')
    const [widthInput, setWidthInput] = useState<string>('0')
    const [heightInput, setHeightInput] = useState<string>('0')
    const [radiusInput, setRadiusInput] = useState<string>('0')

    // Track which sliders are currently being dragged
    const isDraggingOpacity = useRef<boolean>(false)
    const isDraggingShadowStrength = useRef<boolean>(false)
    const isDraggingBorderRadius = useRef<boolean>(false)

    // Track recently released sliders with timestamps to prevent immediate updates
    const recentlyReleasedOpacity = useRef<{ value: number; timestamp: number } | null>(null)
    const recentlyReleasedShadowStrength = useRef<{ value: number; timestamp: number } | null>(null)
    const recentlyReleasedBorderRadius = useRef<{ value: number; timestamp: number } | null>(null)

    // Memoize shape properties to avoid unnecessary updates
    const shapeId = selectedShape.id
    const shapeType = selectedShape.type
    const shapeColor = selectedShape.color
    const shapeX = selectedShape.x
    const shapeY = selectedShape.y
    const shapeWidth = selectedShape.width
    const shapeHeight = selectedShape.height
    const shapeRadius = selectedShape.radius
    const shapeRotation = selectedShape.rotation ?? 0
    const shapeOpacity = selectedShape.opacity ?? 1
    const shapeShadowColor = selectedShape.shadowColor ?? '#1c1c1c'
    const shapeShadowStrength = selectedShape.shadowStrength ?? 0
    const shapeBorderRadius = selectedShape.borderRadius ?? 0
    const shapeFontFamily = selectedShape.fontFamily ?? 'Inter'
    const shapeFontWeight = selectedShape.fontWeight ?? 'normal'

    useEffect(() => {
        setRotationInput(String(Math.round(shapeRotation)))
        setXInput(String(Math.round(shapeX)))
        setYInput(String(Math.round(shapeY)))
        if (shapeWidth !== undefined) setWidthInput(String(Math.round(shapeWidth)))
        if (shapeHeight !== undefined) setHeightInput(String(Math.round(shapeHeight)))
        if (shapeRadius !== undefined) setRadiusInput(String(Math.round(shapeRadius)))

        // Only update slider values if not actively dragging them or recently released
        if (!isDraggingOpacity.current) {
            const recent = recentlyReleasedOpacity.current
            if (recent && Date.now() - recent.timestamp < 1000) {
                // Within 1000ms grace period, preserve the released value
                setOpacityPct(recent.value)
            } else {
                // Clear old entries and update from server
                recentlyReleasedOpacity.current = null
                setOpacityPct(Math.round(shapeOpacity * 100))
            }
        }

        if (!isDraggingShadowStrength.current) {
            const recent = recentlyReleasedShadowStrength.current
            if (recent && Date.now() - recent.timestamp < 1000) {
                setShadowStrength(recent.value)
            } else {
                recentlyReleasedShadowStrength.current = null
                setShadowStrength(Math.max(0, Math.round(shapeShadowStrength)))
            }
        }

        if (!isDraggingBorderRadius.current) {
            const recent = recentlyReleasedBorderRadius.current
            if (recent && Date.now() - recent.timestamp < 1000) {
                setBorderRadius(recent.value)
            } else {
                recentlyReleasedBorderRadius.current = null
                setBorderRadius(Math.max(0, Math.round(shapeBorderRadius)))
            }
        }
    }, [shapeId, shapeRotation, shapeOpacity, shapeShadowStrength, shapeBorderRadius, shapeX, shapeY, shapeWidth, shapeHeight, shapeRadius])

    const isText = useMemo(() => shapeType === 'text', [shapeType])
    const isRectangle = useMemo(() => shapeType === 'rectangle', [shapeType])
    const isCircle = useMemo(() => shapeType === 'circle', [shapeType])
    const isImage = useMemo(() => shapeType === 'image', [shapeType])
    const isIcon = useMemo(() => shapeType === 'icon', [shapeType])

    return (
        <div
            id="shape-selection-panel"
            style={{
                position: 'absolute',
                right: '0px',
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

            {/* Position */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Position</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '15px' }}>X</div>
                        <input
                            type="number"
                            value={xInput}
                            onChange={(e) => {
                                setXInput(e.target.value)
                                const num = Number(e.target.value)
                                if (!Number.isNaN(num) && onChangeX) onChangeX(num)
                            }}
                            style={{
                                flex: 1,
                                backgroundColor: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '12px',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '15px' }}>Y</div>
                        <input
                            type="number"
                            value={yInput}
                            onChange={(e) => {
                                setYInput(e.target.value)
                                const num = Number(e.target.value)
                                if (!Number.isNaN(num) && onChangeY) onChangeY(num)
                            }}
                            style={{
                                flex: 1,
                                backgroundColor: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '12px',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Dimensions - Width/Height for rectangles, text, and images */}
            {(isRectangle || isText || isImage) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Dimensions</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '15px' }}>W</div>
                            <input
                                type="number"
                                value={widthInput}
                                onChange={(e) => {
                                    setWidthInput(e.target.value)
                                    const num = Number(e.target.value)
                                    if (!Number.isNaN(num) && onChangeWidth) onChangeWidth(num)
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#333',
                                    color: '#fff',
                                    border: '1px solid #555',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '15px' }}>H</div>
                            <input
                                type="number"
                                value={heightInput}
                                onChange={(e) => {
                                    setHeightInput(e.target.value)
                                    const num = Number(e.target.value)
                                    if (!Number.isNaN(num) && onChangeHeight) onChangeHeight(num)
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#333',
                                    color: '#fff',
                                    border: '1px solid #555',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Radius for circles */}
            {isCircle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '70px' }}>Radius</div>
                    <input
                        type="number"
                        value={radiusInput}
                        onChange={(e) => {
                            setRadiusInput(e.target.value)
                            const num = Number(e.target.value)
                            if (!Number.isNaN(num) && onChangeRadius) onChangeRadius(num)
                        }}
                        style={{
                            flex: 1,
                            backgroundColor: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                        }}
                    />
                </div>
            )}

            {/* Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <ColorSlider
                    valueHex={shapeColor}
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
                    onMouseDown={() => {
                        isDraggingOpacity.current = true
                        if (isDraggingOpacityRef) isDraggingOpacityRef.current = true
                    }}
                    onMouseUp={() => {
                        isDraggingOpacity.current = false
                        if (isDraggingOpacityRef) isDraggingOpacityRef.current = false
                        // Store current value and timestamp for grace period
                        recentlyReleasedOpacity.current = {
                            value: opacityPct,
                            timestamp: Date.now()
                        }
                    }}
                    onTouchStart={() => {
                        isDraggingOpacity.current = true
                        if (isDraggingOpacityRef) isDraggingOpacityRef.current = true
                    }}
                    onTouchEnd={() => {
                        isDraggingOpacity.current = false
                        if (isDraggingOpacityRef) isDraggingOpacityRef.current = false
                        // Store current value and timestamp for grace period
                        recentlyReleasedOpacity.current = {
                            value: opacityPct,
                            timestamp: Date.now()
                        }
                    }}
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
                        valueHex={shapeShadowColor}
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
                        onMouseDown={() => {
                            isDraggingShadowStrength.current = true
                            if (isDraggingShadowStrengthRef) isDraggingShadowStrengthRef.current = true
                        }}
                        onMouseUp={() => {
                            isDraggingShadowStrength.current = false
                            if (isDraggingShadowStrengthRef) isDraggingShadowStrengthRef.current = false
                            // Store current value and timestamp for grace period
                            recentlyReleasedShadowStrength.current = {
                                value: shadowStrength,
                                timestamp: Date.now()
                            }
                        }}
                        onTouchStart={() => {
                            isDraggingShadowStrength.current = true
                            if (isDraggingShadowStrengthRef) isDraggingShadowStrengthRef.current = true
                        }}
                        onTouchEnd={() => {
                            isDraggingShadowStrength.current = false
                            if (isDraggingShadowStrengthRef) isDraggingShadowStrengthRef.current = false
                            // Store current value and timestamp for grace period
                            recentlyReleasedShadowStrength.current = {
                                value: shadowStrength,
                                timestamp: Date.now()
                            }
                        }}
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

            {/* Border Radius (only for rectangles) */}
            {isRectangle && onChangeBorderRadius && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '70px' }}>Radius</div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={borderRadius}
                        onMouseDown={() => {
                            isDraggingBorderRadius.current = true
                            if (isDraggingBorderRadiusRef) isDraggingBorderRadiusRef.current = true
                        }}
                        onMouseUp={() => {
                            isDraggingBorderRadius.current = false
                            if (isDraggingBorderRadiusRef) isDraggingBorderRadiusRef.current = false
                            // Store current value and timestamp for grace period
                            recentlyReleasedBorderRadius.current = {
                                value: borderRadius,
                                timestamp: Date.now()
                            }
                        }}
                        onTouchStart={() => {
                            isDraggingBorderRadius.current = true
                            if (isDraggingBorderRadiusRef) isDraggingBorderRadiusRef.current = true
                        }}
                        onTouchEnd={() => {
                            isDraggingBorderRadius.current = false
                            if (isDraggingBorderRadiusRef) isDraggingBorderRadiusRef.current = false
                            // Store current value and timestamp for grace period
                            recentlyReleasedBorderRadius.current = {
                                value: borderRadius,
                                timestamp: Date.now()
                            }
                        }}
                        onChange={(e) => {
                            const v = Number(e.target.value)
                            setBorderRadius(v)
                            onChangeBorderRadius(v)
                        }}
                        style={{ width: '160px' }}
                    />
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ddd', width: '36px', textAlign: 'right' }}>{borderRadius}</div>
                </div>
            )}

            {/* Image URL (only for images) */}
            {isImage && onChangeImageUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Image URL</div>
                    <input
                        type="text"
                        value={selectedShape.imageUrl || ''}
                        onChange={(e) => onChangeImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        style={{
                            backgroundColor: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            width: '100%',
                        }}
                    />
                </div>
            )}

            {/* Icon selection (only for icons) */}
            {isIcon && onChangeIconName && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600 }}>Icon</div>
                    <select
                        value={selectedShape.iconName || 'star'}
                        onChange={(e) => onChangeIconName(e.target.value)}
                        style={{
                            backgroundColor: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            width: '100%',
                        }}
                    >
                        <optgroup label="General & Feedback">
                            <option value="smile">😊 Smile</option>
                            <option value="heart">❤️ Heart</option>
                            <option value="star">⭐ Star</option>
                            <option value="check">✅ Check</option>
                            <option value="cross">❌ Cross</option>
                            <option value="fire">🔥 Fire</option>
                            <option value="rocket">🚀 Rocket</option>
                            <option value="thumbs-up">👍 Thumbs Up</option>
                            <option value="thumbs-down">👎 Thumbs Down</option>
                            <option value="warning">⚠️ Warning</option>
                            <option value="info">ℹ️ Info</option>
                            <option value="question">❓ Question</option>
                            <option value="lightbulb">💡 Lightbulb</option>
                            <option value="flag">🚩 Flag</option>
                            <option value="pin">📌 Pin</option>
                            <option value="calendar">📅 Calendar</option>
                            <option value="clock">🕐 Clock</option>
                            <option value="home">🏠 Home</option>
                            <option value="folder">📁 Folder</option>
                            <option value="email">📧 Email</option>
                        </optgroup>
                        <optgroup label="Profile & Account">
                            <option value="user">👤 User</option>
                            <option value="users">👥 Users</option>
                            <option value="lock">🔐 Lock</option>
                            <option value="unlock">🔓 Unlock</option>
                            <option value="key">🔑 Key</option>
                            <option value="settings">⚙️ Settings</option>
                            <option value="profile">👨‍💼 Profile</option>
                            <option value="shield">🛡️ Shield</option>
                        </optgroup>
                        <optgroup label="Shopping & E-commerce">
                            <option value="cart">🛒 Cart</option>
                            <option value="card">💳 Card</option>
                            <option value="money">💰 Money</option>
                            <option value="tag">🏷️ Tag</option>
                            <option value="package">📦 Package</option>
                            <option value="payment">💸 Payment</option>
                            <option value="bag">🛍️ Bag</option>
                            <option value="receipt">🧾 Receipt</option>
                            <option value="gift">🎁 Gift</option>
                            <option value="diamond">💎 Diamond</option>
                        </optgroup>
                        <optgroup label="Booking & Travel">
                            <option value="plane">✈️ Plane</option>
                            <option value="hotel">🏨 Hotel</option>
                            <option value="ticket">🎫 Ticket</option>
                            <option value="globe">🌐 Globe</option>
                            <option value="map">🗺️ Map</option>
                            <option value="compass">🧭 Compass</option>
                            <option value="car">🚗 Car</option>
                            <option value="train">🚆 Train</option>
                        </optgroup>
                        <optgroup label="Social & Communication">
                            <option value="chat">💬 Chat</option>
                            <option value="phone">📱 Phone</option>
                            <option value="camera">📸 Camera</option>
                            <option value="eye">👁️ Eye</option>
                            <option value="bell">🔔 Bell</option>
                            <option value="message">💌 Message</option>
                            <option value="megaphone">📣 Megaphone</option>
                            <option value="video">📹 Video</option>
                            <option value="mic">🎤 Mic</option>
                        </optgroup>
                        <optgroup label="SaaS & Productivity">
                            <option value="chart">📊 Chart</option>
                            <option value="trending-up">📈 Trending Up</option>
                            <option value="trending-down">📉 Trending Down</option>
                            <option value="search">🔍 Search</option>
                            <option value="edit">📝 Edit</option>
                            <option value="save">💾 Save</option>
                            <option value="cloud">☁️ Cloud</option>
                            <option value="refresh">🔄 Refresh</option>
                            <option value="download">⬇️ Download</option>
                            <option value="upload">⬆️ Upload</option>
                            <option value="plus">➕ Plus</option>
                            <option value="minus">➖ Minus</option>
                            <option value="trash">🗑️ Trash</option>
                            <option value="clipboard">📋 Clipboard</option>
                            <option value="document">📄 Document</option>
                            <option value="book">📖 Book</option>
                            <option value="bookmark">🔖 Bookmark</option>
                            <option value="link">🔗 Link</option>
                        </optgroup>
                        <optgroup label="Events & Celebrations">
                            <option value="party">🎉 Party</option>
                            <option value="cake">🎂 Cake</option>
                            <option value="balloons">🎈 Balloons</option>
                            <option value="trophy">🏆 Trophy</option>
                            <option value="medal">🏅 Medal</option>
                            <option value="crown">👑 Crown</option>
                        </optgroup>
                        <optgroup label="Status & Indicators">
                            <option value="battery">🔋 Battery</option>
                            <option value="signal">📶 Signal</option>
                            <option value="wifi">📡 WiFi</option>
                            <option value="location">📍 Location</option>
                            <option value="target">🎯 Target</option>
                            <option value="hourglass">⏳ Hourglass</option>
                            <option value="stopwatch">⏱️ Stopwatch</option>
                            <option value="timer">⏲️ Timer</option>
                        </optgroup>
                        <optgroup label="Media & Entertainment">
                            <option value="music">🎵 Music</option>
                            <option value="play">▶️ Play</option>
                            <option value="pause">⏸️ Pause</option>
                            <option value="film">🎬 Film</option>
                            <option value="tv">📺 TV</option>
                            <option value="headphones">🎧 Headphones</option>
                        </optgroup>
                        <optgroup label="Miscellaneous">
                            <option value="tool">🔧 Tool</option>
                            <option value="wrench">🔨 Wrench</option>
                            <option value="paintbrush">🖌️ Paintbrush</option>
                            <option value="palette">🎨 Palette</option>
                            <option value="bulb">💡 Bulb</option>
                            <option value="magnet">🧲 Magnet</option>
                            <option value="puzzle">🧩 Puzzle</option>
                        </optgroup>
                    </select>
                </div>
            )}

            {/* Font controls (only for text and icons) */}
            {(isText || isIcon) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#ccc', fontWeight: 600, minWidth: '70px' }}>Font</div>
                        <select
                            value={shapeFontFamily}
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
                            value={shapeFontWeight}
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

// Memoize to prevent unnecessary re-renders - compare props carefully
export default memo(ShapeSelectionPanel, (prevProps, nextProps) => {
    // Only re-render if the selected shape's relevant properties changed
    return (
        prevProps.selectedShape.id === nextProps.selectedShape.id &&
        prevProps.selectedShape.type === nextProps.selectedShape.type &&
        prevProps.selectedShape.color === nextProps.selectedShape.color &&
        prevProps.selectedShape.x === nextProps.selectedShape.x &&
        prevProps.selectedShape.y === nextProps.selectedShape.y &&
        prevProps.selectedShape.width === nextProps.selectedShape.width &&
        prevProps.selectedShape.height === nextProps.selectedShape.height &&
        prevProps.selectedShape.radius === nextProps.selectedShape.radius &&
        prevProps.selectedShape.rotation === nextProps.selectedShape.rotation &&
        prevProps.selectedShape.opacity === nextProps.selectedShape.opacity &&
        prevProps.selectedShape.shadowColor === nextProps.selectedShape.shadowColor &&
        prevProps.selectedShape.shadowStrength === nextProps.selectedShape.shadowStrength &&
        prevProps.selectedShape.borderRadius === nextProps.selectedShape.borderRadius &&
        prevProps.selectedShape.fontFamily === nextProps.selectedShape.fontFamily &&
        prevProps.selectedShape.fontWeight === nextProps.selectedShape.fontWeight
    )
})


