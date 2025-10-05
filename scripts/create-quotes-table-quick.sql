-- Quick check and create quotes table if not exists
-- Execute this in your Supabase SQL Editor

-- First, check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
        -- Create the quotes table
        CREATE TABLE quotes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            quote_number VARCHAR(50) UNIQUE NOT NULL,
            customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
            vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
            agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
            policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('basica', 'limitada', 'amplia')),
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            premium_amount NUMERIC NOT NULL,
            payment_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'biannual', 'annual')),
            auto_renewal BOOLEAN DEFAULT false,
            
            -- Quote specific data
            selected_coverages JSONB,
            driver_data JSONB,
            vehicle_data JSONB,
            risk_assessment JSONB,
            
            -- Agent review fields
            agent_notes TEXT,
            reviewed_at TIMESTAMP WITH TIME ZONE,
            rejected_reason TEXT,
            
            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days'
        );

        -- Create indexes
        CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
        CREATE INDEX idx_quotes_agent_id ON quotes(agent_id);
        CREATE INDEX idx_quotes_status ON quotes(status);
        CREATE INDEX idx_quotes_created_at ON quotes(created_at);

        -- Enable RLS
        ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Customers can view their own quotes" ON quotes FOR SELECT USING (
            customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        );

        CREATE POLICY "Customers can create quotes" ON quotes FOR INSERT WITH CHECK (
            customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        );

        CREATE POLICY "Customers can update their own pending quotes" ON quotes FOR UPDATE USING (
            customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) AND status = 'pending'
        );

        CREATE POLICY "Staff can view all quotes" ON quotes FOR SELECT USING (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent'))
        );

        CREATE POLICY "Agents can manage quotes" ON quotes FOR UPDATE USING (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent'))
        );

        -- Create trigger function
        CREATE OR REPLACE FUNCTION update_quotes_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger
        CREATE TRIGGER update_quotes_updated_at_trigger
            BEFORE UPDATE ON quotes
            FOR EACH ROW
            EXECUTE FUNCTION update_quotes_updated_at();

        RAISE NOTICE 'Quotes table created successfully!';
    ELSE
        RAISE NOTICE 'Quotes table already exists!';
    END IF;
END
$$;