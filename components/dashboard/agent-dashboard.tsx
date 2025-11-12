'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { ClaimNotificationSystem } from '@/components/claims/claim-notification-system';
import { AdminClaimMonitor } from '@/components/admin/admin-claim-monitor';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = createClient();

  // Funciones helper para el formateo de fechas
  const getDaysOld = (date: string) => {
    const claimDate = new Date(date);
    const now = new Date();
    
    // Comparar solo las fechas (sin horas)
    const claimDateOnly = new Date(claimDate.getFullYear(), claimDate.getMonth(), claimDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowDateOnly.getTime() - claimDateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const getClaimAgeDisplay = (date: string) => {
    const days = getDaysOld(date);
    
    if (days === 0) {
      // Mismo día - no mostrar etiqueta de edad
      return null;
    } else if (days === 1) {
      // Un día - singular
      return '1 día desde creación';
    } else {
      // Múltiples días - plural
      return `${days} días desde creación`;
    }
  };

  useEffect(() => {
    if (userProfile) {
      loadDashboardData();

      // Suscripción en tiempo real para actualizar cuando cambien las reclamaciones
      console.log('🔌 Estableciendo suscripción dashboard de agente...');
      const channel = supabase
        .channel('claims-dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*', // Escuchar INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'claims',
          },
          payload => {
            console.log('🔄 DASHBOARD AGENTE - Cambio detectado en reclamación:', payload);
            console.log('🔄 DASHBOARD AGENTE - Tipo de evento:', payload.eventType);
            console.log('🔄 DASHBOARD AGENTE - Datos nuevos:', payload.new);
            console.log('🔄 DASHBOARD AGENTE - Datos anteriores:', payload.old);

            // Añadir un pequeño delay para asegurar que la base de datos se actualice completamente
            setTimeout(() => {
              console.log('🔄 DASHBOARD AGENTE - Recargando dashboard...');
              loadDashboardData();
            }, 500);
          }
        )
        .subscribe(status => {
          console.log('📡 Estado de suscripción dashboard:', status);
        });

      // Método de respaldo: polling cada 10 segundos
      const pollInterval = setInterval(() => {
        console.log('🔄 Polling de respaldo - verificando actualizaciones...');
        loadDashboardData();
      }, 10000);

      return () => {
        console.log('🔌 Desconectando suscripción dashboard de agente...');
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
      };
    }
  }, [userProfile]);

  // Efecto para recargar datos cuando el componente vuelve a enfocarse
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Dashboard enfocado - recargando datos...');
      loadDashboardData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Página visible - recargando datos...');
        loadDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getStatusLabel = (status: string) => {
    const statusConfig = {
      submitted: 'Enviada',
      under_review: 'En Revisión',
      investigating: 'En Investigación',
      waiting_approval: 'Esperando Aprobación',
      approved: 'Aprobada',
      denied: 'Denegada',
      paid: 'Pagada',
      closed: 'Cerrada',
    };
    return statusConfig[status as keyof typeof statusConfig] || status;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 INICIANDO CARGA DE DATOS DEL DASHBOARD...');
      await Promise.all([loadStats(), loadUrgentClaims(), loadRecentClaims()]);
      setRefreshKey(Date.now()); // Forzar re-render
      console.log('✅ CARGA DE DATOS COMPLETADA');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Obtener estadísticas de todas las reclamaciones del sistema para el dashboard general
      const { data: allClaims, error } = await supabase
        .from('claims')
        .select('status, created_at, approved_amount, estimated_damage_cost');

      if (error) throw error;

      // Calcular estadísticas basadas en el estado actual de las reclamaciones
      const stats: DashboardStats = {
        pending_review:
          allClaims?.filter(c => c.status === 'under_review' || c.status === 'submitted').length ||
          0,
        under_investigation: allClaims?.filter(c => c.status === 'investigating').length || 0,
        pending_approval: allClaims?.filter(c => c.status === 'waiting_approval').length || 0,
        total_assigned: allClaims?.length || 0,
        avg_resolution_time: 0, // Se calcularía con lógica más compleja
        total_amount_processed:
          allClaims
            ?.filter(c => c.status === 'approved' || c.status === 'paid')
            .reduce((sum, c) => sum + (c.approved_amount || c.estimated_damage_cost || 0), 0) || 0,
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
        .in('status', [
          'submitted',
          'under_review',
          'investigating',
          'pending_documentation',
          'waiting_approval',
        ])
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
          days_since_created: getDaysOld(claim.created_at),
          estimated_damage_cost: claim.estimated_damage_cost,
        })) || [];

      console.log('📊 URGENTES - Reclamaciones cargadas:', formattedClaims.length);
      formattedClaims.forEach(claim => {
        console.log(
          `📊 URGENTE ${claim.claim_number}: status='${claim.status}' -> label='${getStatusLabel(claim.status)}'`
        );
      });
      setUrgentClaims([...formattedClaims]); // Forzar nuevo array
    } catch (error) {
      console.error('Error loading urgent claims:', error);
    }
  };

  const loadRecentClaims = async () => {
    try {
      let query = supabase
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
        .order('created_at', { ascending: false });

      // Todos los roles ven todas las reclamaciones - solo cambia el label

      const { data, error } = await query.limit(10);

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
          days_since_created: getDaysOld(claim.created_at),
          estimated_damage_cost: claim.estimated_damage_cost,
        })) || [];

      console.log('📊 RECIENTES - Reclamaciones cargadas:', formattedClaims.length);
      formattedClaims.forEach(claim => {
        console.log(
          `📊 RECIENTE ${claim.claim_number}: status='${claim.status}' -> label='${getStatusLabel(claim.status)}'`
        );
      });
      setRecentClaims([...formattedClaims]); // Forzar nuevo array
    } catch (error) {
      console.error('Error loading recent claims:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Enviada', variant: 'secondary' as const },
      under_review: { label: 'En Revisión', variant: 'default' as const },
      investigating: { label: 'En Investigación', variant: 'default' as const },
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

    console.log(`🏷️ DASHBOARD AGENTE - Badge: status='${status}' -> label='${config.label}'`);
    const getVariantStyles = (variant: string) => {
      switch (variant) {
        case 'secondary':
          return 'bg-gray-100 text-gray-900 border border-gray-200';
        case 'default':
          return 'bg-blue-500 text-white';
        case 'outline':
          return 'bg-transparent border border-gray-300 text-gray-700';
        case 'destructive':
          return 'bg-red-500 text-white';
        default:
          return 'bg-gray-100 text-gray-900';
      }
    };

    return (
      <div
        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${getVariantStyles(config.variant)}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          lineHeight: '1',
          minHeight: '24px',
          whiteSpace: 'nowrap',
        }}
      >
        {config.label}
      </div>
    );
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
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          lineHeight: '1',
          minHeight: '24px',
          whiteSpace: 'nowrap',
        }}
      >
        {config.label}
      </div>
    );
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
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔄 Recarga manual iniciada...');
              loadDashboardData();
            }}
            disabled={loading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {loading ? 'Actualizando...' : 'Refrescar'}
          </Button>
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
                <div className="space-y-4" key={refreshKey}>
                  {urgentClaims.map(claim => (
                    <div
                      key={`${claim.id}-${refreshKey}`}
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
                          {getClaimAgeDisplay(claim.created_at) && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{getClaimAgeDisplay(claim.created_at)}</span>
                            </div>
                          )}
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
              <div className="space-y-3" key={refreshKey}>
                {recentClaims.map(claim => (
                  <div
                    key={`${claim.id}-${refreshKey}`}
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

      {/* Monitor de Estados - Solo para testing */}
      {userProfile?.role === 'admin' || userProfile?.role === 'agent' ? (
        <div className="mt-8">
          <AdminClaimMonitor />
        </div>
      ) : null}
    </div>
  );
}
