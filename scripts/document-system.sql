-- Sistema de Gestión de Documentos Mejorado
-- Este script crea las tablas y funciones para un sistema completo de gestión de documentos

-- Tabla para categorías de documentos
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    required_fields JSONB DEFAULT '[]'::JSONB, -- Campos requeridos para esta categoría
    max_file_size BIGINT DEFAULT 10485760, -- 10MB por defecto
    allowed_mime_types JSONB DEFAULT '["application/pdf", "image/jpeg", "image/png"]'::JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla principal de documentos (mejorada)
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- Extensión del archivo
    size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    document_category VARCHAR(100) REFERENCES document_categories(name),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    reference_type VARCHAR(50), -- 'policy', 'claim', 'customer', 'vehicle', etc.
    reference_id UUID, -- ID del objeto referenciado
    uploaded_by UUID REFERENCES users(id),
    file_path TEXT NOT NULL, -- Ruta en el storage
    file_hash VARCHAR(64), -- Hash SHA-256 para verificar integridad
    metadata JSONB DEFAULT '{}'::JSONB, -- Metadatos adicionales
    tags TEXT[], -- Tags para búsqueda
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id), -- Para versionado
    is_current_version BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE, -- Fecha de expiración opcional
    reviewed_by UUID REFERENCES users(id), -- Quien revisó el documento
    reviewed_at TIMESTAMP WITH TIME ZONE, -- Cuándo fue revisado
    review_notes TEXT, -- Notas de la revisión
    access_level VARCHAR(20) DEFAULT 'normal' CHECK (access_level IN ('public', 'normal', 'restricted', 'confidential')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para compartir documentos
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id),
    shared_with_role VARCHAR(50), -- Compartir con todos los usuarios de un rol
    permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para histórico de acciones en documentos
CREATE TABLE IF NOT EXISTS document_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'upload', 'download', 'view', 'approve', 'reject', 'delete', etc.
    details JSONB DEFAULT '{}'::JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para plantillas de documentos
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) REFERENCES document_categories(name),
    template_data JSONB NOT NULL, -- Estructura de la plantilla
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(document_category);
CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON documents(expires_at);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_is_current ON documents(is_current_version) WHERE is_current_version = true;
CREATE INDEX IF NOT EXISTS idx_document_shares_user ON document_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_log_document ON document_audit_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_log_user ON document_audit_log(user_id);

-- Función para obtener estadísticas de documentos
CREATE OR REPLACE FUNCTION get_document_statistics(user_role TEXT DEFAULT NULL)
RETURNS TABLE (
    total_documents BIGINT,
    pending_review BIGINT,
    approved BIGINT,
    rejected BIGINT,
    expired BIGINT,
    storage_used BIGINT,
    by_category JSONB
) AS $$
DECLARE
    category_stats JSONB;
BEGIN
    -- Estadísticas por categoría
    SELECT jsonb_object_agg(document_category, count)
    INTO category_stats
    FROM (
        SELECT document_category, COUNT(*) as count
        FROM documents
        WHERE is_current_version = true
        GROUP BY document_category
    ) cat_counts;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM documents WHERE is_current_version = true) as total_documents,
        (SELECT COUNT(*) FROM documents WHERE status = 'pending' AND is_current_version = true) as pending_review,
        (SELECT COUNT(*) FROM documents WHERE status = 'approved' AND is_current_version = true) as approved,
        (SELECT COUNT(*) FROM documents WHERE status = 'rejected' AND is_current_version = true) as rejected,
        (SELECT COUNT(*) FROM documents WHERE expires_at < NOW() AND is_current_version = true) as expired,
        (SELECT COALESCE(SUM(size), 0) FROM documents WHERE is_current_version = true) as storage_used,
        COALESCE(category_stats, '{}'::JSONB) as by_category;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar documentos avanzada
CREATE OR REPLACE FUNCTION search_documents(
    search_term TEXT DEFAULT '',
    status_filter TEXT DEFAULT 'all',
    category_filter TEXT DEFAULT 'all',
    user_id UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    name TEXT,
    document_category TEXT,
    status TEXT,
    size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    uploader_name TEXT,
    reference_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name::TEXT,
        d.document_category::TEXT,
        d.status::TEXT,
        d.size,
        d.created_at,
        CONCAT(u.first_name, ' ', u.last_name)::TEXT as uploader_name,
        CASE 
            WHEN d.reference_type = 'policy' THEN 
                jsonb_build_object('type', 'policy', 'number', p.policy_number, 'customer', CONCAT(c.first_name, ' ', c.last_name))
            WHEN d.reference_type = 'claim' THEN 
                jsonb_build_object('type', 'claim', 'number', cl.claim_number)
            ELSE '{}'::JSONB
        END as reference_info
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    LEFT JOIN policies p ON d.reference_type = 'policy' AND d.reference_id = p.id
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN claims cl ON d.reference_type = 'claim' AND d.reference_id = cl.id
    WHERE d.is_current_version = true
        AND (search_term = '' OR d.name ILIKE '%' || search_term || '%' 
             OR d.document_category ILIKE '%' || search_term || '%'
             OR u.first_name ILIKE '%' || search_term || '%'
             OR u.last_name ILIKE '%' || search_term || '%')
        AND (status_filter = 'all' OR d.status = status_filter)
        AND (category_filter = 'all' OR d.document_category = category_filter)
    ORDER BY d.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Función para validar acceso a documento
CREATE OR REPLACE FUNCTION can_access_document(doc_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    doc_record documents%ROWTYPE;
    user_roles TEXT[];
    has_access BOOLEAN := false;
BEGIN
    -- Obtener información del documento
    SELECT * INTO doc_record FROM documents WHERE id = doc_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Obtener roles del usuario
    SELECT array_agg(r.name) INTO user_roles
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id;
    
    -- Verificar acceso
    -- 1. El usuario es el que subió el documento
    IF doc_record.uploaded_by = user_id THEN
        has_access := true;
    END IF;
    
    -- 2. El documento es público
    IF doc_record.access_level = 'public' THEN
        has_access := true;
    END IF;
    
    -- 3. Administradores tienen acceso total
    IF 'admin' = ANY(user_roles) THEN
        has_access := true;
    END IF;
    
    -- 4. Verificar permisos específicos de compartición
    IF NOT has_access THEN
        SELECT true INTO has_access
        FROM document_shares ds
        WHERE ds.document_id = doc_id
            AND (
                ds.shared_with_user_id = user_id
                OR ds.shared_with_role = ANY(user_roles)
            )
            AND (ds.expires_at IS NULL OR ds.expires_at > NOW());
    END IF;
    
    RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql;

-- Función para crear nueva versión de documento
CREATE OR REPLACE FUNCTION create_document_version(
    parent_doc_id UUID,
    new_name TEXT,
    new_file_path TEXT,
    new_size BIGINT,
    new_mime_type TEXT,
    uploaded_by_user UUID
) RETURNS UUID AS $$
DECLARE
    parent_doc documents%ROWTYPE;
    new_doc_id UUID;
    new_version_number INTEGER;
BEGIN
    -- Obtener documento padre
    SELECT * INTO parent_doc FROM documents WHERE id = parent_doc_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Documento padre no encontrado';
    END IF;
    
    -- Marcar versión anterior como no actual
    UPDATE documents 
    SET is_current_version = false, updated_at = NOW()
    WHERE parent_document_id = parent_doc_id OR id = parent_doc_id;
    
    -- Calcular nuevo número de versión
    SELECT COALESCE(MAX(version), 0) + 1 INTO new_version_number
    FROM documents 
    WHERE parent_document_id = parent_doc_id OR id = parent_doc_id;
    
    -- Crear nueva versión
    INSERT INTO documents (
        name,
        description,
        type,
        size,
        mime_type,
        document_category,
        status,
        reference_type,
        reference_id,
        uploaded_by,
        file_path,
        metadata,
        tags,
        version,
        parent_document_id,
        is_current_version,
        expires_at,
        access_level
    ) VALUES (
        new_name,
        parent_doc.description,
        parent_doc.type,
        new_size,
        new_mime_type,
        parent_doc.document_category,
        'pending',
        parent_doc.reference_type,
        parent_doc.reference_id,
        uploaded_by_user,
        new_file_path,
        parent_doc.metadata,
        parent_doc.tags,
        new_version_number,
        CASE WHEN parent_doc.parent_document_id IS NULL THEN parent_doc_id ELSE parent_doc.parent_document_id END,
        true,
        parent_doc.expires_at,
        parent_doc.access_level
    ) RETURNING id INTO new_doc_id;
    
    RETURN new_doc_id;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar documentos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_documents()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    doc_record RECORD;
BEGIN
    -- Marcar documentos expirados como archivados
    FOR doc_record IN 
        SELECT id, file_path 
        FROM documents 
        WHERE expires_at < NOW() 
        AND status != 'archived'
        AND is_current_version = true
    LOOP
        UPDATE documents 
        SET status = 'archived', updated_at = NOW()
        WHERE id = doc_record.id;
        
        cleanup_count := cleanup_count + 1;
        
        -- Log de la acción
        INSERT INTO document_audit_log (
            document_id,
            user_id,
            action,
            details
        ) VALUES (
            doc_record.id,
            NULL,
            'auto_archive',
            jsonb_build_object('reason', 'expired', 'archived_at', NOW())
        );
    END LOOP;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoría automática
CREATE OR REPLACE FUNCTION document_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO document_audit_log (document_id, user_id, action, details)
        VALUES (NEW.id, NEW.uploaded_by, 'upload', jsonb_build_object('document_name', NEW.name));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO document_audit_log (document_id, user_id, action, details)
            VALUES (NEW.id, NEW.reviewed_by, 'status_change', 
                   jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO document_audit_log (document_id, user_id, action, details)
        VALUES (OLD.id, NULL, 'delete', jsonb_build_object('document_name', OLD.name));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
DROP TRIGGER IF EXISTS document_audit_trigger ON documents;
CREATE TRIGGER document_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION document_audit_trigger();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

CREATE TRIGGER document_categories_updated_at
    BEFORE UPDATE ON document_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

-- Insertar categorías por defecto
INSERT INTO document_categories (name, description, max_file_size, allowed_mime_types) VALUES
('license', 'Licencias de Conducir', 5242880, '["image/jpeg", "image/png", "application/pdf"]'),
('vehicle_registration', 'Registro de Vehículos', 5242880, '["image/jpeg", "image/png", "application/pdf"]'),
('insurance_card', 'Tarjetas de Seguro', 2097152, '["image/jpeg", "image/png", "application/pdf"]'),
('damage_photos', 'Fotos de Daños', 10485760, '["image/jpeg", "image/png"]'),
('repair_estimates', 'Estimaciones de Reparación', 10485760, '["application/pdf", "image/jpeg", "image/png"]'),
('medical_reports', 'Reportes Médicos', 20971520, '["application/pdf"]'),
('police_reports', 'Reportes Policiales', 15728640, '["application/pdf", "image/jpeg", "image/png"]'),
('contracts', 'Contratos', 10485760, '["application/pdf"]'),
('identity_documents', 'Documentos de Identidad', 5242880, '["image/jpeg", "image/png", "application/pdf"]'),
('financial_documents', 'Documentos Financieros', 15728640, '["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]')
ON CONFLICT (name) DO NOTHING;

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Política para documentos (acceso basado en función personalizada)
CREATE POLICY "Users can access allowed documents" ON documents
    FOR ALL USING (can_access_document(id, auth.uid()));

-- Política para categorías (todos pueden ver)
CREATE POLICY "Everyone can view document categories" ON document_categories
    FOR SELECT USING (true);

-- Solo admins pueden gestionar categorías
CREATE POLICY "Admin can manage document categories" ON document_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Política para document_shares
CREATE POLICY "Users can manage their document shares" ON document_shares
    FOR ALL USING (
        created_by = auth.uid()
        OR shared_with_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Política para audit log (solo lectura para usuarios autorizados)
CREATE POLICY "Authorized users can view audit log" ON document_audit_log
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'agent')
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE documents IS 'Tabla principal para gestión de documentos con versionado y control de acceso';
COMMENT ON TABLE document_categories IS 'Categorías de documentos con reglas de validación';
COMMENT ON TABLE document_shares IS 'Permisos de compartición de documentos';
COMMENT ON TABLE document_audit_log IS 'Log de auditoría para todas las acciones en documentos';
COMMENT ON TABLE document_templates IS 'Plantillas para generación automática de documentos';
COMMENT ON FUNCTION get_document_statistics IS 'Obtiene estadísticas completas del sistema de documentos';
COMMENT ON FUNCTION search_documents IS 'Búsqueda avanzada de documentos con filtros';
COMMENT ON FUNCTION can_access_document IS 'Valida si un usuario tiene acceso a un documento específico';
COMMENT ON FUNCTION create_document_version IS 'Crea una nueva versión de un documento existente';
COMMENT ON FUNCTION cleanup_expired_documents IS 'Limpia documentos expirados marcándolos como archivados';