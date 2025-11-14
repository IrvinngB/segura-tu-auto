// Script temporal para debuggear datos del cliente
console.log('🔍 Verificando datos del cliente en la base de datos...');

// Este script se puede ejecutar en la consola del navegador para verificar los datos
const checkCustomerData = async () => {
  // Importar supabase (esto funcionará en el contexto del navegador)
  const { createClient } = await import('/lib/supabase/client');
  const supabase = createClient();

  try {
    // Obtener el usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return;
    }

    console.log('👤 Usuario autenticado:', user.id);

    // Obtener datos del perfil de usuario
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('👤 Perfil de usuario:', userProfile);

    // Obtener datos del cliente
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('🏢 Datos del cliente:', customer);
  } catch (error) {
    console.error('💥 Error:', error);
  }
};

// Ejecutar
checkCustomerData();
