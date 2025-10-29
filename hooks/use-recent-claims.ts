'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

interface RecentClaim {
  id: string;
  claim_number: string;
  claim_type: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalPolicies: number;
  activeClaims: number;
  totalClients: number;
  pendingAssessments: number;
}

export function useRecentClaims(limit: number = 3) {
  const { user, userProfile } = useAuth();
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPolicies: 0,
    activeClaims: 0,
    totalClients: 0,
    pendingAssessments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Actualizando dashboard para rol:', userProfile.role);

      if (userProfile.role === 'customer') {
        // Dashboard del cliente
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (customerData) {
          const [policiesResult, claimsResult] = await Promise.all([
            supabase.from('policies').select('id, status').eq('customer_id', customerData.id),
            supabase
              .from('claims')
              .select('id, claim_number, claim_type, priority, status, created_at, updated_at')
              .eq('customer_id', customerData.id)
              .order('updated_at', { ascending: false })
              .limit(limit),
          ]);

          setStats({
            totalPolicies: policiesResult.data?.length || 0,
            activeClaims:
              claimsResult.data?.filter(c => !['closed', 'paid', 'denied'].includes(c.status))
                .length || 0,
            totalClients: 1,
            pendingAssessments:
              claimsResult.data?.filter(c => c.status === 'under_review').length || 0,
          });

          setRecentClaims(claimsResult.data || []);
        }
      } else if (userProfile.role === 'agent') {
        // Dashboard del agente - reclamaciones que puede procesar
        const [policiesResult, claimsResult, customersResult] = await Promise.all([
          supabase.from('policies').select('id'),
          supabase
            .from('claims')
            .select('id, claim_number, claim_type, priority, status, created_at, updated_at')
            .in('status', [
              'submitted',
              'under_review',
              'pending_documentation',
              'approved',
              'processing_payment',
              'paid',
              'denied',
            ])
            .order('updated_at', { ascending: false })
            .limit(limit),
          supabase.from('customers').select('id'),
        ]);

        setStats({
          totalPolicies: policiesResult.data?.length || 0,
          activeClaims:
            claimsResult.data?.filter(c => !['closed', 'paid', 'denied'].includes(c.status))
              .length || 0,
          totalClients: customersResult.data?.length || 0,
          pendingAssessments: claimsResult.data?.filter(c => c.status === 'submitted').length || 0,
        });

        setRecentClaims(claimsResult.data || []);
      } else if (userProfile.role === 'adjuster') {
        // Dashboard del evaluador - reclamaciones que puede evaluar
        const [policiesResult, claimsResult, customersResult, assessmentsResult] =
          await Promise.all([
            supabase.from('policies').select('id'),
            supabase
              .from('claims')
              .select('id, claim_number, claim_type, priority, status, created_at, updated_at')
              .in('status', ['investigating', 'waiting_approval', 'approved', 'denied'])
              .order('updated_at', { ascending: false })
              .limit(limit),
            supabase.from('customers').select('id'),
            supabase.from('damage_assessments').select('id').eq('is_final', false),
          ]);

        setStats({
          totalPolicies: policiesResult.data?.length || 0,
          activeClaims:
            claimsResult.data?.filter(c => ['investigating', 'waiting_approval'].includes(c.status))
              .length || 0,
          totalClients: customersResult.data?.length || 0,
          pendingAssessments:
            claimsResult.data?.filter(c => c.status === 'investigating').length || 0,
        });

        setRecentClaims(claimsResult.data || []);
      } else {
        // Dashboard del administrador - todas las reclamaciones
        const [policiesResult, claimsResult, customersResult, assessmentsResult] =
          await Promise.all([
            supabase.from('policies').select('id'),
            supabase
              .from('claims')
              .select('id, claim_number, claim_type, priority, status, created_at, updated_at')
              .order('updated_at', { ascending: false })
              .limit(limit),
            supabase.from('customers').select('id'),
            supabase.from('damage_assessments').select('id').eq('is_final', false),
          ]);

        setStats({
          totalPolicies: policiesResult.data?.length || 0,
          activeClaims:
            claimsResult.data?.filter(c => !['closed', 'paid', 'denied'].includes(c.status))
              .length || 0,
          totalClients: customersResult.data?.length || 0,
          pendingAssessments: assessmentsResult.data?.length || 0,
        });

        setRecentClaims(claimsResult.data || []);
      }

      setLastUpdated(new Date());
      console.log('✅ Dashboard actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, limit, supabase]);

  // Fetch inicial
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh cada 5 segundos (tiempo real)
  useEffect(() => {
    if (!user || !userProfile) return;

    console.log('⚡ Configurando auto-refresh del dashboard en tiempo real cada 5 segundos...');
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh tiempo real del dashboard...');
      fetchDashboardData();
    }, 5000); // 5 segundos para tiempo real

    return () => {
      console.log('🔌 Desconectando auto-refresh dashboard');
      clearInterval(interval);
    };
  }, [fetchDashboardData, user, userProfile]);

  // Suscripción en tiempo real a cambios en reclamaciones
  useEffect(() => {
    if (!user || !userProfile) return;

    console.log('🔔 Configurando suscripción en tiempo real para reclamaciones...');

    const subscription = supabase
      .channel('dashboard-claims-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'claims',
        },
        payload => {
          console.log('🔔 Cambio detectado en reclamaciones:', payload);
          // Actualizar datos cuando hay cambios
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando suscripción dashboard');
      subscription.unsubscribe();
    };
  }, [fetchDashboardData, user, userProfile, supabase]);

  // Función manual para refrescar
  const refresh = useCallback(() => {
    console.log('🔄 Refresh manual del dashboard...');
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    recentClaims,
    stats,
    loading,
    lastUpdated,
    refresh,
  };
}
