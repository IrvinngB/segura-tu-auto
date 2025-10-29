-- EJECUTA ESTE SCRIPT EN EL SQL EDITOR DE SUPABASE

-- 1. Eliminar la restricción existente de estados
ALTER TABLE claims 
DROP CONSTRAINT IF EXISTS claims_status_check;

-- 2. Agregar nueva restricción con todos los estados
ALTER TABLE claims 
ADD CONSTRAINT claims_status_check 
CHECK (status IN (
    'submitted', 
    'under_review', 
    'pending_documentation', 
    'waiting_approval', 
    'investigating', 
    'approved', 
    'processing_payment', 
    'denied', 
    'closed', 
    'paid'
));

-- 3. Crear tabla para historial de estados si no existe
CREATE TABLE IF NOT EXISTS claim_status_history (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    claim_id uuid NOT NULL,
    previous_status character varying NOT NULL,
    new_status character varying NOT NULL,
    changed_by uuid NOT NULL,
    change_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT claim_status_history_pkey PRIMARY KEY (id),
    CONSTRAINT claim_status_history_claim_id_fkey 
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT claim_status_history_changed_by_fkey 
        FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 4. Actualizar restricción de communications para incluir 'internal'
ALTER TABLE communications 
DROP CONSTRAINT IF EXISTS communications_communication_type_check;

ALTER TABLE communications 
ADD CONSTRAINT communications_communication_type_check 
CHECK (communication_type IN (
    'email', 
    'phone', 
    'sms', 
    'chat', 
    'letter', 
    'internal'
));

-- 5. Habilitar RLS para la nueva tabla
ALTER TABLE claim_status_history ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas de seguridad
CREATE POLICY "Users can view claim status history for their role" 
    ON claim_status_history FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM claims c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.id = claim_status_history.claim_id
        )
    );

CREATE POLICY "Authorized users can insert claim status history" 
    ON claim_status_history FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'adjuster', 'agent')
        )
    );

-- Mensaje de confirmación
SELECT 'Base de datos actualizada correctamente. Los nuevos estados de reclamaciones ya están disponibles.' as message;