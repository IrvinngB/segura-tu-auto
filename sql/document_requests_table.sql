-- Tabla para solicitudes de documentos adicionales
CREATE TABLE IF NOT EXISTS public.document_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  requested_documents text[] NOT NULL, -- Array de tipos de documentos solicitados
  notes text, -- Instrucciones adicionales
  read boolean DEFAULT false, -- Si el cliente ha leído la notificación
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_requests_pkey PRIMARY KEY (id),
  CONSTRAINT document_requests_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.claims(id),
  CONSTRAINT document_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_document_requests_customer_id ON public.document_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_claim_id ON public.document_requests(claim_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_read ON public.document_requests(read);
CREATE INDEX IF NOT EXISTS idx_document_requests_created_at ON public.document_requests(created_at DESC);

-- RLS (Row Level Security) para que los clientes solo vean sus propias notificaciones
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

-- Política para clientes: solo pueden ver sus propias notificaciones
CREATE POLICY "Clientes pueden ver sus propias solicitudes de documentos" ON public.document_requests
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM public.customers WHERE id = customer_id
  ));

-- Política para agentes/admins: pueden ver todas las solicitudes
CREATE POLICY "Agentes pueden ver todas las solicitudes de documentos" ON public.document_requests
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('admin', 'agent', 'adjuster')
  ));

-- Política para insertar: solo agentes/admins pueden crear solicitudes
CREATE POLICY "Solo agentes pueden crear solicitudes de documentos" ON public.document_requests
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('admin', 'agent', 'adjuster')
  ));

-- Política para actualizar: clientes pueden marcar como leído, agentes pueden editar
CREATE POLICY "Clientes pueden marcar como leído sus solicitudes" ON public.document_requests
  FOR UPDATE USING (
    (auth.uid() IN (
      SELECT user_id FROM public.customers WHERE id = customer_id
    ) AND (OLD.read = false AND NEW.read = true)) -- Solo pueden cambiar de false a true
    OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role IN ('admin', 'agent', 'adjuster')
    )
  );