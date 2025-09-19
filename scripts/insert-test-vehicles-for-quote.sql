-- Script para insertar vehículos de prueba para la funcionalidad de cotización
-- Este script crea vehículos de ejemplo para que aparezcan en el selector de cotización

-- Insertar vehículos de prueba para clientes existentes
INSERT INTO vehicles (
    customer_id,
    make,
    model,
    year,
    vin,
    license_plate,
    color,
    engine_size,
    fuel_type,
    transmission,
    vehicle_type,
    usage_type,
    estimated_value,
    mileage,
    garage_type,
    annual_mileage,
    safety_features,
    anti_theft_devices
) 
SELECT 
    c.id as customer_id,
    'Toyota' as make,
    'Corolla' as model,
    2020 as year,
    '1HGBH41JXMN109186' as vin,
    'ABC-123' as license_plate,
    'Blanco' as color,
    '1.8L' as engine_size,
    'Gasolina' as fuel_type,
    'Manual' as transmission,
    'Sedán' as vehicle_type,
    'personal' as usage_type,
    15000.00 as estimated_value,
    25000 as mileage,
    'enclosed' as garage_type,
    12000 as annual_mileage,
    ARRAY['ABS', 'Airbags', 'Cinturones de seguridad'] as safety_features,
    ARRAY['Alarma', 'Inmovilizador'] as anti_theft_devices
FROM customers c
LIMIT 1
ON CONFLICT (vin) DO NOTHING;

-- Insertar otro vehículo de prueba
INSERT INTO vehicles (
    customer_id,
    make,
    model,
    year,
    vin,
    license_plate,
    color,
    engine_size,
    fuel_type,
    transmission,
    vehicle_type,
    usage_type,
    estimated_value,
    mileage,
    garage_type,
    annual_mileage,
    safety_features,
    anti_theft_devices
) 
SELECT 
    c.id as customer_id,
    'Honda' as make,
    'Civic' as model,
    2021 as year,
    '2HGBH41JXMN109187' as vin,
    'XYZ-456' as license_plate,
    'Azul' as color,
    '1.5L' as engine_size,
    'Gasolina' as fuel_type,
    'Automático' as transmission,
    'Sedán' as vehicle_type,
    'personal' as usage_type,
    18000.00 as estimated_value,
    15000 as mileage,
    'covered' as garage_type,
    10000 as annual_mileage,
    ARRAY['ABS', 'Airbags', 'Control de estabilidad'] as safety_features,
    ARRAY['Alarma', 'Inmovilizador', 'GPS'] as anti_theft_devices
FROM customers c
LIMIT 1
ON CONFLICT (vin) DO NOTHING;

-- Insertar vehículo comercial de prueba
INSERT INTO vehicles (
    customer_id,
    make,
    model,
    year,
    vin,
    license_plate,
    color,
    engine_size,
    fuel_type,
    transmission,
    vehicle_type,
    usage_type,
    estimated_value,
    mileage,
    garage_type,
    annual_mileage,
    safety_features,
    anti_theft_devices
) 
SELECT 
    c.id as customer_id,
    'Ford' as make,
    'Transit' as model,
    2019 as year,
    '3HGBH41JXMN109188' as vin,
    'COM-789' as license_plate,
    'Blanco' as color,
    '2.0L' as engine_size,
    'Diesel' as fuel_type,
    'Manual' as transmission,
    'Wagon' as vehicle_type,
    'commercial' as usage_type,
    25000.00 as estimated_value,
    45000 as mileage,
    'street' as garage_type,
    25000 as annual_mileage,
    ARRAY['ABS', 'Airbags'] as safety_features,
    ARRAY['Alarma'] as anti_theft_devices
FROM customers c
LIMIT 1
ON CONFLICT (vin) DO NOTHING;

-- Insertar vehículo SUV de prueba
INSERT INTO vehicles (
    customer_id,
    make,
    model,
    year,
    vin,
    license_plate,
    color,
    engine_size,
    fuel_type,
    transmission,
    vehicle_type,
    usage_type,
    estimated_value,
    mileage,
    garage_type,
    annual_mileage,
    safety_features,
    anti_theft_devices
) 
SELECT 
    c.id as customer_id,
    'Nissan' as make,
    'X-Trail' as model,
    2022 as year,
    '4HGBH41JXMN109189' as vin,
    'SUV-001' as license_plate,
    'Negro' as color,
    '2.5L' as engine_size,
    'Gasolina' as fuel_type,
    'Automático' as transmission,
    'SUV' as vehicle_type,
    'personal' as usage_type,
    28000.00 as estimated_value,
    8000 as mileage,
    'enclosed' as garage_type,
    15000 as annual_mileage,
    ARRAY['ABS', 'Airbags', 'Control de estabilidad', 'Frenos de disco'] as safety_features,
    ARRAY['Alarma', 'Inmovilizador', 'GPS', 'Cámara de reversa'] as anti_theft_devices
FROM customers c
LIMIT 1
ON CONFLICT (vin) DO NOTHING;

-- Verificar los vehículos insertados
SELECT 
    'Vehículos creados para cotización:' as info,
    COUNT(*) as total
FROM vehicles;

-- Mostrar los vehículos de ejemplo
SELECT 
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.fuel_type,
    v.transmission,
    v.vehicle_type,
    v.usage_type,
    v.garage_type,
    v.estimated_value,
    v.annual_mileage,
    u.first_name || ' ' || u.last_name as customer_name
FROM vehicles v
JOIN customers c ON v.customer_id = c.id
JOIN users u ON c.user_id = u.id
ORDER BY v.created_at DESC
LIMIT 5;

-- Mostrar resumen por tipo de vehículo
SELECT 
    'Resumen por tipo de vehículo:' as info,
    vehicle_type,
    COUNT(*) as cantidad,
    AVG(estimated_value) as valor_promedio,
    AVG(annual_mileage) as kilometraje_promedio
FROM vehicles
GROUP BY vehicle_type
ORDER BY cantidad DESC;
