-- Script completo para configurar el sistema de documentos y evidencias en reclamaciones
-- Este script debe ejecutarse en Supabase SQL Editor

-- 1. Crear tabla para documentos de clientes si no existe
CREATE TABLE IF NOT EXISTS claim_customer_documents (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    claim_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'license', 'id', 'proof_of_address', 'invoice', 
        'police_report', 'photos', 'other'
    )),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    reviewed_by uuid,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT claim_customer_documents_pkey PRIMARY KEY (id),
    CONSTRAINT claim_customer_documents_claim_id_fkey 
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT claim_customer_documents_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT claim_customer_documents_reviewed_by_fkey 
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- 2. Crear tabla para documentos de evidencia si no existe
CREATE TABLE IF NOT EXISTS claim_documents (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    claim_id uuid NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by uuid NOT NULL,
    upload_source VARCHAR(50) DEFAULT 'web',
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT claim_documents_pkey PRIMARY KEY (id),
    CONSTRAINT claim_documents_claim_id_fkey 
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT claim_documents_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_claim_customer_documents_claim_id 
    ON claim_customer_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_customer_documents_customer_id 
    ON claim_customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_claim_customer_documents_status 
    ON claim_customer_documents(status);

CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id 
    ON claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_uploaded_by 
    ON claim_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_claim_documents_document_type 
    ON claim_documents(document_type);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE claim_customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de seguridad para claim_customer_documents
-- Ver documentos
CREATE POLICY "Users can view claim customer documents based on role" 
    ON claim_customer_documents FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND (
                -- Admins y ajustadores pueden ver todos
                u.role IN ('admin', 'adjuster', 'agent') OR
                -- Clientes solo pueden ver sus propios documentos
                (u.role = 'customer' AND customer_id IN (
                    SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
                ))
            )
        )
    );

-- Insertar documentos (clientes y staff)
CREATE POLICY "Authorized users can insert claim customer documents" 
    ON claim_customer_documents FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND (
                u.role IN ('admin', 'adjuster', 'agent') OR
                -- Clientes pueden subir documentos a sus propias reclamaciones
                (u.role = 'customer' AND customer_id IN (
                    SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
                ))
            )
        )
    );

-- Actualizar documentos (solo staff para aprobación/rechazo)
CREATE POLICY "Staff can update claim customer documents" 
    ON claim_customer_documents FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'adjuster', 'agent')
        )
    );

-- Eliminar documentos
CREATE POLICY "Users can delete their own claim customer documents" 
    ON claim_customer_documents FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND (
                u.role IN ('admin', 'adjuster') OR
                -- Clientes pueden eliminar sus documentos pendientes
                (u.role = 'customer' AND status = 'pending' AND customer_id IN (
                    SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
                ))
            )
        )
    );

-- 6. Crear políticas de seguridad para claim_documents (evidencia)
-- Ver documentos
CREATE POLICY "Users can view claim documents based on role" 
    ON claim_documents FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN claims cl ON cl.id = claim_documents.claim_id
            WHERE u.id = auth.uid()
            AND (
                -- Staff puede ver todos
                u.role IN ('admin', 'adjuster', 'agent') OR
                -- Clientes pueden ver documentos de sus reclamaciones
                (u.role = 'customer' AND cl.customer_id IN (
                    SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
                ))
            )
        )
    );

-- Insertar documentos
CREATE POLICY "Authorized users can insert claim documents" 
    ON claim_documents FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'adjuster', 'agent', 'customer')
        )
    );

-- Actualizar documentos
CREATE POLICY "Staff can update claim documents" 
    ON claim_documents FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'adjuster', 'agent')
        )
    );

-- Eliminar documentos
CREATE POLICY "Users can delete their own claim documents" 
    ON claim_documents FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND (
                u.role IN ('admin', 'adjuster') OR
                uploaded_by = auth.uid()
            )
        )
    );

-- 7. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Crear triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_claim_customer_documents_updated_at ON claim_customer_documents;
CREATE TRIGGER update_claim_customer_documents_updated_at
    BEFORE UPDATE ON claim_customer_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_documents_updated_at ON claim_documents;
CREATE TRIGGER update_claim_documents_updated_at
    BEFORE UPDATE ON claim_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Crear las políticas de Storage
-- NOTA: Estas políticas se deben crear en el panel de Storage de Supabase

-- Para el bucket 'clientes-adjuntos' (documentos de clientes):
/*
Políticas a crear en Supabase Storage > clientes-adjuntos:

1. SELECT policy: "Users can view their own claim documents"
   Target roles: authenticated
   Policy definition:
   ((bucket_id = 'clientes-adjuntos'::text) AND (auth.role() = 'authenticated'::text))

2. INSERT policy: "Users can upload claim documents"
   Target roles: authenticated
   Policy definition:
   ((bucket_id = 'clientes-adjuntos'::text) AND (auth.role() = 'authenticated'::text))

3. UPDATE policy: "Users can update their own documents"
   Target roles: authenticated
   Policy definition:
   ((bucket_id = 'clientes-adjuntos'::text) AND (auth.role() = 'authenticated'::text))

4. DELETE policy: "Users can delete their own documents"
   Target roles: authenticated
   Policy definition:
   ((bucket_id = 'clientes-adjuntos'::text) AND (auth.role() = 'authenticated'::text))
*/

-- Para el bucket 'claim-evidence' (evidencia de reclamaciones):
/*
Políticas a crear en Supabase Storage > claim-evidence:

1. SELECT policy: "Authenticated users can view claim evidence"
   Target roles: authenticated
   Policy definition:
   ((bucket_id = 'claim-evidence'::text) AND (auth.role() = 'authenticated'::text))

2. INSERT policy: "Authenticated users can upload claim evidence"
   Target roles: authenticated
   Policy definition:
   ((bucket_id = 'claim-evidence'::text) AND (auth.role() = 'authenticated'::text))

3. UPDATE policy: "Authenticated users can update claim evidence"
   Target roles: authenticated
   Policy definition:
   ((bucket_id = 'claim-evidence'::text) AND (auth.role() = 'authenticated'::text))

4. DELETE policy: "Authenticated users can delete claim evidence"
   Target roles: authenticated
   Policy definition:
   ((bucket_id = 'claim-evidence'::text) AND (auth.role() = 'authenticated'::text))
*/

-- 10. Mensaje de confirmación y próximos pasos
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de documentos de reclamaciones configurado exitosamente!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASOS REQUERIDOS:';
    RAISE NOTICE '1. Crear bucket "clientes-adjuntos" en Supabase Storage si no existe';
    RAISE NOTICE '2. Crear bucket "claim-evidence" en Supabase Storage si no existe';
    RAISE NOTICE '3. Configurar las políticas de Storage mencionadas en los comentarios';
    RAISE NOTICE '4. Probar la subida de documentos desde la aplicación';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CONFIGURACIÓN COMPLETADA:';
    RAISE NOTICE '- Tablas: claim_customer_documents, claim_documents';
    RAISE NOTICE '- Políticas RLS: Configuradas para todos los roles';
    RAISE NOTICE '- Índices: Optimizados para consultas rápidas';
    RAISE NOTICE '- Triggers: Auto-actualización de timestamps';
END $$;