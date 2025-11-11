-- Script de diagnóstico para identificar el campo problemático
-- Ejecutar este script para ver la estructura actual de las tablas

-- Mostrar la estructura de la tabla notifications
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Mostrar la estructura de la tabla communications  
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'communications'
ORDER BY ordinal_position;

-- Mostrar la estructura de la tabla claims
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'claims'
ORDER BY ordinal_position;

-- Verificar si existen las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'communications', 'claims');