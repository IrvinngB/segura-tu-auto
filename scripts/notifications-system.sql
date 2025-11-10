-- Agregar tabla de notificaciones al sistema
-- Este archivo debe ser ejecutado por un администrador de base de datos

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    category character varying(20) NOT NULL DEFAULT 'general' CHECK (category IN ('policy', 'claim', 'payment', 'general')),
    priority character varying(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_read boolean NOT NULL DEFAULT false,
    action_url text,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden actualizar (marcar como leídas) sus propias notificaciones
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Los administradores pueden insertar notificaciones para cualquier usuario
CREATE POLICY "Admins can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

-- Los usuarios pueden borrar sus propias notificaciones
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Función para crear notificaciones automáticas
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id uuid,
    p_title text,
    p_message text,
    p_type text DEFAULT 'info',
    p_category text DEFAULT 'general',
    p_priority text DEFAULT 'medium',
    p_action_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO public.notifications (
        user_id, title, message, type, category, priority, action_url
    ) VALUES (
        p_user_id, p_title, p_message, p_type, p_category, p_priority, p_action_url
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Función trigger para crear notificaciones automáticas en eventos importantes
CREATE OR REPLACE FUNCTION notify_policy_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_user_id uuid;
    policy_number text;
BEGIN
    -- Obtener el user_id del customer
    SELECT u.id, p.policy_number INTO customer_user_id, policy_number
    FROM public.customers c
    JOIN public.users u ON c.user_id = u.id
    JOIN public.policies p ON p.customer_id = c.id
    WHERE c.id = COALESCE(NEW.customer_id, OLD.customer_id)
    AND p.id = COALESCE(NEW.id, OLD.id);

    IF TG_OP = 'INSERT' THEN
        -- Nueva póliza creada
        PERFORM create_notification(
            customer_user_id,
            'Nueva Póliza Creada',
            'Su póliza ' || policy_number || ' ha sido creada exitosamente.',
            'success',
            'policy',
            'medium'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Póliza actualizada
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'active' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Póliza Activada',
                        'Su póliza ' || policy_number || ' ha sido activada.',
                        'success',
                        'policy',
                        'high'
                    );
                WHEN 'expired' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Póliza Expirada',
                        'Su póliza ' || policy_number || ' ha expirado. Contacte para renovar.',
                        'warning',
                        'policy',
                        'high'
                    );
                WHEN 'cancelled' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Póliza Cancelada',
                        'Su póliza ' || policy_number || ' ha sido cancelada.',
                        'info',
                        'policy',
                        'medium'
                    );
            END CASE;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Función trigger para notificaciones de reclamaciones
CREATE OR REPLACE FUNCTION notify_claim_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_user_id uuid;
    claim_number text;
BEGIN
    -- Obtener el user_id del customer
    SELECT u.id, c.claim_number INTO customer_user_id, claim_number
    FROM public.customers cust
    JOIN public.users u ON cust.user_id = u.id
    JOIN public.claims c ON c.customer_id = cust.id
    WHERE cust.id = COALESCE(NEW.customer_id, OLD.customer_id)
    AND c.id = COALESCE(NEW.id, OLD.id);

    IF TG_OP = 'INSERT' THEN
        -- Nueva reclamación creada
        PERFORM create_notification(
            customer_user_id,
            'Reclamación Recibida',
            'Su reclamación ' || claim_number || ' ha sido recibida y está siendo procesada.',
            'info',
            'claim',
            'medium'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reclamación actualizada
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'under_review' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Reclamación en Revisión',
                        'Su reclamación ' || claim_number || ' está siendo revisada por nuestro equipo.',
                        'info',
                        'claim',
                        'medium'
                    );
                WHEN 'approved' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Reclamación Aprobada',
                        'Su reclamación ' || claim_number || ' ha sido aprobada.',
                        'success',
                        'claim',
                        'high'
                    );
                WHEN 'denied' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Reclamación Denegada',
                        'Su reclamación ' || claim_number || ' ha sido denegada. Consulte los detalles.',
                        'warning',
                        'claim',
                        'high'
                    );
                WHEN 'paid' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Pago Procesado',
                        'El pago de su reclamación ' || claim_number || ' ha sido procesado.',
                        'success',
                        'claim',
                        'high'
                    );
            END CASE;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Crear triggers
DROP TRIGGER IF EXISTS notify_policy_changes ON public.policies;
CREATE TRIGGER notify_policy_changes
    AFTER INSERT OR UPDATE ON public.policies
    FOR EACH ROW
    EXECUTE FUNCTION notify_policy_events();

DROP TRIGGER IF EXISTS notify_claim_changes ON public.claims;
CREATE TRIGGER notify_claim_changes
    AFTER INSERT OR UPDATE ON public.claims
    FOR EACH ROW
    EXECUTE FUNCTION notify_claim_events();

-- Insertar algunas notificaciones de ejemplo (opcional)
-- Solo ejecutar si deseas datos de prueba
/*
INSERT INTO public.notifications (user_id, title, message, type, category, priority)
SELECT 
    u.id,
    'Bienvenido a Segura Tu Auto',
    'Gracias por registrarte en nuestro sistema de seguros. Explore las funcionalidades disponibles.',
    'success',
    'general',
    'medium'
FROM public.users u 
WHERE u.role = 'customer'
LIMIT 5;
*/

COMMENT ON TABLE public.notifications IS 'Tabla para almacenar notificaciones del sistema para usuarios';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación: info, warning, error, success';
COMMENT ON COLUMN public.notifications.category IS 'Categoría: policy, claim, payment, general';
COMMENT ON COLUMN public.notifications.priority IS 'Prioridad: low, medium, high';