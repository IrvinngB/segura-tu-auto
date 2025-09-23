const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function updateDatabase() {
  // Verificar variables de entorno
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Falta la configuración de Supabase en .env.local');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🔄 Conectando a Supabase...');

  try {
    // Leer el script SQL
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'add-driver-history-columns.sql'), 
      'utf8'
    );

    console.log('📝 Ejecutando script SQL...');
    console.log('SQL:', sqlScript);

    // Ejecutar el script
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sqlScript 
    });

    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      
      // Intentar ejecutar cada comando por separado
      console.log('🔄 Intentando ejecutar comandos individualmente...');
      
      const commands = sqlScript.split(';').filter(cmd => cmd.trim());
      
      for (const command of commands) {
        const trimmedCommand = command.trim();
        if (trimmedCommand) {
          console.log(`Ejecutando: ${trimmedCommand.substring(0, 50)}...`);
          const { error: cmdError } = await supabase.rpc('exec_sql', { 
            sql: trimmedCommand 
          });
          
          if (cmdError) {
            console.error(`❌ Error en comando: ${cmdError.message}`);
          } else {
            console.log('✅ Comando ejecutado correctamente');
          }
        }
      }
    } else {
      console.log('✅ Script ejecutado correctamente:', data);
    }

    // Verificar que las columnas se agregaron
    console.log('🔍 Verificando estructura de la tabla customers...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error verificando tabla:', tableError);
    } else {
      console.log('✅ Tabla customers accesible');
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

updateDatabase();