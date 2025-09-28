// Configuración de Supabase para desarrollo y producción
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  // Configuración de cookies para desarrollo
  cookieOptions: {
    name: 'sb-auth-token',
    lifetime: 60 * 60 * 24 * 7, // 7 días
    domain: process.env.NODE_ENV === 'development' ? 'localhost' : undefined,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  },
  
  // Configuración de auth
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  }
}

// Validar que las variables de entorno estén configuradas
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}
