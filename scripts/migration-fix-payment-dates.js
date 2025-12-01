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
    // Get all activation payments that might have incorrect due dates
    const { data: payments, error: fetchError } = await supabase
      .from('payments')
      .select(`
        id,
        policy_id,
        due_date,
        created_at,
        policies!inner(
          id,
          updated_at,
          status
        )
      `)
      .eq('payment_type', 'activation')
      .eq('policies.status', 'active');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📋 Found ${payments.length} activation payments to review`);

    let updatedCount = 0;
    const graceDays = parseInt(process.env.PAYMENT_GRACE_DAYS) || 15;

    for (const payment of payments) {
      const approvedAt = new Date(payment.policies.updated_at);
      const currentDueDate = new Date(payment.due_date);
      
      // Calculate what the due date should be
      const correctDueDate = createEndOfDayUTC(approvedAt, graceDays);
      const correctDueDateObj = new Date(correctDueDate);
      
      // Check if the current due date is incorrect (should be graceDays after approval)
      const daysDifference = Math.floor((currentDueDate - approvedAt) / (1000 * 60 * 60 * 24));
      
      if (daysDifference < graceDays) {
        console.log(`📝 Updating payment ${payment.id}:`);
        console.log(`   Policy last updated: ${approvedAt.toISOString()}`);
        console.log(`   Current due date: ${currentDueDate.toISOString()} (${daysDifference} days)`);
        console.log(`   New due date: ${correctDueDate} (${graceDays} days)`);
        
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
      } else {
        console.log(`✅ Payment ${payment.id} already has correct due date (${daysDifference} days)`);
      }
    }

    console.log('');
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