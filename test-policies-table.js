const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sztuxibgvlwbykaopnqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjIwOTAsImV4cCI6MjA3MzY5ODA5MH0.FG8snw8YMe4HTW76uMuy_ghIJUho-Ltq96cDUNq0OgM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPoliciesTable() {
  console.log('🔍 Checking policies table...');
  
  try {
    // Test if policies table exists and is accessible
    console.log('1. Testing policies table access...');
    const { data: policiesTest, error: policiesError } = await supabase
      .from('policies')
      .select('count')
      .limit(0);

    if (policiesError) {
      console.error('❌ Policies table error:', policiesError);
      console.log('\n📋 The policies table may not exist or may need to be created.');
      
      return false;
    } else {
      console.log('✅ Policies table accessible');
    }

    // Test if policy_coverages table exists
    console.log('2. Testing policy_coverages table access...');
    const { data: coveragesTest, error: coveragesError } = await supabase
      .from('policy_coverages')
      .select('count')
      .limit(0);

    if (coveragesError) {
      console.error('❌ Policy coverages table error:', coveragesError);
    } else {
      console.log('✅ Policy coverages table accessible');
    }

    // List existing policies if any
    console.log('3. Checking existing policies...');
    const { data: existingPolicies, error: listError } = await supabase
      .from('policies')
      .select('*')
      .limit(5);

    if (listError) {
      console.error('❌ Error listing policies:', listError);
    } else {
      console.log(`✅ Found ${existingPolicies.length} existing policies`);
      if (existingPolicies.length > 0) {
        console.log('Sample policy structure:', Object.keys(existingPolicies[0]));
      }
    }

    return true;
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

async function testPolicyCreation() {
  console.log('\n🧪 Testing policy creation...');
  
  try {
    const testPolicyData = {
      policy_number: `TEST-${Date.now()}`,
      customer_id: 'test-customer-id',
      vehicle_id: 'test-vehicle-id',
      agent_id: 'test-agent-id',
      policy_type: 'basica',
      status: 'active',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      premium_amount: 5000,
      payment_frequency: 'monthly',
      auto_renewal: false,
    };

    console.log('Test policy data:', testPolicyData);

    const { data: testPolicy, error: testError } = await supabase
      .from('policies')
      .insert(testPolicyData)
      .select()
      .single();

    if (testError) {
      console.error('❌ Test policy creation failed:', testError);
      console.log('\nPossible issues:');
      console.log('- Foreign key constraints (customer_id, vehicle_id, agent_id may not exist)');
      console.log('- Missing required fields');
      console.log('- Table permissions (RLS policies)');
    } else {
      console.log('✅ Test policy created successfully:', testPolicy.id);
      
      // Clean up test policy
      await supabase.from('policies').delete().eq('id', testPolicy.id);
      console.log('🧹 Test policy cleaned up');
    }
  } catch (error) {
    console.error('💥 Test creation error:', error);
  }
}

async function main() {
  const tableExists = await checkPoliciesTable();
  
  if (tableExists) {
    await testPolicyCreation();
  } else {
    console.log('\n📝 Policies table needs to be created. Here\'s the SQL:');
    console.log(`
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    policy_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'suspended')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium_amount NUMERIC NOT NULL,
    payment_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
    auto_renewal BOOLEAN DEFAULT false,
    discount_applied NUMERIC DEFAULT 0,
    risk_assessment JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_policies_customer_id ON policies(customer_id);
CREATE INDEX IF NOT EXISTS idx_policies_vehicle_id ON policies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_policies_agent_id ON policies(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);

-- Enable RLS
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
    `);
  }
}

main();