import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./config";

export function createClient() {
    return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey, {
        auth: {
            ...supabaseConfig.auth,
            // Configuración simplificada para evitar loops
            storage:
                typeof window !== "undefined" ? window.localStorage : undefined,
            storageKey: "sb-auth-token",
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce" as const,
        },
        global: {
            headers: {
                "X-Client-Info": "supabase-js-web",
            },
        },
    });
}
