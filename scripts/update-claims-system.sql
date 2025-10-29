-- Script para actualizar la base de datos con las nuevas funcionalidades

-- 1. Actualizar la tabla claims para incluir los nuevos estados
ALTER TABLE claims 
DROP CONSTRAINT IF EXISTS claims_status_check;

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

-- 2. Crear tabla para el historial de cambios de estado
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

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_claim_status_history_claim_id 
    ON claim_status_history(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_status_history_created_at 
    ON claim_status_history(created_at DESC);

-- 4. Actualizar la tabla communications para agregar type 'internal'
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

-- 5. Crear función para registrar automáticamente cambios de estado
CREATE OR REPLACE FUNCTION log_claim_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el estado realmente cambió
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO claim_status_history (
            claim_id,
            previous_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid() -- ID del usuario autenticado
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para ejecutar la función automáticamente
DROP TRIGGER IF EXISTS trigger_log_claim_status_change ON claims;
CREATE TRIGGER trigger_log_claim_status_change
    AFTER UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION log_claim_status_change();

-- 7. Habilitar RLS (Row Level Security) para las nuevas tablas
ALTER TABLE claim_status_history ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas de seguridad para claim_status_history
CREATE POLICY "Users can view claim status history for their role" 
    ON claim_status_history FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM claims c
            JOIN users u ON u.id = auth.uid()
            WHERE c.id = claim_status_history.claim_id
            AND (
                u.role IN ('admin', 'adjuster', 'agent') OR
                c.customer_id = u.id
            )
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

-- 9. Actualizar políticas existentes para communications si es necesario
-- (Las políticas existentes deberían seguir funcionando)

-- 10. Insertar datos de ejemplo para testing (opcional)
-- INSERT INTO claim_status_history (claim_id, previous_status, new_status, changed_by, change_reason)
-- SELECT 
--     c.id,
--     'submitted',
--     c.status,
--     c.adjuster_id,
--     'Estado inicial registrado automáticamente'
-- FROM claims c 
-- WHERE c.status != 'submitted'
-- AND NOT EXISTS (
--     SELECT 1 FROM claim_status_history csh 
--     WHERE csh.claim_id = c.id
-- );

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos actualizada exitosamente con las nuevas funcionalidades de reclamaciones';
END $$;