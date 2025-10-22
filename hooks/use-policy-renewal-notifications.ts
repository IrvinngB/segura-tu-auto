import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Policy } from "@/lib/types/database";

interface PolicyRenewalNotification {
  id: string;
  policy: Policy;
  daysUntilExpiry: number;
  type: "expired" | "expiring" | "renewable";
}

export function usePolicyRenewalNotifications(customerId?: string) {
  const [notifications, setNotifications] = useState<PolicyRenewalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const checkRenewalNotifications = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener pólizas del cliente que necesitan atención
      const { data: policies, error: policiesError } = await supabase
        .from("policies")
        .select(`
          *,
          customer:customers(*),
          vehicle:vehicles(*),
          agent:users(first_name, last_name, email)
        `)
        .eq("customer_id", customerId)
        .in("status", ["active", "expired"]);

      if (policiesError) throw policiesError;

      if (!policies) {
        setNotifications([]);
        return;
      }

      const now = new Date();
      const renewalNotifications: PolicyRenewalNotification[] = [];

      policies.forEach((policy) => {
        const endDate = new Date(policy.end_date);
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Pólizas vencidas (hasta 90 días después del vencimiento pueden renovarse)
        if (policy.status === "expired" || daysUntilExpiry < 0) {
          const daysSinceExpiry = Math.abs(daysUntilExpiry);
          if (daysSinceExpiry <= 90) { // 90 días de gracia para renovar
            renewalNotifications.push({
              id: `expired-${policy.id}`,
              policy,
              daysUntilExpiry,
              type: "expired"
            });
          }
        }
        // Pólizas por vencer (30 días antes)
        else if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          renewalNotifications.push({
            id: `expiring-${policy.id}`,
            policy,
            daysUntilExpiry,
            type: "expiring"
          });
        }
        // Pólizas que pueden renovarse anticipadamente (60 días antes)
        else if (daysUntilExpiry <= 60 && daysUntilExpiry > 30) {
          renewalNotifications.push({
            id: `renewable-${policy.id}`,
            policy,
            daysUntilExpiry,
            type: "renewable"
          });
        }
      });

      setNotifications(renewalNotifications);

    } catch (err: any) {
      console.error("Error checking renewal notifications:", err);
      setError(err.message || "Error al verificar notificaciones de renovación");
    } finally {
      setLoading(false);
    }
  };

  const markAsRenewed = (policyId: string) => {
    setNotifications(prev => prev.filter(n => n.policy.id !== policyId));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  useEffect(() => {
    checkRenewalNotifications();
  }, [customerId]);

  // Verificar cada 5 minutos si hay cambios
  useEffect(() => {
    const interval = setInterval(() => {
      checkRenewalNotifications();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [customerId]);

  return {
    notifications,
    loading,
    error,
    refetch: checkRenewalNotifications,
    markAsRenewed,
    dismissNotification
  };
}

// Hook para obtener estadísticas de renovación
export function useRenewalStats(customerId?: string) {
  const [stats, setStats] = useState({
    totalPolicies: 0,
    activePolicies: 0,
    expiredPolicies: 0,
    expiringPolicies: 0,
    renewablePolicies: 0
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      if (!customerId) return;

      try {
        const { data: policies } = await supabase
          .from("policies")
          .select("id, status, end_date")
          .eq("customer_id", customerId);

        if (!policies) return;

        const now = new Date();
        let activePolicies = 0;
        let expiredPolicies = 0;
        let expiringPolicies = 0;
        let renewablePolicies = 0;

        policies.forEach((policy) => {
          const endDate = new Date(policy.end_date);
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (policy.status === "expired" || daysUntilExpiry < 0) {
            expiredPolicies++;
          } else if (policy.status === "active") {
            activePolicies++;
            
            if (daysUntilExpiry <= 30) {
              expiringPolicies++;
            } else if (daysUntilExpiry <= 60) {
              renewablePolicies++;
            }
          }
        });

        setStats({
          totalPolicies: policies.length,
          activePolicies,
          expiredPolicies,
          expiringPolicies,
          renewablePolicies
        });

      } catch (error) {
        console.error("Error fetching renewal stats:", error);
      }
    };

    fetchStats();
  }, [customerId]);

  return stats;
}
