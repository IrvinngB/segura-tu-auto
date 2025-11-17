'use client';

import { useState, useMemo, memo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { LogoutButton } from '@/components/auth/logout-button';
import { OptimizedLink, usePrefetchRoutes } from '@/components/navigation/optimized-link';
import {
  Shield,
  FileText,
  AlertTriangle,
  TrendingUp,
  Users,
  Upload,
  BarChart3,
  Menu,
  X,
  Home,
  Car,
  CreditCard,
  User,
  ClipboardList,
  MessageSquare,
  Calculator,
  Bell,
  Settings,
  Activity,
  RefreshCw,
  Archive,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  description?: string;
}

const navigationItems: NavigationItem[] = [
  // Dashboard - Todos los roles
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    roles: ['admin', 'agent', 'adjuster', 'customer'],
    description: 'Panel principal',
  },

  // Admin y Agent
  {
    name: 'Pólizas',
    href: '/policies',
    icon: FileText,
    roles: ['admin', 'agent'],
    description: 'Gestión de pólizas',
  },
  {
    name: 'Cotizaciones',
    href: '/quotes',
    icon: Calculator,
    roles: ['admin', 'agent'],
    description: 'Gestión de cotizaciones',
  },
  {
    name: 'Clientes',
    href: '/clients',
    icon: Users,
    roles: ['admin', 'agent'],
    description: 'Gestión de clientes',
  },
  {
    name: 'Reclamaciones',
    href: '/claims',
    icon: AlertTriangle,
    roles: ['admin', 'agent', 'adjuster'],
    description: 'Gestión de reclamos',
  },
  {
    name: 'Evaluación de Riesgo',
    href: '/risk-assessment',
    icon: TrendingUp,
    roles: ['admin', 'agent'],
    description: 'Evaluación de riesgos',
  },
  {
    name: 'Documentos',
    href: '/documents',
    icon: Upload,
    roles: ['admin', 'agent'],
    description: 'Gestión de documentos',
  },
  {
    name: 'Análisis',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin', 'agent'],
    description: 'Reportes y análisis',
  },
  {
    name: 'Reportes Avanzados',
    href: '/admin/reports',
    icon: TrendingUp,
    roles: ['admin'],
    description: 'Dashboard de métricas y reportes',
  },
  {
    name: 'Auditoría',
    href: '/admin/audit',
    icon: Activity,
    roles: ['admin'],
    description: 'Registro de auditoría',
  },

  // Customer
  {
    name: 'Mis Pólizas',
    href: '/customer/policies',
    icon: FileText,
    roles: ['customer'],
    description: 'Mis pólizas de seguro',
  },
  {
    name: 'Mis Cotizaciones',
    href: '/customer/quotes',
    icon: Calculator,
    roles: ['customer'],
    description: 'Mis cotizaciones de seguro',
  },
  {
    name: 'Mis Reclamaciones',
    href: '/customer/claims',
    icon: AlertTriangle,
    roles: ['customer'],
    description: 'Mis reclamos',
  },
  {
    name: 'Mis Vehículos',
    href: '/customer/vehicles',
    icon: Car,
    roles: ['customer'],
    description: 'Mis vehículos',
  },
  {
    name: 'Nueva Cotización',
    href: '/customer/quote',
    icon: Calculator,
    roles: ['customer'],
    description: 'Solicitar cotización',
  },
  {
    name: 'Pagos',
    href: '/customer/payments',
    icon: CreditCard,
    roles: ['customer'],
    description: 'Historial de pagos',
  },
  {
    name: 'Comunicaciones',
    href: '/customer/communications',
    icon: MessageSquare,
    roles: ['customer'],
    description: 'Mensajes y notificaciones',
  },

  // Admin - Gestión Avanzada
  {
    name: 'Renovaciones',
    href: '/admin/renewals',
    icon: RefreshCw,
    roles: ['admin', 'agent'],
    description: 'Sistema de renovación automática',
  },

  // Funcionalidades comunes para todos los usuarios
  {
    name: 'Notificaciones',
    href: '/notifications',
    icon: Bell,
    roles: ['admin', 'agent', 'adjuster', 'customer'],
    description: 'Centro de notificaciones',
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'agent', 'adjuster', 'customer'],
    description: 'Configuración de cuenta',
  },

  // Adjuster
  {
    name: 'Evaluaciones',
    href: '/adjuster/assessments',
    icon: ClipboardList,
    roles: ['adjuster'],
    description: 'Evaluaciones de daños',
  },
  {
    name: 'Mis Casos',
    href: '/adjuster/cases',
    icon: AlertTriangle,
    roles: ['adjuster'],
    description: 'Casos asignados',
  },
];

export const RoleBasedSidebar = memo(function RoleBasedSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { userProfile } = useAuth();

  // Filtrar navegación basada en el rol del usuario
  const filteredNavigation = useMemo(
    () =>
      navigationItems.filter(item => userProfile?.role && item.roles.includes(userProfile.role)),
    [userProfile?.role]
  );

  // Prefetch de rutas más usadas para carga instantánea
  const routesToPrefetch = useMemo(() => {
    return filteredNavigation.slice(0, 5).map(item => item.href);
  }, [filteredNavigation]);

  usePrefetchRoutes(routesToPrefetch);

  // Agrupar elementos por categorías
  const groupedNavigation = useMemo(
    () => ({
      main: filteredNavigation.filter(item =>
        [
          'Dashboard',
          'Mis Pólizas',
          'Pólizas',
          'Mis Cotizaciones',
          'Cotizaciones',
          'Mis Reclamaciones',
          'Reclamaciones',
        ].includes(item.name)
      ),
      management: filteredNavigation.filter(item =>
        ['Clientes', 'Mis Vehículos', 'Evaluación de Riesgo', 'Evaluaciones', 'Mis Casos'].includes(
          item.name
        )
      ),
      tools: filteredNavigation.filter(item =>
        ['Nueva Cotización', 'Documentos', 'Pagos', 'Comunicaciones'].includes(item.name)
      ),
      reports: filteredNavigation.filter(item =>
        ['Análisis', 'Reportes Avanzados'].includes(item.name)
      ),
      admin: filteredNavigation.filter(item =>
        ['Auditoría', 'Renovaciones'].includes(item.name)
      ),
      
      common: filteredNavigation.filter(item =>
        ['Notificaciones', 'Configuración'].includes(item.name)
      ),
    }),
    [filteredNavigation]
  );

  const getRoleDisplayName = useMemo(
    () => (role: string) => {
      const roleNames = {
        admin: 'Administrador',
        agent: 'Agente',
        adjuster: 'Ajustador',
        customer: 'Cliente',
      };
      return roleNames[role as keyof typeof roleNames] || role;
    },
    []
  );

  const getRoleColor = useMemo(
    () => (role: string) => {
      const roleColors = {
        admin: 'text-red-600',
        agent: 'text-blue-400 dark:text-blue-300',
        adjuster: 'text-green-600',
        customer: 'text-purple-600 dark:text-purple-200',
      };
      return roleColors[role as keyof typeof roleColors] || 'text-gray-600';
    },
    []
  );

  const renderNavigationGroup = (items: NavigationItem[], title?: string) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        {title && (
          <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {title}
          </h3>
        )}
        <ul className="space-y-1">
          {items.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.name}>
                <OptimizedLink
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors group',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span
                    className="flex items-center w-full"
                    onClick={() => setIsOpen(false)}
                    title={item.description}
                  >
                    <item.icon className="mr-3 h-5 w-5 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </span>
                </OptimizedLink>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-center h-16 border-b border-border px-4">
          <Shield className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold">SeguraTuAuto</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* User Info */}
        {userProfile && (
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userProfile.first_name} {userProfile.last_name}
                </p>
                <p className={cn('text-xs truncate', getRoleColor(userProfile.role))}>
                  {getRoleDisplayName(userProfile.role)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {renderNavigationGroup(groupedNavigation.main, 'Principal')}
          {renderNavigationGroup(groupedNavigation.management, 'Gestión')}
          {renderNavigationGroup(groupedNavigation.tools, 'Herramientas')}
          {renderNavigationGroup(groupedNavigation.reports, 'Reportes')}
          {renderNavigationGroup(groupedNavigation.admin, 'Administración')}
          {renderNavigationGroup(groupedNavigation.common, 'General')}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <LogoutButton
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            showIcon={true}
            iconOnly={false}
          />
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
});
