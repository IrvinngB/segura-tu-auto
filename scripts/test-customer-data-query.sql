-- Script para probar la consulta que usa el hook useCustomerData
-- Este script replica la consulta que hace el hook para identificar problemas

-- 1. Probar la consulta exacta que hace useCustomerData
SELECT 
    c.id,
    c.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.role
FROM customers c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 5;

-- 2. Verificar si hay usuarios sin perfil de cliente
SELECT 
    'Usuarios sin perfil de cliente:' as info,
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role
FROM users u
LEFT JOIN customers c ON u.id = c.user_id
WHERE c.id IS NULL
    AND u.role = 'customer'
ORDER BY u.created_at DESC;

-- 3. Verificar si hay clientes sin usuario
SELECT 
    'Clientes sin usuario:' as info,
    c.id,
    c.user_id
FROM customers c
LEFT JOIN users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- 4. Verificar la estructura de la consulta con JOIN
SELECT 
    'Estructura de consulta con JOIN:' as info,
    c.id as customer_id,
    c.user_id,
    u.id as user_id_from_join,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    CASE 
        WHEN c.id IS NULL THEN 'NO_CUSTOMER'
        WHEN u.id IS NULL THEN 'NO_USER'
        ELSE 'OK'
    END as status
FROM customers c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 5. Verificar permisos de lectura en las tablas
SELECT 
    'Permisos en customers:' as info,
    privilege_type,
    COUNT(*) as count
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name = 'customers'
GROUP BY privilege_type;

SELECT 
    'Permisos en users:' as info,
    privilege_type,
    COUNT(*) as count
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name = 'users'
GROUP BY privilege_type;

-- 6. Verificar políticas RLS específicas
SELECT 
    'Políticas RLS en customers:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'customers' 
    AND schemaname = 'public';

SELECT 
    'Políticas RLS en users:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
    AND schemaname = 'public';

-- 7. Probar consulta con filtro por user_id (como hace el hook)
-- Nota: Esta consulta simula lo que haría el hook con un user_id específico
SELECT 
    'Consulta con filtro por user_id:' as info,
    c.id,
    c.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.role
FROM customers c
JOIN users u ON c.user_id = u.id
WHERE c.user_id = (SELECT id FROM users WHERE role = 'customer' LIMIT 1)
LIMIT 1;

-- 8. Verificar si hay problemas de índices
SELECT 
    'Índices en customers:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'customers' 
    AND schemaname = 'public';

SELECT 
    'Índices en users:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
    AND schemaname = 'public';

-- 9. Verificar estadísticas de las tablas
SELECT 
    'Estadísticas de customers:' as info,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE relname = 'customers';

SELECT 
    'Estadísticas de users:' as info,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE relname = 'users';
