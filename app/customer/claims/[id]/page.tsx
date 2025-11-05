'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { ClaimCommunication } from '@/components/claims/claim-communication';
import { ClaimEvidenceSystem } from '@/components/claims/claim-evidence-system';
import { ClaimCustomerDocuments } from '@/components/claims/claim-customer-documents';
import type { Claim } from '@/lib/types/database';
import {
  ArrowLeft,
  FileText,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Car,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { InfoTooltip } from '@/components/ui/info-tooltip';

export default function CustomerClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    if (userProfile) {
      fetchCustomerId();
    }
  }, [userProfile]);

  useEffect(() => {
    if (params.id && customerId) {
      fetchClaimDetails();
    }
  }, [params.id, customerId]);

  const fetchCustomerId = async () => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userProfile?.id)
        .single();

      if (customer) {
        setCustomerId(customer.id);
      }
    } catch (error) {
      console.error('Error fetching customer ID:', error);
    }
  };

  const fetchClaimDetails = async () => {
    try {
      const { data: claimData, error: claimError } = await supabase
        .from('claims')
        .select(
          `
          *,
          policy:policies(
            *,
            vehicle:vehicles(*)
          ),
          adjuster:users(*)
        `
        )
        .eq('id', params.id)
        .eq('customer_id', customerId) // Solo permitir ver sus propias reclamaciones
        .single();

      if (claimError) {
        console.error('Error fetching claim:', claimError);
        throw claimError;
      }

      setClaim(claimData);
    } catch (error) {
      console.error('Error fetching claim details:', error);
      router.push('/customer/claims');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { 
        label: 'Enviada', 
        variant: 'outline' as const, 
        icon: Clock,
        tooltip: 'Tu reclamación ha sido recibida y está esperando ser asignada a un ajustador.'
      },
      under_review: { 
        label: 'En Revisión', 
        variant: 'secondary' as const, 
        icon: FileText,
        tooltip: 'Un ajustador está revisando tu caso. Puede contactarte si necesita más información.'
      },
      pending_documentation: {
        label: 'Documentos Pendientes',
        variant: 'outline' as const,
        icon: FileText,
        tooltip: 'Se requieren documentos adicionales. Revisa la pestaña de Comunicación para ver qué documentos se solicitan.'
      },
      waiting_approval: {
        label: 'Esperando Aprobación',
        variant: 'secondary' as const,
        icon: Clock,
        tooltip: 'Tu caso está siendo evaluado por un supervisor para aprobación final.'
      },
      investigating: { 
        label: 'Investigando', 
        variant: 'default' as const, 
        icon: AlertTriangle,
        tooltip: 'El ajustador está realizando una investigación detallada del incidente. Este proceso puede tomar algunos días.'
      },
      approved: { 
        label: 'Aprobada', 
        variant: 'default' as const, 
        icon: CheckCircle,
        tooltip: '¡Buenas noticias! Tu reclamación ha sido aprobada. El pago será procesado pronto.'
      },
      processing_payment: {
        label: 'Procesando Pago',
        variant: 'secondary' as const,
        icon: DollarSign,
        tooltip: 'El departamento financiero está procesando tu pago. Recibirás una notificación cuando se complete.'
      },
      denied: { 
        label: 'Denegada', 
        variant: 'destructive' as const, 
        icon: XCircle,
        tooltip: 'Tu reclamación no fue aprobada. Revisa la pestaña de Comunicación para conocer los motivos.'
      },
      closed: { 
        label: 'Cerrada', 
        variant: 'outline' as const, 
        icon: CheckCircle,
        tooltip: 'Este caso ha sido cerrado y completado.'
      },
      paid: { 
        label: 'Pagada', 
        variant: 'default' as const, 
        icon: CheckCircle,
        tooltip: 'El pago ha sido procesado exitosamente. Revisa tu cuenta bancaria.'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-1.5">
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        <InfoTooltip content={config.tooltip} side="right" />
      </div>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', variant: 'outline' as const },
      medium: { label: 'Media', variant: 'secondary' as const },
      high: { label: 'Alta', variant: 'default' as const },
      urgent: { label: 'Urgente', variant: 'destructive' as const },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando detalles de la reclamación...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!claim) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Reclamación no encontrada</h1>
            <p className="text-muted-foreground mb-4">
              La reclamación que buscas no existe o no tienes permisos para verla.
            </p>
            <Button onClick={() => router.push('/customer/claims')}>
              Volver a Mis Reclamaciones
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
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

        <Tabs defaultValue="details" className="space-y-6">
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
              />

              {/* Sistema de Evidencia */}
              <ClaimEvidenceSystem
                claimId={claim.id}
                currentUserRole="customer"
                customerId={customerId}
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
