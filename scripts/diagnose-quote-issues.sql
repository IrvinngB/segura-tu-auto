-- Script para diagnosticar problemas con la página de cotización
-- Este script verifica el estado de las tablas relacionadas con cotizaciones

-- 1. Verificar estructura de la tabla coverage_types
SELECT 'Verificando estructura de tabla coverage_types' as check_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'coverage_types' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar datos existentes en coverage_types
SELECT 'Datos existentes en coverage_types' as check_name;
SELECT COUNT(*) as total_coverage_types FROM coverage_types;

-- 3. Mostrar todas las coberturas disponibles
SELECT 'Coberturas disponibles:' as info;
SELECT 
    id,
    name,
    description,
    base_premium,
    is_mandatory,
    coverage_limit,
    deductible,
    created_at
FROM coverage_types
ORDER BY is_mandatory DESC, name;

-- 4. Verificar coberturas obligatorias
SELECT 'Coberturas obligatorias:' as info;
SELECT 
    name,
    base_premium,
    coverage_limit,
    deductible
FROM coverage_types
WHERE is_mandatory = true
ORDER BY name;

-- 5. Verificar coberturas opcionales
SELECT 'Coberturas opcionales:' as info;
SELECT 
    name,
    base_premium,
    coverage_limit,
    deductible
FROM coverage_types
WHERE is_mandatory = false
ORDER BY name;

-- 6. Verificar si hay coberturas con precios válidos
SELECT 'Verificando precios válidos:' as info;
SELECT 
    name,
    base_premium,
    CASE 
        WHEN base_premium > 0 THEN 'OK'
        ELSE 'ERROR: Precio inválido'
    END as status
FROM coverage_types
ORDER BY base_premium DESC;

-- 7. Verificar si hay coberturas con límites válidos
SELECT 'Verificando límites de cobertura:' as info;
SELECT 
    name,
    coverage_limit,
    CASE 
        WHEN coverage_limit IS NULL THEN 'Sin límite'
        WHEN coverage_limit > 0 THEN 'OK'
        ELSE 'ERROR: Límite inválido'
    END as status
FROM coverage_types
ORDER BY coverage_limit DESC NULLS LAST;

-- 8. Verificar políticas RLS en coverage_types
SELECT 'Verificando políticas RLS en coverage_types' as check_name;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'coverage_types';

-- 9. Verificar permisos en coverage_types
SELECT 'Verificando permisos en coverage_types' as check_name;
SELECT 
    table_name,
    privilege_type,
    COUNT(*) as grant_count
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name = 'coverage_types'
GROUP BY table_name, privilege_type
ORDER BY table_name, privilege_type;

-- 10. Verificar índices en coverage_types
SELECT 'Verificando índices en coverage_types' as check_name;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'coverage_types' 
    AND schemaname = 'public';

-- 11. Verificar si hay datos de prueba necesarios
SELECT 'Verificando datos de prueba:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'ERROR: No hay coberturas'
        WHEN COUNT(*) < 5 THEN 'ADVERTENCIA: Pocas coberturas disponibles'
        ELSE 'OK: Coberturas suficientes'
    END as status,
    COUNT(*) as total_coberturas
FROM coverage_types;

-- 12. Mostrar estadísticas de uso
SELECT 'Estadísticas de coberturas:' as info;
SELECT 
    COUNT(*) as total_coberturas,
    COUNT(CASE WHEN is_mandatory = true THEN 1 END) as obligatorias,
    COUNT(CASE WHEN is_mandatory = false THEN 1 END) as opcionales,
    AVG(base_premium) as prima_promedio,
    MIN(base_premium) as prima_minima,
    MAX(base_premium) as prima_maxima
FROM coverage_types;
