-- Add 'system' to the allowed values for communication_type
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_communication_type_check;

ALTER TABLE communications
  ADD CONSTRAINT communications_communication_type_check 
  CHECK (communication_type IN ('email', 'phone', 'chat', 'sms', 'letter', 'quote_approved', 'quote_rejected', 'system'));
