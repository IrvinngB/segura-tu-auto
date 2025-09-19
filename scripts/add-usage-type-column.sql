-- Script para agregar la columna usage_type a la tabla vehicles
-- Este script actualiza la base de datos existente

-- Agregar la columna usage_type si no existe
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS usage_type VARCHAR(20) CHECK (usage_type IN ('personal', 'commercial', 'taxi', 'delivery', 'other'));

-- Actualizar registros existentes con un valor por defecto
UPDATE vehicles 
SET usage_type = 'personal' 
WHERE usage_type IS NULL;

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
    AND table_schema = 'public'
    AND column_name = 'usage_type';

-- Mostrar algunos registros para verificar
SELECT 
    make,
    model,
    year,
    usage_type,
    created_at
FROM vehicles 
LIMIT 5;
