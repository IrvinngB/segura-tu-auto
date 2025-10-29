console.log('Para ejecutar el SQL de configuración del sistema de evidencias:');
console.log('1. Ve a https://sztuxibgvlwbykaopnqg.supabase.co/project/sztuxibgvlwbykaopnqg/sql');
console.log('2. Copia y pega el contenido del archivo complete_evidence_system.sql');
console.log('3. Ejecuta las consultas SQL');
console.log('');
console.log(
  'O también puedes ejecutar manualmente cada comando SQL desde la interfaz de Supabase:'
);

const fs = require('fs');
const path = require('path');

try {
  const sqlContent = fs.readFileSync(path.join(__dirname, 'complete_evidence_system.sql'), 'utf8');
  console.log('========== CONTENIDO DEL ARCHIVO SQL ==========');
  console.log(sqlContent);
  console.log('========== FIN DEL ARCHIVO SQL ==========');
} catch (error) {
  console.error('Error reading SQL file:', error);
}
