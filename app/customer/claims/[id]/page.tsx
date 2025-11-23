'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import type { Claim, ClaimCustomerDocument } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ClaimCustomerDocuments } from '@/components/claims/claim-customer-documents';
import { ClaimCommunication } from '@/components/claims/claim-communication';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Car, 
  MessageCircle, 
  FileText, 
  User 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CustomerClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<ClaimCustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string>('');
  
  // Inicializar tab desde la URL si existe
  const initialTab = searchParams.get('tab');
  const validTabs = ['details', 'documents', 'communication', 'status'];
  const [activeTab, setActiveTab] = useState(
    (initialTab && validTabs.includes(initialTab)) ? initialTab : 'details'
  );
  
  const supabase = createClient();

  // Mantener sincronizado si cambia la URL (ej. navegación atrás/adelante)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        if (!userProfile) return;

        // Obtener el ID del cliente asociado al usuario actual
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', userProfile.id)
          .single();

        if (customerError) throw customerError;
        setCustomerId(customerData.id);

        // Obtener la reclamación
        const { data: claimData, error: claimError } = await supabase
          .from('claims')
          .select(`
            *,
            policy:policies(*,vehicle:vehicles(*)),
            adjuster:users!claims_adjuster_id_fkey(*)
          `)
          .eq('id', params.id)
          .eq('customer_id', customerData.id)
          .single();

        if (claimError) throw claimError;
        setClaim(claimData);

        // Fetch documents
        const { data: documentsData, error: documentsError } = await supabase
          .from('claim_customer_documents')
          .select('*')
          .eq('claim_id', params.id)
          .order('upload_date', { ascending: false });

        if (documentsError) console.error('Error fetching documents:', documentsError);
        setDocuments(documentsData || []);
      } catch (error) {
        console.error('Error fetching claim:', error);
        router.push('/customer/claims');
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [params.id, userProfile, router, supabase]);

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
    const types = {
      Colisión: 'Colisión',
      Robo: 'Robo',
      Vandalismo: 'Vandalismo',
      Incendio: 'Incendio',
      'Daño por clima': 'Daño por clima',
      'Daño por granizo': 'Daño por granizo',
      Otros: 'Otros',
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

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <div className="container mx-auto py-8 px-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!claim) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push('/customer/claims')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{claim.claim_number}</h1>
            <p className="text-muted-foreground">
              {getClaimTypeLabel(claim.claim_type)} -{' '}
              {format(new Date(claim.incident_date), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(claim.status)}
            {getPriorityBadge(claim.priority)}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="documents">Documentos y Evidencia</TabsTrigger>
            <TabsTrigger value="communication">Comunicación</TabsTrigger>
            <TabsTrigger value="status">Estado</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información del Siniestro */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Detalles del Siniestro
                    <InfoTooltip
                      content="Información sobre el incidente reportado. Si necesitas corregir algún dato, contacta a tu ajustador a través de la pestaña de Comunicación."
                      side="right"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Fecha del Siniestro
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>
                        {format(new Date(claim.incident_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>

                  {claim.incident_location && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p>{claim.incident_location}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                    <p className="mt-1 text-sm">{claim.incident_description}</p>
                  </div>

                  {claim.estimated_damage_cost && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Costo Estimado
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">
                          ${claim.estimated_damage_cost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {claim.approved_amount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        Monto Aprobado
                        <InfoTooltip
                          content="Este es el monto que la aseguradora pagará por tu reclamación. El pago se procesará en los próximos días hábiles."
                          side="right"
                        />
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-lg font-semibold text-green-600">
                          ${claim.approved_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Información del Vehículo */}
              {claim.policy?.vehicle && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehículo Asegurado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vehículo</label>
                      <p className="text-lg">
                        {claim.policy.vehicle.year} {claim.policy.vehicle.make}{' '}
                        {claim.policy.vehicle.model}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Placa</label>
                      <p>{claim.policy.vehicle.license_plate}</p>
                    </div>

                    {claim.policy.vehicle.color && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Color</label>
                        <p>{claim.policy.vehicle.color}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Póliza</label>
                      <p>{claim.policy.policy_number}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-6">
              {/* Documentos del Cliente */}
              <ClaimCustomerDocuments
                claimId={claim.id}
                customerId={customerId}
                currentUserRole="customer"
                documents={documents}
                onRefresh={async () => {
                  // Re-fetch only documents or full claim
                  const { data } = await supabase
                    .from('claim_customer_documents')
                    .select('*')
                    .eq('claim_id', claim.id)
                    .order('upload_date', { ascending: false });
                  setDocuments(data || []);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Comunicación con su Agente
                  </CardTitle>
                  <CardDescription>
                    Envíe mensajes, documentos e imágenes directamente a su agente de seguros
                  </CardDescription>
                </CardHeader>
              </Card>

              <ClaimCommunication
                claimId={claim.id}
                customerId={customerId}
                claimNumber={claim.claim_number}
                currentUserRole="customer"
              />
            </div>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estado de la Reclamación
                  <InfoTooltip
                    content="Aquí puedes ver el progreso de tu reclamación. El estado se actualiza automáticamente cuando el ajustador realiza cambios."
                    side="right"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Estado actual:</span>
                    {getStatusBadge(claim.status)}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">¿Qué significa este estado?</h4>
                    <div className="text-sm text-muted-foreground">
                      {claim.status === 'submitted' && (
                        <p>Su reclamación ha sido recibida y está pendiente de revisión inicial.</p>
                      )}
                      {claim.status === 'under_review' && (
                        <p>
                          Su reclamación está siendo revisada por nuestro equipo de documentación.
                        </p>
                      )}
                      {claim.status === 'pending_documentation' && (
                        <p>
                          Necesitamos documentación adicional para continuar con su reclamación. Por
                          favor, contacte a su agente.
                        </p>
                      )}
                      {claim.status === 'investigating' && (
                        <p>
                          Su reclamación está siendo evaluada técnicamente por un ajustador
                          especializado.
                        </p>
                      )}
                      {claim.status === 'waiting_approval' && (
                        <p>
                          La evaluación técnica ha sido completada y está pendiente de aprobación
                          final.
                        </p>
                      )}
                      {claim.status === 'approved' && (
                        <p>Su reclamación ha sido aprobada. El proceso de pago iniciará pronto.</p>
                      )}
                      {claim.status === 'processing_payment' && (
                        <p>
                          Su pago está siendo procesado. Recibirá la compensación en los próximos
                          días hábiles.
                        </p>
                      )}
                      {claim.status === 'paid' && (
                        <p>Su reclamación ha sido pagada exitosamente.</p>
                      )}
                      {claim.status === 'denied' && (
                        <p>
                          Su reclamación ha sido denegada. Para más información, contacte a su
                          agente.
                        </p>
                      )}
                      {claim.status === 'closed' && <p>Su reclamación ha sido cerrada.</p>}
                    </div>
                  </div>

                  {claim.adjuster && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Ajustador Asignado
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p>
                          {claim.adjuster.first_name} {claim.adjuster.last_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
