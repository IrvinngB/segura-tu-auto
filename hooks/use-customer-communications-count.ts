'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

export function useCustomerCommunicationsCount(customerId?: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();
  
  // Tracking de navegación para saber si ya visitó comunicaciones antes
  const hasVisitedCommunications = useRef(false);
  const lastPathname = useRef<string>('');

  const fetchUnreadCount = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Contar comunicaciones no leídas (status != 'read')
      const { count: unreadCount, error } = await supabase
        .from('communications')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('direction', 'outbound') // Solo las que vienen de la empresa
        .neq('status', 'read'); // No leídas

      if (error) {
        console.error('Error fetching unread communications count:', error);
        setCount(0);
      } else {
        console.log('📊 Conteo actualizado de comunicaciones no leídas:', unreadCount);
        setCount(unreadCount || 0);
      }
    } catch (error) {
      console.error('Error in fetchUnreadCount:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    fetchUnreadCount();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`customer-communications-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'communications',
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          console.log('💬 Communication change detected:', payload);
          
          // Refrescar el conteo cuando hay cambios
          fetchUnreadCount();
        }
      )
      .subscribe();

    // REMOVIDO: Ya no escuchamos eventos agresivos de forzado
    // Solo el sistema de re-entrada maneja el marcado como leído

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, supabase]);

  // Efecto para tracking de navegación - solo marcar como leído en re-visitas
  useEffect(() => {
    const currentPath = pathname;
    const prevPath = lastPathname.current;
    
    console.log('🚶‍♂️ Navegación detectada:', { prevPath, currentPath, hasVisited: hasVisitedCommunications.current });
    
    // Si está en comunicaciones
    if (currentPath === '/customer/communications' && customerId) {
      // Si ya había visitado comunicaciones antes (re-entrada)
      if (hasVisitedCommunications.current && prevPath !== '/customer/communications') {
        console.log('🔄 RE-ENTRADA a comunicaciones detectada - marcando como leído');
        setCount(0);
        setLoading(false);
        
        // Marcar como leídas solo en re-entrada
        const markAsRead = async () => {
          try {
            await supabase
              .from('communications')
              .update({ status: 'read' })
              .eq('customer_id', customerId)
              .eq('direction', 'outbound')
              .neq('status', 'read');
            
            console.log('✅ Comunicaciones marcadas como leídas en re-entrada');
          } catch (error) {
            console.error('❌ Error marcando como leídas en re-entrada:', error);
          }
        };
        
        markAsRead();
      } else if (!hasVisitedCommunications.current) {
        // Primera visita - solo marcar que ya visitó, pero NO cambiar el estado
        console.log('👋 PRIMERA VISITA a comunicaciones - manteniendo estado original');
        hasVisitedCommunications.current = true;
      }
    }
    
    // Actualizar el path anterior
    lastPathname.current = currentPath;
  }, [pathname, customerId, supabase]);

  const refreshCount = () => {
    if (customerId) {
      fetchUnreadCount();
    }
  };

  return {
    count,
    loading,
    refreshCount,
  };
}