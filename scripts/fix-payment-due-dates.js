#!/usr/bin/env node

/**
 * Migration script to fix existing pending payments with incorrect due dates
 * 
 * This script:
 * 1. Identifies pending payments with due_date <= created_at or NULL
 * 2. Recalculates due_date based on quote approval/creation date + PAYMENT_GRACE_DAYS
 * 3. Updates due_date to end of day UTC to avoid timezone display issues
 * 
 * Run with: node scripts/fix-payment-due-dates.js
 */

import { createClient } from '@supabase/supabase-js';
import { createActivationPaymentData } from '../lib/utils/payments.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPaymentDueDates() {
  console.log('🔧 Starting payment due dates migration...');
  
  try {
    // Get all pending payments with problematic due dates
    const { data: problematicPayments, error: fetchError } = await supabase
      .from('payments')
      .select(`
        *,
        policy:policies(
          id,
          customer_id
        ),
        quote:policies(
          quote:quotes(
            id,
            created_at,
            approved_at,
            premium_amount,
            payment_frequency
          )
        )
      `)
      .eq('status', 'pending')
      .or('due_date.is.null,due_date.lte.created_at');

    if (fetchError) {
      console.error('❌ Error fetching problematic payments:', fetchError);
      return;
    }

    if (!problematicPayments || problematicPayments.length === 0) {
      console.log('✅ No problematic payments found');
      return;
    }

    console.log(`📋 Found ${problematicPayments.length} payments to fix`);

    let fixed = 0;
    let errors = 0;

    for (const payment of problematicPayments) {
      try {
        console.log(`🔄 Processing payment ${payment.id}...`);

        // Get the related quote information
        const { data: quote, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('customer_id', payment.policy?.customer_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (quoteError || !quote) {
          console.warn(`⚠️  Could not find quote for payment ${payment.id}, using payment created_at`);
          
          // Fallback: use payment created_at + grace days
          const PAYMENT_GRACE_DAYS = parseInt(process.env.PAYMENT_GRACE_DAYS || '7', 10);
          const baseDate = new Date(payment.created_at);
          const dueDate = new Date(Date.UTC(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate()
          ));
          dueDate.setUTCDate(dueDate.getUTCDate() + PAYMENT_GRACE_DAYS);
          dueDate.setUTCHours(23, 59, 59, 0);

          const { error: updateError } = await supabase
            .from('payments')
            .update({ 
              due_date: dueDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          if (updateError) {
            console.error(`❌ Error updating payment ${payment.id}:`, updateError);
            errors++;
          } else {
            console.log(`✅ Fixed payment ${payment.id} using fallback method`);
            fixed++;
          }
          continue;
        }

        // Calculate new due date using the utility function
        const paymentData = createActivationPaymentData(
          {
            approvedAt: quote.approved_at,
            createdAt: quote.created_at,
            premium_amount: quote.premium_amount || payment.amount,
            payment_frequency: quote.payment_frequency
          },
          payment.policy_id,
          payment.customer_id || payment.policy?.customer_id
        );

        // Update the payment with new due date
        const { error: updateError } = await supabase
          .from('payments')
          .update({ 
            due_date: paymentData.due_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error(`❌ Error updating payment ${payment.id}:`, updateError);
          errors++;
        } else {
          console.log(`✅ Fixed payment ${payment.id}: due_date = ${paymentData.due_date}`);
          fixed++;
        }

      } catch (error) {
        console.error(`❌ Error processing payment ${payment.id}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Fixed payments: ${fixed}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${problematicPayments.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
fixPaymentDueDates()
  .then(() => {
    console.log('🎉 Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });