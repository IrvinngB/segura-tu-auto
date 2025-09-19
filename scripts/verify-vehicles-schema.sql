-- Script para verificar el esquema de la tabla vehicles
-- Este script verifica que todos los campos estén correctos

-- 1. Verificar estructura completa de la tabla vehicles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar restricciones CHECK en la tabla vehicles
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'vehicles' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK';

-- 3. Verificar que la columna usage_type existe y tiene los valores correctos
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
    AND table_schema = 'public'
    AND column_name = 'usage_type';

-- 4. Verificar índices en la tabla vehicles
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'vehicles' 
    AND schemaname = 'public';

-- 5. Verificar datos existentes en vehicles (si los hay)
SELECT 
    make,
    model,
    year,
    fuel_type,
    transmission,
    vehicle_type,
    usage_type,
    garage_type,
    created_at
FROM vehicles 
LIMIT 5;

-- 6. Verificar que no hay registros con valores inválidos
SELECT 
    'fuel_type' as field_name,
    fuel_type as invalid_value,
    COUNT(*) as count
FROM vehicles 
WHERE fuel_type NOT IN ('Gasolina', 'Diesel', 'Híbrido', 'Eléctrico', 'GLP')
GROUP BY fuel_type

UNION ALL

SELECT 
    'transmission' as field_name,
    transmission as invalid_value,
    COUNT(*) as count
FROM vehicles 
WHERE transmission NOT IN ('Manual', 'Automático', 'CVT')
GROUP BY transmission

UNION ALL

SELECT 
    'vehicle_type' as field_name,
    vehicle_type as invalid_value,
    COUNT(*) as count
FROM vehicles 
WHERE vehicle_type NOT IN ('Sedán', 'SUV', 'Hatchback', 'Pickup', 'Convertible', 'Coupé', 'Wagon')
GROUP BY vehicle_type

UNION ALL

SELECT 
    'usage_type' as field_name,
    usage_type as invalid_value,
    COUNT(*) as count
FROM vehicles 
WHERE usage_type NOT IN ('personal', 'commercial', 'taxi', 'delivery', 'other')
GROUP BY usage_type

UNION ALL

SELECT 
    'garage_type' as field_name,
    garage_type as invalid_value,
    COUNT(*) as count
FROM vehicles 
WHERE garage_type NOT IN ('enclosed', 'covered', 'street')
GROUP BY garage_type;
