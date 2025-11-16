'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Shield } from 'lucide-react';

// Landing page components
import { PublicHeader } from '@/components/landing/public-header';
import { HeroSection } from '@/components/landing/hero-section';
import { ServicesSection } from '@/components/landing/services-section';
import { PoliciesSection } from '@/components/landing/policies-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PublicFooter } from '@/components/landing/public-footer';

// Role-specific dashboards
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard';
import { AdjusterDashboard } from '@/components/dashboard/adjuster-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { AgentDashboard } from '@/components/dashboard/agent-dashboard';

export default function HomePage() {
  const { user, userProfile, loading: authLoading } = useAuth();

  // Mostrar landing page pública si no está autenticado
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

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Obtener el rol del usuario
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      customer: 'Cliente',
      adjuster: 'Ajustador',
      agent: 'Agente',
      admin: 'Administrador',
    };
    return labels[role] || role;
  };

  // Renderizar dashboard según el rol
  const renderDashboard = () => {
    switch (userProfile?.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'adjuster':
        return <AdjusterDashboard />;
      case 'agent':
        return <AgentDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Rol no reconocido</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">SeguraTuAuto</h1>
              {userProfile?.role && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                  {getRoleLabel(userProfile.role)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {userProfile?.first_name} {userProfile?.last_name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
