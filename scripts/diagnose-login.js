// Script para diagnosticar problemas de login
// Ejecutar en la consola del navegador

console.log('🔍 Diagnosticando problemas de login...')

// Verificar variables de entorno
console.log('📋 Variables de entorno:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada')

// Verificar localStorage
console.log('📋 localStorage:')
const localStorageKeys = Object.keys(localStorage)
console.log('Claves encontradas:', localStorageKeys)
localStorageKeys.forEach(key => {
  if (key.includes('sb-') || key.includes('supabase')) {
    console.log(`✅ ${key}:`, localStorage.getItem(key) ? 'Tiene valor' : 'Sin valor')
  }
})

// Verificar sessionStorage
console.log('📋 sessionStorage:')
const sessionStorageKeys = Object.keys(sessionStorage)
console.log('Claves encontradas:', sessionStorageKeys)
sessionStorageKeys.forEach(key => {
  if (key.includes('user_profile_') || key.includes('customer_data_') || key.includes('supabase')) {
    console.log(`✅ ${key}:`, sessionStorage.getItem(key) ? 'Tiene valor' : 'Sin valor')
  }
})

// Verificar cookies
console.log('📋 Cookies:')
const cookies = document.cookie.split(';')
console.log('Cookies encontradas:', cookies.length)
cookies.forEach(cookie => {
  const [name] = cookie.trim().split('=')
  if (name.includes('sb-') || name.includes('supabase')) {
    console.log(`⚠️  Cookie de Supabase: ${name}`)
  }
})

// Función para probar login
window.testLogin = async function(email, password) {
  console.log('🧪 Probando login...')
  
  try {
    // Crear cliente de Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          storage: {
            getItem: (key) => localStorage.getItem(key),
            setItem: (key, value) => localStorage.setItem(key, value),
            removeItem: (key) => localStorage.removeItem(key)
          },
          storageKey: 'sb-auth-token',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    )
    
    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Error en login:', error)
      return { success: false, error }
    }
    
    if (data.user) {
      console.log('✅ Login exitoso:', data.user.email)
      
      // Verificar perfil de usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle()
      
      if (userError) {
        console.error('❌ Error al obtener perfil:', userError)
      } else if (userData) {
        console.log('✅ Perfil encontrado:', userData.role)
      } else {
        console.warn('⚠️  Perfil no encontrado en tabla users')
      }
      
      return { success: true, user: data.user, profile: userData }
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    return { success: false, error }
  }
}

// Función para limpiar todo
window.clearAllAuth = function() {
  console.log('🧹 Limpiando todo el estado de autenticación...')
  
  // Limpiar localStorage
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
  
  // Limpiar sessionStorage
  const sessionKeysToRemove = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && (key.includes('user_profile_') || key.includes('customer_data_') || key.includes('supabase'))) {
      sessionKeysToRemove.push(key)
    }
  }
  sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
  
  console.log('✅ Estado de autenticación limpiado')
}

console.log('')
console.log('🛠️  Funciones disponibles:')
console.log('• testLogin("email@example.com", "password") - Probar login')
console.log('• clearAllAuth() - Limpiar todo el estado de autenticación')
console.log('')
console.log('💡 Para probar el login:')
console.log('1. Ejecuta: testLogin("tu-email@example.com", "tu-password")')
console.log('2. Si hay problemas, ejecuta: clearAllAuth()')
console.log('3. Luego intenta el login normal en la página')
