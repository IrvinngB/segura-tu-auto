-- Sistema de Renovación Automática de Pólizas
-- Este script crea las tablas y funciones necesarias para el sistema de renovación automática

-- Tabla para configuración de renovación automática
CREATE TABLE IF NOT EXISTS renewal_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    days_before_expiry INTEGER DEFAULT 30, -- Días antes del vencimiento para enviar notificaciones
    auto_renewal_grace_period INTEGER DEFAULT 7, -- Días de gracia para renovación automática
    annual_increase_percentage DECIMAL(5,2) DEFAULT 5.00, -- Porcentaje de aumento anual
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para log de renovaciones
CREATE TABLE IF NOT EXISTS policy_renewals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_policy_id UUID REFERENCES policies(id),
    new_policy_id UUID REFERENCES policies(id),
    renewal_type VARCHAR(20) CHECK (renewal_type IN ('automatic', 'manual')),
    renewal_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    premium_old DECIMAL(10,2),
    premium_new DECIMAL(10,2),
    processed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_policies_end_date ON policies(end_date);
CREATE INDEX IF NOT EXISTS idx_policies_auto_renewal ON policies(auto_renewal);
CREATE INDEX IF NOT EXISTS idx_policies_status_end_date ON policies(status, end_date);
CREATE INDEX IF NOT EXISTS idx_policy_renewals_renewal_date ON policy_renewals(renewal_date);

-- Función para obtener pólizas que necesitan renovación
CREATE OR REPLACE FUNCTION get_policies_for_renewal(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    policy_id UUID,
    policy_number TEXT,
    customer_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    vehicle_info TEXT,
    end_date DATE,
    days_until_expiry INTEGER,
    premium_amount DECIMAL(10,2),
    auto_renewal BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.policy_number,
        p.customer_id,
        CONCAT(c.first_name, ' ', c.last_name),
        c.email,
        CONCAT(v.year, ' ', v.make, ' ', v.model),
        p.end_date::DATE,
        (p.end_date::DATE - CURRENT_DATE),
        p.premium_amount,
        p.auto_renewal
    FROM policies p
    JOIN customers c ON p.customer_id = c.id
    JOIN vehicles v ON p.vehicle_id = v.id
    WHERE p.status = 'active'
        AND p.end_date::DATE <= (CURRENT_DATE + INTERVAL '1 day' * days_ahead)
        AND p.end_date::DATE >= CURRENT_DATE
    ORDER BY p.end_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Función para crear una renovación de póliza
CREATE OR REPLACE FUNCTION renew_policy(
    policy_id UUID,
    processed_by_user UUID DEFAULT NULL,
    renewal_type TEXT DEFAULT 'manual'
) RETURNS UUID AS $$
DECLARE
    old_policy policies%ROWTYPE;
    new_policy_id UUID;
    new_policy_number TEXT;
    increase_percentage DECIMAL(5,2);
    new_premium DECIMAL(10,2);
    coverage_record RECORD;
BEGIN
    -- Obtener la póliza original
    SELECT * INTO old_policy FROM policies WHERE id = policy_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Póliza no encontrada o no está activa';
    END IF;
    
    -- Obtener configuración de aumento
    SELECT annual_increase_percentage INTO increase_percentage 
    FROM renewal_settings 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF increase_percentage IS NULL THEN
        increase_percentage := 5.00;
    END IF;
    
    -- Calcular nueva prima
    new_premium := old_policy.premium_amount * (1 + increase_percentage / 100);
    
    -- Generar nuevo número de póliza
    new_policy_number := 'POL-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || 
                        UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));
    
    -- Crear nueva póliza
    INSERT INTO policies (
        policy_number,
        customer_id,
        vehicle_id,
        policy_type,
        status,
        start_date,
        end_date,
        premium_amount,
        payment_frequency,
        auto_renewal,
        selected_coverages,
        driver_data,
        vehicle_data,
        created_at,
        updated_at
    ) VALUES (
        new_policy_number,
        old_policy.customer_id,
        old_policy.vehicle_id,
        old_policy.policy_type,
        'active',
        old_policy.end_date, -- Nueva póliza comienza cuando termina la anterior
        old_policy.end_date + INTERVAL '1 year',
        new_premium,
        old_policy.payment_frequency,
        old_policy.auto_renewal,
        old_policy.selected_coverages,
        old_policy.driver_data,
        old_policy.vehicle_data,
        NOW(),
        NOW()
    ) RETURNING id INTO new_policy_id;
    
    -- Copiar coberturas de la póliza anterior
    FOR coverage_record IN 
        SELECT * FROM policy_coverages WHERE policy_id = policy_id
    LOOP
        INSERT INTO policy_coverages (
            policy_id,
            coverage_type_id,
            coverage_limit,
            deductible,
            premium
        ) VALUES (
            new_policy_id,
            coverage_record.coverage_type_id,
            coverage_record.coverage_limit,
            coverage_record.deductible,
            coverage_record.premium * (1 + increase_percentage / 100)
        );
    END LOOP;
    
    -- Marcar póliza anterior como expirada
    UPDATE policies 
    SET status = 'expired', updated_at = NOW()
    WHERE id = policy_id;
    
    -- Registrar la renovación
    INSERT INTO policy_renewals (
        original_policy_id,
        new_policy_id,
        renewal_type,
        premium_old,
        premium_new,
        processed_by,
        notes
    ) VALUES (
        policy_id,
        new_policy_id,
        renewal_type,
        old_policy.premium_amount,
        new_premium,
        processed_by_user,
        'Renovación ' || renewal_type || ' con aumento del ' || increase_percentage || '%'
    );
    
    -- Crear notificación de renovación exitosa
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        reference_type,
        reference_id
    ) VALUES (
        old_policy.customer_id,
        'Póliza Renovada',
        'Su póliza ' || old_policy.policy_number || ' ha sido renovada como ' || new_policy_number,
        'info',
        'policy',
        new_policy_id
    );
    
    RETURN new_policy_id;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar renovaciones automáticas
CREATE OR REPLACE FUNCTION process_auto_renewals()
RETURNS TABLE (
    processed_count INTEGER,
    failed_count INTEGER,
    details JSONB
) AS $$
DECLARE
    policy_record RECORD;
    new_policy_id UUID;
    success_count INTEGER := 0;
    failure_count INTEGER := 0;
    results JSONB := '[]'::JSONB;
    grace_period INTEGER;
BEGIN
    -- Obtener período de gracia
    SELECT auto_renewal_grace_period INTO grace_period 
    FROM renewal_settings 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF grace_period IS NULL THEN
        grace_period := 7;
    END IF;
    
    -- Procesar pólizas con auto-renovación habilitada que expiran en el período de gracia
    FOR policy_record IN 
        SELECT * FROM get_policies_for_renewal(grace_period)
        WHERE auto_renewal = true
    LOOP
        BEGIN
            new_policy_id := renew_policy(policy_record.policy_id, NULL, 'automatic');
            success_count := success_count + 1;
            
            results := results || jsonb_build_object(
                'policy_id', policy_record.policy_id,
                'policy_number', policy_record.policy_number,
                'customer_name', policy_record.customer_name,
                'status', 'success',
                'new_policy_id', new_policy_id
            );
            
        EXCEPTION WHEN OTHERS THEN
            failure_count := failure_count + 1;
            
            results := results || jsonb_build_object(
                'policy_id', policy_record.policy_id,
                'policy_number', policy_record.policy_number,
                'customer_name', policy_record.customer_name,
                'status', 'failed',
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN QUERY SELECT success_count, failure_count, results;
END;
$$ LANGUAGE plpgsql;

-- Función para enviar notificaciones de renovación próxima
CREATE OR REPLACE FUNCTION send_renewal_notifications()
RETURNS INTEGER AS $$
DECLARE
    policy_record RECORD;
    notification_count INTEGER := 0;
    days_before INTEGER;
BEGIN
    -- Obtener configuración de días antes de notificar
    SELECT days_before_expiry INTO days_before 
    FROM renewal_settings 
    WHERE notification_enabled = true
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF days_before IS NULL THEN
        days_before := 30;
    END IF;
    
    -- Enviar notificaciones para pólizas que expiran pronto
    FOR policy_record IN 
        SELECT * FROM get_policies_for_renewal(days_before)
        WHERE days_until_expiry <= days_before
    LOOP
        -- Verificar si ya se envió notificación para esta póliza
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE reference_type = 'policy_renewal'
            AND reference_id = policy_record.policy_id::TEXT
            AND created_at > NOW() - INTERVAL '7 days'
        ) THEN
            INSERT INTO notifications (
                user_id,
                title,
                message,
                type,
                reference_type,
                reference_id
            ) VALUES (
                policy_record.customer_id,
                'Renovación de Póliza Próxima',
                'Su póliza ' || policy_record.policy_number || ' vence el ' || 
                TO_CHAR(policy_record.end_date, 'DD/MM/YYYY') || 
                ' (' || policy_record.days_until_expiry || ' días). ' ||
                CASE 
                    WHEN policy_record.auto_renewal THEN 'Se renovará automáticamente.'
                    ELSE 'Por favor contacte a su agente para renovar.'
                END,
                CASE 
                    WHEN policy_record.days_until_expiry <= 7 THEN 'warning'
                    ELSE 'info'
                END,
                'policy_renewal',
                policy_record.policy_id::TEXT
            );
            
            notification_count := notification_count + 1;
        END IF;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Insertar configuración por defecto
INSERT INTO renewal_settings (
    days_before_expiry,
    auto_renewal_grace_period,
    annual_increase_percentage,
    notification_enabled
) VALUES (30, 7, 5.00, true)
ON CONFLICT DO NOTHING;

-- Crear trigger para actualizar updated_at en renewal_settings
CREATE OR REPLACE FUNCTION update_renewal_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER renewal_settings_updated_at
    BEFORE UPDATE ON renewal_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_renewal_settings_timestamp();

-- RLS Policies
ALTER TABLE renewal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_renewals ENABLE ROW LEVEL SECURITY;

-- Política para renewal_settings (solo admins pueden ver/editar)
CREATE POLICY "Admin can manage renewal settings" ON renewal_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Política para policy_renewals (admins y agentes pueden ver, admins pueden crear)
CREATE POLICY "Admin and agents can view policy renewals" ON policy_renewals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'agent')
        )
    );

CREATE POLICY "Admin can manage policy renewals" ON policy_renewals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE renewal_settings IS 'Configuración global para el sistema de renovación automática';
COMMENT ON TABLE policy_renewals IS 'Log de todas las renovaciones de pólizas realizadas';
COMMENT ON FUNCTION get_policies_for_renewal IS 'Obtiene lista de pólizas que necesitan renovación';
COMMENT ON FUNCTION renew_policy IS 'Renueva una póliza específica creando una nueva';
COMMENT ON FUNCTION process_auto_renewals IS 'Procesa todas las renovaciones automáticas pendientes';
COMMENT ON FUNCTION send_renewal_notifications IS 'Envía notificaciones de renovación próxima';