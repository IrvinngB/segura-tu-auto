-- Script para diagnosticar problemas con la creación de pólizas
-- Este script verifica el estado de las tablas relacionadas con pólizas

-- 1. Verificar estructura de la tabla policies
SELECT 'Verificando estructura de tabla policies' as check_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'policies' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla policy_coverages
SELECT 'Verificando estructura de tabla policy_coverages' as check_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'policy_coverages' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar datos existentes
SELECT 'Datos existentes en policies' as check_name;
SELECT COUNT(*) as total_policies FROM policies;

SELECT 'Datos existentes en policy_coverages' as check_name;
SELECT COUNT(*) as total_policy_coverages FROM policy_coverages;

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

-- 5. Verificar vehículos existentes
SELECT 'Vehículos existentes' as check_name;
SELECT 
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.estimated_value,
    u.first_name || ' ' || u.last_name as customer_name
FROM vehicles v
JOIN customers c ON v.customer_id = c.id
JOIN users u ON c.user_id = u.id
ORDER BY v.created_at DESC
LIMIT 5;

-- 6. Verificar coberturas existentes
SELECT 'Coberturas existentes' as check_name;
SELECT 
    name,
    description,
    base_premium,
    is_mandatory,
    coverage_limit,
    deductible
FROM coverage_types
ORDER BY is_mandatory DESC, name;

-- 7. Verificar políticas RLS en las tablas relacionadas
SELECT 'Verificando políticas RLS' as check_name;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('policies', 'policy_coverages', 'customers', 'vehicles', 'coverage_types')
ORDER BY tablename;

-- 8. Verificar permisos en las tablas
SELECT 'Verificando permisos en tablas' as check_name;
SELECT 
    table_name,
    privilege_type,
    COUNT(*) as grant_count
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('policies', 'policy_coverages', 'customers', 'vehicles', 'coverage_types')
GROUP BY table_name, privilege_type
ORDER BY table_name, privilege_type;

-- 9. Verificar integridad referencial
SELECT 'Verificando integridad: policies -> customers' as check_name;
SELECT 
    'policies_without_customers' as issue_type,
    COUNT(*) as count
FROM policies p
LEFT JOIN customers c ON p.customer_id = c.id
WHERE c.id IS NULL;

SELECT 'Verificando integridad: policies -> vehicles' as check_name;
SELECT 
    'policies_without_vehicles' as issue_type,
    COUNT(*) as count
FROM policies p
LEFT JOIN vehicles v ON p.vehicle_id = v.id
WHERE v.id IS NULL;

-- 10. Mostrar pólizas existentes
SELECT 'Pólizas existentes' as check_name;
SELECT 
    p.policy_number,
    p.policy_type,
    p.status,
    p.premium_amount,
    p.auto_renewal,
    u.first_name || ' ' || u.last_name as customer_name,
    v.make || ' ' || v.model as vehicle,
    p.created_at
FROM policies p
JOIN customers c ON p.customer_id = c.id
JOIN users u ON c.user_id = u.id
JOIN vehicles v ON p.vehicle_id = v.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 11. Verificar si hay datos de prueba necesarios
SELECT 'Verificando datos de prueba necesarios' as check_name;
SELECT 
    'customers_without_vehicles' as issue_type,
    COUNT(*) as count
FROM customers c
LEFT JOIN vehicles v ON c.id = v.customer_id
WHERE v.id IS NULL;

SELECT 'customers_without_coverage_types' as issue_type,
    COUNT(*) as count
FROM customers c
CROSS JOIN coverage_types ct
WHERE ct.id NOT IN (SELECT DISTINCT coverage_type_id FROM policy_coverages);

-- 12. Verificar restricciones CHECK en policies
SELECT 'Verificando restricciones CHECK en policies' as check_name;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'policies' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK';
