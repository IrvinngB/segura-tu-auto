'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import type { Claim } from '@/lib/types/database';

interface NotificationData {
  id: string;
  type: 'claim_overdue' | 'claim_urgent' | 'claim_status_change';
  title: string;
  message: string;
  claimId: string;
  isRead: boolean;
  createdAt: string;
}

export function useClaimNotifications() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const canReceiveNotifications =
    userProfile?.role === 'agent' ||
    userProfile?.role === 'adjuster' ||
    userProfile?.role === 'admin';

  useEffect(() => {
    if (canReceiveNotifications) {
      checkForNewNotifications();

      // Verificar cada 5 minutos
      const interval = setInterval(checkForNewNotifications, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [userProfile]);

  const checkForNewNotifications = async () => {
    try {
      // Obtener reclamaciones que requieren atención
      const { data: claims, error } = await supabase
        .from('claims')
        .select(
          `
          *,
          customer:customers(
            *,
            user:users(*)
          )
        `
        )
        .in('status', [
          'submitted',
          'under_review',
          'pending_documentation',
          'waiting_approval',
          'investigating',
        ]);

      if (error) throw error;

      const newNotifications: NotificationData[] = [];
      const now = new Date();

      claims?.forEach(claim => {
        const statusUpdatedAt = new Date(claim.updated_at || claim.created_at);
        const daysInStatus = Math.floor(
          (now.getTime() - statusUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Generar notificaciones según el estado y tiempo
        switch (claim.status) {
          case 'submitted':
            if (daysInStatus > 3) {
              newNotifications.push({
                id: `${claim.id}-submitted-overdue`,
                type: 'claim_urgent',
                title: 'Reclamación sin revisar',
                message: `${claim.claim_number} lleva ${daysInStatus} días sin ser revisada`,
                claimId: claim.id,
                isRead: false,
                createdAt: new Date().toISOString(),
              });
            }
            break;

          case 'under_review':
            if (daysInStatus > 7) {
              newNotifications.push({
                id: `${claim.id}-review-urgent`,
                type: 'claim_urgent',
                title: 'Revisión muy atrasada',
                message: `${claim.claim_number} lleva ${daysInStatus} días en revisión`,
                claimId: claim.id,
                isRead: false,
                createdAt: new Date().toISOString(),
              });
            }
            break;

          case 'waiting_approval':
            if (daysInStatus > 5) {
              newNotifications.push({
                id: `${claim.id}-approval-overdue`,
                type: 'claim_overdue',
                title: 'Aprobación pendiente',
                message: `${claim.claim_number} espera aprobación hace ${daysInStatus} días`,
                claimId: claim.id,
                isRead: false,
                createdAt: new Date().toISOString(),
              });
            }
            break;

          case 'pending_documentation':
            if (daysInStatus > 14) {
              newNotifications.push({
                id: `${claim.id}-docs-urgent`,
                type: 'claim_urgent',
                title: 'Documentos pendientes críticos',
                message: `${claim.claim_number} lleva ${daysInStatus} días esperando documentos`,
                claimId: claim.id,
                isRead: false,
                createdAt: new Date().toISOString(),
              });
            }
            break;
        }
      });

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    setUnreadCount(0);
  };

  const getNotificationsByType = (type: NotificationData['type']) => {
    return notifications.filter(notification => notification.type === type);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getNotificationsByType,
    refreshNotifications: checkForNewNotifications,
  };
}
