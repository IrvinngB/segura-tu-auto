'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Bell, 
  FileText, 
  Clock, 
  User, 
  Calculator, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type NotificationType = 'claim' | 'quote' | 'document' | 'message' | 'system' | 'cancellation';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  subDetail?: string;
  status?: string;
  priority?: string;
  created_at: string;
  link: string;
  read: boolean;
  metadata?: any;
}

export function AgentNotificationSystem() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const notificationRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!userProfile || !['agent', 'adjuster', 'admin'].includes(userProfile.role)) {
      return;
    }

    // Cargar notificaciones iniciales
    loadNotifications();

    // Configurar suscripción en tiempo real
    const channel = supabase
      .channel('agent-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claims' },
        (payload) => handleNewClaim(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'claims' },
        (payload) => handleClaimUpdate(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quotes' },
        (payload) => handleNewQuote(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communications' },
        (payload) => handleNewCommunication(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communications' },
        (payload) => handleNewCommunication(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'policy_cancellation_requests' },
        (payload) => handleNewCancellationRequest(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Cargar IDs leídos del almacenamiento local
  const getReadNotificationIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('read_notifications');
    return stored ? JSON.parse(stored) : [];
  };

  // Guardar ID como leído
  const markIdAsRead = (id: string) => {
    const current = getReadNotificationIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem('read_notifications', JSON.stringify(updated));
    }
  };

  // Guardar múltiples IDs como leídos
  const markIdsAsRead = (ids: string[]) => {
    const current = getReadNotificationIds();
    const newIds = ids.filter(id => !current.includes(id));
    if (newIds.length > 0) {
      const updated = [...current, ...newIds];
      localStorage.setItem('read_notifications', JSON.stringify(updated));
    }
  };

  const loadNotifications = async () => {
    try {
      const allNotifications: NotificationItem[] = [];
      const readIds = getReadNotificationIds();

      // 1. Fetch Claims (Submitted or Assigned)
      const { data: claims } = await supabase
        .from('claims')
        .select(`
          id, claim_number, claim_type, priority, status, created_at, customer_id,
          customer:customers(user:users(first_name, last_name))
        `)
        .or(`status.eq.submitted,adjuster_id.eq.${userProfile?.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (claims) {
        claims.forEach((claim: any) => {
          // Solo mostrar si no está cerrada o rechazada (opcional, depende de reglas de negocio)
          if (['closed', 'rejected', 'paid'].includes(claim.status)) return;
          
          // Check if read locally OR via status
          const isRead = readIds.includes(claim.id) || (claim.status !== 'submitted' && claim.status !== 'assigned');

          allNotifications.push({
            id: claim.id,
            type: 'claim',
            title: `Reclamación ${claim.claim_number}`,
            detail: `${claim.customer?.user?.first_name || ''} ${claim.customer?.user?.last_name || ''}`.trim(),
            subDetail: claim.claim_type,
            status: claim.status,
            priority: claim.priority,
            created_at: claim.created_at,
            link: `/claims/${claim.id}`,
            read: isRead,
            metadata: { 
                customerId: claim.customer_id,
                claimNumber: claim.claim_number
            }
          });
        });
      }

      // 2. Fetch Quotes (Pending)
      const { data: quotes } = await supabase
        .from('quotes')
        .select(`
          id, quote_number, policy_type, status, created_at, premium_amount,
          customer:customers(user:users(first_name, last_name))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);

      if (quotes) {
        quotes.forEach((quote: any) => {
          allNotifications.push({
            id: quote.id,
            type: 'quote',
            title: `Cotización ${quote.quote_number}`,
            detail: `${quote.customer?.user?.first_name || ''} ${quote.customer?.user?.last_name || ''}`.trim(),
            subDetail: `$${quote.premium_amount?.toLocaleString()} - ${quote.policy_type}`,
            status: quote.status,
            created_at: quote.created_at,
            link: `/quotes`, 
            read: readIds.includes(quote.id),
            metadata: { quoteId: quote.id }
          });
        });
      }

      // 3. Fetch Communications (Inbound)
      const { data: communications } = await supabase
        .from('communications')
        .select(`
          id, subject, created_at, claim_id, direction,
          claim:claims(claim_number)
        `)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (communications) {
         communications.forEach((comm: any) => {
            const isRecent = new Date(comm.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
            if (isRecent) {
                allNotifications.push({
                    id: comm.id,
                    type: 'message',
                    title: comm.subject || 'Nuevo Mensaje',
                    detail: comm.claim?.claim_number ? `Ref: ${comm.claim.claim_number}` : 'Sin referencia',
                    created_at: comm.created_at,
                    link: comm.claim_id ? `/claims/${comm.claim_id}?tab=communications` : '#',
                    read: readIds.includes(comm.id)
                });
            }
         });
      }

      // 4. Fetch Cancellation Requests (Pending)
      const { data: cancellations } = await supabase
        .from('policy_cancellation_requests')
        .select(`
          id, created_at, status, policy_id,
          policy:policies(policy_number),
          customer:customers(user:users(first_name, last_name))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (cancellations) {
        cancellations.forEach((req: any) => {
            allNotifications.push({
                id: req.id,
                type: 'cancellation',
                title: `Solicitud de cancelación – Póliza ${req.policy?.policy_number || 'Sin número'}`,
                detail: `${req.customer?.user?.first_name || ''} ${req.customer?.user?.last_name || ''}`.trim(),
                subDetail: format(new Date(req.created_at), "d MMM, h:mm a", { locale: es }),
                status: req.status,
                created_at: req.created_at,
                link: '/policies?tab=cancellations', // Asumiendo que existe esta ruta/tab
                read: readIds.includes(req.id)
            });
        });
      }

      // Ordenar por fecha
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Handlers para tiempo real
  const handleNewClaim = async (newClaim: any) => {
    toast.info(`Nueva reclamación recibida: ${newClaim.claim_number || 'Sin número'}`);
    loadNotifications();
    await tryAutoAssignment(newClaim.id);
  };

  const handleClaimUpdate = (updatedClaim: any) => {
    // Solo recargar si cambia algo relevante
    loadNotifications();
  };

  const handleNewQuote = (newQuote: any) => {
    toast.info(`Nueva cotización recibida: ${newQuote.quote_number || 'Sin número'}`);
    loadNotifications();
  };

  const handleNewCommunication = (newComm: any) => {
    if (newComm.direction === 'inbound') {
        toast.info('Nuevo mensaje recibido');
        loadNotifications();
    }
  };

  const handleNewCancellationRequest = (newRequest: any) => {
    toast.warning('Nueva solicitud de cancelación recibida');
    loadNotifications();
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

  const handleNotificationClick = async (notification: NotificationItem) => {
    // 1. Marcar como leída (Visualmente y en DB si es posible)
    // Para Claims, si está en 'submitted', la pasamos a 'under_review' (lógica existente)
    console.log('🔔 Notification clicked:', notification);
    console.log('🔔 Metadata:', notification.metadata);
    
    if (notification.type === 'claim' && notification.status === 'submitted') {
        try {
            // 1. Obtener detalles actualizados de la reclamación para tener el customer_id
            const { data: claimData, error: claimError } = await supabase
                .from('claims')
                .select('customer_id, claim_number')
                .eq('id', notification.id)
                .single();

            if (claimError) {
                console.error('Error fetching claim details:', claimError);
            }

            // 2. Actualizar estado
            await supabase.from('claims').update({ status: 'under_review' }).eq('id', notification.id);
            
            // 3. Notificar al cliente
            const customerId = claimData?.customer_id || notification.metadata?.customerId;
            const claimNumber = claimData?.claim_number || notification.metadata?.claimNumber;

            if (customerId) {
                console.log('🔔 Sending notification to customer:', customerId);
                const content = `Tu reclamación ${claimNumber || ''} está siendo revisada por nuestro equipo.`;
                
                const { error: commError } = await supabase.from('communications').insert({
                    customer_id: customerId,
                    claim_id: notification.id,
                    subject: 'Estado de Reclamación Actualizado',
                    content: content,
                    communication_type: 'email',
                    direction: 'outbound',
                    status: 'unread',
                    created_at: new Date().toISOString()
                });
                
                if (commError) {
                    console.error('❌ Error sending communication:', commError);
                    toast.error('Error al notificar al cliente');
                } else {
                    console.log('✅ Notificación enviada al cliente por cambio de estado automático');
                    toast.success('Cliente notificado del cambio de estado');
                }
            } else {
                console.warn('⚠️ No customerId found, cannot notify customer');
                toast.warning('No se pudo notificar al cliente (ID no encontrado)');
            }
        } catch (e) {
            console.error('Error updating claim status or notifying customer:', e);
            toast.error('Error al actualizar estado o notificar');
        }
    }

    // Persistir lectura localmente
    markIdAsRead(notification.id);

    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    setShowNotifications(false);

    // Lógica de redirección específica solicitada
    const isAgent = userProfile?.role === 'agent';
    const isCancellationRequest = notification.type === 'cancellation';

    if (isAgent && isCancellationRequest) {
        console.log("Redirigiendo agente a solicitudes de cancelación");
        router.push('/agent/requests');
        return;
    }

    // Navegar (Resto de la lógica)
    if (notification.type === 'quote') {
        router.push('/quotes');
    } else if (notification.type === 'cancellation') {
        // Fallback para otros roles (ej. admin)
        router.push('/policies'); 
    } else {
        router.push(notification.link);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    // Persistir todos los IDs actuales como leídos
    const allIds = notifications.map(n => n.id);
    markIdsAsRead(allIds);
    
    // También intentar actualizar backend para claims
    const claimIds = notifications.filter(n => n.type === 'claim' && !n.read).map(n => n.id);
    
    if (claimIds.length > 0) {
        try {
            await supabase.from('claims').update({ status: 'under_review' }).in('id', claimIds);
        } catch (e) {
            console.error("Error marking claims as read", e);
        }
    }

    toast.success('Todas las notificaciones marcadas como leídas');
  };

  const removeNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Recalcular unread
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority || '';
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'claim': return 'Reclamación';
      case 'quote': return 'Cotización';
      case 'message': return 'Mensaje';
      case 'document': return 'Documento';
      case 'system': return 'Sistema';
      case 'cancellation': return 'Cancelación';
      default: return type;
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'claim': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'quote': return <Calculator className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'cancellation': return <X className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(n => n.type === activeTab || (activeTab === 'document' && n.type === 'document') || (activeTab === 'message' && n.type === 'message') || (activeTab === 'cancellation' && n.type === 'cancellation'));
  };

  const filteredNotifications = getFilteredNotifications();

  if (!userProfile || !['agent', 'adjuster', 'admin'].includes(userProfile.role)) {
    return null;
  }

  return (
    <div className="relative" ref={notificationRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background" />
        )}
      </Button>

      {showNotifications && (
        <Card className="absolute right-0 top-12 w-[90vw] sm:w-[650px] max-h-[600px] z-50 shadow-xl border-border animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
                {unreadCount > 0 && <Badge variant="secondary" className="ml-2">{unreadCount} nuevas</Badge>}
              </CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                  Marcar leídas
                </Button>
              )}
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-5 h-8">
                <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
                <TabsTrigger value="claim" className="text-xs">Reclamos</TabsTrigger>
                <TabsTrigger value="quote" className="text-xs">Cotizaciones</TabsTrigger>
                <TabsTrigger value="message" className="text-xs">Mensajes</TabsTrigger>
                <TabsTrigger value="cancellation" className="text-xs">Cancelaciones</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[420px] notification-scroll-area">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="bg-muted/50 p-3 rounded-full mb-3">
                    <Bell className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No hay notificaciones</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeTab !== 'all' ? 'No hay notificaciones en esta categoría' : 'Estás al día con todo'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-2 pr-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] ${
                        !notification.read 
                          ? 'bg-[#E5F1FF] dark:bg-[#111827] border-[#7DD321] shadow-[0_0_15px_rgba(125,211,33,0.15)]' 
                          : 'bg-[#F8FAFC] dark:bg-[#141B2B] border-gray-200 dark:border-gray-800 opacity-80 hover:opacity-100'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Main Content */}
                      <div className={`flex flex-1 flex-col gap-1.5 min-w-0`}>
                        <div className="flex items-center gap-2">
                          <div className="shrink-0 mt-0.5">
                            {getIcon(notification.type)}
                          </div>
                          <p className={`text-sm leading-tight ${!notification.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                        </div>
                        
                        <div className="pl-6 flex flex-col gap-1">
                          <p className={`text-xs line-clamp-2 ${!notification.read ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                            {notification.detail}
                          </p>
                          {notification.subDetail && (
                            <p className="text-xs text-muted-foreground/80 truncate">
                              {notification.subDetail}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-background/50">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {notification.priority && (
                              <Badge 
                                variant="secondary" 
                                className={`text-[10px] h-5 px-1.5 font-normal ${
                                  notification.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                  notification.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                  notification.priority === 'low' ? 'bg-[#7DD321]/20 text-green-800 dark:text-green-300' : ''
                                }`}
                              >
                                {getPriorityLabel(notification.priority)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meta: Badge, Date & Actions */}
                      <div className="flex shrink-0 flex-col items-end gap-1.5 pl-2">
                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                          !notification.read 
                            ? 'bg-[#7DD321] text-white shadow-sm' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {!notification.read ? 'No leído' : 'Leído'}
                        </span>

                        <span className={`text-[10px] whitespace-nowrap font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {format(new Date(notification.created_at), "d MMM, h:mm a", { locale: es })}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
                          onClick={(e) => removeNotification(e, notification.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
