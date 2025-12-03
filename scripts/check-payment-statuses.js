const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPaymentStatuses() {
  console.log('🔍 Checking payment statuses...');
  
  try {
    // Get all payments with their statuses
    const { data: allPayments, error: allError } = await supabase
      .from('payments')
      .select('id, payment_status, payment_type, due_date, created_at');

    if (allError) {
      throw allError;
    }

    console.log(`📊 Found ${allPayments.length} total payments`);
    
    // Group by status
    const statusGroups = allPayments.reduce((acc, payment) => {
      const status = payment.payment_status || 'NULL';
      if (!acc[status]) acc[status] = [];
      acc[status].push(payment);
      return acc;
    }, {});

    console.log('\n📋 Payment statuses:');
    Object.entries(statusGroups).forEach(([status, payments]) => {
      console.log(`   ${status}: ${payments.length} payments`);
    });

    // Show specific payments with due_date
    const paymentsWithDueDate = allPayments.filter(p => p.due_date);
    console.log(`\n📅 Payments with due_date: ${paymentsWithDueDate.length}`);
    
    paymentsWithDueDate.forEach(payment => {
      const dueDate = new Date(payment.due_date);
      console.log(`   ID: ${payment.id.substring(0, 8)}... | Status: ${payment.payment_status} | Due: ${dueDate.toLocaleDateString()}`);
    });

    // Show all payment details for debugging
    console.log('\n🔍 All payment details:');
    allPayments.forEach(payment => {
      console.log(JSON.stringify(payment, null, 2));
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkPaymentStatuses();