-- Update existing pending activation payments to have a due date of 7 days after policy start date
-- This fixes payments that were created with due_date = start_date (immediate payment required)

UPDATE payments
SET due_date = (p.start_date::date + INTERVAL '7 days')::timestamp
FROM policies p
WHERE payments.policy_id = p.id
  AND payments.status = 'pending'
  AND payments.payment_type = 'activation'
  AND payments.due_date <= p.start_date::timestamp;

-- Also update any upcoming payments that might have been created with wrong dates if any
-- (Though usually these are calculated on the fly in frontend, but if stored in DB)

-- Log the number of updated rows (if running in a tool that supports it, otherwise just the update is enough)
