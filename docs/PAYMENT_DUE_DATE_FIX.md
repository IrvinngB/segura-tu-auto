# Payment Due Date Fix - Implementation Guide

## Problem Description

The activation payment due dates were showing incorrectly due to timezone handling issues. Payments were being saved with `due_date` equal to or earlier than the creation/approval date, causing confusion for users who saw dates in the past.

**Root Cause**: Improper UTC/local timezone handling when calculating and storing due dates.

## Solution Implementation

### 1. Environment Configuration

Added `PAYMENT_GRACE_DAYS` environment variable:

```env
# Payment Configuration
PAYMENT_GRACE_DAYS=7
```

This allows configurable grace periods for payment due dates.

### 2. Payment Utilities (`lib/utils/payments.ts`)

Created comprehensive utilities for handling payment calculations:

#### `createActivationPaymentData()`
- Calculates activation payment amount based on frequency
- Determines base date (approvedAt, createdAt, or current date)
- Calculates due date with proper UTC handling
- Sets due time to end of day UTC (23:59:59.000Z) to avoid timezone display issues

#### `formatDueDate()`
- Converts UTC dates to local timezone for display
- Returns DD/MM/YYYY format
- Handles null/invalid dates gracefully

#### `isDueDatePassed()`
- Timezone-aware due date checking
- Returns boolean for overdue status

### 3. Backend Integration

Updated quote approval process (`app/api/quotes/[id]/route.ts`):

```typescript
// Before (problematic)
const dueDate = new Date(approvalDate);
dueDate.setDate(dueDate.getDate() + PAYMENT_GRACE_DAYS);

// After (fixed)
const paymentData = createActivationPaymentData(
  {
    approvedAt: new Date().toISOString(),
    createdAt: existingQuote.created_at,
    premium_amount: existingQuote.premium_amount,
    payment_frequency: existingQuote.payment_frequency
  },
  policy.id,
  existingQuote.customer_id
);
```

### 4. Frontend Updates

Updated payment display components to use the new formatting utilities:

```typescript
// Before
{format(parseLocalDate(payment.due_date), "dd 'de' MMMM", { locale: es })}

// After  
{formatDueDate(payment.due_date)}
```

### 5. Data Migration

#### JavaScript Migration Script (`scripts/fix-payment-due-dates.js`)
- Identifies payments with `due_date <= created_at` or `NULL`
- Recalculates due dates using the new utility functions
- Updates payments with corrected UTC dates

#### SQL Migration Script (`scripts/migration-fix-payment-due-dates.sql`)
- Direct SQL approach for batch updates
- Uses PostgreSQL date functions for UTC calculations
- Includes verification queries

### 6. Testing

#### Unit Tests (`__tests__/lib/utils/payments.test.ts`)
- Comprehensive test coverage for all utility functions
- Edge cases: leap years, month boundaries, timezones
- Mock environment variables and dates
- Validates UTC calculations and formatting

#### Manual Testing Script (`scripts/test-payment-calculations.js`)
- Real-world scenario testing
- Different payment frequencies and grace periods
- Timezone verification
- Visual verification of calculations

## Key Technical Details

### UTC Date Calculation
```typescript
// Create base date in UTC (midnight)
const baseDateUTC = new Date(Date.UTC(
  baseDate.getUTCFullYear(),
  baseDate.getUTCMonth(), 
  baseDate.getUTCDate()
));

// Add grace days
baseDateUTC.setUTCDate(baseDateUTC.getUTCDate() + PAYMENT_GRACE_DAYS);

// Set to end of day UTC to prevent timezone display issues
baseDateUTC.setUTCHours(23, 59, 59, 0);
```

### Why End of Day UTC?
Setting due dates to 23:59:59 UTC ensures that when users in negative UTC timezones (like UTC-5) view the date, they see the correct day rather than the previous day.

Example:
- Due date: `2025-12-07T23:59:59.000Z`
- User in UTC-5 sees: December 7, 2025 6:59 PM (correct day)
- If we used midnight UTC, user would see: December 6, 2025 7:00 PM (wrong day)

## Migration Instructions

### 1. Backup Database
```sql
-- Create backup before running migration
pg_dump your_database > backup_before_payment_fix.sql
```

### 2. Run Migration
Choose one approach:

**Option A: JavaScript Migration**
```bash
node scripts/fix-payment-due-dates.js
```

**Option B: SQL Migration**
```sql
-- Execute the SQL script in your database management tool
-- Review the queries first and adjust PAYMENT_GRACE_DAYS value
```

### 3. Verification
```sql
-- Check that no payments have due_date <= created_at
SELECT COUNT(*) as remaining_issues
FROM payments 
WHERE status = 'pending'
  AND (due_date IS NULL OR due_date <= created_at);
-- Should return 0
```

### 4. Deploy Code Changes
Deploy the updated application code with the new payment utilities.

## Testing Checklist

- [ ] Unit tests pass: `npm test payments.test.ts`
- [ ] Manual calculations verified: `node scripts/test-payment-calculations.js`
- [ ] Migration completed without errors
- [ ] No payments have `due_date <= created_at`
- [ ] Frontend displays dates correctly in different timezones
- [ ] New quotes generate proper due dates
- [ ] Payment processing works with updated date format

## Configuration

### Environment Variables
```env
PAYMENT_GRACE_DAYS=7  # Default: 7 days
```

### Supported Payment Frequencies
- `annual`: Full premium amount
- `monthly`: Premium ÷ 12
- `quarterly`: Premium ÷ 4

### Date Format Output
- Database: ISO 8601 UTC (`2025-12-07T23:59:59.000Z`)
- Display: Local DD/MM/YYYY (`07/12/2025`)

## Maintenance

### Monitoring
- Monitor for payments with `due_date <= created_at`
- Check timezone display accuracy across different user locations
- Verify grace period calculations match business requirements

### Future Enhancements
- Add support for business day calculations (exclude weekends/holidays)
- Implement configurable due time (currently fixed at 23:59:59)
- Add timezone-specific grace periods if needed

## Rollback Plan

If issues arise, rollback involves:

1. Revert code changes
2. Restore database from backup
3. Re-run previous payment creation logic

The migration scripts include verification steps to ensure safe rollback if needed.

## Commit Message Template
```
fix(payments): calculate activation payment due_date using PAYMENT_GRACE_DAYS and save as UTC end-of-day

- Add PAYMENT_GRACE_DAYS environment variable (default: 7 days)
- Implement createActivationPaymentData with proper UTC calculations  
- Update frontend to use formatDueDate utility for consistent display
- Create migration scripts for existing problematic payments
- Add comprehensive tests for date calculations and edge cases
- Fix timezone display issues by setting due_date to 23:59:59 UTC

Resolves issue where due_date was <= created_at causing confusion
```