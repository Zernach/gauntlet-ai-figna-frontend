import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export async function createCanvas(name: string = 'My Canvas') {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/canvas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw new Error('Failed to create canvas')
  }

  return response.json()
}

export async function getCanvases() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/canvas`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch canvases')
  }

  return response.json()
}

export async function getVoiceRelayUrl() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/voice/relay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get voice relay URL')
  }

  return response.json()
}

export interface ImageGenerationRequest {
  prompt: string
  style?: 'vivid' | 'natural'
  size?: '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
}

export interface ImageGenerationResult {
  success: boolean
  image: {
    imageUrl: string
    revisedPrompt: string
    width: number
    height: number
  }
  timestamp: string
}

export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/voice/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate image')
  }

  return response.json()
}

