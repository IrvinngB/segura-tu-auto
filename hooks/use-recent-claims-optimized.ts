'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { useEffect, useMemo } from 'react';

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

export function useRecentClaimsOptimized(limit: number = 3) {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const fetchDashboardData = async () => {
    if (!user || !userProfile) {
      throw new Error('No user or profile');
    }

    if (userProfile.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customerData) throw new Error('Customer not found');

      const [policiesResult, claimsResult] = await Promise.all([
        supabase.from('policies').select('id, status').eq('customer_id', customerData.id),
        supabase
          .from('claims')
          .select('id, claim_number, claim_type, priority, status, created_at, updated_at')
          .eq('customer_id', customerData.id)
          .order('updated_at', { ascending: false })
          .limit(limit),
      ]);

      return {
        stats: {
          totalPolicies: policiesResult.data?.length || 0,
          activeClaims:
            claimsResult.data?.filter(c => !['closed', 'paid', 'denied'].includes(c.status))
              .length || 0,
          totalClients: 1,
          pendingAssessments:
            claimsResult.data?.filter(c => c.status === 'under_review').length || 0,
        },
        recentClaims: claimsResult.data || [],
      };
    } else if (userProfile.role === 'agent') {
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

      return {
        stats: {
          totalPolicies: policiesResult.data?.length || 0,
          activeClaims:
            claimsResult.data?.filter(c => !['closed', 'paid', 'denied'].includes(c.status))
              .length || 0,
          totalClients: customersResult.data?.length || 0,
          pendingAssessments: claimsResult.data?.filter(c => c.status === 'submitted').length || 0,
        },
        recentClaims: claimsResult.data || [],
      };
    } else if (userProfile.role === 'adjuster') {
      const [policiesResult, claimsResult, customersResult] = await Promise.all([
        supabase.from('policies').select('id'),
        supabase
          .from('claims')
          .select('id, claim_number, claim_type, priority, status, created_at, updated_at')
          .in('status', ['investigating', 'waiting_approval', 'approved', 'denied'])
          .order('updated_at', { ascending: false })
          .limit(limit),
        supabase.from('customers').select('id'),
      ]);

      return {
        stats: {
          totalPolicies: policiesResult.data?.length || 0,
          activeClaims:
            claimsResult.data?.filter(c => ['investigating', 'waiting_approval'].includes(c.status))
              .length || 0,
          totalClients: customersResult.data?.length || 0,
          pendingAssessments:
            claimsResult.data?.filter(c => c.status === 'investigating').length || 0,
        },
        recentClaims: claimsResult.data || [],
      };
    } else {
      const [policiesResult, claimsResult, customersResult, assessmentsResult] = await Promise.all([
        supabase.from('policies').select('id'),
        supabase
          .from('claims')
          .select('id, claim_number, claim_type, priority, status, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(limit),
        supabase.from('customers').select('id'),
        supabase.from('damage_assessments').select('id').eq('is_final', false),
      ]);

      return {
        stats: {
          totalPolicies: policiesResult.data?.length || 0,
          activeClaims:
            claimsResult.data?.filter(c => !['closed', 'paid', 'denied'].includes(c.status))
              .length || 0,
          totalClients: customersResult.data?.length || 0,
          pendingAssessments: assessmentsResult.data?.length || 0,
        },
        recentClaims: claimsResult.data || [],
      };
    }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', user?.id, userProfile?.role, limit],
    queryFn: fetchDashboardData,
    enabled: !!user && !!userProfile,
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: true,
  });

  // ✅ Solo suscripción realtime, SIN polling
  useEffect(() => {
    if (!user || !userProfile) return;

    console.log('🔔 Configurando suscripción realtime para dashboard (SIN polling)...');

    const channel = supabase
      .channel(`dashboard-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
        },
        payload => {
          console.log('🔔 Cambio detectado en claims:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando suscripción dashboard');
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user, userProfile, queryClient, supabase]);

  return {
    recentClaims: data?.recentClaims || [],
    stats: data?.stats || {
      totalPolicies: 0,
      activeClaims: 0,
      totalClients: 0,
      pendingAssessments: 0,
    },
    loading: isLoading,
    lastUpdated: new Date(),
    refresh: refetch,
  };
}
