'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  FileText,
  ArrowRight,
  Search
} from 'lucide-react';

interface AdjusterStats {
  assignedClaims: number;
  completedToday: number;
  pendingEvaluations: number;
  urgentCases: number;
}

export function AdjusterDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdjusterStats>({
    assignedClaims: 0,
    completedToday: 0,
    pendingEvaluations: 0,
    urgentCases: 0,
  });
  const [assignedClaims, setAssignedClaims] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAdjusterData();
  }, []);

  const fetchAdjusterData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [assignedRes, completedRes, urgentRes, recentRes] = await Promise.all([
        supabase
          .from('claims')
          .select('id, status')
          .eq('adjuster_id', user.id)
          .in('status', ['investigating', 'waiting_approval']),
        supabase
          .from('claims')
          .select('id')
          .eq('adjuster_id', user.id)
          .eq('status', 'approved')
          .gte('updated_at', today.toISOString()),
        supabase
          .from('claims')
          .select('id')
          .eq('adjuster_id', user.id)
          .in('priority', ['high', 'urgent'])
          .in('status', ['investigating', 'waiting_approval']),
        supabase
          .from('claims')
          .select(`
            *,
            policy:policies(
              policy_number,
              vehicle:vehicles(make, model, year, license_plate),
              customer:customers(first_name, last_name)
            )
          `)
          .eq('adjuster_id', user.id)
          .in('status', ['investigating', 'waiting_approval'])
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(5)
      ]);

      const pendingEvals = assignedRes.data?.filter((c: any) => c.status === 'investigating').length || 0;

      setStats({
        assignedClaims: assignedRes.data?.length || 0,
        completedToday: completedRes.data?.length || 0,
        pendingEvaluations: pendingEvals,
        urgentCases: urgentRes.data?.length || 0,
      });

      setAssignedClaims(recentRes.data || []);
    } catch (error) {
      console.error('Error fetching adjuster data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-green-600 bg-green-50 border-green-200',
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    };
    return labels[priority] || priority;
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
        <h2 className="text-3xl font-bold tracking-tight">Panel de Ajustador</h2>
        <p className="text-muted-foreground">
          Gestiona y evalúa las reclamaciones asignadas
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Asignados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedClaims}</div>
            <p className="text-xs text-muted-foreground">
              Activos en este momento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              Evaluaciones finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              Requieren evaluación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgentCases}</div>
            <p className="text-xs text-muted-foreground">
              Prioridad alta/urgente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas y Casos Asignados */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede a tus herramientas de trabajo</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button 
              className="w-full justify-between" 
              onClick={() => router.push('/claims?filter=urgent')}
            >
              <span className="flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Ver Casos Urgentes
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => router.push('/claims')}
            >
              <span className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Buscar Reclamaciones
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => router.push('/damage-assessments')}
            >
              <span className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Mis Evaluaciones
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Casos Asignados */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Casos Activos</CardTitle>
            <CardDescription>Reclamaciones que requieren tu atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedClaims.length > 0 ? (
                assignedClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/claims/${claim.id}`)}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {claim.policy?.vehicle?.make} {claim.policy?.vehicle?.model}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(claim.priority)}`}
                        >
                          {getPriorityLabel(claim.priority)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {claim.policy?.customer?.first_name} {claim.policy?.customer?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Placa: {claim.policy?.vehicle?.license_plate}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {claim.status === 'investigating' ? 'Evaluando' : 'Esperando'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tienes casos asignados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
