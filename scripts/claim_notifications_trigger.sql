-- Function to handle claim status changes and generate notifications
CREATE OR REPLACE FUNCTION handle_claim_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_subject TEXT;
  notification_content TEXT;
  customer_id_val UUID;
BEGIN
  -- Only proceed if status has changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    customer_id_val := NEW.customer_id;
    
    -- Determine message based on new status
    CASE NEW.status
      WHEN 'under_review' THEN
        notification_subject := 'Reclamación en Revisión';
        notification_content := 'Tu reclamación ' || NEW.claim_number || ' está siendo revisada por nuestro equipo de agentes.';
      
      WHEN 'investigating' THEN
        notification_subject := 'Reclamación Asignada a Evaluador';
        notification_content := 'Tu reclamación ' || NEW.claim_number || ' ha sido asignada a un evaluador técnico y se encuentra en proceso de investigación.';
        
      WHEN 'approved' THEN
        notification_subject := '¡Reclamación Aprobada!';
        notification_content := '¡Buenas noticias! Tu reclamación ' || NEW.claim_number || ' ha sido aprobada' || 
          CASE WHEN NEW.approved_amount IS NOT NULL THEN ' por un monto de $' || NEW.approved_amount ELSE '' END || '.';
          
      WHEN 'denied' THEN
        notification_subject := 'Actualización de Reclamación';
        notification_content := 'Tu reclamación ' || NEW.claim_number || ' ha sido denegada. Por favor revisa los detalles en tu portal o contacta a un agente.';
        
      WHEN 'processing_payment' THEN
        notification_subject := 'Pago en Proceso';
        notification_content := 'El pago de tu reclamación ' || NEW.claim_number || ' ha sido autorizado y está siendo procesado.';
        
      WHEN 'paid' THEN
        notification_subject := 'Pago Completado';
        notification_content := 'El pago' || 
          CASE WHEN NEW.paid_amount IS NOT NULL THEN ' de $' || NEW.paid_amount ELSE '' END || 
          ' por tu reclamación ' || NEW.claim_number || ' ha sido completado exitosamente.';
          
      WHEN 'pending_documentation' THEN
        notification_subject := 'Documentación Pendiente';
        notification_content := 'Tu reclamación ' || NEW.claim_number || ' requiere documentación adicional. Por favor revisa la sección de documentos.';
        
      ELSE
        -- For other statuses, we might not want to send a notification or just a generic one
        -- Skipping 'submitted', 'waiting_approval', 'closed' for now unless requested
        RETURN NEW;
    END CASE;

    -- Insert into communications table
    IF notification_subject IS NOT NULL THEN
      INSERT INTO communications (
        customer_id,
        claim_id,
        communication_type,
        direction,
        subject,
        content,
        status,
        created_at,
        updated_at
      ) VALUES (
        customer_id_val,
        NEW.id,
        'claim_status_update',
        'outbound',
        notification_subject,
        notification_content,
        'unread',
        NOW(),
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_claim_status_change ON claims;

-- Create trigger
CREATE TRIGGER on_claim_status_change
AFTER UPDATE ON claims
FOR EACH ROW
EXECUTE FUNCTION handle_claim_status_change();
