/**
 * Pattern templates for complex UI components
 * Used by AI agent to create sophisticated multi-shape patterns
 */

import { CreateShapeParams } from '../hooks/useAgenticToolCalling'

export interface PatternTemplate {
    name: string
    description: string
    shapes: CreateShapeParams[]
}

/**
 * Creates a login form pattern
 */
export function createLoginForm(
    x: number,
    y: number,
    options: {
        width?: number
        primaryColor?: string
        accentColor?: string
        textColor?: string
    } = {}
): CreateShapeParams[] {
    const {
        width = 400,
        primaryColor = '#2563eb',
        accentColor = '#3b82f6',
        textColor = '#ffffff'
    } = options

    const formHeight = 500

    return [
        // Background container
        {
            type: 'rectangle',
            x,
            y,
            width,
            height: formHeight,
            color: '#1f2937',
            opacity: 0.95
        },
        // Title
        {
            type: 'text',
            x: x + width / 2 - 50,
            y: y + 40,
            textContent: 'Login',
            fontSize: 32,
            fontFamily: 'Inter',
            color: textColor
        },
        // Username label
        {
            type: 'text',
            x: x + 40,
            y: y + 120,
            textContent: 'Username',
            fontSize: 16,
            fontFamily: 'Inter',
            color: textColor
        },
        // Username field
        {
            type: 'rectangle',
            x: x + 40,
            y: y + 150,
            width: width - 80,
            height: 50,
            color: '#374151'
        },
        // Password label
        {
            type: 'text',
            x: x + 40,
            y: y + 230,
            textContent: 'Password',
            fontSize: 16,
            fontFamily: 'Inter',
            color: textColor
        },
        // Password field
        {
            type: 'rectangle',
            x: x + 40,
            y: y + 260,
            width: width - 80,
            height: 50,
            color: '#374151'
        },
        // Login button
        {
            type: 'rectangle',
            x: x + 40,
            y: y + 350,
            width: width - 80,
            height: 50,
            color: primaryColor
        },
        // Login button text
        {
            type: 'text',
            x: x + width / 2 - 40,
            y: y + 365,
            textContent: 'Sign In',
            fontSize: 18,
            fontFamily: 'Inter',
            color: textColor
        },
        // Forgot password link
        {
            type: 'text',
            x: x + width / 2 - 80,
            y: y + 430,
            textContent: 'Forgot password?',
            fontSize: 14,
            fontFamily: 'Inter',
            color: accentColor
        }
    ]
}

/**
 * Creates a navigation bar pattern
 */
export function createNavigationBar(
    x: number,
    y: number,
    options: {
        width?: number
        itemCount?: number
        items?: string[]
        backgroundColor?: string
        textColor?: string
        accentColor?: string
    } = {}
): CreateShapeParams[] {
    const {
        width = 1200,
        itemCount = 4,
        items = ['Home', 'About', 'Services', 'Contact'],
        backgroundColor = '#1f2937',
        textColor = '#ffffff',
        accentColor = '#3b82f6'
    } = options

    const navHeight = 80
    const shapes: CreateShapeParams[] = []

    // Background bar
    shapes.push({
        type: 'rectangle',
        x,
        y,
        width,
        height: navHeight,
        color: backgroundColor,
        opacity: 0.95
    })

    // Logo/brand text
    shapes.push({
        type: 'text',
        x: x + 40,
        y: y + 30,
        textContent: 'Brand',
        fontSize: 24,
        fontFamily: 'Inter',
        color: accentColor,
        fontWeight: 'bold'
    })

    // Menu items
    const menuStartX = x + width - (itemCount * 120) - 40
    const actualItems = items.slice(0, itemCount)

    actualItems.forEach((item, index) => {
        const itemX = menuStartX + (index * 120)

        shapes.push({
            type: 'text',
            x: itemX,
            y: y + 30,
            textContent: item,
            fontSize: 16,
            fontFamily: 'Inter',
            color: textColor
        })
    })

    return shapes
}

/**
 * Creates a card layout pattern
 */
export function createCardLayout(
    x: number,
    y: number,
    options: {
        cardWidth?: number
        cardHeight?: number
        title?: string
        description?: string
        hasImage?: boolean
        hasButton?: boolean
        backgroundColor?: string
        accentColor?: string
        textColor?: string
    } = {}
): CreateShapeParams[] {
    const {
        cardWidth = 350,
        cardHeight = 450,
        title = 'Card Title',
        description = 'Card description goes here',
        hasImage = true,
        hasButton = true,
        backgroundColor = '#1f2937',
        accentColor = '#3b82f6',
        textColor = '#ffffff'
    } = options

    const shapes: CreateShapeParams[] = []

    // Card container
    shapes.push({
        type: 'rectangle',
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        color: backgroundColor,
        opacity: 0.95
    })

    let currentY = y + 20

    // Image placeholder (if enabled)
    if (hasImage) {
        shapes.push({
            type: 'rectangle',
            x: x + 20,
            y: currentY,
            width: cardWidth - 40,
            height: 200,
            color: '#374151'
        })
        shapes.push({
            type: 'text',
            x: x + cardWidth / 2 - 40,
            y: currentY + 90,
            textContent: 'Image',
            fontSize: 16,
            fontFamily: 'Inter',
            color: '#9ca3af'
        })
        currentY += 220
    }

    // Title
    shapes.push({
        type: 'text',
        x: x + 20,
        y: currentY,
        textContent: title,
        fontSize: 24,
        fontFamily: 'Inter',
        color: textColor,
        fontWeight: 'bold'
    })
    currentY += 50

    // Description
    shapes.push({
        type: 'text',
        x: x + 20,
        y: currentY,
        textContent: description,
        fontSize: 14,
        fontFamily: 'Inter',
        color: '#9ca3af'
    })
    currentY += 80

    // Button (if enabled)
    if (hasButton) {
        shapes.push({
            type: 'rectangle',
            x: x + 20,
            y: currentY,
            width: cardWidth - 40,
            height: 45,
            color: accentColor
        })
        shapes.push({
            type: 'text',
            x: x + cardWidth / 2 - 50,
            y: currentY + 15,
            textContent: 'Learn More',
            fontSize: 16,
            fontFamily: 'Inter',
            color: textColor
        })
    }

    return shapes
}

/**
 * Creates a button group pattern
 */
export function createButtonGroup(
    x: number,
    y: number,
    options: {
        buttonCount?: number
        labels?: string[]
        buttonWidth?: number
        buttonHeight?: number
        spacing?: number
        orientation?: 'horizontal' | 'vertical'
        primaryColor?: string
        textColor?: string
    } = {}
): CreateShapeParams[] {
    const {
        buttonCount = 3,
        labels = ['Primary', 'Secondary', 'Tertiary'],
        buttonWidth = 150,
        buttonHeight = 50,
        spacing = 20,
        orientation = 'horizontal',
        primaryColor = '#3b82f6',
        textColor = '#ffffff'
    } = options

    const shapes: CreateShapeParams[] = []
    const actualLabels = labels.slice(0, buttonCount)

    actualLabels.forEach((label, index) => {
        const buttonX = orientation === 'horizontal'
            ? x + (index * (buttonWidth + spacing))
            : x
        const buttonY = orientation === 'vertical'
            ? y + (index * (buttonHeight + spacing))
            : y

        // Button background
        shapes.push({
            type: 'rectangle',
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            color: index === 0 ? primaryColor : '#374151'
        })

        // Button text
        shapes.push({
            type: 'text',
            x: buttonX + buttonWidth / 2 - (label.length * 4),
            y: buttonY + 17,
            textContent: label,
            fontSize: 16,
            fontFamily: 'Inter',
            color: textColor
        })
    })

    return shapes
}

/**
 * Creates a dashboard panel pattern
 */
export function createDashboardPanel(
    x: number,
    y: number,
    options: {
        width?: number
        height?: number
        title?: string
        hasChart?: boolean
        statCount?: number
        backgroundColor?: string
        accentColor?: string
        textColor?: string
    } = {}
): CreateShapeParams[] {
    const {
        width = 600,
        height = 400,
        title = 'Dashboard',
        hasChart = true,
        statCount = 3,
        backgroundColor = '#1f2937',
        accentColor = '#3b82f6',
        textColor = '#ffffff'
    } = options

    const shapes: CreateShapeParams[] = []

    // Panel container
    shapes.push({
        type: 'rectangle',
        x,
        y,
        width,
        height,
        color: backgroundColor,
        opacity: 0.95
    })

    // Title
    shapes.push({
        type: 'text',
        x: x + 30,
        y: y + 30,
        textContent: title,
        fontSize: 28,
        fontFamily: 'Inter',
        color: textColor,
        fontWeight: 'bold'
    })

    // Stats row
    const statWidth = (width - 80) / statCount
    for (let i = 0; i < statCount; i++) {
        const statX = x + 30 + (i * statWidth)
        const statY = y + 90

        shapes.push({
            type: 'text',
            x: statX,
            y: statY,
            textContent: ['Users', 'Revenue', 'Growth'][i] || 'Stat',
            fontSize: 14,
            fontFamily: 'Inter',
            color: '#9ca3af'
        })

        shapes.push({
            type: 'text',
            x: statX,
            y: statY + 30,
            textContent: ['1.2K', '$45K', '+23%'][i] || '0',
            fontSize: 24,
            fontFamily: 'Inter',
            color: accentColor,
            fontWeight: 'bold'
        })
    }

    // Chart placeholder (if enabled)
    if (hasChart) {
        shapes.push({
            type: 'rectangle',
            x: x + 30,
            y: y + 200,
            width: width - 60,
            height: height - 240,
            color: '#374151'
        })
        shapes.push({
            type: 'text',
            x: x + width / 2 - 40,
            y: y + height / 2 + 50,
            textContent: 'Chart Area',
            fontSize: 16,
            fontFamily: 'Inter',
            color: '#9ca3af'
        })
    }

    return shapes
}

/**
 * Creates a form input field pattern
 */
export function createFormField(
    x: number,
    y: number,
    options: {
        label?: string
        placeholder?: string
        width?: number
        fieldHeight?: number
        labelColor?: string
        fieldColor?: string
    } = {}
): CreateShapeParams[] {
    const {
        label = 'Label',
        placeholder = 'Enter text...',
        width = 300,
        fieldHeight = 50,
        labelColor = '#ffffff',
        fieldColor = '#374151'
    } = options

    return [
        // Label
        {
            type: 'text',
            x,
            y,
            textContent: label,
            fontSize: 16,
            fontFamily: 'Inter',
            color: labelColor
        },
        // Input field
        {
            type: 'rectangle',
            x,
            y: y + 30,
            width,
            height: fieldHeight,
            color: fieldColor
        },
        // Placeholder text
        {
            type: 'text',
            x: x + 15,
            y: y + 45,
            textContent: placeholder,
            fontSize: 14,
            fontFamily: 'Inter',
            color: '#6b7280'
        }
    ]
}

/**
 * Pattern registry for easy lookup
 */
export const PATTERN_REGISTRY: Record<string, (x: number, y: number, options?: any) => CreateShapeParams[]> = {
    'login-form': createLoginForm,
    'navigation-bar': createNavigationBar,
    'card': createCardLayout,
    'button-group': createButtonGroup,
    'dashboard': createDashboardPanel,
    'form-field': createFormField
}

/**
 * Get available pattern names
 */
export function getAvailablePatterns(): string[] {
    return Object.keys(PATTERN_REGISTRY)
}

