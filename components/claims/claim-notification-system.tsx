'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { Bell, FileText, Clock, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ClaimNotification {
  id: string;
  claim_number: string;
  customer_name: string;
  claim_type: string;
  priority: string;
  created_at: string;
  status: string;
}

export function ClaimNotificationSystem() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<ClaimNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userProfile || !['agent', 'adjuster', 'admin'].includes(userProfile.role)) {
      return;
    }

    // Cargar notificaciones iniciales
    loadNotifications();

    // Configurar suscripción en tiempo real para nuevas reclamaciones y comunicaciones
    const channel = supabase
      .channel('new-claims-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'claims',
        },
        payload => {
          console.log('🔔 Nueva reclamación detectada:', payload);
          handleNewClaim(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'claims',
        },
        payload => {
          console.log('📝 Reclamación actualizada:', payload);
          handleClaimUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications',
        },
        payload => {
          console.log('💬 Nueva comunicación/evidencia:', payload);
          handleNewCommunication(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  // Efecto para cerrar el modal al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const loadNotifications = async () => {
    try {
      const { data: claims, error } = await supabase
        .from('claims')
        .select(
          `
          id,
          claim_number,
          claim_type,
          priority,
          status,
          created_at,
          customer:customers(
            user:users(first_name, last_name)
          )
        `
        )
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedNotifications =
        claims?.map((claim: any) => ({
          id: claim.id,
          claim_number: claim.claim_number,
          customer_name:
            `${claim.customer?.user?.first_name || ''} ${claim.customer?.user?.last_name || ''}`.trim(),
          claim_type: claim.claim_type,
          priority: claim.priority,
          created_at: claim.created_at,
          status: claim.status,
        })) || [];

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNewClaim = async (newClaim: any) => {
    try {
      // Obtener datos completos de la nueva reclamación
      const { data: claimData, error } = await supabase
        .from('claims')
        .select(
          `
          id,
          claim_number,
          claim_type,
          priority,
          status,
          created_at,
          customer:customers(
            user:users(first_name, last_name)
          )
        `
        )
        .eq('id', newClaim.id)
        .single();

      if (error) throw error;

      const notification: ClaimNotification = {
        id: (claimData as any).id,
        claim_number: (claimData as any).claim_number,
        customer_name:
          `${(claimData as any).customer?.user?.first_name || ''} ${(claimData as any).customer?.user?.last_name || ''}`.trim(),
        claim_type: (claimData as any).claim_type,
        priority: (claimData as any).priority,
        created_at: (claimData as any).created_at,
        status: (claimData as any).status,
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Mostrar notificación toast
      toast.success(`Nueva reclamación: ${notification.claim_number}`, {
        description: `Cliente: ${notification.customer_name} - Tipo: ${notification.claim_type}`,
        duration: 5000,
      });

      // Intentar asignación automática
      await tryAutoAssignment(newClaim.id);
    } catch (error) {
      console.error('Error handling new claim:', error);
    }
  };

  const handleClaimUpdate = (updatedClaim: any) => {
    setNotifications(prev =>
      prev
        .map(notification =>
          notification.id === updatedClaim.id
            ? { ...notification, status: updatedClaim.status }
            : notification
        )
        .filter(notification => notification.status === 'submitted')
    );
  };

  const handleNewCommunication = async (newCommunication: any) => {
    try {
      // Solo notificar si es una comunicación de evidencia o archivo adjunto de un cliente
      if (
        newCommunication.direction === 'inbound' &&
        (newCommunication.attachment_url || newCommunication.subject?.includes('evidencia'))
      ) {
        // Obtener información de la reclamación
        const { data: claimData, error } = await supabase
          .from('claims')
          .select(
            `
            id,
            claim_number,
            claim_type,
            customer:customers(
              user:users(first_name, last_name)
            )
          `
          )
          .eq('id', newCommunication.claim_id)
          .single();

        if (error) throw error;

        // Crear notificación visual temporal
        toast.success(`📸 Nueva evidencia recibida en ${claimData.claim_number}`, {
          duration: 5000,
          action: {
            label: 'Ver',
            onClick: () => (window.location.href = `/claims/${claimData.id}`),
          },
        });

        // Incrementar contador de no leídas
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling new communication:', error);
    }
  };

  const tryAutoAssignment = async (claimId: string) => {
    try {
      // Buscar agentes disponibles (con menos carga de trabajo)
      const { data: agents, error: agentsError } = await supabase
        .from('users')
        .select(
          `
          id,
          first_name,
          last_name,
          claims_assigned:claims!adjuster_id(count)
        `
        )
        .eq('role', 'agent')
        .eq('is_active', true);

      if (agentsError) throw agentsError;

      if (agents && agents.length > 0) {
        // Encontrar el agente con menos reclamaciones asignadas
        const availableAgent = agents.reduce((prev, current) =>
          (prev.claims_assigned?.length || 0) < (current.claims_assigned?.length || 0)
            ? prev
            : current
        );

        // Asignar la reclamación al agente
        const { error: assignError } = await supabase
          .from('claims')
          .update({
            adjuster_id: availableAgent.id,
            status: 'under_review',
          })
          .eq('id', claimId);

        if (assignError) throw assignError;

        console.log(
          `✅ Reclamación ${claimId} asignada automáticamente a ${availableAgent.first_name} ${availableAgent.last_name}`
        );

        // Notificar al agente asignado si no es el usuario actual
        if (availableAgent.id !== userProfile?.id) {
          toast.info(
            `Reclamación asignada automáticamente a ${availableAgent.first_name} ${availableAgent.last_name}`
          );
        }
      }
    } catch (error) {
      console.error('Error in auto assignment:', error);
    }
  };

  const markAsRead = async (claimId: string) => {
    try {
      // Actualizar el estado de la reclamación en la base de datos
      const { error } = await supabase
        .from('claims')
        .update({
          status: 'under_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (error) throw error;

      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== claimId));
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast.success('Reclamación marcada como leída', {
        description: 'El estado ha sido actualizado a "En Revisión"',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leído');
    }
  };

  const markAllAsRead = async () => {
    try {
      const claimIds = notifications.map(n => n.id);

      if (claimIds.length === 0) return;

      // Actualizar todas las reclamaciones en la base de datos
      const { error } = await supabase
        .from('claims')
        .update({
          status: 'under_review',
          updated_at: new Date().toISOString(),
        })
        .in('id', claimIds);

      if (error) throw error;

      // Limpiar estado local
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false); // Cerrar el panel

      toast.success('Todas las notificaciones marcadas como leídas', {
        description: `${claimIds.length} reclamaciones actualizadas`,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Media';
    }
  };

  if (!userProfile || !['agent', 'adjuster', 'admin'].includes(userProfile.role)) {
    return null;
  }

  return (
    <div className="relative" ref={notificationRef}>
      {/* Botón de notificaciones */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel de notificaciones */}
      {showNotifications && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto z-50 shadow-lg border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4" />
              Nuevas Reclamaciones ({unreadCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay reclamaciones pendientes
              </p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-sm truncate">
                          {notification.claim_number}
                        </span>
                        <Badge
                          className={`${getPriorityColor(notification.priority)} text-white text-xs`}
                        >
                          {getPriorityLabel(notification.priority)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{notification.customer_name}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <span>{notification.claim_type}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                      title="Marcar como leído"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))
            )}

            {notifications.length > 0 && (
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="w-full text-xs"
                >
                  Marcar todas como leídas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
