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

export type NotificationType = 'claim' | 'quote' | 'document' | 'message' | 'system';

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

  const loadNotifications = async () => {
    try {
      const allNotifications: NotificationItem[] = [];

      // 1. Fetch Claims (Submitted or Assigned)
      const { data: claims } = await supabase
        .from('claims')
        .select(`
          id, claim_number, claim_type, priority, status, created_at,
          customer:customers(user:users(first_name, last_name))
        `)
        .or(`status.eq.submitted,adjuster_id.eq.${userProfile?.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (claims) {
        claims.forEach((claim: any) => {
          // Solo mostrar si no está cerrada o rechazada (opcional, depende de reglas de negocio)
          if (['closed', 'rejected', 'paid'].includes(claim.status)) return;

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
            read: claim.status !== 'submitted' && claim.status !== 'assigned', // Lógica aproximada
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
            link: `/quotes`, // Idealmente abriría el modal de esa cotización
            read: false,
            metadata: { quoteId: quote.id }
          });
        });
      }

      // 3. Fetch Communications (Inbound, Unread - Simulado por ahora si no hay campo read)
      // Asumiremos que traemos los últimos inbound
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
            // Filtrar muy antiguos para no llenar de basura si no hay estado 'read'
            const isRecent = new Date(comm.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
            if (isRecent) {
                allNotifications.push({
                    id: comm.id,
                    type: 'message',
                    title: comm.subject || 'Nuevo Mensaje',
                    detail: comm.claim?.claim_number ? `Ref: ${comm.claim.claim_number}` : 'Sin referencia',
                    created_at: comm.created_at,
                    link: comm.claim_id ? `/claims/${comm.claim_id}?tab=communications` : '#',
                    read: false // Difícil saber sin campo específico
                });
            }
         });
      }

      // Ordenar por fecha
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      // Calcular unread (simulado para algunos tipos)
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
    // Marcar como leída (Visualmente y en DB si es posible)
    // Para Claims, si está en 'submitted', la pasamos a 'under_review' (lógica existente)
    if (notification.type === 'claim' && notification.status === 'submitted') {
        try {
            await supabase.from('claims').update({ status: 'under_review' }).eq('id', notification.id);
        } catch (e) {
            console.error(e);
        }
    }

    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    setShowNotifications(false);

    // Navegar
    if (notification.type === 'quote') {
        // Para cotizaciones, vamos a la página de cotizaciones
        // Podríamos pasar un query param para abrir el modal automáticamente
        router.push('/quotes');
    } else {
        router.push(notification.link);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
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

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'claim': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'quote': return <Calculator className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(n => n.type === activeTab || (activeTab === 'document' && n.type === 'document') || (activeTab === 'message' && n.type === 'message'));
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
        <Card className="absolute right-0 top-12 w-[400px] max-h-[600px] z-50 shadow-xl border-border animate-in fade-in zoom-in-95 duration-200">
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
              <TabsList className="grid w-full grid-cols-4 h-8">
                <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
                <TabsTrigger value="claim" className="text-xs">Reclamos</TabsTrigger>
                <TabsTrigger value="quote" className="text-xs">Coti</TabsTrigger>
                <TabsTrigger value="message" className="text-xs">Msjes</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
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
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {format(new Date(notification.created_at), 'dd MMM HH:mm', { locale: es })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {notification.detail}
                          </p>
                          {notification.subDetail && (
                            <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
                              {notification.subDetail}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                              {notification.type === 'claim' ? 'Reclamación' : 
                               notification.type === 'quote' ? 'Cotización' : 
                               notification.type === 'message' ? 'Mensaje' : 'Sistema'}
                            </Badge>
                            {notification.priority && (
                              <Badge 
                                variant="secondary" 
                                className={`text-[10px] h-5 px-1.5 font-normal ${
                                  notification.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''
                                }`}
                              >
                                {notification.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                          onClick={(e) => removeNotification(e, notification.id)}
                        >
                          <X className="h-3 w-3" />
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
