import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables')
}

// Determine the redirect URL for Supabase auth flows.
// Priority: explicit VITE_AUTH_REDIRECT_URL > window.location.origin (browser) > default localhost
export function getAuthRedirectUrl(): string {
  const explicit = import.meta.env.VITE_AUTH_REDIRECT_URL
  if (explicit && explicit.trim().length > 0) return explicit

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // Fallback for non-browser contexts
  return 'http://localhost:3000'
  // return 'http://localhost:5173'
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
