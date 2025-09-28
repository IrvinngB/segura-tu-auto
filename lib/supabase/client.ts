import { createBrowserClient } from "@supabase/ssr"
import { supabaseConfig } from "./config"

export function createClient() {
  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      ...supabaseConfig.auth,
      // Deshabilitar completamente el almacenamiento de la sesión
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      },
      // Asegurarse de que no se intente persistir la sesión
      persistSession: false,
      autoRefreshToken: false,
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
