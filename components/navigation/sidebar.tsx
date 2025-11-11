'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClaimNotifications } from '@/hooks/use-claim-notifications';
import { useDocumentCount } from '@/hooks/use-document-count';
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
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Pólizas', href: '/policies', icon: FileText },
  { name: 'Reclamaciones', href: '/claims', icon: AlertTriangle },
  { name: 'Evaluación de Riesgo', href: '/risk-assessment', icon: TrendingUp },
  { name: 'Documentos', href: '/documents', icon: Upload },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Análisis', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { unreadCount } = useClaimNotifications();
  const { documentCount } = useDocumentCount();
  
  console.log('� SIDEBAR DOCUMENT COUNT:', documentCount);
  console.log('🚨 SIDEBAR RENDERING WITH COUNT:', documentCount);

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
        <div className="flex items-center justify-center h-16 border-b border-border">
          <Shield className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold">SeguraTuAuto</span>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map(item => {
              const isActive = pathname === item.href;
              const showClaimsBadge = item.href === '/claims' && unreadCount > 0;
              const showDocumentsBadge = item.href === '/documents'; // Siempre mostrar para prueba
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    
                    {showClaimsBadge && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-6 w-6 rounded-full text-xs font-bold !flex !items-center !justify-center !p-0 min-w-[24px] leading-none"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                    
                    {showDocumentsBadge && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center bg-orange-500 text-white"
                      >
                        {documentCount > 99 ? '99+' : documentCount}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
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
}
