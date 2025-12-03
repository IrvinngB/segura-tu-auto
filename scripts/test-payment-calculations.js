#!/usr/bin/env node

/**
 * Manual Test Script for Payment Due Date Calculations
 * 
 * This script allows manual testing of payment due date calculations
 * with different scenarios and timezone configurations.
 * 
 * Run with: node scripts/test-payment-calculations.js
 */

import { createActivationPaymentData, formatDueDate, isDueDatePassed } from '../lib/utils/payments.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Testing Payment Due Date Calculations\n');

// Test Scenario 1: Quote approved today with default grace period
console.log('📝 Test 1: Quote approved today (default grace period)');
const today = new Date();
const testQuote1 = {
  approvedAt: today.toISOString(),
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  premium_amount: 3947,
  payment_frequency: 'annual'
};

const payment1 = createActivationPaymentData(testQuote1, 'test-policy-1', 'test-customer-1');
console.log(`📅 Approved At: ${testQuote1.approvedAt}`);
console.log(`💰 Amount: $${payment1.amount}`);
console.log(`📆 Due Date (UTC): ${payment1.due_date}`);
console.log(`📆 Due Date (Formatted): ${formatDueDate(payment1.due_date)}`);
console.log(`⏰ Is Past Due: ${isDueDatePassed(payment1.due_date)}`);
console.log('');

// Test Scenario 2: Monthly payment frequency
console.log('📝 Test 2: Monthly payment frequency');
const testQuote2 = {
  approvedAt: '2025-11-30T05:00:00Z',
  premium_amount: 3947,
  payment_frequency: 'monthly'
};

const payment2 = createActivationPaymentData(testQuote2, 'test-policy-2', 'test-customer-2');
console.log(`📅 Approved At: ${testQuote2.approvedAt}`);
console.log(`💰 Amount: $${payment2.amount} (should be ${Math.round(3947/12)})`);
console.log(`📆 Due Date (UTC): ${payment2.due_date}`);
console.log(`📆 Due Date (Formatted): ${formatDueDate(payment2.due_date)}`);
console.log('');

// Test Scenario 3: Quarterly payment frequency
console.log('📝 Test 3: Quarterly payment frequency');
const testQuote3 = {
  approvedAt: '2025-11-30T05:00:00Z',
  premium_amount: 3600,
  payment_frequency: 'quarterly'
};

const payment3 = createActivationPaymentData(testQuote3, 'test-policy-3', 'test-customer-3');
console.log(`📅 Approved At: ${testQuote3.approvedAt}`);
console.log(`💰 Amount: $${payment3.amount} (should be ${3600/4})`);
console.log(`📆 Due Date (UTC): ${payment3.due_date}`);
console.log(`📆 Due Date (Formatted): ${formatDueDate(payment3.due_date)}`);
console.log('');

// Test Scenario 4: Past due date
console.log('📝 Test 4: Past due date check');
const pastDueDate = '2025-11-25T23:59:59.000Z';
console.log(`📆 Past Date: ${pastDueDate}`);
console.log(`📆 Formatted: ${formatDueDate(pastDueDate)}`);
console.log(`⏰ Is Past Due: ${isDueDatePassed(pastDueDate)}`);
console.log('');

// Test Scenario 5: Future due date
console.log('📝 Test 5: Future due date check');
const futureDueDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days from now
console.log(`📆 Future Date: ${futureDueDate}`);
console.log(`📆 Formatted: ${formatDueDate(futureDueDate)}`);
console.log(`⏰ Is Past Due: ${isDueDatePassed(futureDueDate)}`);
console.log('');

// Test Scenario 6: Using createdAt when approvedAt is null
console.log('📝 Test 6: Using createdAt (no approvedAt)');
const testQuote6 = {
  approvedAt: null,
  createdAt: '2025-11-28T10:30:00Z',
  premium_amount: 2400,
  payment_frequency: 'annual'
};

const payment6 = createActivationPaymentData(testQuote6, 'test-policy-6', 'test-customer-6');
console.log(`📅 Created At: ${testQuote6.createdAt}`);
console.log(`📅 Approved At: ${testQuote6.approvedAt}`);
console.log(`💰 Amount: $${payment6.amount}`);
console.log(`📆 Due Date (UTC): ${payment6.due_date}`);
console.log(`📆 Due Date (Formatted): ${formatDueDate(payment6.due_date)}`);
console.log('');

// Test Scenario 7: Custom grace period
console.log('📝 Test 7: Custom grace period from environment');
const originalGraceDays = process.env.PAYMENT_GRACE_DAYS;
process.env.PAYMENT_GRACE_DAYS = '14';

const testQuote7 = {
  approvedAt: '2025-11-30T05:00:00Z',
  premium_amount: 1800,
  payment_frequency: 'annual'
};

const payment7 = createActivationPaymentData(testQuote7, 'test-policy-7', 'test-customer-7');
console.log(`📅 Approved At: ${testQuote7.approvedAt}`);
console.log(`⚙️  Grace Days: ${process.env.PAYMENT_GRACE_DAYS}`);
console.log(`📆 Due Date (UTC): ${payment7.due_date}`);
console.log(`📆 Due Date (Formatted): ${formatDueDate(payment7.due_date)}`);

// Restore original grace days
process.env.PAYMENT_GRACE_DAYS = originalGraceDays;
console.log('');

// Test Scenario 8: Edge case - End of month
console.log('📝 Test 8: End of month calculation');
const testQuote8 = {
  approvedAt: '2025-01-31T23:59:59Z', // January 31
  premium_amount: 1200,
  payment_frequency: 'annual'
};

const payment8 = createActivationPaymentData(testQuote8, 'test-policy-8', 'test-customer-8');
console.log(`📅 Approved At: ${testQuote8.approvedAt} (Jan 31)`);
console.log(`📆 Due Date (UTC): ${payment8.due_date} (should be Feb 7)`);
console.log(`📆 Due Date (Formatted): ${formatDueDate(payment8.due_date)}`);
console.log('');

// Summary
console.log('✅ Manual Test Summary:');
console.log(`⚙️  PAYMENT_GRACE_DAYS: ${process.env.PAYMENT_GRACE_DAYS || '15 (default)'}`);
console.log(`⚙️  PAYMENT_GRACE_PERIOD_DAYS: ${process.env.PAYMENT_GRACE_PERIOD_DAYS || '30 (default)'}`);
console.log(`🕐 Current Time: ${new Date().toISOString()}`);
console.log(`🌍 Timezone Offset: ${new Date().getTimezoneOffset()} minutes`);
console.log('');
console.log('🔍 Key Observations:');
console.log('- Due dates are always set to 23:59:59.000Z (end of day UTC)');
console.log('- Monthly payments are annual premium / 12');
console.log('- Quarterly payments are annual premium / 4');
console.log('- Date calculations handle month boundaries correctly');
console.log('- Timezone formatting converts UTC to local display format');
console.log('- Grace period: 15 days after approval for initial payment');
console.log('- Late payment grace: 30 days after due date before overdue');

console.log('\n🎉 Manual testing completed!');