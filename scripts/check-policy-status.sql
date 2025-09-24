-- Script simple para probar la actualización de pólizas vencidas
-- Ejecutar este script para ver qué pólizas están vencidas actualmente

-- 1. Mostrar todas las pólizas con su estado actual
SELECT 
    'Estado actual de todas las pólizas:' as info,
    NULL as policy_number,
    NULL as status,
    NULL as end_date,
    NULL as days_since_expiry;

SELECT 
    NULL as info,
    policy_number,
    status,
    end_date,
    CASE 
        WHEN end_date < CURRENT_DATE THEN (CURRENT_DATE - end_date)::text || ' días vencida'
        ELSE (end_date - CURRENT_DATE)::text || ' días restantes'
    END as days_since_expiry
FROM policies
ORDER BY end_date ASC;

-- 2. Mostrar específicamente las pólizas que deberían estar vencidas pero están activas
SELECT 
    'Pólizas que deberían estar VENCIDAS pero están ACTIVAS:' as info,
    NULL as policy_number,
    NULL as status,
    NULL as end_date,
    NULL as days_overdue;

SELECT 
    NULL as info,
    policy_number,
    status,
    end_date,
    (CURRENT_DATE - end_date)::integer as days_overdue
FROM policies 
WHERE status = 'active' 
AND end_date < CURRENT_DATE
ORDER BY end_date ASC;

-- 3. Contar pólizas por estado
SELECT 
    'Resumen por estado:' as info,
    NULL as status,
    NULL as count;

SELECT 
    NULL as info,
    status,
    COUNT(*)::text as count
FROM policies 
GROUP BY status
ORDER BY count DESC;