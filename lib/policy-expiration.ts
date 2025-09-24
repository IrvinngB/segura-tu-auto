// Utility functions for handling policy expiration
import { createClient } from "@/lib/supabase/client";

export interface PolicyExpirationResult {
    updatedCount: number;
    updatedPolicyNumbers: string[];
    error?: string;
}

export interface ExpiringPolicy {
    policy_number: string;
    customer_name: string;
    end_date: string;
    days_until_expiry: number;
    vehicle_info: string;
}

/**
 * Updates expired policies by calling the database function
 */
export async function updateExpiredPolicies(): Promise<PolicyExpirationResult> {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.rpc("update_expired_policies");

        if (error) {
            console.error("Error updating expired policies:", error);
            return {
                updatedCount: 0,
                updatedPolicyNumbers: [],
                error: error.message,
            };
        }

        const result = data?.[0] || { updated_count: 0, policy_numbers: [] };

        return {
            updatedCount: result.updated_count || 0,
            updatedPolicyNumbers: result.policy_numbers || [],
        };
    } catch (error) {
        console.error("Unexpected error updating expired policies:", error);
        return {
            updatedCount: 0,
            updatedPolicyNumbers: [],
            error: "Error inesperado al actualizar pólizas vencidas",
        };
    }
}

/**
 * Gets policies that are expiring soon
 */
export async function getExpiringPolicies(
    daysAhead: number = 30
): Promise<ExpiringPolicy[]> {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.rpc("check_expiring_policies", {
            days_ahead: daysAhead,
        });

        if (error) {
            console.error("Error getting expiring policies:", error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error("Unexpected error getting expiring policies:", error);
        return [];
    }
}

/**
 * Checks if a policy is expired based on its end date
 */
export function isPolicyExpired(endDate: string): boolean {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
}

/**
 * Checks if a policy is expiring soon
 */
export function isPolicyExpiringSoon(
    endDate: string,
    daysThreshold: number = 30
): boolean {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
}

/**
 * Gets the number of days until a policy expires (negative if already expired)
 */
export function getDaysUntilExpiry(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Automatically updates expired policies when the app loads
 * This should be called in strategic places like dashboard loads
 */
export async function autoUpdateExpiredPolicies(): Promise<void> {
    try {
        const result = await updateExpiredPolicies();

        if (result.updatedCount > 0) {
            console.log(
                `Actualizadas ${result.updatedCount} pólizas vencidas:`,
                result.updatedPolicyNumbers
            );
        }

        if (result.error) {
            console.error("Error en actualización automática:", result.error);
        }
    } catch (error) {
        console.error("Error en actualización automática de pólizas:", error);
    }
}
