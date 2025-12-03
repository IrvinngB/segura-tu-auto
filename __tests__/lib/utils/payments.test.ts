/**
 * Tests for payment utilities - due date calculations and formatting
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createActivationPaymentData, formatDueDate, isDueDatePassed, getPaymentStatus } from '@/lib/utils/payments';

// Mock environment variable
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Payment Utilities', () => {
  describe('createActivationPaymentData', () => {
    it('should calculate due date with default 15 days grace period', () => {
      process.env.PAYMENT_GRACE_DAYS = '15';
      
      const quoteData = {
        approvedAt: '2025-11-30T05:00:00Z',
        createdAt: '2025-11-29T10:00:00Z',
        premium_amount: 3600,
        payment_frequency: 'annual'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      // Should use approvedAt date + 15 days
      expect(result.due_date).toBe('2025-12-15T23:59:59.000Z');
      expect(result.amount).toBe(3600); // Annual payment
      expect(result.status).toBe('pending');
      expect(result.payment_type).toBe('activation');
    });

    it('should calculate monthly payment amount correctly', () => {
      process.env.PAYMENT_GRACE_DAYS = '7';
      
      const quoteData = {
        approvedAt: '2025-11-30T05:00:00Z',
        premium_amount: 3600,
        payment_frequency: 'monthly'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      expect(result.amount).toBe(300); // 3600 / 12
    });

    it('should calculate quarterly payment amount correctly', () => {
      process.env.PAYMENT_GRACE_DAYS = '7';
      
      const quoteData = {
        approvedAt: '2025-11-30T05:00:00Z',
        premium_amount: 3600,
        payment_frequency: 'quarterly'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      expect(result.amount).toBe(900); // 3600 / 4
    });

    it('should use createdAt when approvedAt is null', () => {
      process.env.PAYMENT_GRACE_DAYS = '10';
      
      const quoteData = {
        approvedAt: null,
        createdAt: '2025-11-25T10:00:00Z',
        premium_amount: 1200,
        payment_frequency: 'annual'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      expect(result.due_date).toBe('2025-12-05T23:59:59.000Z'); // Nov 25 + 10 days
    });

    it('should use current date when both approvedAt and createdAt are null', () => {
      process.env.PAYMENT_GRACE_DAYS = '5';
      
      const quoteData = {
        approvedAt: null,
        createdAt: null,
        premium_amount: 1200,
        payment_frequency: 'annual'
      };

      // Mock current date
      const mockDate = new Date('2025-12-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      expect(result.due_date).toBe('2025-12-06T23:59:59.000Z'); // Dec 1 + 5 days

      jest.restoreAllMocks();
    });

    it('should use custom PAYMENT_GRACE_DAYS from environment', () => {
      process.env.PAYMENT_GRACE_DAYS = '14';
      
      const quoteData = {
        approvedAt: '2025-11-30T05:00:00Z',
        premium_amount: 1200,
        payment_frequency: 'annual'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      expect(result.due_date).toBe('2025-12-14T23:59:59.000Z'); // Nov 30 + 14 days
    });

    it('should default to 15 days when PAYMENT_GRACE_DAYS is not set', () => {
      delete process.env.PAYMENT_GRACE_DAYS;
      
      const quoteData = {
        approvedAt: '2025-11-30T05:00:00Z',
        premium_amount: 1200,
        payment_frequency: 'annual'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      expect(result.due_date).toBe('2025-12-15T23:59:59.000Z'); // Nov 30 + 15 days (default)
    });
  });

  describe('formatDueDate', () => {
    it('should format UTC date correctly to local DD/MM/YYYY', () => {
      const utcDate = '2025-12-07T23:59:59.000Z';
      const result = formatDueDate(utcDate);
      
      // Expected format: DD/MM/YYYY
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      
      // Should be December 7th or 8th depending on timezone
      expect(result).toMatch(/^0[78]\/12\/2025$/);
    });

    it('should handle null/undefined dates', () => {
      expect(formatDueDate(null)).toBe('');
      expect(formatDueDate(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(formatDueDate('')).toBe('');
    });

    it('should handle invalid date strings gracefully', () => {
      expect(formatDueDate('invalid-date')).toBe('');
    });
  });

  describe('isDueDatePassed', () => {
    beforeEach(() => {
      // Mock current time to December 10, 2025
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-12-10T12:00:00Z').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true for past dates', () => {
      const pastDate = '2025-12-05T23:59:59.000Z'; // December 5
      expect(isDueDatePassed(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = '2025-12-15T23:59:59.000Z'; // December 15
      expect(isDueDatePassed(futureDate)).toBe(false);
    });

    it('should return false for current date', () => {
      const currentDate = '2025-12-10T12:00:00Z'; // Same as mocked current time
      expect(isDueDatePassed(currentDate)).toBe(false);
    });

    it('should handle null/undefined dates', () => {
      expect(isDueDatePassed(null)).toBe(false);
      expect(isDueDatePassed(undefined)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isDueDatePassed('')).toBe(false);
    });

    it('should handle invalid date strings gracefully', () => {
      expect(isDueDatePassed('invalid-date')).toBe(false);
    });
  });

  describe('getPaymentStatus', () => {
    beforeEach(() => {
      // Mock current time to December 10, 2025
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-12-10T12:00:00Z').getTime());
      process.env.PAYMENT_GRACE_PERIOD_DAYS = '30';
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return upcoming for future dates', () => {
      const futureDate = '2025-12-15T23:59:59.000Z';
      expect(getPaymentStatus(futureDate)).toBe('upcoming');
    });

    it('should return upcoming for current date', () => {
      const currentDate = '2025-12-10T12:00:00Z';
      expect(getPaymentStatus(currentDate)).toBe('upcoming');
    });

    it('should return grace_period for recently past due dates', () => {
      const recentPastDate = '2025-12-05T23:59:59.000Z'; // 5 days ago
      expect(getPaymentStatus(recentPastDate)).toBe('grace_period');
    });

    it('should return grace_period for dates within grace period', () => {
      const gracePeriodDate = '2025-11-15T23:59:59.000Z'; // 25 days ago (within 30 day grace)
      expect(getPaymentStatus(gracePeriodDate)).toBe('grace_period');
    });

    it('should return overdue for dates past grace period', () => {
      const overdueDate = '2025-10-05T23:59:59.000Z'; // More than 30 days ago
      expect(getPaymentStatus(overdueDate)).toBe('overdue');
    });

    it('should handle custom grace period from environment', () => {
      process.env.PAYMENT_GRACE_PERIOD_DAYS = '45';
      const pastDate = '2025-10-30T23:59:59.000Z'; // 41 days ago
      expect(getPaymentStatus(pastDate)).toBe('grace_period'); // Within 45 day grace
    });

    it('should default to 30 days grace when not configured', () => {
      delete process.env.PAYMENT_GRACE_PERIOD_DAYS;
      const pastDate = '2025-11-05T23:59:59.000Z'; // 35 days ago
      expect(getPaymentStatus(pastDate)).toBe('overdue'); // Past 30 day default
    });

    it('should handle null/undefined dates', () => {
      expect(getPaymentStatus(null)).toBe('upcoming');
      expect(getPaymentStatus(undefined)).toBe('upcoming');
    });
  });

  describe('Edge Cases and Timezone Handling', () => {
    it('should handle end of month calculations correctly', () => {
      process.env.PAYMENT_GRACE_DAYS = '7';
      
      const quoteData = {
        approvedAt: '2025-01-31T23:59:59Z', // January 31
        premium_amount: 1200,
        payment_frequency: 'annual'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      expect(result.due_date).toBe('2025-02-07T23:59:59.000Z'); // Feb 7 (Jan 31 + 7 days)
    });

    it('should handle leap year correctly', () => {
      process.env.PAYMENT_GRACE_DAYS = '5';
      
      const quoteData = {
        approvedAt: '2024-02-28T10:00:00Z', // February 28 in leap year
        premium_amount: 1200,
        payment_frequency: 'annual'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      expect(result.due_date).toBe('2024-03-04T23:59:59.000Z'); // Mar 4 (Feb 28 + 5 days)
    });

    it('should always set due time to end of day UTC', () => {
      process.env.PAYMENT_GRACE_DAYS = '1';
      
      const quoteData = {
        approvedAt: '2025-11-30T05:30:45.123Z', // Any time during the day
        premium_amount: 1200,
        payment_frequency: 'annual'
      };

      const result = createActivationPaymentData(
        quoteData,
        'policy-123',
        'customer-456'
      );

      // Should always end with 23:59:59.000Z regardless of source time
      expect(result.due_date.endsWith('T23:59:59.000Z')).toBe(true);
    });
  });
});