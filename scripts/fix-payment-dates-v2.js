const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function createEndOfDayUTC(dateInput, graceDays = 15) {
  const date = new Date(dateInput);
  date.setUTCDate(date.getUTCDate() + graceDays);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

async function fixPaymentDates() {
  console.log('🔄 Starting payment date migration...');
  console.log(`🚀 Using ${process.env.PAYMENT_GRACE_DAYS || 15} days grace period`);
  
  try {
    // Get all pending payments that might have incorrect due dates
    const { data: payments, error: fetchError } = await supabase
      .from('payments')
      .select(`
        id,
        policy_id,
        due_date,
        created_at,
        payment_status,
        policies!inner(
          id,
          policy_number,
          updated_at,
          status
        )
      `)
      .eq('payment_type', 'premium')
      .in('payment_status', ['pending', 'unpaid'])
      .eq('policies.status', 'active')
      .not('due_date', 'is', null);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📋 Found ${payments.length} pending premium payments to review`);

    let updatedCount = 0;
    const graceDays = parseInt(process.env.PAYMENT_GRACE_DAYS) || 15;
    const today = new Date();

    for (const payment of payments) {
      const policyUpdated = new Date(payment.policies.updated_at);
      const currentDueDate = new Date(payment.due_date);
      
      // Calculate what the due date should be (15 days after policy update/activation)
      const correctDueDate = createEndOfDayUTC(policyUpdated, graceDays);
      const correctDueDateObj = new Date(correctDueDate);
      
      // Check if the current due date is too soon (less than grace days)
      const daysDifference = Math.floor((currentDueDate - policyUpdated) / (1000 * 60 * 60 * 24));
      
      // Also check if payment is due today or in the past
      const isDueToday = currentDueDate <= today;
      
      if (daysDifference < graceDays || isDueToday) {
        console.log(`📝 Updating payment ${payment.id}:`);
        console.log(`   Policy: ${payment.policies.policy_number} (updated: ${policyUpdated.toLocaleDateString()})`);
        console.log(`   Current due date: ${currentDueDate.toLocaleDateString()} (${daysDifference} days after policy)`);
        console.log(`   New due date: ${correctDueDateObj.toLocaleDateString()} (${graceDays} days after policy)`);
        console.log(`   Is due today/past: ${isDueToday}`);
        
        const { error: updateError } = await supabase
          .from('payments')
          .update({ 
            due_date: correctDueDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error(`❌ Failed to update payment ${payment.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`✅ Updated payment ${payment.id}`);
        }
        console.log('');
      } else {
        console.log(`✅ Payment ${payment.id} already has correct due date (${daysDifference} days)`);
      }
    }

    console.log('📊 Migration Summary:');
    console.log(`   Total payments reviewed: ${payments.length}`);
    console.log(`   Payments updated: ${updatedCount}`);
    console.log(`   Payments already correct: ${payments.length - updatedCount}`);
    console.log('');
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixPaymentDates();