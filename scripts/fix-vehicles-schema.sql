-- Script para corregir el esquema de la tabla vehicles
-- Hacer que VIN y license_plate sean opcionales ya que no siempre están disponibles

-- 1. Eliminar la restricción NOT NULL de VIN
ALTER TABLE vehicles ALTER COLUMN vin DROP NOT NULL;

-- 2. Eliminar la restricción NOT NULL de license_plate  
ALTER TABLE vehicles ALTER COLUMN license_plate DROP NOT NULL;

-- 3. Eliminar la restricción NOT NULL de estimated_value también (puede ser estimado después)
ALTER TABLE vehicles ALTER COLUMN estimated_value DROP NOT NULL;

-- 4. Verificar los cambios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
    AND table_schema = 'public'
    AND column_name IN ('vin', 'license_plate', 'estimated_value')
ORDER BY column_name;

-- 5. Verificar que los constraints UNIQUE todavía existen pero permiten NULL
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'vehicles' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'UNIQUE'
    AND kcu.column_name IN ('vin', 'license_plate');