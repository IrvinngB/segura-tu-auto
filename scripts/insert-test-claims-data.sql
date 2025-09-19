-- Script para insertar datos de prueba necesarios para reclamos
-- Este script crea políticas y vehículos de ejemplo para que los clientes puedan crear reclamos

-- 1. Insertar coberturas de prueba si no existen
INSERT INTO coverage_types (name, description, base_premium, is_mandatory, coverage_limit, deductible) VALUES
('Responsabilidad Civil', 'Cobertura básica de responsabilidad civil', 500.00, true, 50000.00, 500.00),
('Colisión', 'Cobertura por daños en colisión', 800.00, false, 25000.00, 1000.00),
('Robo', 'Cobertura por robo del vehículo', 300.00, false, 20000.00, 500.00),
('Daños por Terceros', 'Cobertura por daños causados por terceros', 400.00, false, 30000.00, 750.00)
ON CONFLICT (name) DO NOTHING;

-- 2. Insertar políticas de prueba para clientes existentes
INSERT INTO policies (
    policy_number,
    customer_id,
    vehicle_id,
    agent_id,
    policy_type,
    status,
    start_date,
    end_date,
    premium_amount,
    total_coverage_limit,
    risk_assessment
)
SELECT 
    'POL-' || LPAD(ROW_NUMBER() OVER (ORDER BY c.created_at)::text, 6, '0') as policy_number,
    c.id as customer_id,
    v.id as vehicle_id,
    u_agent.id as agent_id,
    'Básica' as policy_type,
    'active' as status,
    CURRENT_DATE as start_date,
    CURRENT_DATE + INTERVAL '1 year' as end_date,
    1200.00 as premium_amount,
    50000.00 as total_coverage_limit,
    '{"risk_score": 50, "factors": ["low_risk_customer"]}'::jsonb as risk_assessment
FROM customers c
JOIN vehicles v ON c.id = v.customer_id
JOIN users u_agent ON u_agent.role = 'agent'
WHERE NOT EXISTS (
    SELECT 1 FROM policies p WHERE p.customer_id = c.id
)
LIMIT 3
ON CONFLICT (policy_number) DO NOTHING;

-- 3. Insertar coberturas para las políticas creadas
INSERT INTO policy_coverages (
    policy_id,
    coverage_type_id,
    coverage_limit,
    deductible,
    premium
)
SELECT 
    p.id as policy_id,
    ct.id as coverage_type_id,
    ct.coverage_limit,
    ct.deductible,
    ct.base_premium
FROM policies p
JOIN coverage_types ct ON ct.is_mandatory = true
WHERE p.policy_number LIKE 'POL-%'
ON CONFLICT (policy_id, coverage_type_id) DO NOTHING;

-- 4. Insertar reclamos de prueba
INSERT INTO claims (
    claim_number,
    policy_id,
    customer_id,
    incident_date,
    claim_type,
    status,
    incident_description,
    incident_location,
    estimated_damage_cost,
    priority
)
SELECT 
    'CLM-' || LPAD(ROW_NUMBER() OVER (ORDER BY p.created_at)::text, 6, '0') as claim_number,
    p.id as policy_id,
    p.customer_id as customer_id,
    CURRENT_DATE - INTERVAL '7 days' as incident_date,
    'Colisión' as claim_type,
    'submitted' as status,
    'Accidente menor en intersección. Daños en parachoques delantero.' as incident_description,
    'Av. Principal y Calle Secundaria' as incident_location,
    2500.00 as estimated_damage_cost,
    'medium' as priority
FROM policies p
WHERE p.policy_number LIKE 'POL-%'
LIMIT 2
ON CONFLICT (claim_number) DO NOTHING;

-- 5. Verificar los datos insertados
SELECT 'Políticas creadas:' as info, COUNT(*) as total FROM policies WHERE policy_number LIKE 'POL-%';
SELECT 'Coberturas creadas:' as info, COUNT(*) as total FROM policy_coverages WHERE policy_id IN (SELECT id FROM policies WHERE policy_number LIKE 'POL-%');
SELECT 'Reclamos creados:' as info, COUNT(*) as total FROM claims WHERE claim_number LIKE 'CLM-%';

-- 6. Mostrar datos de ejemplo
SELECT 
    'Políticas de ejemplo:' as info,
    p.policy_number,
    u.first_name || ' ' || u.last_name as customer_name,
    v.make || ' ' || v.model as vehicle,
    p.status,
    p.premium_amount
FROM policies p
JOIN customers c ON p.customer_id = c.id
JOIN users u ON c.user_id = u.id
JOIN vehicles v ON p.vehicle_id = v.id
WHERE p.policy_number LIKE 'POL-%'
ORDER BY p.created_at DESC
LIMIT 3;

-- 7. Mostrar reclamos de ejemplo
SELECT 
    'Reclamos de ejemplo:' as info,
    cl.claim_number,
    u.first_name || ' ' || u.last_name as customer_name,
    cl.claim_type,
    cl.status,
    cl.estimated_damage_cost,
    cl.incident_date
FROM claims cl
JOIN customers c ON cl.customer_id = c.id
JOIN users u ON c.user_id = u.id
WHERE cl.claim_number LIKE 'CLM-%'
ORDER BY cl.created_at DESC
LIMIT 3;
