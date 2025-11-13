'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import type { Claim } from '@/lib/types/database';
import { Search, Eye, FileText, Calendar, AlertTriangle, Clock, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClaimListProps {
  customerId?: string;
  policyId?: string;
  onViewClaim?: (claim: Claim) => void;
  onEditClaim?: (claim: Claim) => void;
}

export function ClaimList({ customerId, policyId, onViewClaim, onEditClaim }: ClaimListProps) {
  const { userProfile } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    fetchClaims();
  }, [customerId, policyId]);

  useEffect(() => {
    filterClaims();
  }, [claims, searchTerm, statusFilter, typeFilter, priorityFilter]);

  // Detectar cuando la página vuelve a tener foco después de navegar
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 CLAIM LIST - Página enfocada, refrescando...');
      fetchClaims();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 CLAIM LIST - Página visible, refrescando...');
        fetchClaims();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!userProfile) return;

    console.log('⚡ Configurando auto-refresh cada 30 segundos...');
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh de reclamaciones...');
      fetchClaims();
    }, 30000); // 30 segundos

    return () => {
      console.log('🔌 Desconectando auto-refresh');
      clearInterval(interval);
    };
  }, [customerId, policyId, userProfile]);

  // Suscripción en tiempo real a cambios en reclamaciones
  useEffect(() => {
    if (!userProfile) return;

    console.log('🔔 Configurando suscripción en tiempo real para ClaimList...');

    const subscription = supabase
      .channel('claim-list-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'claims',
        },
        payload => {
          console.log('🔔 CLAIM LIST - Cambio detectado:', payload);
          console.log('🔔 CLAIM LIST - Evento:', payload.eventType);
          console.log('🔔 CLAIM LIST - Datos nuevos:', payload.new);
          console.log('🔔 CLAIM LIST - Datos anteriores:', payload.old);

          // Actualizar datos cuando hay cambios con un pequeño delay
          setTimeout(() => {
            console.log('🔄 CLAIM LIST - Refrescando lista de reclamaciones...');
            fetchClaims();
          }, 500);
        }
      )
      .subscribe(status => {
        console.log('📡 CLAIM LIST - Estado de suscripción:', status);
      });

    return () => {
      console.log('🔌 Desconectando suscripción ClaimList');
      subscription.unsubscribe();
    };
  }, [customerId, policyId, userProfile]);

  const fetchClaims = async () => {
    try {
      let query = supabase
        .from('claims')
        .select(
          `
          *,
          policy:policies(
            *,
            vehicle:vehicles(*)
          ),
          customer:customers(
            *,
            user:users(*)
          ),
          adjuster:users(*)
        `
        )
        .order('created_at', { ascending: false });

      // Filtrar según el rol del usuario
      if (customerId) {
        // Para clientes específicos
        query = query.eq('customer_id', customerId);
      }
      // Todos los roles ven todas las reclamaciones - solo cambia la funcionalidad de los botones

      if (policyId) {
        query = query.eq('policy_id', policyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        console.log('📊 CLAIM LIST - Datos obtenidos:', data.length);
        data.forEach(claim => {
          console.log(
            `📊 CLAIM LIST ${claim.claim_number}: status='${claim.status}' -> label será calculado en render`
          );
        });
        setClaims([...data]); // Forzar nuevo array
        setFilteredClaims([...data]); // Forzar nuevo array
        setLastUpdated(new Date());
        setForceRefreshKey(Date.now()); // Forzar re-render completo
        console.log('✅ CLAIM LIST - Claims actualizadas en estado');
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClaims = () => {
    let filtered = claims;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        claim =>
          claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.customer?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.customer?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.policy?.policy_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.incident_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(claim => claim.claim_type === typeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(claim => claim.priority === priorityFilter);
    }

    setFilteredClaims(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: 'Pendiente',
        classes: 'status-badge status-pending',
      },
      submitted: {
        label: 'Enviada',
        classes: 'status-badge status-submitted',
      },
      under_review: {
        label: 'En Revisión',
        classes: 'status-badge status-under-review',
      },
      pending_documentation: {
        label: 'Documentos Pendientes',
        classes: 'status-badge status-pending',
      },
      waiting_approval: {
        label: 'Esperando Aprobación',
        classes: 'status-badge status-waiting',
      },
      investigating: {
        label: 'En Investigación',
        classes: 'status-badge status-investigating',
      },
      approved: {
        label: 'Aprobada',
        classes: 'status-badge status-approved',
      },
      processing_payment: {
        label: 'Procesando Pago',
        classes: 'status-badge status-processing',
      },
      rejected: {
        label: 'Rechazada',
        classes: 'status-badge status-denied',
      },
      denied: {
        label: 'Denegada',
        classes: 'status-badge status-denied',
      },
      closed: {
        label: 'Cerrada',
        classes: 'status-badge status-closed',
      },
      paid: {
        label: 'Pagada',
        classes: 'status-badge status-paid',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      classes: 'status-badge status-submitted',
    };

    console.log(`🏷️ CLAIM LIST - Badge render: status='${status}' -> label='${config.label}'`);
    return <span className={config.classes}>{config.label}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', classes: 'priority-badge priority-low' },
      medium: {
        label: 'Media',
        classes: 'priority-badge priority-medium',
      },
      high: { label: 'Alta', classes: 'priority-badge priority-high' },
      urgent: {
        label: 'Urgente',
        classes: 'priority-badge priority-urgent',
      },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      label: priority,
      classes: 'priority-badge priority-low',
    };
    return <span className={config.classes}>{config.label}</span>;
  };

  const getClaimTypeLabel = (type: string) => {
    // Los tipos en la base de datos ya están en español
    const types = {
      Colisión: 'Colisión',
      Robo: 'Robo',
      Vandalismo: 'Vandalismo',
      Incendio: 'Incendio',
      'Daño por clima': 'Daño por clima',
      'Daño por granizo': 'Daño por granizo',
      Otros: 'Otros',
      // Compatibilidad con valores antiguos en inglés (si existen)
      collision: 'Colisión',
      theft: 'Robo',
      vandalism: 'Vandalismo',
      fire: 'Incendio',
      flood: 'Daño por clima',
      hail: 'Daño por granizo',
      glass: 'Otros',
      other: 'Otros',
    };
    return types[type as keyof typeof types] || type;
  };

  const getDaysOld = (date: string) => {
    const claimDate = new Date(date);
    const now = new Date();
    
    // Comparar solo las fechas (sin horas)
    const claimDateOnly = new Date(claimDate.getFullYear(), claimDate.getMonth(), claimDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowDateOnly.getTime() - claimDateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const getClaimAgeDisplay = (date: string) => {
    const days = getDaysOld(date);
    
    if (days === 0) {
      // Mismo día - no mostrar etiqueta de edad
      return null;
    } else if (days === 1) {
      // Un día - singular
      return '1 día';
    } else {
      // Múltiples días - plural
      return `${days} días`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando reclamaciones...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reclamaciones
            </CardTitle>
            <CardDescription>
              {customerId
                ? 'Reclamaciones del cliente'
                : userProfile?.role === 'agent'
                  ? 'Reclamaciones para gestión administrativa y documentación'
                  : userProfile?.role === 'adjuster'
                    ? 'Reclamaciones para evaluación técnica y aprobación'
                    : 'Gestión completa de reclamaciones'}
              {lastUpdated && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Última actualización: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>

        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente, póliza..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="submitted">Enviada</SelectItem>
              <SelectItem value="under_review">En Revisión</SelectItem>
              <SelectItem value="pending_documentation">Pendiente Documentos</SelectItem>
              <SelectItem value="waiting_approval">Esperando Aprobación</SelectItem>
              <SelectItem value="investigating">Investigando</SelectItem>
              <SelectItem value="approved">Aprobada</SelectItem>
              <SelectItem value="processing_payment">Procesando Pago</SelectItem>
              <SelectItem value="denied">Denegada</SelectItem>
              <SelectItem value="closed">Cerrada</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="Colisión">Colisión</SelectItem>
              <SelectItem value="Robo">Robo</SelectItem>
              <SelectItem value="Vandalismo">Vandalismo</SelectItem>
              <SelectItem value="Incendio">Incendio</SelectItem>
              <SelectItem value="Daño por clima">Daño por clima</SelectItem>
              <SelectItem value="Daño por granizo">Daño por granizo</SelectItem>
              <SelectItem value="Otros">Otros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Claims Table */}
        <div className="rounded-md border" key={forceRefreshKey}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                {!customerId && <TableHead>Cliente</TableHead>}
                <TableHead>Póliza</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Prioridad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={customerId ? 8 : 9} className="text-center py-8">
                    No se encontraron reclamaciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredClaims.map(claim => (
                  <TableRow key={`${claim.id}-${claim.status}-${forceRefreshKey}`}>
                    <TableCell className="font-medium">{claim.claim_number}</TableCell>
                    {!customerId && (
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {claim.customer?.user?.first_name} {claim.customer?.user?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {claim.customer?.user?.email}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <div className="font-medium">{claim.policy?.policy_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {claim.policy?.vehicle?.year} {claim.policy?.vehicle?.make}{' '}
                          {claim.policy?.vehicle?.model}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getClaimTypeLabel(claim.claim_type)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(claim.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {getPriorityBadge(claim.priority)}
                        {claim.injury_involved && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Lesiones
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(claim.incident_date), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                      {getClaimAgeDisplay(claim.created_at) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{getClaimAgeDisplay(claim.created_at)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {claim.estimated_damage_cost && (
                          <div className="flex items-center gap-1">
                            <span>${claim.estimated_damage_cost.toLocaleString()}</span>
                          </div>
                        )}
                        {claim.approved_amount && (
                          <div className="flex items-center gap-1 text-green-600">
                            <span className="text-xs">Aprobado:</span>
                            <span>${claim.approved_amount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewClaim?.(claim)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Botones específicos por rol */}

                        {/* AGENTE: Solo puede procesar estados administrativos */}
                        {userProfile?.role === 'agent' &&
                          [
                            'submitted',
                            'under_review',
                            'pending_documentation',
                            'approved',
                            'processing_payment',
                            'denied',
                          ].includes(claim.status) &&
                          claim.status !== 'paid' &&
                          claim.status !== 'closed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditClaim?.(claim)}
                              title="Gestión Administrativa"
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}

                        {/* AJUSTADOR: Solo puede procesar evaluaciones técnicas */}
                        {userProfile?.role === 'adjuster' &&
                          ['investigating', 'waiting_approval'].includes(claim.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditClaim?.(claim)}
                              title="Evaluación Técnica"
                              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}

                        {/* ADMINISTRADOR: Acceso completo */}
                        {userProfile?.role === 'admin' && claim.status !== 'closed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditClaim?.(claim)}
                            title="Control Total"
                            className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary - Métricas específicas por rol */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Métricas para AGENTES */}
          {userProfile?.role === 'agent' && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'submitted').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Por revisar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {filteredClaims.filter(c => c.status === 'under_review').length}
                  </div>
                  <div className="text-sm text-muted-foreground">En revisión</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'investigating').length}
                  </div>
                  <div className="text-sm text-muted-foreground">En investigación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">
                    {filteredClaims.filter(c => c.status === 'closed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Cerradas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredClaims.filter(c => c.status === 'denied').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Denegadas</div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Métricas para AJUSTADORES */}
          {userProfile?.role === 'adjuster' && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'investigating').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Investigando</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {filteredClaims.filter(c => c.status === 'waiting_approval').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pend. aprobación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredClaims.filter(c => c.status === 'approved').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Aprobadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredClaims.filter(c => c.status === 'denied').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Denegadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">
                    $
                    {filteredClaims
                      .filter(c => c.status === 'approved')
                      .reduce((sum, c) => sum + (c.approved_amount || 0), 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Monto aprobado</div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Métricas para ADMINISTRADORES - Vista completa */}
          {userProfile?.role === 'admin' && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'submitted').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Enviadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {
                      filteredClaims.filter(c =>
                        ['under_review', 'investigating'].includes(c.status)
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">En proceso</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredClaims.filter(c => c.status === 'approved').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Aprobadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredClaims.filter(c => c.priority === 'urgent').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Urgentes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">
                    $
                    {filteredClaims
                      .reduce(
                        (sum, c) => sum + (c.approved_amount || c.estimated_damage_cost || 0),
                        0
                      )
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Monto total</div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Métricas para CLIENTES - Vista simplificada */}
          {(!userProfile?.role || userProfile?.role === 'customer') && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'submitted').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Enviadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {
                      filteredClaims.filter(c =>
                        ['under_review', 'investigating'].includes(c.status)
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">En proceso</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredClaims.filter(c => c.status === 'approved').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Aprobadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredClaims.filter(c => c.status === 'paid').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pagadas</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
