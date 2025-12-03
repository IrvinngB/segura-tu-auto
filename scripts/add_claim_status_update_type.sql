-- Update communication_type check constraint to include 'claim_status_update'
ALTER TABLE public.communications DROP CONSTRAINT IF EXISTS communications_communication_type_check;
ALTER TABLE public.communications ADD CONSTRAINT communications_communication_type_check 
CHECK (communication_type::text = ANY (ARRAY[
  'email'::character varying, 
  'phone'::character varying, 
  'sms'::character varying, 
  'chat'::character varying, 
  'letter'::character varying, 
  'quote_approved'::character varying, 
  'quote_rejected'::character varying,
  'claim_status_update'::character varying
]::text[]));
