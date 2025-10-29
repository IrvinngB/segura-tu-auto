-- Tabla para el historial de acciones de reclamaciones
CREATE TABLE IF NOT EXISTS public.claim_actions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  claim_id uuid NOT NULL,
  action_type character varying NOT NULL,
  notes text,
  performed_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT claim_actions_pkey PRIMARY KEY (id),
  CONSTRAINT claim_actions_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.claims(id) ON DELETE CASCADE,
  CONSTRAINT claim_actions_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_claim_actions_claim_id ON public.claim_actions(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_actions_created_at ON public.claim_actions(created_at);

-- Habilitar Row Level Security
ALTER TABLE public.claim_actions ENABLE ROW LEVEL SECURITY;

-- Política de acceso para claim_actions
CREATE POLICY "Users can view claim actions for accessible claims" ON public.claim_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.claims c 
      WHERE c.id = claim_actions.claim_id 
      AND (
        -- Admin y agentes pueden ver todas
        auth.jwt() ->> 'role' IN ('admin', 'agent', 'adjuster')
        OR 
        -- Cliente puede ver solo sus reclamaciones
        (auth.jwt() ->> 'role' = 'customer' AND c.customer_id IN (
          SELECT id FROM public.customers WHERE user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Agents can insert claim actions" ON public.claim_actions
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'agent', 'adjuster')
  );

-- Actualizar la tabla communications para incluir notificaciones del sistema
ALTER TABLE public.communications 
ADD COLUMN IF NOT EXISTS communication_type_new character varying;

-- Actualizar el check constraint para incluir 'system'
ALTER TABLE public.communications 
DROP CONSTRAINT IF EXISTS communications_communication_type_check;

ALTER TABLE public.communications 
ADD CONSTRAINT communications_communication_type_check 
CHECK (communication_type::text = ANY (ARRAY['email'::character varying, 'phone'::character varying, 'sms'::character varying, 'chat'::character varying, 'letter'::character varying, 'system'::character varying]::text[]));