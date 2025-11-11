'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useForceBadgeRefresh() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/customer/communications') {
      console.log('🚫 FORZANDO eliminación de badge por pathname');
      
      // Forzar re-render de todos los componentes que usan comunicaciones
      window.dispatchEvent(new CustomEvent('force-communications-refresh', {
        detail: { pathname, action: 'hide-badge' }
      }));
      
      // También limpiar cualquier cache local
      localStorage.removeItem('unread-communications-cache');
    }
  }, [pathname]);

  return pathname;
}