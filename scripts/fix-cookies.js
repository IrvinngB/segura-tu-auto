// Script para limpiar cookies problemáticas de Supabase
// Ejecutar en la consola del navegador

console.log('🧹 Limpiando cookies problemáticas de Supabase...')

// Lista de cookies de Supabase que pueden causar problemas
const supabaseCookies = [
  'sb-sztuxibgvlwbykaopnqg-auth-token',
  'sb-auth-token',
  'supabase-auth-token',
  'sb-sztuxibgvlwbykaopnqg-auth-token.0',
  'sb-sztuxibgvlwbykaopnqg-auth-token.1',
  'sb-sztuxibgvlwbykaopnqg-auth-token.2',
  'sb-sztuxibgvlwbykaopnqg-auth-token.3',
  'sb-sztuxibgvlwbykaopnqg-auth-token.4',
  'sb-sztuxibgvlwbykaopnqg-auth-token.5',
  'sb-sztuxibgvlwbykaopnqg-auth-token.6',
  'sb-sztuxibgvlwbykaopnqg-auth-token.7',
  'sb-sztuxibgvlwbykaopnqg-auth-token.8',
  'sb-sztuxibgvlwbykaopnqg-auth-token.9'
]

// Función para eliminar una cookie
function deleteCookie(name, domain = 'localhost', path = '/') {
  // Eliminar para el dominio actual
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`
  
  // Eliminar para el dominio con punto (para subdominios)
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${domain}`
  
  // Eliminar para diferentes variaciones de path
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`
}

// Eliminar todas las cookies de Supabase
supabaseCookies.forEach(cookieName => {
  deleteCookie(cookieName)
  console.log(`✅ Eliminada cookie: ${cookieName}`)
})

// Limpiar sessionStorage y localStorage
console.log('🧹 Limpiando sessionStorage...')
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('user_profile_') || key.includes('customer_data_') || key.includes('supabase')) {
    sessionStorage.removeItem(key)
    console.log(`✅ Eliminado de sessionStorage: ${key}`)
  }
})

console.log('🧹 Limpiando localStorage...')
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('sb-')) {
    localStorage.removeItem(key)
    console.log(`✅ Eliminado de localStorage: ${key}`)
  }
})

console.log('🎉 Limpieza completada! Recarga la página para aplicar los cambios.')
console.log('💡 Si el problema persiste, verifica la configuración de Supabase en tu .env.local')

// Mostrar cookies actuales
console.log('📋 Cookies actuales:')
document.cookie.split(';').forEach(cookie => {
  const [name] = cookie.trim().split('=')
  if (name.includes('sb-') || name.includes('supabase')) {
    console.log(`⚠️  Cookie de Supabase encontrada: ${name}`)
  }
})
