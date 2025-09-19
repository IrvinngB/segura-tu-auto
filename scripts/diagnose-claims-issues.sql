-- Script para diagnosticar problemas con la página de reclamos
-- Este script verifica el estado de las tablas relacionadas con reclamos

-- 1. Verificar estructura de la tabla claims
SELECT 'Verificando estructura de tabla claims' as check_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'claims' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla damage_assessments
SELECT 'Verificando estructura de tabla damage_assessments' as check_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'damage_assessments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar datos existentes
SELECT 'Datos existentes en claims' as check_name;
SELECT COUNT(*) as total_claims FROM claims;

SELECT 'Datos existentes en damage_assessments' as check_name;
SELECT COUNT(*) as total_assessments FROM damage_assessments;

-- 4. Verificar clientes existentes
SELECT 'Clientes existentes' as check_name;
SELECT 
    c.id,
    u.first_name,
    u.last_name,
    u.email,
    u.role
FROM customers c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 5;

-- 5. Verificar políticas existentes para clientes
SELECT 'Políticas existentes por cliente' as check_name;
SELECT 
    u.first_name || ' ' || u.last_name as customer_name,
    COUNT(p.id) as policy_count
FROM customers c
JOIN users u ON c.user_id = u.id
LEFT JOIN policies p ON c.id = p.customer_id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY policy_count DESC;

-- 6. Verificar vehículos existentes para clientes
SELECT 'Vehículos existentes por cliente' as check_name;
SELECT 
    u.first_name || ' ' || u.last_name as customer_name,
    COUNT(v.id) as vehicle_count
FROM customers c
JOIN users u ON c.user_id = u.id
LEFT JOIN vehicles v ON c.id = v.customer_id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY vehicle_count DESC;

-- 7. Verificar reclamos existentes por cliente
SELECT 'Reclamos existentes por cliente' as check_name;
SELECT 
    u.first_name || ' ' || u.last_name as customer_name,
    COUNT(cl.id) as claim_count
FROM customers c
JOIN users u ON c.user_id = u.id
LEFT JOIN claims cl ON c.id = cl.customer_id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY claim_count DESC;

-- 8. Verificar políticas RLS en las tablas relacionadas
SELECT 'Verificando políticas RLS' as check_name;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('claims', 'damage_assessments', 'customers', 'policies', 'vehicles')
ORDER BY tablename;

-- 9. Verificar permisos en las tablas
SELECT 'Verificando permisos en tablas' as check_name;
SELECT 
    table_name,
    privilege_type,
    COUNT(*) as grant_count
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('claims', 'damage_assessments', 'customers', 'policies', 'vehicles')
GROUP BY table_name, privilege_type
ORDER BY table_name, privilege_type;

-- 10. Verificar integridad referencial
SELECT 'Verificando integridad: claims -> customers' as check_name;
SELECT 
    'claims_without_customers' as issue_type,
    COUNT(*) as count
FROM claims cl
LEFT JOIN customers c ON cl.customer_id = c.id
WHERE c.id IS NULL;

SELECT 'Verificando integridad: claims -> policies' as check_name;
SELECT 
    'claims_without_policies' as issue_type,
    COUNT(*) as count
FROM claims cl
LEFT JOIN policies p ON cl.policy_id = p.id
WHERE p.id IS NULL;

-- 11. Mostrar reclamos existentes
SELECT 'Reclamos existentes' as check_name;
SELECT 
    cl.claim_number,
    cl.claim_type,
    cl.status,
    cl.incident_date,
    u.first_name || ' ' || u.last_name as customer_name,
    p.policy_number
FROM claims cl
JOIN customers c ON cl.customer_id = c.id
JOIN users u ON c.user_id = u.id
LEFT JOIN policies p ON cl.policy_id = p.id
ORDER BY cl.created_at DESC
LIMIT 5;

-- 12. Verificar si hay datos de prueba necesarios
SELECT 'Verificando datos de prueba necesarios' as check_name;
SELECT 
    'customers_without_policies' as issue_type,
    COUNT(*) as count
FROM customers c
LEFT JOIN policies p ON c.id = p.customer_id
WHERE p.id IS NULL;

SELECT 'customers_without_vehicles' as issue_type,
    COUNT(*) as count
FROM customers c
LEFT JOIN vehicles v ON c.id = v.customer_id
WHERE v.id IS NULL;
