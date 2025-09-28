import { createBrowserClient } from "@supabase/ssr"
import { supabaseConfig } from "./config"

export function createClient() {
  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      ...supabaseConfig.auth,
      // Configuración estándar para persistencia de sesiones
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce" as const
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js-web"
      }
    }
  });
}
