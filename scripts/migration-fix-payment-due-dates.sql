-- Migration SQL Script to fix payment due dates
-- This script corrects pending payments with due_date <= created_at or NULL
-- 
-- IMPORTANT: 
-- 1. BACKUP your database before running this script
-- 2. Replace '7' with your actual PAYMENT_GRACE_DAYS value if different
-- 3. Test on staging environment first
-- 
-- Usage: Execute this script directly in your PostgreSQL/Supabase SQL editor

-- Step 1: Show current problematic payments (for review)
SELECT 
    p.id,
    p.created_at,
    p.due_date,
    p.amount,
    p.status,
    pol.policy_number,
    CASE 
        WHEN p.due_date IS NULL THEN 'NULL due_date'
        WHEN p.due_date <= p.created_at THEN 'due_date <= created_at'
        ELSE 'OK'
    END as issue_type
FROM payments p
LEFT JOIN policies pol ON p.policy_id = pol.id
WHERE p.status = 'pending'
  AND (p.due_date IS NULL OR p.due_date <= p.created_at)
ORDER BY p.created_at DESC;

-- Step 2: Update problematic payments
-- This sets due_date = created_at + PAYMENT_GRACE_DAYS at end of day UTC
WITH params AS (
    SELECT 7 AS grace_days -- Change this to your PAYMENT_GRACE_DAYS value
)
UPDATE payments 
SET 
    due_date = (
        DATE_TRUNC('day', payments.created_at) + 
        (params.grace_days || ' days')::interval + 
        interval '23 hours 59 minutes 59 seconds'
    ),
    updated_at = NOW()
FROM params
WHERE payments.status = 'pending'
  AND (payments.due_date IS NULL OR payments.due_date <= payments.created_at);

-- Step 3: Verify the fix
SELECT 
    p.id,
    p.created_at,
    p.due_date,
    p.amount,
    p.status,
    pol.policy_number,
    (p.due_date - p.created_at) as grace_period,
    EXTRACT(day FROM (p.due_date - p.created_at)) as days_difference
FROM payments p
LEFT JOIN policies pol ON p.policy_id = pol.id
WHERE p.status = 'pending'
  AND p.updated_at > (NOW() - interval '1 hour') -- Recently updated payments
ORDER BY p.updated_at DESC;

-- Step 4: Check for any remaining issues
SELECT 
    COUNT(*) as remaining_problematic_payments
FROM payments 
WHERE status = 'pending'
  AND (due_date IS NULL OR due_date <= created_at);

-- Expected result: 0 remaining_problematic_payments