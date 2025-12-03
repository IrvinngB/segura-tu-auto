const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigatePayments() {
  console.log('🔍 Investigating payments in database...');
  
  try {
    // First, let's see all payments
    const { data: allPayments, error: allError } = await supabase
      .from('payments')
      .select('*')
      .limit(10);

    if (allError) {
      throw allError;
    }

    console.log(`📊 Found ${allPayments.length} total payments (showing first 10)`);
    
    if (allPayments.length > 0) {
      console.log('\n📝 Sample payment structure:');
      console.log(JSON.stringify(allPayments[0], null, 2));
    }

    // Check payment types
    const { data: paymentTypes, error: typesError } = await supabase
      .from('payments')
      .select('payment_type')
      .limit(100);

    if (typesError) {
      throw typesError;
    }

    const uniqueTypes = [...new Set(paymentTypes.map(p => p.payment_type))];
    console.log('\n🏷️ Unique payment types found:');
    uniqueTypes.forEach(type => console.log(`   - ${type || 'NULL'}`));

    // Get payments with current date issues
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: problematicPayments, error: probError } = await supabase
      .from('payments')
      .select(`
        id,
        policy_id,
        due_date,
        amount,
        payment_type,
        status,
        created_at,
        policies!inner(
          policy_number,
          status,
          updated_at
        )
      `)
      .lte('due_date', today.toISOString())
      .eq('status', 'pending');

    if (probError) {
      throw probError;
    }

    console.log(`\n⚠️  Found ${problematicPayments.length} payments due today or earlier with pending status:`);
    
    problematicPayments.forEach(payment => {
      const dueDate = new Date(payment.due_date);
      const policyUpdated = new Date(payment.policies.updated_at);
      const daysDiff = Math.floor((dueDate - policyUpdated) / (1000 * 60 * 60 * 24));
      
      console.log(`   Payment ID: ${payment.id}`);
      console.log(`   Policy: ${payment.policies.policy_number} (${payment.policies.status})`);
      console.log(`   Due Date: ${dueDate.toLocaleDateString()}`);
      console.log(`   Policy Updated: ${policyUpdated.toLocaleDateString()}`);
      console.log(`   Days between policy update and due date: ${daysDiff}`);
      console.log(`   Type: ${payment.payment_type || 'NULL'}`);
      console.log(`   Amount: $${payment.amount}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

// Run the investigation
investigatePayments();