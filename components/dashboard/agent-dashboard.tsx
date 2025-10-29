'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { ClaimNotificationSystem } from '@/components/claims/claim-notification-system';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ClaimSummary {
  id: string;
  claim_number: string;
  claim_type: string;
  status: string;
  priority: string;
  created_at: string;
  customer_name: string;
  days_since_created: number;
  estimated_damage_cost?: number;
}

interface DashboardStats {
  pending_review: number;
  under_investigation: number;
  pending_approval: number;
  total_assigned: number;
  avg_resolution_time: number;
  total_amount_processed: number;
}

export function AgentDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pending_review: 0,
    under_investigation: 0,
    pending_approval: 0,
    total_assigned: 0,
    avg_resolution_time: 0,
    total_amount_processed: 0,
  });
  const [urgentClaims, setUrgentClaims] = useState<ClaimSummary[]>([]);
  const [recentClaims, setRecentClaims] = useState<ClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (userProfile) {
      loadDashboardData();
    }
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadUrgentClaims(), loadRecentClaims()]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Obtener estadísticas de reclamaciones asignadas al agente
      const { data: claims, error } = await supabase
        .from('claims')
        .select('status, created_at, approved_amount')
        .eq('adjuster_id', userProfile?.id);

      if (error) throw error;

      const stats: DashboardStats = {
        pending_review: claims?.filter(c => c.status === 'under_review').length || 0,
        under_investigation: claims?.filter(c => c.status === 'investigating').length || 0,
        pending_approval: claims?.filter(c => c.status === 'waiting_approval').length || 0,
        total_assigned: claims?.length || 0,
        avg_resolution_time: 0, // Se calcularía con lógica más compleja
        total_amount_processed: claims?.reduce((sum, c) => sum + (c.approved_amount || 0), 0) || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUrgentClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select(
          `
          id,
          claim_number,
          claim_type,
          status,
          priority,
          created_at,
          estimated_damage_cost,
          customer:customers(
            user:users(first_name, last_name)
          )
        `
        )
        .in('priority', ['urgent', 'high'])
        .in('status', ['submitted', 'under_review', 'investigating'])
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) throw error;

      const formattedClaims =
        data?.map((claim: any) => ({
          id: claim.id,
          claim_number: claim.claim_number,
          claim_type: claim.claim_type,
          status: claim.status,
          priority: claim.priority,
          created_at: claim.created_at,
          customer_name:
            `${claim.customer?.user?.first_name || ''} ${claim.customer?.user?.last_name || ''}`.trim(),
          days_since_created: Math.ceil(
            (new Date().getTime() - new Date(claim.created_at).getTime()) / (1000 * 60 * 60 * 24)
          ),
          estimated_damage_cost: claim.estimated_damage_cost,
        })) || [];

      setUrgentClaims(formattedClaims);
    } catch (error) {
      console.error('Error loading urgent claims:', error);
    }
  };

  const loadRecentClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select(
          `
          id,
          claim_number,
          claim_type,
          status,
          priority,
          created_at,
          estimated_damage_cost,
          customer:customers(
            user:users(first_name, last_name)
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedClaims =
        data?.map((claim: any) => ({
          id: claim.id,
          claim_number: claim.claim_number,
          claim_type: claim.claim_type,
          status: claim.status,
          priority: claim.priority,
          created_at: claim.created_at,
          customer_name:
            `${claim.customer?.user?.first_name || ''} ${claim.customer?.user?.last_name || ''}`.trim(),
          days_since_created: Math.ceil(
            (new Date().getTime() - new Date(claim.created_at).getTime()) / (1000 * 60 * 60 * 24)
          ),
          estimated_damage_cost: claim.estimated_damage_cost,
        })) || [];

      setRecentClaims(formattedClaims);
    } catch (error) {
      console.error('Error loading recent claims:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Recibida', variant: 'secondary' as const },
      under_review: { label: 'En Revisión', variant: 'default' as const },
      investigating: { label: 'Investigando', variant: 'default' as const },
      waiting_approval: { label: 'Esperando Aprobación', variant: 'outline' as const },
      approved: { label: 'Aprobada', variant: 'default' as const },
      denied: { label: 'Denegada', variant: 'destructive' as const },
      paid: { label: 'Pagada', variant: 'default' as const },
      closed: { label: 'Cerrada', variant: 'secondary' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'secondary' as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { label: 'Urgente', className: 'bg-red-500 text-white' },
      high: { label: 'Alta', className: 'bg-orange-500 text-white' },
      medium: { label: 'Media', className: 'bg-yellow-500 text-white' },
      low: { label: 'Baja', className: 'bg-green-500 text-white' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      label: priority,
      className: 'bg-gray-500 text-white',
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (!userProfile || !['admin', 'agent', 'adjuster'].includes(userProfile.role)) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos para acceder a este dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Dashboard de{' '}
            {userProfile.role === 'agent'
              ? 'Agente'
              : userProfile.role === 'adjuster'
                ? 'Ajustador'
                : 'Administrador'}
          </h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de reclamaciones •{' '}
            {format(new Date(), 'dd/MM/yyyy', { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClaimNotificationSystem />
          <Link href="/claims">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Ver Todas las Reclamaciones
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_review}</div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investigando</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.under_investigation}</div>
            <p className="text-xs text-muted-foreground">En proceso de investigación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esperando Aprobación</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_approval}</div>
            <p className="text-xs text-muted-foreground">Listas para aprobación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procesado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_amount_processed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Monto total aprobado</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="urgent" className="space-y-6">
        <TabsList>
          <TabsTrigger value="urgent" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Urgentes ({urgentClaims.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recientes ({recentClaims.length})
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rendimiento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="urgent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Reclamaciones Urgentes y de Alta Prioridad
              </CardTitle>
              <CardDescription>Reclamaciones que requieren atención inmediata</CardDescription>
            </CardHeader>
            <CardContent>
              {urgentClaims.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">¡Excelente trabajo!</h3>
                  <p className="text-muted-foreground">No hay reclamaciones urgentes pendientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {urgentClaims.map(claim => (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{claim.claim_number}</span>
                          {getPriorityBadge(claim.priority)}
                          {getStatusBadge(claim.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            <span>{claim.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            <span>{claim.claim_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{claim.days_since_created} días desde creación</span>
                          </div>
                          {claim.estimated_damage_cost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              <span>${claim.estimated_damage_cost.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/claims/${claim.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Link href={`/claims/${claim.id}?tab=processing`}>
                          <Button size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Procesar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Reclamaciones Recientes
              </CardTitle>
              <CardDescription>Últimas reclamaciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentClaims.map(claim => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{claim.claim_number}</span>
                        {getPriorityBadge(claim.priority)}
                        {getStatusBadge(claim.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {claim.customer_name} • {claim.claim_type} •{' '}
                        {format(new Date(claim.created_at), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    </div>
                    <Link href={`/claims/${claim.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Rendimiento</CardTitle>
                <CardDescription>Métricas de tu trabajo actual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total de reclamaciones asignadas:</span>
                  <span className="font-semibold">{stats.total_assigned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Reclamaciones en proceso:</span>
                  <span className="font-semibold">
                    {stats.pending_review + stats.under_investigation}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Monto total procesado:</span>
                  <span className="font-semibold">
                    ${stats.total_amount_processed.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Funciones más utilizadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/claims" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver todas las reclamaciones
                  </Button>
                </Link>
                <Link href="/claims?tab=new" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Crear nueva reclamación
                  </Button>
                </Link>
                <Link href="/analytics" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver estadísticas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
