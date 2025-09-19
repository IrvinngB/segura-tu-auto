-- Script para agregar la columna auto_renewal a la tabla policies
-- Este script actualiza la base de datos existente

-- Agregar la columna auto_renewal si no existe
ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false;

-- Actualizar registros existentes con valor por defecto
UPDATE policies 
SET auto_renewal = false 
WHERE auto_renewal IS NULL;

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'policies' 
    AND table_schema = 'public'
    AND column_name = 'auto_renewal';

-- Mostrar algunos registros para verificar
SELECT 
    policy_number,
    customer_id,
    auto_renewal,
    created_at
FROM policies 
LIMIT 5;
