-- Script para crear clientes de prueba para testing del selector de agentes
-- Este script crea usuarios y clientes de prueba

-- Crear usuarios de prueba
INSERT INTO users (id, email, first_name, last_name, phone, role, is_active) 
VALUES 
  ('test-customer-1', 'cliente1@test.com', 'Juan', 'Pérez', '+1234567890', 'customer', true),
  ('test-customer-2', 'cliente2@test.com', 'María', 'González', '+1234567891', 'customer', true),
  ('test-customer-3', 'cliente3@test.com', 'Carlos', 'López', '+1234567892', 'customer', true)
ON CONFLICT (id) DO NOTHING;

-- Crear perfiles de clientes de prueba
INSERT INTO customers (id, user_id, date_of_birth, gender, address, city, state, postal_code, country, license_number, driving_experience_years, marital_status, occupation, annual_income, risk_score)
VALUES 
  (gen_random_uuid(), 'test-customer-1', '1990-01-15', 'M', 'Calle 123 #45-67', 'Bogotá', 'Cundinamarca', '110111', 'Colombia', 'DL123456789', 10, 'single', 'Ingeniero', 50000, 75),
  (gen_random_uuid(), 'test-customer-2', '1985-05-20', 'F', 'Carrera 45 #78-90', 'Medellín', 'Antioquia', '050001', 'Colombia', 'DL987654321', 15, 'married', 'Doctora', 80000, 60),
  (gen_random_uuid(), 'test-customer-3', '1992-11-30', 'M', 'Avenida 67 #12-34', 'Cali', 'Valle del Cauca', '760001', 'Colombia', 'DL456789123', 8, 'single', 'Abogado', 60000, 70)
ON CONFLICT (user_id) DO NOTHING;

-- Verificar los datos creados
SELECT 
    u.email, 
    u.first_name, 
    u.last_name, 
    c.id as customer_id,
    c.city,
    c.occupation
FROM users u
JOIN customers c ON u.id = c.user_id
WHERE u.email LIKE '%@test.com'
ORDER BY u.first_name;