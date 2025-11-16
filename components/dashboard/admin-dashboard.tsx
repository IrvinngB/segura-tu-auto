'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  TrendingUp,
  FileText,
  ArrowRight,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react';

interface AdminStats {
  totalRevenue: number;
  activeCustomers: number;
  claimsThisMonth: number;
  approvalRate: number;
}

export function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    activeCustomers: 0,
    claimsThisMonth: 0,
    approvalRate: 0,
  });
  const [recentClaims, setRecentClaims] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const [policiesRes, claimsRes, customersRes, recentRes] = await Promise.all([
        supabase
          .from('policies')
          .select('premium_amount')
          .eq('status', 'active'),
        supabase
          .from('claims')
          .select('status')
          .gte('created_at', firstDayOfMonth.toISOString()),
        supabase
          .from('customers')
          .select('id'),
        supabase
          .from('claims')
          .select(`
            *,
            customer:customers(first_name, last_name),
            policy:policies(policy_number)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const totalRevenue = policiesRes.data?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0;
      const claims = claimsRes.data || [];
      const approvedClaims = claims.filter(c => c.status === 'approved').length;
      const approvalRate = claims.length > 0 ? Math.round((approvedClaims / claims.length) * 100) : 0;

      setStats({
        totalRevenue,
        activeCustomers: customersRes.data?.length || 0,
        claimsThisMonth: claims.length,
        approvalRate,
      });

      setRecentClaims(recentRes.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      submitted: { label: 'Enviada', variant: 'secondary' },
      under_review: { label: 'En Revisión', variant: 'secondary' },
      investigating: { label: 'Investigando', variant: 'outline' },
      approved: { label: 'Aprobada', variant: 'default' },
      denied: { label: 'Denegada', variant: 'destructive' },
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
        <h2 className="text-3xl font-bold tracking-tight">Panel de Administración</h2>
        <p className="text-muted-foreground">
          Vista general del sistema y métricas clave
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              De pólizas activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Total de clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Este Mes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.claimsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Reclamaciones registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              Claims aprobados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas y Actividad Reciente */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Administrativas</CardTitle>
            <CardDescription>Acceso rápido a funciones clave</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button 
              className="w-full justify-between" 
              onClick={() => router.push('/admin')}
            >
              <span className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Panel Completo
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => router.push('/admin?tab=users')}
            >
              <span className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Gestionar Usuarios
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => router.push('/analytics')}
            >
              <span className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver Analíticas
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => router.push('/admin?tab=settings')}
            >
              <span className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Reclamaciones Recientes</CardTitle>
            <CardDescription>Últimas reclamaciones del sistema</CardDescription>
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
                          {claim.customer?.first_name} {claim.customer?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Póliza: {claim.policy?.policy_number}
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
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay reclamaciones recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
