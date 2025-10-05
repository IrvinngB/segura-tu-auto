const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://sztuxibgvlwbykaopnqg.supabase.co";
const supabaseServiceKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEyMjA5MCwiZXhwIjoyMDczNjk4MDkwfQ.ptW2xg0PvIr3MwaHIGdv1IQn7-Yickcg_vy4RoCUpB0";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createQuotesTable() {
    console.log("Creating quotes table...");

    try {
        // Create the quotes table with a simpler approach
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS quotes (
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
          selected_coverages JSONB,
          driver_data JSONB,
          vehicle_data JSONB,
          risk_assessment JSONB,
          agent_notes TEXT,
          reviewed_at TIMESTAMP WITH TIME ZONE,
          rejected_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days'
      );
    `;

        // Try using direct SQL execution
        console.log("Attempting to create table...");

        // Method 1: Try using sql function if it exists
        let result = await supabase.rpc("exec_sql", { sql: createTableSQL });

        if (result.error) {
            console.log("Method 1 failed, trying direct query...");
            // Method 2: Try direct query (though this might not work for DDL)
            result = await supabase
                .from("_sql")
                .insert({ query: createTableSQL });
        }

        if (result.error) {
            console.log(
                "Direct creation failed. You need to run this in Supabase SQL Editor:"
            );
            console.log("=====================================");
            console.log(createTableSQL);
            console.log("=====================================");

            // Also create indexes and RLS
            console.log("Also run these commands:");
            console.log(`
        CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
        CREATE INDEX IF NOT EXISTS idx_quotes_agent_id ON quotes(agent_id);
        CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
        CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
        
        ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Customers can view their own quotes" ON quotes FOR SELECT USING (
          customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        );
        
        CREATE POLICY "Customers can create quotes" ON quotes FOR INSERT WITH CHECK (
          customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        );
      `);
            return;
        }

        console.log("Table created successfully!");

        // Test the table
        const testResult = await supabase
            .from("quotes")
            .select("count")
            .limit(0);
        if (testResult.error) {
            console.error("Test failed:", testResult.error);
        } else {
            console.log("SUCCESS! Quotes table is working!");
        }
    } catch (error) {
        console.error("Error:", error.message);
        console.log(
            "\nPlease copy this SQL and run it in Supabase SQL Editor:"
        );
        console.log(
            "Go to: https://app.supabase.com/project/sztuxibgvlwbykaopnqg/sql/new"
        );
    }
}

createQuotesTable();
