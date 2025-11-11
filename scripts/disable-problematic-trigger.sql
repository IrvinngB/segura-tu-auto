-- Script para deshabilitar temporalmente el trigger problemático
-- que está causando el error "value too long for type character varying(20)"

-- Deshabilitar el trigger que causa problemas
DROP TRIGGER IF EXISTS notify_claim_changes ON public.claims;

-- Comentario: Este trigger se puede rehabilitar más tarde una vez que se 
-- ajusten los campos de la tabla notifications para aceptar valores más largos
-- o se modifique la función notify_claim_events para usar títulos más cortos.