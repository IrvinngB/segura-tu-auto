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

    // Escuchar evento de lectura manual (ej: al eliminar mensajes)
    const handleManualRead = () => {
        console.log('📢 Evento communications-read recibido - actualizando conteo');
        fetchUnreadCount();
    };

    window.addEventListener('communications-read', handleManualRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('communications-read', handleManualRead);
    };
  }, [customerId, supabase]);

  // Efecto para tracking de navegación - marcar como leído al SALIR de comunicaciones
  useEffect(() => {
    const currentPath = pathname;
    const prevPath = lastPathname.current;
    
    // Si estamos saliendo de comunicaciones hacia otra página
    if (prevPath === '/customer/communications' && currentPath !== '/customer/communications' && customerId) {
        console.log('👋 SALIENDO de comunicaciones - marcando mensajes como leídos');
        
        const markAsRead = async () => {
          try {
            await supabase
              .from('communications')
              .update({ status: 'read' })
              .eq('customer_id', customerId)
              .eq('direction', 'outbound')
              .neq('status', 'read');
            
            console.log('✅ Comunicaciones marcadas como leídas al salir');
            // Actualizar conteo localmente a 0
            setCount(0);
          } catch (error) {
            console.error('❌ Error marcando como leídas al salir:', error);
          }
        };
        
        markAsRead();
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