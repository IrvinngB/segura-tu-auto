/**
 * Payment utilities for handling activation payments and due dates
 */

/**
 * Creates an activation payment with proper UTC due date calculation
 * @param quoteData - Quote data containing approval/creation dates
 * @param policyId - Policy ID to associate with payment
 * @param customerId - Customer ID
 * @param premiumAmount - Premium amount for calculation
 * @param paymentFrequency - Payment frequency (annual, monthly, quarterly)
 * @returns Payment data object ready for insertion
 */
export function createActivationPaymentData(
  quoteData: {
    approvedAt?: string | Date | null;
    createdAt?: string | Date | null;
    premium_amount: number;
    payment_frequency?: string;
  },
  policyId: string,
  customerId: string
) {
  const PAYMENT_GRACE_DAYS = parseInt(process.env.PAYMENT_GRACE_DAYS || '15', 10);
  
  // Determine base date (approval date, creation date, or now)
  let baseDate: Date;
  if (quoteData.approvedAt) {
    baseDate = new Date(quoteData.approvedAt);
  } else if (quoteData.createdAt) {
    baseDate = new Date(quoteData.createdAt);
  } else {
    baseDate = new Date();
  }

  // Calculate due date in UTC at end of day
  const baseDateUTC = new Date(Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate()
  ));
  
  baseDateUTC.setUTCDate(baseDateUTC.getUTCDate() + PAYMENT_GRACE_DAYS);
  baseDateUTC.setUTCHours(23, 59, 59, 0); // End of day in UTC

  // Calculate activation amount based on payment frequency
  let activationAmount = quoteData.premium_amount;
  if (quoteData.payment_frequency === 'monthly') {
    activationAmount = quoteData.premium_amount / 12;
  } else if (quoteData.payment_frequency === 'quarterly') {
    activationAmount = quoteData.premium_amount / 4;
  }

  return {
    policy_id: policyId,
    customer_id: customerId,
    amount: Number(activationAmount.toFixed(2)),
    status: 'pending',
    payment_type: 'activation',
    due_date: baseDateUTC.toISOString(),
    description: 'Pago de Activación de Póliza',
    created_at: new Date().toISOString()
  };
}

/**
 * Formats a UTC due date for display in local timezone
 * @param utcDateString - UTC date string from database
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDueDate(utcDateString: string | null | undefined): string {
  if (!utcDateString) return '';
  
  try {
    const utcDate = new Date(utcDateString);
    // Convert to local timezone and format
    const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
    return localDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting due date:', error);
    return '';
  }
}

/**
 * Checks if a due date has passed (accounting for timezone)
 * @param utcDateString - UTC due date string
 * @returns true if due date has passed
 */
export function isDueDatePassed(utcDateString: string | null | undefined): boolean {
  if (!utcDateString) return false;
  
  try {
    const dueDate = new Date(utcDateString);
    const now = new Date();
    return now > dueDate;
  } catch (error) {
    console.error('Error checking due date:', error);
    return false;
  }
}

/**
 * Determines payment status based on due date and grace period
 * @param utcDateString - UTC due date string
 * @returns Payment status: 'upcoming', 'grace_period', 'overdue'
 */
export function getPaymentStatus(utcDateString: string | null | undefined): 'upcoming' | 'grace_period' | 'overdue' {
  if (!utcDateString) return 'upcoming';
  
  try {
    const dueDate = new Date(utcDateString);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 0) {
      return 'upcoming'; // Future or today
    } else {
      const daysPastDue = Math.abs(daysDiff);
      const gracePeriodDays = parseInt(process.env.PAYMENT_GRACE_PERIOD_DAYS || '30', 10);
      
      if (daysPastDue <= gracePeriodDays) {
        return 'grace_period'; // Within grace period
      } else {
        return 'overdue'; // Past grace period
      }
    }
  } catch (error) {
    console.error('Error determining payment status:', error);
    return 'upcoming';
  }
}