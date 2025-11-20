-- Script para agregar el estado 'approved' al constraint de policies.status
-- Este estado representa pólizas aprobadas por el agente pero pendientes de pago del cliente

-- Eliminar el constraint existente
ALTER TABLE public.policies 
DROP CONSTRAINT IF EXISTS policies_status_check;

-- Agregar el nuevo constraint con el estado 'approved'
ALTER TABLE public.policies 
ADD CONSTRAINT policies_status_check 
CHECK (status::text = ANY (ARRAY[
  'draft'::character varying,
  'approved'::character varying,
  'active'::character varying,
  'suspended'::character varying,
  'cancelled'::character varying,
  'expired'::character varying
]::text[]));

-- Verificar que el constraint se aplicó correctamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'policies_status_check';

-- Mostrar estados permitidos
SELECT 'Estados permitidos en policies.status:' AS info;
SELECT unnest(ARRAY['draft', 'approved', 'active', 'suspended', 'cancelled', 'expired']) AS status;
