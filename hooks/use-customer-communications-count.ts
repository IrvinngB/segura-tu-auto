'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useCustomerCommunicationsCount(customerId?: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
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
          setCount(unreadCount || 0);
        }
      } catch (error) {
        console.error('Error in fetchUnreadCount:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, supabase]);

  return {
    count,
    loading,
  };
}