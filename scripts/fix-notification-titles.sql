-- Solución definitiva para el error "value too long for type character varying(20)"
-- Modifica la función notify_claim_events para usar títulos más cortos

-- Recrear la función con títulos más cortos
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
            'Reclamo Recibido', -- Título más corto (16 caracteres)
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
                        'Reclamo en Revisión', -- Título más corto (19 caracteres)
                        'Su reclamación ' || claim_number || ' está siendo revisada por nuestro equipo.',
                        'info',
                        'claim',
                        'medium'
                    );
                WHEN 'pending_documentation' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Docs Requeridos', -- Título más corto (15 caracteres)
                        'Se requieren documentos adicionales para su reclamación ' || claim_number || '.',
                        'info',
                        'claim',
                        'medium'
                    );
                WHEN 'approved' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Reclamo Aprobado', -- Título más corto (16 caracteres)
                        'Su reclamación ' || claim_number || ' ha sido aprobada.',
                        'success',
                        'claim',
                        'high'
                    );
                WHEN 'denied' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Reclamo Denegado', -- Título más corto (16 caracteres)
                        'Su reclamación ' || claim_number || ' ha sido denegada. Consulte los detalles.',
                        'warning',
                        'claim',
                        'high'
                    );
                WHEN 'paid' THEN
                    PERFORM create_notification(
                        customer_user_id,
                        'Pago Procesado', -- Título más corto (15 caracteres)
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

-- Recrear el trigger si no existe
DROP TRIGGER IF EXISTS notify_claim_changes ON public.claims;
CREATE TRIGGER notify_claim_changes
    AFTER INSERT OR UPDATE ON public.claims
    FOR EACH ROW
    EXECUTE FUNCTION notify_claim_events();