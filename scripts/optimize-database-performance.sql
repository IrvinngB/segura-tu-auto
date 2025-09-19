-- Script para optimizar el rendimiento de la base de datos
-- Este script crea índices y optimizaciones para mejorar las consultas

-- 1. Crear índices para consultas frecuentes en la tabla users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2. Crear índices para la tabla customers
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- 3. Crear índices para la tabla vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- 4. Crear índices para la tabla policies
CREATE INDEX IF NOT EXISTS idx_policies_customer_id ON policies(customer_id);
CREATE INDEX IF NOT EXISTS idx_policies_agent_id ON policies(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);

-- 5. Crear índices para la tabla claims
CREATE INDEX IF NOT EXISTS idx_claims_customer_id ON claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);

-- 6. Crear índices para la tabla communications
CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_communications_agent_id ON communications(agent_id);
CREATE INDEX IF NOT EXISTS idx_communications_policy_id ON communications(policy_id);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(communication_type);

-- 7. Crear índices para la tabla policy_coverages
CREATE INDEX IF NOT EXISTS idx_policy_coverages_policy_id ON policy_coverages(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_coverages_coverage_id ON policy_coverages(coverage_id);

-- 8. Optimizar configuración de PostgreSQL para mejor rendimiento
-- (Estos cambios requieren reiniciar PostgreSQL)

-- Configurar work_mem para consultas más rápidas
-- ALTER SYSTEM SET work_mem = '256MB';

-- Configurar shared_buffers para mejor cache
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Configurar effective_cache_size
-- ALTER SYSTEM SET effective_cache_size = '1GB';

-- 9. Analizar las tablas para actualizar estadísticas
ANALYZE users;
ANALYZE customers;
ANALYZE vehicles;
ANALYZE policies;
ANALYZE claims;
ANALYZE communications;
ANALYZE policy_coverages;

-- 10. Verificar índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'customers', 'vehicles', 'policies', 'claims', 'communications', 'policy_coverages')
ORDER BY tablename, indexname;

-- 11. Verificar tamaño de las tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'customers', 'vehicles', 'policies', 'claims', 'communications', 'policy_coverages')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
