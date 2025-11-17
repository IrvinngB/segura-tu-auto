-- =====================================================
-- SCRIPT DE CARGA DE DATOS DE PRUEBA
-- Sistema de Seguros de Vehículos
-- =====================================================
-- IMPORTANTE: Este script asume que Supabase Auth ya tiene los usuarios creados
-- Debes crear los usuarios primero en Supabase Auth Dashboard con estos correos:
-- 1. admin@segura.com (Admin)
-- 2. agente@segura.com (Agente)
-- 3. ajustador@segura.com (Ajustador)
-- 4. cliente1@segura.com (Cliente)
-- 5. cliente2@segura.com (Cliente)
-- 6. cliente3@segura.com (Cliente)
-- =====================================================

-- Limpiar datos existentes (opcional - comentar si no quieres borrar)
-- DELETE FROM claim_customer_documents;
-- DELETE FROM damage_assessments;
-- DELETE FROM claims;
-- DELETE FROM payments;
-- DELETE FROM policies;
-- DELETE FROM vehicles;
-- DELETE FROM customers;
-- DELETE FROM users WHERE email LIKE '%@segura.com';

-- =====================================================
-- 1. USUARIOS (Vinculados con Supabase Auth)
-- =====================================================
-- NOTA: Reemplaza los UUIDs con los IDs reales de Supabase Auth
-- Puedes obtenerlos desde: Authentication > Users en el dashboard de Supabase

-- Admin
INSERT INTO users (id, email, first_name, last_name, role, phone, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@segura.com', 'Carlos', 'Administrador', 'admin', '+507 6000-0001', NOW());

-- Agente
INSERT INTO users (id, email, first_name, last_name, role, phone, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'agente@segura.com', 'María', 'Ventas', 'agent', '+507 6000-0002', NOW());

-- Ajustador
INSERT INTO users (id, email, first_name, last_name, role, phone, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'ajustador@segura.com', 'Pedro', 'Evaluador', 'adjuster', '+507 6000-0003', NOW());

-- =====================================================
-- 2. CLIENTES
-- =====================================================
INSERT INTO customers (id, email, first_name, last_name, phone, date_of_birth, address, city, country, postal_code, created_at)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'cliente1@segura.com', 'Juan', 'Pérez', '+507 6100-0001', '1985-03-15', 'Calle 50, Edificio Plaza', 'Ciudad de Panamá', 'Panamá', '0801', NOW()),
  ('10000000-0000-0000-0000-000000000002', 'cliente2@segura.com', 'Ana', 'García', '+507 6100-0002', '1990-07-22', 'Vía España, Torre Global', 'Ciudad de Panamá', 'Panamá', '0802', NOW()),
  ('10000000-0000-0000-0000-000000000003', 'cliente3@segura.com', 'Roberto', 'Martínez', '+507 6100-0003', '1988-11-08', 'Costa del Este, Residencial Mar', 'Ciudad de Panamá', 'Panamá', '0803', NOW());

-- =====================================================
-- 3. VEHÍCULOS
-- =====================================================
INSERT INTO vehicles (id, customer_id, make, model, year, vin, license_plate, color, mileage, purchase_date, purchase_price, current_value, created_at)
VALUES 
  -- Vehículos Cliente 1
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Toyota', 'Corolla', 2020, '1HGBH41JXMN109186', 'ABC-1234', 'Blanco', 45000, '2020-01-15', 22000.00, 18000.00, NOW()),
  
  -- Vehículos Cliente 2
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Honda', 'Civic', 2021, '2HGFC2F59MH123456', 'DEF-5678', 'Negro', 30000, '2021-03-20', 25000.00, 22000.00, NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Mazda', 'CX-5', 2022, '3MZBM1U76MM123789', 'GHI-9012', 'Rojo', 15000, '2022-06-10', 32000.00, 30000.00, NOW()),
  
  -- Vehículos Cliente 3
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Hyundai', 'Tucson', 2019, '5NMZU3LB5KH123456', 'JKL-3456', 'Gris', 60000, '2019-08-05', 28000.00, 20000.00, NOW());

-- =====================================================
-- 4. PÓLIZAS
-- =====================================================
INSERT INTO policies (id, policy_number, customer_id, vehicle_id, policy_type, coverage_type, start_date, end_date, premium_amount, deductible, status, agent_id, created_at)
VALUES 
  -- Póliza Cliente 1 (Activa)
  ('30000000-0000-0000-0000-000000000001', 'POL-2024-001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 
   'auto', 'comprehensive', '2024-01-01', '2025-01-01', 1200.00, 500.00, 'active', '00000000-0000-0000-0000-000000000002', NOW()),
  
  -- Pólizas Cliente 2 (Ambas activas)
  ('30000000-0000-0000-0000-000000000002', 'POL-2024-002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 
   'auto', 'comprehensive', '2024-02-01', '2025-02-01', 1400.00, 500.00, 'active', '00000000-0000-0000-0000-000000000002', NOW()),
  ('30000000-0000-0000-0000-000000000003', 'POL-2024-003', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 
   'auto', 'comprehensive', '2024-03-01', '2025-03-01', 1800.00, 750.00, 'active', '00000000-0000-0000-0000-000000000002', NOW()),
  
  -- Póliza Cliente 3 (Activa)
  ('30000000-0000-0000-0000-000000000004', 'POL-2024-004', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 
   'auto', 'liability', '2024-01-15', '2025-01-15', 900.00, 300.00, 'active', '00000000-0000-0000-0000-000000000002', NOW());

-- =====================================================
-- 5. RECLAMACIONES
-- =====================================================
INSERT INTO claims (id, claim_number, policy_id, customer_id, incident_date, incident_location, incident_description, claim_amount, status, assigned_adjuster_id, created_at)
VALUES 
  -- Reclamación Cliente 1 (Pendiente de asignación)
  ('40000000-0000-0000-0000-000000000001', 'CLM-2024-001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   '2024-10-15', 'Vía Brasil, Ciudad de Panamá', 'Colisión trasera en semáforo. Daños en parachoques y luces traseras.', 2500.00, 'submitted', NULL, NOW()),
  
  -- Reclamación Cliente 2 (Asignada y bajo revisión)
  ('40000000-0000-0000-0000-000000000002', 'CLM-2024-002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   '2024-10-20', 'Corredor Sur, Ciudad de Panamá', 'Daño por piedra en parabrisas durante trayecto en autopista.', 800.00, 'under_review', '00000000-0000-0000-0000-000000000003', NOW()),
  
  -- Reclamación Cliente 2 (Segunda reclamación - Aprobada)
  ('40000000-0000-0000-0000-000000000003', 'CLM-2024-003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
   '2024-09-05', 'Estacionamiento Multiplaza', 'Rayón en puerta lateral por carrito de compras.', 450.00, 'approved', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '20 days'),
  
  -- Reclamación Cliente 3 (Rechazada)
  ('40000000-0000-0000-0000-000000000004', 'CLM-2024-004', '30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003',
   '2024-08-10', 'Residencia del asegurado', 'Daños por inundación en garaje.', 5000.00, 'rejected', '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '45 days');

-- =====================================================
-- 6. EVALUACIONES DE DAÑOS
-- =====================================================
INSERT INTO damage_assessments (id, claim_id, adjuster_id, assessment_date, damage_description, estimated_repair_cost, recommended_action, notes, created_at)
VALUES 
  -- Evaluación para CLM-2024-002
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003',
   NOW() - INTERVAL '2 days', 'Parabrisas con fisura de 15cm en esquina superior derecha. Requiere reemplazo completo.', 750.00, 
   'approve', 'Daño cubierto por póliza. Autorizar reemplazo en taller certificado.', NOW() - INTERVAL '2 days'),
  
  -- Evaluación para CLM-2024-003 (Aprobada)
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
   NOW() - INTERVAL '18 days', 'Rayón superficial de 20cm en puerta lateral derecha. Requiere repintado.', 420.00, 
   'approve', 'Daño menor cubierto. Aprobado para reparación.', NOW() - INTERVAL '18 days'),
  
  -- Evaluación para CLM-2024-004 (Rechazada)
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003',
   NOW() - INTERVAL '43 days', 'Daños extensos por inundación en motor y sistema eléctrico.', 4800.00, 
   'reject', 'La póliza de responsabilidad civil no cubre daños por inundación. Reclamación rechazada.', NOW() - INTERVAL '43 days');

-- =====================================================
-- 7. PAGOS
-- =====================================================
INSERT INTO payments (id, policy_id, customer_id, amount, payment_date, payment_method, status, transaction_id, created_at)
VALUES 
  -- Pagos Cliente 1
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   1200.00, '2024-01-01', 'credit_card', 'completed', 'TXN-2024-001', NOW() - INTERVAL '300 days'),
  
  -- Pagos Cliente 2
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   1400.00, '2024-02-01', 'bank_transfer', 'completed', 'TXN-2024-002', NOW() - INTERVAL '270 days'),
  ('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
   1800.00, '2024-03-01', 'credit_card', 'completed', 'TXN-2024-003', NOW() - INTERVAL '240 days'),
  
  -- Pagos Cliente 3
  ('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003',
   900.00, '2024-01-15', 'debit_card', 'completed', 'TXN-2024-004', NOW() - INTERVAL '285 days'),
  
  -- Pago pendiente Cliente 1 (próximo vencimiento)
  ('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   100.00, NOW() + INTERVAL '15 days', 'credit_card', 'pending', NULL, NOW());

-- =====================================================
-- 8. DOCUMENTOS DE RECLAMACIONES
-- =====================================================
INSERT INTO claim_customer_documents (id, claim_id, customer_id, document_type, file_name, file_url, file_size, mime_type, upload_date, status, notes, created_at)
VALUES 
  -- Documentos CLM-2024-001 (Pendientes de revisión)
  ('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'photos', 'dano_trasero_1.jpg', 'https://placeholder.com/photo1.jpg', 2048576, 'image/jpeg', NOW() - INTERVAL '1 day', 'pending', NULL, NOW() - INTERVAL '1 day'),
  ('70000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'photos', 'dano_trasero_2.jpg', 'https://placeholder.com/photo2.jpg', 1835008, 'image/jpeg', NOW() - INTERVAL '1 day', 'pending', NULL, NOW() - INTERVAL '1 day'),
  ('70000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'license', 'licencia_juan.pdf', 'https://placeholder.com/license1.pdf', 512000, 'application/pdf', NOW() - INTERVAL '1 day', 'pending', NULL, NOW() - INTERVAL '1 day'),
  
  -- Documentos CLM-2024-002 (Aprobados)
  ('70000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'photos', 'parabrisas_danado.jpg', 'https://placeholder.com/photo3.jpg', 1920000, 'image/jpeg', NOW() - INTERVAL '5 days', 'approved', 'Foto clara del daño', NOW() - INTERVAL '5 days'),
  ('70000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'invoice', 'cotizacion_parabrisas.pdf', 'https://placeholder.com/invoice1.pdf', 256000, 'application/pdf', NOW() - INTERVAL '4 days', 'approved', 'Cotización válida', NOW() - INTERVAL '4 days'),
  
  -- Documentos CLM-2024-003 (Aprobados)
  ('70000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
   'photos', 'rayon_puerta.jpg', 'https://placeholder.com/photo4.jpg', 1536000, 'image/jpeg', NOW() - INTERVAL '22 days', 'approved', NULL, NOW() - INTERVAL '22 days'),
  
  -- Documentos CLM-2024-004 (Rechazados)
  ('70000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003',
   'photos', 'dano_inundacion_1.jpg', 'https://placeholder.com/photo5.jpg', 2304000, 'image/jpeg', NOW() - INTERVAL '47 days', 'rejected', 'Daño no cubierto por póliza', NOW() - INTERVAL '47 days'),
  ('70000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003',
   'photos', 'dano_inundacion_2.jpg', 'https://placeholder.com/photo6.jpg', 2150400, 'image/jpeg', NOW() - INTERVAL '47 days', 'rejected', 'Daño no cubierto por póliza', NOW() - INTERVAL '47 days');

-- =====================================================
-- 9. LOGS DE AUDITORÍA (Ejemplos)
-- =====================================================
INSERT INTO audit_logs (id, table_name, record_id, action, old_values, new_values, changed_by, changed_at)
VALUES 
  -- Log de creación de póliza
  ('80000000-0000-0000-0000-000000000001', 'policies', '30000000-0000-0000-0000-000000000001', 'INSERT', NULL, 
   '{"policy_number": "POL-2024-001", "status": "active", "premium_amount": 1200.00}'::jsonb, 
   '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '300 days'),
  
  -- Log de actualización de reclamación
  ('80000000-0000-0000-0000-000000000002', 'claims', '40000000-0000-0000-0000-000000000002', 'UPDATE', 
   '{"status": "submitted", "assigned_adjuster_id": null}'::jsonb,
   '{"status": "under_review", "assigned_adjuster_id": "00000000-0000-0000-0000-000000000003"}'::jsonb,
   '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '3 days'),
  
  -- Log de aprobación de reclamación
  ('80000000-0000-0000-0000-000000000003', 'claims', '40000000-0000-0000-0000-000000000003', 'UPDATE',
   '{"status": "under_review"}'::jsonb,
   '{"status": "approved", "approved_amount": 420.00}'::jsonb,
   '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '18 days'),
  
  -- Log de rechazo de reclamación
  ('80000000-0000-0000-0000-000000000004', 'claims', '40000000-0000-0000-0000-000000000004', 'UPDATE',
   '{"status": "under_review"}'::jsonb,
   '{"status": "rejected", "rejection_reason": "Daño no cubierto por póliza"}'::jsonb,
   '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '43 days');

-- =====================================================
-- RESUMEN DE DATOS CARGADOS
-- =====================================================
-- 3 Usuarios del sistema (Admin, Agente, Ajustador)
-- 3 Clientes
-- 4 Vehículos
-- 4 Pólizas activas
-- 4 Reclamaciones (1 submitted, 1 under_review, 1 approved, 1 rejected)
-- 3 Evaluaciones de daños
-- 5 Pagos (4 completados, 1 pendiente)
-- 8 Documentos (3 pending, 4 approved, 1 rejected)
-- 4 Logs de auditoría
-- =====================================================

-- Verificar datos cargados
SELECT 'Usuarios' as tabla, COUNT(*) as registros FROM users WHERE email LIKE '%@segura.com'
UNION ALL
SELECT 'Clientes', COUNT(*) FROM customers
UNION ALL
SELECT 'Vehículos', COUNT(*) FROM vehicles
UNION ALL
SELECT 'Pólizas', COUNT(*) FROM policies
UNION ALL
SELECT 'Reclamaciones', COUNT(*) FROM claims
UNION ALL
SELECT 'Evaluaciones', COUNT(*) FROM damage_assessments
UNION ALL
SELECT 'Pagos', COUNT(*) FROM payments
UNION ALL
SELECT 'Documentos', COUNT(*) FROM claim_customer_documents
UNION ALL
SELECT 'Logs Auditoría', COUNT(*) FROM audit_logs;
