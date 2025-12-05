'use client';

import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
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
  const [rejectedClaimsMap, setRejectedClaimsMap] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  // ✅ OPTIMIZACIÓN: Debounce de búsqueda para evitar filtrado en cada keystroke
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    if (userProfile) {
      fetchClaims();
    }
  }, [customerId, policyId, userProfile]);

  useEffect(() => {
    filterClaims();
  }, [claims, debouncedSearch, statusFilter, typeFilter, priorityFilter]);

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

  // ✅ OPTIMIZACIÓN: Polling eliminado, solo suscripción realtime
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
      console.log('🔍 FETCH CLAIMS - Iniciando...', {
        userRole: userProfile?.role,
        customerId,
        policyId
      });

      let data = null;
      let error = null;

      if (customerId) {
        const result = await supabase
          .from('claims')
          .select(`
            *,
            policy:policies(*,vehicle:vehicles(*)),
            customer:customers(*,user:users(*)),
            adjuster:users!claims_adjuster_id_fkey(*)
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        data = result.data;
        error = result.error;

        // Fetch rejected documents for this customer to update UI status
        if (data) {
          const { data: rejectedDocs } = await supabase
            .from('claim_customer_documents')
            .select('claim_id')
            .eq('customer_id', customerId)
            .eq('status', 'rejected');

          if (rejectedDocs) {
            const rejectedMap: Record<string, boolean> = {};
            rejectedDocs.forEach(doc => {
              rejectedMap[doc.claim_id] = true;
            });
            setRejectedClaimsMap(rejectedMap);
          }
        }

      } else if (policyId) {
        const result = await supabase
          .from('claims')
          .select(`
            *,
            policy:policies(*,vehicle:vehicles(*)),
            customer:customers(*,user:users(*)),
            adjuster:users!claims_adjuster_id_fkey(*)
          `)
          .eq('policy_id', policyId)
          .order('created_at', { ascending: false });
        data = result.data;
        error = result.error;
      } else if (userProfile?.role === 'adjuster') {
        const [availableRes, myClaimsRes] = await Promise.all([
          fetch('/api/claims/available'),
          fetch('/api/claims/my-claims')
        ]);

        const availableData = await availableRes.json();
        const myClaimsData = await myClaimsRes.json();

        data = [
          ...(myClaimsData.claims || []),
          ...(availableData.claims || [])
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (userProfile?.role === 'agent') {
        const [unassignedRes, processRes, returnedRes, myClaimsRes] = await Promise.all([
          // 1. Reclamaciones sin asignar (Intake)
          supabase
            .from('claims')
            .select(`
              *,
              policy:policies(*,vehicle:vehicles(*)),
              customer:customers(*,user:users(*)),
              adjuster:users!claims_adjuster_id_fkey(*)
            `)
            .is('adjuster_id', null)
            .in('status', ['submitted', 'under_review', 'pending_documentation', 'investigating'])
            .order('created_at', { ascending: false }),
          
          // 2. Reclamaciones en proceso post-ajuste (Visibles para todos los agentes)
          supabase
            .from('claims')
            .select(`
              *,
              policy:policies(*,vehicle:vehicles(*)),
              customer:customers(*,user:users(*)),
              adjuster:users!claims_adjuster_id_fkey(*)
            `)
            .in('status', ['waiting_approval', 'approved', 'processing_payment', 'paid'])
            .order('created_at', { ascending: false }),

          // 3. Reclamaciones devueltas o en revisión (con ajustador asignado pero requieren acción de agente)
          supabase
            .from('claims')
            .select(`
              *,
              policy:policies(*,vehicle:vehicles(*)),
              customer:customers(*,user:users(*)),
              adjuster:users!claims_adjuster_id_fkey(*)
            `)
            .not('adjuster_id', 'is', null)
            .in('status', ['under_review', 'pending_documentation'])
            .order('created_at', { ascending: false }),

          // 4. Mis reclamaciones asignadas
          fetch('/api/claims/my-claims')
        ]);

        const myClaimsData = await myClaimsRes.json();
        
        // Combinar y deduplicar por ID
        const allClaims = [
          ...(myClaimsData.claims || []),
          ...(unassignedRes.data || []),
          ...(processRes.data || []),
          ...(returnedRes.data || []) // returnedRes is the 3rd result now
        ];

        const uniqueClaims = Array.from(new Map(allClaims.map(item => [item.id, item])).values());


        
        // Sort by updated_at to show most recent activity first (better for workflow)
        data = uniqueClaims.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA;
        });
        
        error = unassignedRes.error || processRes.error || returnedRes.error;
      } else if (userProfile?.role === 'admin') {
        const result = await supabase
          .from('claims')
          .select(`
            *,
            policy:policies(*,vehicle:vehicles(*)),
            customer:customers(*,user:users(*)),
            adjuster:users!claims_adjuster_id_fkey(*),
            agent:users!claims_agent_id_fkey(*)
          `)
          .order('created_at', { ascending: false });
        data = result.data;
        error = result.error;
      } else {
        // Default fallback for security - do not fetch all claims
        console.warn('ClaimList: No specific fetch logic for this state', {
          hasCustomerId: !!customerId,
          hasPolicyId: !!policyId,
          role: userProfile?.role
        });
        data = [];
        error = null;
      }

      if (error) {
        console.error('❌ FETCH CLAIMS - Error:', error);
        throw error;
      }

      console.log('📦 FETCH CLAIMS - Data recibida:', data?.length || 0, 'reclamaciones');

      if (data) {
        const uniqueClaims = Array.from(new Map(data.map(c => [c.id, c])).values());
        console.log('📊 CLAIM LIST - Datos únicos obtenidos:', uniqueClaims.length);
        setClaims([...uniqueClaims]);
        setFilteredClaims([...uniqueClaims]);
        setLastUpdated(new Date());
        setForceRefreshKey(Date.now());
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

    // Search filter con debounce
    if (debouncedSearch) {
      filtered = filtered.filter(
        claim =>
          claim.claim_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          claim.customer?.user?.first_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          claim.customer?.user?.last_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          claim.policy?.policy_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          claim.incident_description.toLowerCase().includes(debouncedSearch.toLowerCase())
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

  const getStatusBadge = (status: string, claimId?: string) => {
    // Si es cliente y tiene documentos rechazados, mostrar estado especial
    if (userProfile?.role === 'customer' && claimId && rejectedClaimsMap[claimId]) {
      return <span className="status-badge status-denied">Documento inválido</span>;
    }

    // Determinar el label para 'submitted' según el rol
    const submittedLabel = (userProfile?.role === 'agent' || userProfile?.role === 'adjuster')
      ? 'Por revisar'
      : 'Enviada';

    const statusConfig = {
      pending: {
        label: 'Pendiente',
        classes: 'status-badge status-pending',
      },
      submitted: {
        label: submittedLabel,
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
    const claimDateOnly = new Date(
      claimDate.getFullYear(),
      claimDate.getMonth(),
      claimDate.getDate()
    );
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
                ? null
                : userProfile?.role === 'agent'
                  ? 'Reclamaciones para gestión administrativa y documentación'
                  : userProfile?.role === 'adjuster'
                    ? 'Reclamaciones para evaluación técnica y aprobación'
                    : 'Gestión completa de reclamaciones'}
              {lastUpdated && (
                <span className="block text-xs text-muted-foreground mt-2">
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

        {/* Alert informativo por rol */}


        {userProfile?.role === 'agent' && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">📋 Panel de Agente</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• <strong>Nuevas:</strong> Reclamaciones recién enviadas (estado: Submitted) sin ajustador</li>
              <li>• <strong>Asignar:</strong> Botón verde "Asignar" para asignar ajustador rápidamente</li>
              <li>• <strong>Mis Asignaciones:</strong> Ves las reclamaciones que tú asignaste</li>
              <li>• <strong>Gestión:</strong> Botón azul para procesar documentación y estados</li>
            </ul>
          </div>
        )}

        {userProfile?.role === 'admin' && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">👑 Panel de Administrador</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• <strong>Control Total:</strong> Acceso completo a todas las reclamaciones</li>
              <li>• <strong>Gestionar:</strong> Modifica cualquier estado o asignación</li>
              <li>• <strong>Supervisar:</strong> Monitorea el flujo completo de trabajo</li>
            </ul>
          </div>
        )}

        {/* Claims Table */}
        <div className="rounded-md border" key={forceRefreshKey}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                {!customerId && <TableHead>Cliente</TableHead>}
                <TableHead>Póliza</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                {(userProfile?.role === 'agent' || userProfile?.role === 'admin') && (
                  <TableHead>Ajustador</TableHead>
                )}
                <TableHead className="text-center">Fecha</TableHead>
                <TableHead className="text-center">Monto</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
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
                  <TableRow
                    key={`${claim.id}-${claim.status}-${forceRefreshKey}`}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      console.log('👆 Row click:', claim.id);
                      if (onViewClaim) onViewClaim(claim);
                    }}
                  >
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
                    <TableCell className="text-center">{getStatusBadge(claim.status, claim.id)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <PriorityBadge priority={claim.priority} />
                        {claim.injury_involved && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            Lesiones
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {(userProfile?.role === 'agent' || userProfile?.role === 'admin') && (
                      <TableCell>
                        {claim.adjuster_id ? (
                          <Badge variant="secondary" className="text-xs">
                            Asignado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Sin asignar
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1 text-sm justify-center">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(claim.incident_date), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                      {getClaimAgeDisplay(claim.created_at) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
                          <Clock className="h-3 w-3" />
                          <span>{getClaimAgeDisplay(claim.created_at)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm flex flex-col items-center">
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
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        {/* Botón Ver - Mejorado y Visible */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('👁️ Ver reclamación (botón):', claim.id);
                            if (onViewClaim) {
                              onViewClaim(claim);
                            }
                          }}
                          title="Ver detalles"
                          className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden lg:inline">Ver</span>
                        </Button>

                        {/* AGENTE: Botón de asignar rápido para reclamaciones sin ajustador */}
                        {userProfile?.role === 'agent' && !claim.adjuster_id && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('✅ Asignar reclamación:', claim.id);
                              if (onEditClaim) {
                                onEditClaim(claim);
                              } else if (onViewClaim) {
                                onViewClaim(claim);
                              }
                            }}
                            title="Asignar Ajustador"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Asignar
                          </Button>
                        )}

                        {/* AGENTE: Botón de gestión para reclamaciones ya asignadas */}
                        {userProfile?.role === 'agent' &&
                          claim.adjuster_id &&
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
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('⚙️ Gestión administrativa:', claim.id);
                                if (onEditClaim) {
                                  onEditClaim(claim);
                                } else if (onViewClaim) {
                                  onViewClaim(claim);
                                }
                              }}
                              title="Gestión Administrativa"
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}

                        {/* AJUSTADOR: Botón de evaluar (Single Evaluator Mode: Evaluar cualquiera asignada) */}
                        {userProfile?.role === 'adjuster' &&
                          claim.adjuster_id &&
                          ['investigating', 'waiting_approval'].includes(claim.status) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🔍 Evaluar reclamación:', claim.id);
                                if (onEditClaim) {
                                  onEditClaim(claim);
                                } else if (onViewClaim) {
                                  onViewClaim(claim);
                                }
                              }}
                              title="Evaluar Reclamación"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Evaluar
                            </Button>
                          )}

                        {/* ADMINISTRADOR: Acceso completo */}
                        {userProfile?.role === 'admin' && claim.status !== 'closed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('👑 Admin - Gestionar:', claim.id);
                              if (onEditClaim) {
                                onEditClaim(claim);
                              } else if (onViewClaim) {
                                onViewClaim(claim);
                              }
                            }}
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
        <div className={`mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 ${
          userProfile?.role === 'admin' 
            ? 'xl:grid-cols-11' 
            : userProfile?.role === 'adjuster' 
              ? 'xl:grid-cols-10' 
              : 'xl:grid-cols-8'
        }`}>
          {/* Métricas para AGENTES - Basadas en labels de estado (igual que clientes) */}
          {userProfile?.role === 'agent' && (
            <>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-gray-400">
                    {filteredClaims.filter(c => c.status === 'submitted').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Enviadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-yellow-500">
                    {filteredClaims.filter(c => c.status === 'under_review').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">En revisión</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-purple-500">
                    {filteredClaims.filter(c => c.status === 'waiting_approval').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Esperando aprobación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'investigating').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">En investigación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-green-500">
                    {filteredClaims.filter(c => c.status === 'approved').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Aprobadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-cyan-500">
                    {filteredClaims.filter(c => c.status === 'processing_payment').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Procesando Pago</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-gray-600">
                    {filteredClaims.filter(c => c.status === 'closed').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Cerradas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-red-600">
                    {filteredClaims.filter(c => ['denied', 'rejected'].includes(c.status)).length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Denegadas</div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Métricas para AJUSTADORES */}
          {userProfile?.role === 'adjuster' && (
            <>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-gray-400">
                    {filteredClaims.filter(c => c.status === 'submitted').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Enviadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-yellow-500">
                    {filteredClaims.filter(c => c.status === 'under_review').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">En revisión</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-purple-500">
                    {filteredClaims.filter(c => c.status === 'waiting_approval').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Esperando aprobación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'investigating').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">En investigación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-green-500">
                    {filteredClaims.filter(c => c.status === 'approved').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Aprobadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-cyan-500">
                    {filteredClaims.filter(c => c.status === 'processing_payment').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Procesando Pago</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-gray-600">
                    {filteredClaims.filter(c => c.status === 'closed').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Cerradas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-red-600">
                    {filteredClaims.filter(c => ['denied', 'rejected'].includes(c.status)).length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Denegadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-primary">
                    $
                    {filteredClaims
                      .filter(c => c.status === 'approved')
                      .reduce((sum, c) => sum + (c.approved_amount || 0), 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Monto aprobado</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-green-600">
                    $
                    {filteredClaims
                      .filter(c => c.status === 'paid')
                      .reduce((sum, c) => sum + (c.approved_amount || 0), 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Monto pagada</div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Métricas para ADMINISTRADORES - Vista completa */}
          {userProfile?.role === 'admin' && (
            <>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-gray-400">
                    {filteredClaims.filter(c => c.status === 'submitted').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Enviadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-yellow-500">
                    {filteredClaims.filter(c => c.status === 'under_review').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">En revisión</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-purple-500">
                    {filteredClaims.filter(c => c.status === 'waiting_approval').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Esperando aprobación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'investigating').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">En investigación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-green-500">
                    {filteredClaims.filter(c => c.status === 'approved').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Aprobadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-cyan-500">
                    {filteredClaims.filter(c => c.status === 'processing_payment').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Procesando Pago</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-gray-600">
                    {filteredClaims.filter(c => c.status === 'closed').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Cerradas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-red-600">
                    {filteredClaims.filter(c => ['denied', 'rejected'].includes(c.status)).length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Denegadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-primary">
                    $
                    {filteredClaims
                      .filter(c => c.status === 'approved')
                      .reduce((sum, c) => sum + (c.approved_amount || 0), 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Monto aprobado</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-green-600">
                    $
                    {filteredClaims
                      .filter(c => c.status === 'paid')
                      .reduce((sum, c) => sum + (c.approved_amount || 0), 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Monto pagada</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-primary">
                    $
                    {filteredClaims
                      .reduce(
                        (sum, c) => sum + (c.approved_amount || c.estimated_damage_cost || 0),
                        0
                      )
                      .toLocaleString()}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Monto total</div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Métricas para CLIENTES - Basadas en labels de estado */}
          {(!userProfile?.role || userProfile?.role === 'customer') && (
            <>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-gray-400">
                    {filteredClaims.filter(c => c.status === 'submitted').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Enviadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-yellow-500">
                    {filteredClaims.filter(c => c.status === 'under_review').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">En revisión</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-purple-500">
                    {filteredClaims.filter(c => c.status === 'waiting_approval').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Esperando aprobación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-blue-600">
                    {filteredClaims.filter(c => c.status === 'investigating').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">En investigación</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-green-500">
                    {filteredClaims.filter(c => c.status === 'approved').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Aprobadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-cyan-500">
                    {filteredClaims.filter(c => c.status === 'processing_payment').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Procesando Pago</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-gray-600">
                    {filteredClaims.filter(c => c.status === 'closed').length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Cerradas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-1.5 flex flex-col items-center justify-center text-center h-full">
                  <div className="text-xl font-bold text-red-600">
                    {filteredClaims.filter(c => ['denied', 'rejected'].includes(c.status)).length}
                  </div>
                  <div className="text-[10px] leading-tight text-muted-foreground">Denegadas</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
