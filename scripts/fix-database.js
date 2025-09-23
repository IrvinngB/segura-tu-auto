const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer configuración del archivo .env
require('dotenv').config({ path: '.env' });

async function updateDatabase() {
  console.log('🔄 Iniciando actualización de base de datos...');
  
  // Verificar que las credenciales están disponibles
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ No se encontraron las credenciales de Supabase');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌');
    console.log('ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌');
    process.exit(1);
  }

  console.log('✅ Credenciales encontradas');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  // Crear cliente de Supabase con service role para poder ejecutar DDL
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('🔍 Verificando estructura actual de la tabla customers...');
    
    // Primero verificar si las columnas ya existen
    const { data: existingData, error: selectError } = await supabase
      .from('customers')
      .select('has_accidents, has_claims')
      .limit(1);

    if (selectError && selectError.message.includes('column') && selectError.message.includes('does not exist')) {
      console.log('📝 Las columnas no existen, procediendo a crearlas...');
      
      // Ejecutar los comandos SQL uno por uno
      const commands = [
        'ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_accidents BOOLEAN DEFAULT false;',
        'ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_claims BOOLEAN DEFAULT false;'
      ];

      for (const command of commands) {
        console.log(`Ejecutando: ${command}`);
        
        const { error } = await supabase.rpc('exec_sql', { query: command });
        
        if (error) {
          console.log(`⚠️  Error con rpc, intentando método alternativo: ${error.message}`);
          // Si no funciona rpc, mostrar instrucciones manuales
          console.log('\n📋 EJECUTA ESTE SQL MANUALMENTE EN EL DASHBOARD DE SUPABASE:');
          console.log('\nVe a: https://supabase.com/dashboard/project/sztuxibgvlwbykaopnqg/sql');
          console.log('\nCopia y pega este SQL:\n');
          console.log('ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_accidents BOOLEAN DEFAULT false;');
          console.log('ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_claims BOOLEAN DEFAULT false;');
          console.log('\n📌 Después de ejecutar el SQL, reinicia el servidor con "npm run dev"');
          break;
        } else {
          console.log('✅ Comando ejecutado correctamente');
        }
      }
    } else {
      console.log('✅ Las columnas ya existen en la tabla customers');
    }

    // Verificar que todo esté funcionando
    console.log('🔍 Verificación final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (finalError) {
      console.error('❌ Error en verificación final:', finalError.message);
    } else {
      console.log('✅ ¡Base de datos actualizada correctamente!');
      console.log('🚀 Ahora puedes probar el registro de usuarios');
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    console.log('\n📋 INSTRUCCIONES MANUALES:');
    console.log('1. Ve a: https://supabase.com/dashboard/project/sztuxibgvlwbykaopnqg/sql');
    console.log('2. Ejecuta este SQL:');
    console.log('   ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_accidents BOOLEAN DEFAULT false;');
    console.log('   ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_claims BOOLEAN DEFAULT false;');
    console.log('3. Reinicia el servidor con "npm run dev"');
  }
}

updateDatabase();