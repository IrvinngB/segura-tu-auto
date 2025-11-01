'use client';

import { useState, useMemo, memo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  description?: string;
}

const adminNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Panel principal' },
  {
    name: 'Panel Admin',
    href: '/admin',
    icon: Shield,
    description: 'Panel de administración - Crear usuarios',
  },
  { name: 'Clientes', href: '/clients', icon: Users, description: 'Gestión de clientes' },
  {
    name: 'Evaluación de Riesgo',
    href: '/risk-assessment',
    icon: TrendingUp,
    description: 'Evaluación de riesgos',
  },
  { name: 'Análisis', href: '/analytics', icon: BarChart3, description: 'Reportes y análisis' },
];

const agentNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Panel principal' },
  { name: 'Pólizas', href: '/policies', icon: FileText, description: 'Gestión de pólizas' },
  {
    name: 'Cotizaciones',
    href: '/quotes',
    icon: Calculator,
    description: 'Gestión de cotizaciones',
  },
  {
    name: 'Reclamaciones',
    href: '/claims',
    icon: AlertTriangle,
    description: 'Gestión de reclamos',
  },
  { name: 'Documentos', href: '/documents', icon: Upload, description: 'Gestión de documentos' },
];

const customerNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Panel principal' },
  {
    name: 'Mis Pólizas',
    href: '/customer/policies',
    icon: FileText,
    description: 'Mis pólizas de seguro',
  },
  {
    name: 'Mis Cotizaciones',
    href: '/customer/quotes',
    icon: Calculator,
    description: 'Mis cotizaciones de seguro',
  },
  {
    name: 'Mis Reclamaciones',
    href: '/customer/claims',
    icon: AlertTriangle,
    description: 'Mis reclamos',
  },
  { name: 'Mis Vehículos', href: '/customer/vehicles', icon: Car, description: 'Mis vehículos' },
  {
    name: 'Nueva Cotización',
    href: '/customer/quote',
    icon: Calculator,
    description: 'Solicitar cotización',
  },
  {
    name: 'Pagos',
    href: '/customer/payments',
    icon: CreditCard,
    description: 'Historial de pagos',
  },
  {
    name: 'Comunicaciones',
    href: '/customer/communications',
    icon: MessageSquare,
    description: 'Mensajes y notificaciones',
  },
];

const adjusterNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Panel principal' },
  {
    name: 'Reclamaciones',
    href: '/claims',
    icon: AlertTriangle,
    description: 'Gestión de reclamos',
  },
  {
    name: 'Evaluaciones',
    href: '/adjuster/assessments',
    icon: ClipboardList,
    description: 'Evaluaciones de daños',
  },
  {
    name: 'Mis Casos',
    href: '/adjuster/cases',
    icon: AlertTriangle,
    description: 'Casos asignados',
  },
];

interface SidebarProps {
  navigation: NavigationItem[];
  userProfile: any;
}

const SidebarContent = memo(function SidebarContent({ navigation, userProfile }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const routesToPrefetch = useMemo(() => {
    return navigation.slice(0, 5).map(item => item.href);
  }, [navigation]);

  usePrefetchRoutes(routesToPrefetch);

  const groupedNavigation = useMemo(() => {
    const main = navigation.filter(item =>
      [
        'Dashboard',
        'Panel Admin',
        'Mis Pólizas',
        'Pólizas',
        'Mis Cotizaciones',
        'Cotizaciones',
        'Mis Reclamaciones',
        'Reclamaciones',
      ].includes(item.name)
    );
    const management = navigation.filter(item =>
      ['Clientes', 'Mis Vehículos', 'Evaluación de Riesgo', 'Evaluaciones', 'Mis Casos'].includes(
        item.name
      )
    );
    const tools = navigation.filter(item =>
      ['Nueva Cotización', 'Documentos', 'Pagos', 'Comunicaciones'].includes(item.name)
    );
    const reports = navigation.filter(item => ['Análisis'].includes(item.name));
    return { main, management, tools, reports };
  }, [navigation]);

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      agent: 'Agente',
      adjuster: 'Ajustador',
      customer: 'Cliente',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      admin: 'text-red-600',
      agent: 'text-blue-400 dark:text-blue-300',
      adjuster: 'text-green-600',
      customer: 'text-purple-600 dark:text-purple-200',
    };
    return roleColors[role as keyof typeof roleColors] || 'text-gray-600';
  };

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
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
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
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-center h-16 border-b border-border px-4">
          <Shield className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold">SeguraTuAuto</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {userProfile && (
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
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

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {renderNavigationGroup(groupedNavigation.main, 'Principal')}
          {renderNavigationGroup(groupedNavigation.management, 'Gestión')}
          {renderNavigationGroup(groupedNavigation.tools, 'Herramientas')}
          {renderNavigationGroup(groupedNavigation.reports, 'Reportes')}
        </nav>

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

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
});

export const AdminSidebar = memo(function AdminSidebar({ userProfile }: { userProfile: any }) {
  return <SidebarContent navigation={adminNavigation} userProfile={userProfile} />;
});

export const AgentSidebar = memo(function AgentSidebar({ userProfile }: { userProfile: any }) {
  return <SidebarContent navigation={agentNavigation} userProfile={userProfile} />;
});

export const CustomerSidebar = memo(function CustomerSidebar({
  userProfile,
}: {
  userProfile: any;
}) {
  return <SidebarContent navigation={customerNavigation} userProfile={userProfile} />;
});

export const AdjusterSidebar = memo(function AdjusterSidebar({
  userProfile,
}: {
  userProfile: any;
}) {
  return <SidebarContent navigation={adjusterNavigation} userProfile={userProfile} />;
});
