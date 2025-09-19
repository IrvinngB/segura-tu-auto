import { createBrowserClient } from "@supabase/ssr"
import { supabaseConfig } from "./config"

export function createClient() {
  return createBrowserClient(
    supabaseConfig.url, 
    supabaseConfig.anonKey,
    {
      auth: supabaseConfig.auth,
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return value
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          
          // Configurar opciones de cookie por defecto
          const defaultOptions = {
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            ...options
          }
          
          const cookieString = Object.entries(defaultOptions)
            .map(([key, val]) => `${key}=${val}`)
            .join('; ')
            
          document.cookie = `${name}=${value}; ${cookieString}`
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          
          const defaultOptions = {
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            expires: 'Thu, 01 Jan 1970 00:00:00 UTC',
            ...options
          }
          
          const cookieString = Object.entries(defaultOptions)
            .map(([key, val]) => `${key}=${val}`)
            .join('; ')
            
          document.cookie = `${name}=; ${cookieString}`
        },
      },
    }
  )
}
