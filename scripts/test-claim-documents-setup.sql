-- Script de prueba para verificar el sistema de documentos de reclamaciones
-- Ejecutar después de setup-claim-documents-storage.sql

-- 1. Verificar que las tablas fueron creadas correctamente
DO $$
BEGIN
    -- Verificar claim_customer_documents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claim_customer_documents') THEN
        RAISE NOTICE '✅ Tabla claim_customer_documents existe';
        
        -- Contar registros
        EXECUTE 'SELECT COUNT(*) FROM claim_customer_documents' INTO @row_count;
        RAISE NOTICE '   📊 Registros existentes: %', @row_count;
    ELSE
        RAISE NOTICE '❌ Tabla claim_customer_documents NO existe';
    END IF;
    
    -- Verificar claim_documents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claim_documents') THEN
        RAISE NOTICE '✅ Tabla claim_documents existe';
    ELSE
        RAISE NOTICE '❌ Tabla claim_documents NO existe';
    END IF;
END $$;

-- 2. Verificar políticas RLS
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('claim_customer_documents', 'claim_documents')
ORDER BY tablename, policyname;

-- 3. Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('claim_customer_documents', 'claim_documents')
ORDER BY tablename, indexname;

-- 4. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('claim_customer_documents', 'claim_documents')
ORDER BY event_object_table, trigger_name;

-- 5. Obtener información de reclamaciones existentes para pruebas
SELECT 
    c.id,
    c.claim_number,
    c.status,
    c.customer_id,
    cust.first_name,
    cust.last_name
FROM claims c
JOIN customers cust ON cust.id = c.customer_id
LIMIT 5;

-- 6. Verificar usuarios y sus roles
SELECT 
    u.id,
    u.email,
    u.role,
    u.first_name,
    u.last_name
FROM users u
WHERE u.role IN ('admin', 'agent', 'adjuster', 'customer')
ORDER BY u.role, u.email
LIMIT 10;

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN COMPLETADA';
    RAISE NOTICE '';
    RAISE NOTICE '📋 CHECKLIST PARA COMPLETAR LA CONFIGURACIÓN:';
    RAISE NOTICE '□ Crear bucket "clientes-adjuntos" en Supabase Storage';
    RAISE NOTICE '□ Crear bucket "claim-evidence" en Supabase Storage';
    RAISE NOTICE '□ Configurar políticas de Storage según documentación';
    RAISE NOTICE '□ Probar subida de documentos desde la aplicación web';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Una vez completado, el sistema de documentos estará 100% funcional!';
END $$;