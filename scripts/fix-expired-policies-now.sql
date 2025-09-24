-- Script simple para actualizar pólizas vencidas AHORA MISMO
-- Ejecuta este script en tu base de datos (Supabase SQL Editor)

-- 1. PRIMERO: Ver qué pólizas están vencidas pero activas
SELECT 
    'ANTES DE ACTUALIZAR - Pólizas vencidas pero activas:' as info,
    count(*) as total
FROM policies 
WHERE status = 'active' 
AND end_date < CURRENT_DATE;

-- Mostrar detalles de estas pólizas
SELECT 
    policy_number,
    status,
    end_date,
    (CURRENT_DATE - end_date) as dias_vencida
FROM policies 
WHERE status = 'active' 
AND end_date < CURRENT_DATE
ORDER BY end_date;

-- 2. SEGUNDO: Actualizar las pólizas vencidas DIRECTAMENTE
UPDATE policies 
SET status = 'expired'
WHERE status = 'active' 
AND end_date < CURRENT_DATE;

-- 3. TERCERO: Ver el resultado después de actualizar
SELECT 
    'DESPUÉS DE ACTUALIZAR - Estado de todas las pólizas:' as info,
    NULL as policy_number,
    NULL as status,
    NULL as end_date;

SELECT 
    NULL as info,
    policy_number,
    status,
    end_date
FROM policies 
ORDER BY end_date DESC;

-- 4. CUARTO: Contar pólizas por estado
SELECT 
    'RESUMEN POR ESTADO:' as info,
    NULL as status,
    NULL as cantidad;

SELECT 
    NULL as info,
    status,
    COUNT(*) as cantidad
FROM policies 
GROUP BY status;