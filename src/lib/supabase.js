// ========================================================
// NEOTA — Supabase Client & Connection Engine
// Secure client initialization using public Anon Key.
// Supports env vars & in-app configurable project credentials.
// Row-Level Security (RLS) handles database isolation.
// ========================================================
import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY_URL = 'neota_supabase_url'
const STORAGE_KEY_KEY = 'neota_supabase_anon_key'

// Helper to get active configuration
export const getSupabaseConfig = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

  const localUrl = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : '') || ''
  const localKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : '') || ''

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, source: 'env' }
  } else if (localUrl && localKey) {
    return { url: localUrl, key: localKey, source: 'local' }
  }
  return { url: '', key: '', source: null }
}

// Create Supabase Client instance
const initClient = () => {
  const { url, key } = getSupabaseConfig()
  if (!url || !key) return null

  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    })
  } catch (err) {
    console.warn('[NEOTA Supabase] Failed to initialize client:', err)
    return null
  }
}

// Active singleton instance
export let supabase = initClient()
export let isConnected = Boolean(supabase)

// Event listener mechanism for dynamic connection updates
const listeners = new Set()
export const subscribeToSupabaseChange = listener => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const notifyListeners = () => {
  listeners.forEach(fn => {
    try {
      fn({ client: supabase, isConnected })
    } catch (e) {
      console.error(e)
    }
  })
}

// Test credentials before saving
export const testSupabaseConnection = async (testUrl, testKey) => {
  if (!testUrl || !testKey) {
    return { ok: false, error: 'Please enter both Supabase URL and Anon Key.' }
  }

  // Basic URL validation
  try {
    const parsed = new URL(testUrl)
    if (!parsed.protocol.startsWith('http')) {
      return { ok: false, error: 'Invalid URL format. Must start with https://' }
    }
  } catch {
    return { ok: false, error: 'Invalid URL format. Example: https://xyz.supabase.co' }
  }

  try {
    const testClient = createClient(testUrl, testKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // Probe Supabase auth endpoint
    const { error } = await testClient.auth.getSession()
    if (error && error.message?.includes('Invalid API key')) {
      return { ok: false, error: 'Invalid Supabase Anon Key. Please check the key in your Supabase Dashboard.' }
    }

    return { ok: true, message: 'Successfully connected to Supabase project!' }
  } catch (err) {
    return { ok: false, error: err.message || 'Could not connect to Supabase.' }
  }
}

// Save project credentials to local storage and re-initialize
export const saveSupabaseConfig = (newUrl, newKey) => {
  const cleanUrl = (newUrl || '').trim()
  const cleanKey = (newKey || '').trim()

  if (typeof window !== 'undefined') {
    if (cleanUrl && cleanKey) {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl)
      localStorage.setItem(STORAGE_KEY_KEY, cleanKey)
    } else {
      localStorage.removeItem(STORAGE_KEY_URL)
      localStorage.removeItem(STORAGE_KEY_KEY)
    }
  }

  supabase = initClient()
  isConnected = Boolean(supabase)
  notifyListeners()

  return { ok: isConnected }
}

// Clear custom config
export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL)
    localStorage.removeItem(STORAGE_KEY_KEY)
  }

  supabase = initClient()
  isConnected = Boolean(supabase)
  notifyListeners()
}
