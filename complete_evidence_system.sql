-- Verificar y crear todas las tablas necesarias para el sistema de evidencias

-- 1. Tabla para documentos de reclamación (evidencias directas)
CREATE TABLE IF NOT EXISTS claim_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'evidence', -- 'evidence', 'repair_estimate', 'police_report', etc.
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- 'image/png', 'application/pdf', etc.
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    upload_source VARCHAR(20) DEFAULT 'web', -- 'web', 'mobile', 'email'
    description TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Mejorar tabla communications (si no está actualizada)
DO $$
BEGIN
    -- Agregar columnas faltantes si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communications' AND column_name='attachment_url') THEN
        ALTER TABLE communications ADD COLUMN attachment_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communications' AND column_name='attachment_name') THEN
        ALTER TABLE communications ADD COLUMN attachment_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communications' AND column_name='attachment_type') THEN
        ALTER TABLE communications ADD COLUMN attachment_type VARCHAR(100);
    END IF;
END $$;

-- 3. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id ON claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_type ON claim_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_claim_documents_created_at ON claim_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_claim_documents_verified ON claim_documents(is_verified);

-- 4. Asegurar que el bucket de storage existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-attachments', 'claim-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- También crear bucket específico para evidencias
INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-evidence', 'claim-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Políticas de seguridad para claim_documents
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;

-- Política para ver documentos de reclamación
CREATE POLICY IF NOT EXISTS "Users can view claim documents" ON claim_documents
FOR SELECT USING (
    -- El cliente puede ver sus propios documentos
    EXISTS (
        SELECT 1 FROM claims 
        WHERE claims.id = claim_documents.claim_id 
        AND claims.customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    ) OR
    -- Los agentes/admins pueden ver todos los documentos
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'agent', 'adjuster')
    )
);

-- Política para subir documentos
CREATE POLICY IF NOT EXISTS "Users can upload claim documents" ON claim_documents
FOR INSERT WITH CHECK (
    -- El cliente puede subir a sus propias reclamaciones
    EXISTS (
        SELECT 1 FROM claims 
        WHERE claims.id = claim_documents.claim_id 
        AND claims.customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    ) OR
    -- Los agentes/admins pueden subir documentos
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'agent', 'adjuster')
    )
);

-- 6. Políticas de seguridad para los buckets de storage
CREATE POLICY IF NOT EXISTS "Users can upload to claim-evidence" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'claim-evidence' AND
    auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can view claim-evidence" ON storage.objects
FOR SELECT USING (
    bucket_id = 'claim-evidence'
);

-- 7. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para claim_documents
DROP TRIGGER IF EXISTS update_claim_documents_updated_at ON claim_documents;
CREATE TRIGGER update_claim_documents_updated_at
    BEFORE UPDATE ON claim_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Vista para obtener documentos de reclamación con información adicional
CREATE OR REPLACE VIEW claim_documents_with_details AS
SELECT 
    cd.*,
    c.claim_number,
    c.claim_type,
    u.first_name as uploader_first_name,
    u.last_name as uploader_last_name,
    u.role as uploader_role
FROM claim_documents cd
LEFT JOIN claims c ON cd.claim_id = c.id
LEFT JOIN users u ON cd.uploaded_by = u.id;

-- Comentarios para documentar el sistema
COMMENT ON TABLE claim_documents IS 'Almacena documentos y evidencias relacionadas con reclamaciones de seguros';
COMMENT ON COLUMN claim_documents.document_type IS 'Tipo de documento: evidence, repair_estimate, police_report, medical_report, etc.';
COMMENT ON COLUMN claim_documents.is_verified IS 'Indica si el documento ha sido verificado por un agente';
COMMENT ON VIEW claim_documents_with_details IS 'Vista que incluye información adicional sobre los documentos de reclamación';