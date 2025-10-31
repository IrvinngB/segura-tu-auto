-- Script de diagnóstico para problemas con solicitud de documentos

-- 1. Verificar si el estado 'pending_documentation' es válido
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable,
  check_clause
FROM information_schema.columns 
WHERE table_name = 'claims' 
  AND column_name = 'status';

-- 2. Verificar los valores permitidos en la columna status
SELECT 
  table_name,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE table_name = 'claims'
  AND constraint_name LIKE '%status%';

-- 3. Verificar si hay reclamaciones existentes con estado pending_documentation
SELECT 
  COUNT(*) as total_pending_documentation,
  status
FROM claims 
WHERE status = 'pending_documentation'
GROUP BY status;

-- 4. Probar actualización directa a pending_documentation
-- (Descomenta la siguiente línea solo si tienes una reclamación de prueba)
-- UPDATE claims SET status = 'pending_documentation' WHERE id = 'TU_CLAIM_ID_AQUI';

-- 5. Verificar estructura de tabla communications
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'communications'
ORDER BY ordinal_position;

-- 6. Verificar si hay foreign keys que puedan estar causando problemas
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'claims' OR tc.table_name = 'communications');

-- 7. Verificar permisos RLS si están habilitados
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('claims', 'communications');

-- 8. Lista de todos los estados de reclamación actuales
SELECT 
  status,
  COUNT(*) as count
FROM claims 
GROUP BY status
ORDER BY count DESC;