-- Script para insertar tipos de cobertura para el sistema de cotización
-- Este script crea las coberturas que deberían aparecer en la sección de coberturas

-- Insertar tipos de cobertura básicos
INSERT INTO coverage_types (name, description, base_premium, is_mandatory, coverage_limit, deductible) VALUES
('Responsabilidad Civil', 'Cobertura básica de responsabilidad civil por daños a terceros. Obligatoria por ley.', 500.00, true, 50000.00, 500.00),
('Colisión', 'Cobertura por daños al vehículo en caso de colisión con otro vehículo u objeto.', 800.00, false, 25000.00, 1000.00),
('Robo', 'Cobertura por robo total del vehículo o robo de accesorios.', 300.00, false, 20000.00, 500.00),
('Vandalismo', 'Cobertura por daños causados por actos de vandalismo.', 200.00, false, 15000.00, 750.00),
('Daños por Terceros', 'Cobertura por daños causados por terceros no identificados.', 400.00, false, 30000.00, 750.00),
('Daño por Granizo', 'Cobertura por daños causados por granizo y fenómenos meteorológicos.', 150.00, false, 10000.00, 500.00),
('Incendio', 'Cobertura por daños causados por incendio o explosión.', 250.00, false, 20000.00, 1000.00),
('Cristales', 'Cobertura por rotura de cristales del vehículo.', 100.00, false, 5000.00, 200.00),
('Asistencia en Carretera', 'Servicio de asistencia 24/7 en caso de avería o accidente.', 200.00, false, NULL, 0.00),
('Gastos Médicos', 'Cobertura de gastos médicos para el conductor y pasajeros.', 300.00, false, 10000.00, 500.00)
ON CONFLICT (name) DO NOTHING;

-- Verificar las coberturas insertadas
SELECT 
    'Coberturas creadas:' as info,
    COUNT(*) as total
FROM coverage_types;

-- Mostrar las coberturas disponibles
SELECT 
    name,
    description,
    base_premium,
    is_mandatory,
    coverage_limit,
    deductible,
    CASE 
        WHEN is_mandatory THEN 'Obligatoria'
        ELSE 'Opcional'
    END as tipo
FROM coverage_types
ORDER BY is_mandatory DESC, name;

-- Mostrar resumen por tipo
SELECT 
    'Resumen por tipo:' as info,
    CASE 
        WHEN is_mandatory THEN 'Obligatorias'
        ELSE 'Opcionales'
    END as tipo_cobertura,
    COUNT(*) as cantidad,
    AVG(base_premium) as prima_promedio,
    MIN(base_premium) as prima_minima,
    MAX(base_premium) as prima_maxima
FROM coverage_types
GROUP BY is_mandatory
ORDER BY is_mandatory DESC;
