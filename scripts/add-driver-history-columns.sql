-- Add driver history columns to customers table
-- These columns are useful for risk assessment and premium calculation

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS has_accidents BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_claims BOOLEAN DEFAULT false;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN customers.has_accidents IS 'Indicates if the customer has had accidents in the last 3 years';
COMMENT ON COLUMN customers.has_claims IS 'Indicates if the customer has made claims in the last 3 years';

-- Update any existing customers to have default values
UPDATE customers 
SET 
    has_accidents = false,
    has_claims = false
WHERE 
    has_accidents IS NULL 
    OR has_claims IS NULL;