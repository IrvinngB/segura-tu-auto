'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { createBrowserClient } from '@supabase/ssr';
import { useRecentClaims } from '@/hooks/use-recent-claims';
import { AgentDashboard } from '@/components/dashboard/agent-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, FileText, AlertTriangle, Users, TrendingUp, Shield, Clock } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardSkeleton } from '@/components/ui/skeleton';

// Import public landing components
import { PublicHeader } from '@/components/landing/public-header';
import { HeroSection } from '@/components/landing/hero-section';
import { ServicesSection } from '@/components/landing/services-section';
import { PoliciesSection } from '@/components/landing/policies-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PublicFooter } from '@/components/landing/public-footer';

export default function HomePage() {
  const { user, userProfile, loading: authLoading, clearAllCache } = useAuth();
  const router = useRouter();

  // Usar el hook personalizado para reclamaciones recientes
  const { recentClaims, stats, loading: claimsLoading, lastUpdated, refresh } = useRecentClaims(3);

  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Funciones para obtener etiquetas y variantes de estado
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      submitted: 'Enviada',
      under_review: 'En Revisión',
      pending_documentation: 'Documentos Pendientes',
      investigating: 'Investigando',
      waiting_approval: 'Esperando Aprobación',
      approved: 'Aprobada',
      processing_payment: 'Procesando Pago',
      paid: 'Pagada',
      denied: 'Denegada',
      closed: 'Cerrada',
    };
    return statusLabels[status] || status;
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'submitted':
      case 'under_review':
        return 'secondary';
      case 'pending_documentation':
      case 'investigating':
      case 'waiting_approval':
        return 'outline';
      case 'approved':
      case 'paid':
        return 'default';
      case 'processing_payment':
        return 'secondary';
      case 'denied':
      case 'closed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    // Actualizar el estado de loading cuando termine la autenticación y las reclamaciones
    if (!authLoading) {
      setLoading(claimsLoading);
    }
  }, [authLoading, claimsLoading]);

  const navigationItems = useMemo(() => {
    const baseItems = [
      { path: '/policies', icon: FileText, label: 'Gestión de Pólizas' },
      { path: '/claims', icon: AlertTriangle, label: 'Reclamaciones' },
      {
        path: '/risk-assessment',
        icon: TrendingUp,
        label: 'Evaluación de Riesgo',
      },
    ];

    if (userProfile?.role === 'customer') {
      return [
        {
          path: '/customer/dashboard',
          icon: Shield,
          label: 'Mi Dashboard',
        },
        {
          path: '/customer/policies',
          icon: FileText,
          label: 'Mis Pólizas',
        },
        {
          path: '/customer/claims',
          icon: AlertTriangle,
          label: 'Mis Reclamaciones',
        },
        {
          path: '/customer/quote',
          icon: TrendingUp,
          label: 'Solicitar Cotización',
        },
        {
          path: '/customer/profile',
          icon: Users,
          label: 'Mi Perfil',
        },
      ];
    }

    if (userProfile?.role === 'admin' || userProfile?.role === 'agent') {
      return [
        ...baseItems,
        { path: '/documents', icon: FileText, label: 'Documentos' },
        { path: '/clients', icon: Users, label: 'Clientes' },
        {
          path: '/analytics',
          icon: TrendingUp,
          label: 'Análisis Básico',
        },
      ];
    }

    if (userProfile?.role === 'adjuster') {
      return [
        {
          path: '/claims',
          icon: AlertTriangle,
          label: 'Reclamaciones',
        },
        {
          path: '/damage-assessments',
          icon: TrendingUp,
          label: 'Evaluaciones',
        },
        { path: '/documents', icon: FileText, label: 'Documentos' },
      ];
    }

    return baseItems;
  }, [userProfile?.role]);

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', classes: 'priority-badge priority-low' },
      medium: {
        label: 'Media',
        classes: 'priority-badge priority-medium',
      },
      high: { label: 'Alta', classes: 'priority-badge priority-high' },
      urgent: {
        label: 'Urgente',
        classes: 'priority-badge priority-urgent',
      },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      label: priority,
      classes: 'priority-badge priority-low',
    };
    return config;
  };

  const getPriorityBadgeVariant = useMemo(
    () => (priority: string) => {
      switch (priority) {
        case 'high':
        case 'urgent':
          return 'destructive';
        case 'medium':
          return 'secondary';
        case 'low':
          return 'outline';
        default:
          return 'secondary';
      }
    },
    []
  );

  // If user is not authenticated, show public landing page
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <main>
          <HeroSection />
          <ServicesSection />
          <PoliciesSection />
          <TestimonialsSection />
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (authLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">SeguraTuAuto</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // If user is an agent, show the specialized agent dashboard
  if (userProfile?.role === 'agent') {
    return <AgentDashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">SeguraTuAuto</h1>
              {userProfile?.role && (
                <Badge
                  variant="outline"
                  className="capitalize dark:text-purple-200 dark:border-purple-300"
                >
                  {userProfile.role === 'customer'
                    ? 'Cliente'
                    : userProfile.role === 'agent'
                      ? 'Agente'
                      : userProfile.role === 'adjuster'
                        ? 'Evaluador'
                        : 'Admin'}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Bienvenido, {userProfile?.first_name} {userProfile?.last_name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile?.role === 'customer' ? 'Mis Pólizas' : 'Total Pólizas'}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPolicies}</div>
              <p className="text-xs text-muted-foreground">
                {userProfile?.role === 'customer' ? 'Pólizas activas' : '+12% desde el mes pasado'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile?.role === 'customer' ? 'Mis Reclamaciones' : 'Reclamaciones Activas'}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeClaims}</div>
              <p className="text-xs text-muted-foreground">
                {userProfile?.role === 'customer' ? 'En proceso' : '-3% desde la semana pasada'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile?.role === 'customer' ? 'Mi Perfil' : 'Total Clientes'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {userProfile?.role === 'customer'
                  ? 'Información actualizada'
                  : '+8% desde el mes pasado'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile?.role === 'customer'
                  ? 'Estado de Evaluaciones'
                  : 'Evaluaciones Pendientes'}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAssessments}</div>
              <p className="text-xs text-muted-foreground">
                {userProfile?.role === 'customer' ? 'En revisión' : 'Requieren atención'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Accede a las funciones principales del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile?.role === 'customer' ? (
                <>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => router.push('/customer/quote')}
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Solicitar Cotización
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => router.push('/customer/claims/new')}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Nueva Reclamación
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => router.push('/customer/policies')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Mis Pólizas
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => router.push('/customer/profile')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Actualizar Mis Datos
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => router.push('/policies/new')}
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Nueva Póliza
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => router.push('/claims/new')}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Nueva Reclamación
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => router.push('/risk-assessment')}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Evaluación de Riesgo
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {userProfile?.role === 'customer'
                      ? 'Mis Reclamaciones Recientes'
                      : 'Reclamaciones Recientes'}
                  </CardTitle>
                  <CardDescription>
                    {userProfile?.role === 'customer'
                      ? 'Estado de tus reclamaciones más recientes'
                      : 'Últimas reclamaciones que requieren atención'}
                    {lastUpdated && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        Actualizado: {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClaims.length > 0 ? (
                  recentClaims.map(claim => (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{claim.claim_number}</p>
                        <p className="text-xs text-muted-foreground">{claim.claim_type}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getStatusBadgeVariant(claim.status)} className="text-xs">
                            {getStatusLabel(claim.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={getPriorityBadge(claim.priority).classes}>
                          {getPriorityBadge(claim.priority).label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(claim.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay reclamaciones recientes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Menu */}
        <Card>
          <CardHeader>
            <CardTitle>Módulos del Sistema</CardTitle>
            <CardDescription>Navega por las diferentes secciones de SeguraTuAuto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {navigationItems.map(item => (
                <Button
                  key={item.path}
                  variant="outline"
                  className="h-20 flex-col space-y-2 bg-transparent"
                  onClick={() => router.push(item.path)}
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
