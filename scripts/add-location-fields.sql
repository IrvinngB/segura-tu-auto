-- Add simple location fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Panamá';

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_customers_country ON customers(country);

-- Update existing customers with default country
UPDATE customers 
SET country = 'Panamá'
WHERE country IS NULL;