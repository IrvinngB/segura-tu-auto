'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DocumentRequestNotification {
  id: string;
  claim_id: string;
  claim_number: string;
  requested_documents: string[];
  notes: string;
  created_at: string;
  read: boolean;
}

export function useDocumentRequestNotifications(customerId?: string) {
  const [notifications, setNotifications] = useState<DocumentRequestNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!customerId) return;

    fetchNotifications();

    // Suscripción en tiempo real para nuevas solicitudes de documentos
    const channel = supabase
      .channel('document-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_requests',
          filter: `customer_id=eq.${customerId}`,
        },
        payload => {
          console.log('📄 Nueva solicitud de documentos:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId]);

  const fetchNotifications = async () => {
    if (!customerId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('document_requests')
        .select(
          `
          id,
          claim_id,
          requested_documents,
          notes,
          created_at,
          read,
          claims!inner(
            claim_number
          )
        `
        )
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications = (data || []).map(item => ({
        id: item.id,
        claim_id: item.claim_id,
        claim_number: (item as any).claims?.claim_number || 'N/A',
        requested_documents: item.requested_documents || [],
        notes: item.notes || '',
        created_at: item.created_at,
        read: item.read || false,
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching document request notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('document_requests')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refetch: fetchNotifications,
  };
}
