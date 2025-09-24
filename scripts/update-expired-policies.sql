-- Script para actualizar automáticamente el estado de pólizas vencidas
-- Este script debe ejecutarse regularmente para mantener los estados actualizados

-- Función para actualizar pólizas vencidas
CREATE OR REPLACE FUNCTION update_expired_policies()
RETURNS TABLE(
    updated_count integer,
    policy_numbers text[]
) AS $$
DECLARE
    updated_policies text[];
    update_count integer;
BEGIN
    -- Obtener las pólizas que serán actualizadas
    SELECT array_agg(policy_number) INTO updated_policies
    FROM policies 
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
    
    -- Actualizar las pólizas vencidas
    UPDATE policies 
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
    
    -- Obtener el número de registros actualizados
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    -- Retornar resultados
    RETURN QUERY SELECT 
        update_count as updated_count,
        COALESCE(updated_policies, ARRAY[]::text[]) as policy_numbers;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar pólizas que vencerán pronto (próximos 30 días)
CREATE OR REPLACE FUNCTION check_expiring_policies(days_ahead integer DEFAULT 30)
RETURNS TABLE(
    policy_number varchar(50),
    customer_name text,
    end_date date,
    days_until_expiry integer,
    vehicle_info text
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        p.policy_number,
        u.first_name || ' ' || u.last_name as customer_name,
        p.end_date,
        (p.end_date - CURRENT_DATE)::integer as days_until_expiry,
        v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_info
    FROM policies p
    JOIN customers c ON p.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    JOIN vehicles v ON p.vehicle_id = v.id
    WHERE p.status = 'active'
    AND p.end_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    AND p.end_date >= CURRENT_DATE
    ORDER BY p.end_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la actualización inmediata
SELECT * FROM update_expired_policies();

-- Mostrar pólizas que vencerán en los próximos 30 días
SELECT 'Pólizas que vencerán pronto:' as info;
SELECT * FROM check_expiring_policies(30);

-- Mostrar un resumen del estado actual de las pólizas
SELECT 'Resumen del estado actual de pólizas:' as info;
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM policies 
GROUP BY status
ORDER BY count DESC;

-- Mostrar pólizas que deberían estar vencidas pero aún están activas
SELECT 'Pólizas que deberían estar vencidas:' as info;
SELECT 
    p.policy_number,
    p.status,
    p.end_date,
    (CURRENT_DATE - p.end_date)::integer as days_overdue,
    u.first_name || ' ' || u.last_name as customer_name
FROM policies p
JOIN customers c ON p.customer_id = c.id
JOIN users u ON c.user_id = u.id
WHERE p.status = 'active' 
AND p.end_date < CURRENT_DATE
ORDER BY p.end_date ASC;