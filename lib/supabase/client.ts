import { createBrowserClient } from "@supabase/ssr"
import { supabaseConfig } from "./config"

export function createClient() {
  return createBrowserClient(
    supabaseConfig.url, 
    supabaseConfig.anonKey,
    {
      auth: {
        ...supabaseConfig.auth,
        // Usar localStorage en lugar de cookies para evitar conflictos
        storage: typeof window !== 'undefined' ? {
          getItem: (key: string) => {
            try {
              return window.localStorage.getItem(key)
            } catch (error) {
              console.warn('Error getting item from localStorage:', error)
              return null
            }
          },
          setItem: (key: string, value: string) => {
            try {
              // Limpiar sesiones anteriores antes de establecer una nueva
              if (key === 'sb-auth-token') {
                // Limpiar todas las claves de Supabase existentes
                const keysToRemove = []
                for (let i = 0; i < window.localStorage.length; i++) {
                  const existingKey = window.localStorage.key(i)
                  if (existingKey && existingKey.includes('sb-')) {
                    keysToRemove.push(existingKey)
                  }
                }
                keysToRemove.forEach(k => window.localStorage.removeItem(k))
              }
              window.localStorage.setItem(key, value)
            } catch (error) {
              console.warn('Error setting item in localStorage:', error)
            }
          },
          removeItem: (key: string) => {
            try {
              window.localStorage.removeItem(key)
            } catch (error) {
              console.warn('Error removing item from localStorage:', error)
            }
          }
        } : undefined,
        storageKey: 'sb-auth-token',
        // Configuración para evitar múltiples sesiones
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce' as const,
      },
      // No usar cookies personalizadas para evitar conflictos
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-web'
        }
      }
    }
  )
}
