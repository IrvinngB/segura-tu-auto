'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react';

interface CustomerStats {
  activePolicies: number;
  totalClaims: number;
  pendingClaims: number;
  nextPaymentDate: string | null;
  nextPaymentAmount: number | null;
  totalCoverage: number;
}

export function CustomerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    activePolicies: 0,
    totalClaims: 0,
    pendingClaims: 0,
    nextPaymentDate: null,
    nextPaymentAmount: null,
    totalCoverage: 0,
  });
  const [recentClaims, setRecentClaims] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customer) return;

      const [policiesRes, claimsRes] = await Promise.all([
        supabase
          .from('policies')
          .select('*, vehicle:vehicles(*)')
          .eq('customer_id', customer.id)
          .eq('status', 'active'),
        supabase
          .from('claims')
          .select('*, policy:policies(policy_number, vehicle:vehicles(make, model))')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const policies = policiesRes.data || [];
      const claims = claimsRes.data || [];

      const nextPolicy = policies.sort((a, b) => 
        new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      )[0];

      const totalCoverage = policies.reduce((sum, p) => sum + (p.coverage_amount || 0), 0);
      const pendingClaims = claims.filter(c => 
        ['submitted', 'under_review', 'investigating'].includes(c.status)
      ).length;

      setStats({
        activePolicies: policies.length,
        totalClaims: claims.length,
        pendingClaims,
        nextPaymentDate: nextPolicy?.end_date || null,
        nextPaymentAmount: nextPolicy?.premium_amount || null,
        totalCoverage,
      });

      setRecentClaims(claims);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      submitted: { label: 'Enviada', variant: 'secondary' },
      under_review: { label: 'En Revisión', variant: 'secondary' },
      investigating: { label: 'Investigando', variant: 'outline' },
      waiting_approval: { label: 'Esperando Aprobación', variant: 'outline' },
      approved: { label: 'Aprobada', variant: 'default' },
      denied: { label: 'Denegada', variant: 'destructive' },
      processing_payment: { label: 'Procesando Pago', variant: 'default' },
      paid: { label: 'Pagada', variant: 'default' },
      closed: { label: 'Cerrada', variant: 'outline' },
    };
    return config[status] || { label: status, variant: 'outline' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mi Panel de Control</h2>
        <p className="text-muted-foreground">
          Gestiona tus pólizas y reclamaciones de forma sencilla
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pólizas Activas</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePolicies}</div>
            <p className="text-xs text-muted-foreground">
              Cobertura total: ${stats.totalCoverage.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Pago</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.nextPaymentAmount?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.nextPaymentDate 
                ? new Date(stats.nextPaymentDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
                : 'Sin pagos pendientes'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reclamaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              Total de reclamaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClaims}</div>
            <p className="text-xs text-muted-foreground">
              Reclamaciones activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas y Actividad Reciente */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>¿Qué necesitas hacer hoy?</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button 
              className="w-full justify-between" 
              onClick={() => router.push('/customer/claims/new')}
            >
              <span className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Reclamación
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => router.push('/customer/quote')}
            >
              <span className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Solicitar Cotización
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => router.push('/customer/policies')}
            >
              <span className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Ver Mis Pólizas
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Reclamaciones</CardTitle>
            <CardDescription>Estado de tus reclamaciones recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentClaims.length > 0 ? (
                recentClaims.map((claim) => {
                  const statusInfo = getStatusBadge(claim.status);
                  return (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/claims/${claim.id}`)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {claim.policy?.vehicle?.make} {claim.policy?.vehicle?.model}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {claim.claim_type?.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tienes reclamaciones</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
