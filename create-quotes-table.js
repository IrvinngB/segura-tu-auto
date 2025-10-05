const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sztuxibgvlwbykaopnqg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEyMjA5MCwiZXhwIjoyMDczNjk4MDkwfQ.ptW2xg0PvIr3MwaHIGdv1IQn7-Yickcg_vy4RoCUpB0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createQuotesTable() {
  console.log('🏗️  Creating quotes table and related structures...');
  
  try {
    // Step 1: Create the quotes table
    console.log('1️⃣ Creating quotes table...');
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
    `;
    
    const { data: tableResult, error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (tableError) {
      console.error('❌ Error creating table:', tableError);
      return;
    }
    console.log('✅ Table created successfully');

    // Step 2: Create indexes
    console.log('2️⃣ Creating indexes...');
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
      CREATE INDEX IF NOT EXISTS idx_quotes_agent_id ON quotes(agent_id);
      CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
      CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
    `;
    
    const { data: indexResult, error: indexError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      return;
    }
    console.log('✅ Indexes created successfully');

    // Step 3: Enable RLS
    console.log('3️⃣ Enabling Row Level Security...');
    const rlsSQL = 'ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;';
    
    const { data: rlsResult, error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return;
    }
    console.log('✅ RLS enabled successfully');

    // Step 4: Create policies (one by one)
    console.log('4️⃣ Creating RLS policies...');
    const policies = [
      {
        name: 'Customers can view their own quotes',
        sql: `CREATE POLICY "Customers can view their own quotes" ON quotes FOR SELECT USING (
          customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        );`
      },
      {
        name: 'Customers can create quotes',
        sql: `CREATE POLICY "Customers can create quotes" ON quotes FOR INSERT WITH CHECK (
          customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        );`
      },
      {
        name: 'Customers can update their own pending quotes',
        sql: `CREATE POLICY "Customers can update their own pending quotes" ON quotes FOR UPDATE USING (
          customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) AND status = 'pending'
        );`
      },
      {
        name: 'Staff can view all quotes',
        sql: `CREATE POLICY "Staff can view all quotes" ON quotes FOR SELECT USING (
          EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent'))
        );`
      },
      {
        name: 'Agents can manage quotes',
        sql: `CREATE POLICY "Agents can manage quotes" ON quotes FOR UPDATE USING (
          EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent'))
        );`
      }
    ];

    for (const policy of policies) {
      const { data: policyResult, error: policyError } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (policyError) {
        console.error(`❌ Error creating policy "${policy.name}":`, policyError);
      } else {
        console.log(`✅ Policy "${policy.name}" created`);
      }
    }

    // Step 5: Create trigger function and trigger
    console.log('5️⃣ Creating trigger function...');
    const triggerFunctionSQL = \`
      CREATE OR REPLACE FUNCTION update_quotes_updated_at()
      RETURNS TRIGGER AS \$\$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      \$\$ language 'plpgsql';
    \`;
    
    const { data: funcResult, error: funcError } = await supabase.rpc('exec_sql', { sql: triggerFunctionSQL });
    if (funcError) {
      console.error('❌ Error creating trigger function:', funcError);
    } else {
      console.log('✅ Trigger function created');
    }

    console.log('6️⃣ Creating trigger...');
    const triggerSQL = \`
      CREATE TRIGGER update_quotes_updated_at_trigger
          BEFORE UPDATE ON quotes
          FOR EACH ROW
          EXECUTE FUNCTION update_quotes_updated_at();
    \`;
    
    const { data: triggerResult, error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
    } else {
      console.log('✅ Trigger created');
    }

    console.log('🎉 All done! Testing table access...');
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('quotes')
      .select('count')
      .limit(0);
      
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('🎯 SUCCESS! Quotes table is working correctly!');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createQuotesTable();