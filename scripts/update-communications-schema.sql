-- Add metadata column if it doesn't exist
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Update communication_type check constraint to include new types
ALTER TABLE public.communications DROP CONSTRAINT IF EXISTS communications_communication_type_check;
ALTER TABLE public.communications ADD CONSTRAINT communications_communication_type_check 
CHECK (communication_type::text = ANY (ARRAY[
  'email'::character varying, 
  'phone'::character varying, 
  'sms'::character varying, 
  'chat'::character varying, 
  'letter'::character varying, 
  'quote_approved'::character varying, 
  'quote_rejected'::character varying
]::text[]));

-- Update status check constraint to include 'unread'
ALTER TABLE public.communications DROP CONSTRAINT IF EXISTS communications_status_check;
ALTER TABLE public.communications ADD CONSTRAINT communications_status_check 
CHECK (status::text = ANY (ARRAY[
  'draft'::character varying, 
  'sent'::character varying, 
  'delivered'::character varying, 
  'read'::character varying, 
  'failed'::character varying, 
  'unread'::character varying
]::text[]));
