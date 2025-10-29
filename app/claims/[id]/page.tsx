'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DamageAssessmentForm } from '@/components/claims/damage-assessment-form';
import { ClaimProcessing } from '@/components/claims/claim-processing';
import { ClaimStatusHistory } from '@/components/claims/claim-status-history';
import { ClaimCommunications } from '@/components/claims/claim-communications';
import { PaymentStatus } from '@/components/claims/payment-status';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/components/auth/auth-provider';
import type { Claim, DamageAssessment, ClaimDocument } from '@/lib/types/database';
import {
  ArrowLeft,
  FileText,
  Camera,
  ClipboardCheck,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Car,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [assessments, setAssessments] = useState<DamageAssessment[]>([]);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);

  // Determinar la tab inicial basado en el parámetro de query
  const initialTab = searchParams.get('tab') || 'details';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (params.id) {
      fetchClaimDetails();
    }
  }, [params.id]);

  const fetchClaimDetails = async () => {
    console.log('Fetching claim details for ID:', params.id);
    try {
      // Fetch claim with related data
      const { data: claimData, error: claimError } = await supabase
        .from('claims')
        .select(
          `
          *,
          policy:policies(
            *,
            vehicle:vehicles(*),
            customer:customers(
              *,
              user:users(*)
            )
          ),
          customer:customers(
            *,
            user:users(*)
          ),
          adjuster:users(*)
        `
        )
        .eq('id', params.id)
        .single();

      if (claimError) {
        console.error('Error fetching claim:', claimError);
        throw claimError;
      }

      console.log('Claim data fetched:', claimData);
      setClaim(claimData);

      // Fetch assessments
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('damage_assessments')
        .select(
          `
          *,
          adjuster:users(*)
        `
        )
        .eq('claim_id', params.id)
        .order('created_at', { ascending: false });

      if (assessmentError) throw assessmentError;
      setAssessments(assessmentData || []);

      // Fetch documents
      const { data: documentData, error: documentError } = await supabase
        .from('claim_documents')
        .select('*')
        .eq('claim_id', params.id)
        .order('created_at', { ascending: false });

      if (documentError) throw documentError;
      setDocuments(documentData || []);
    } catch (error) {
      console.error('Error fetching claim details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (newStatus: string) => {
    console.log('Updating claim status from', claim?.status, 'to', newStatus);

    if (!claim || !userProfile) {
      console.log('Missing claim or user profile');
      return;
    }

    try {
      const { error } = await supabase
        .from('claims')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) {
        console.error('Error updating claim status:', error);
        throw error;
      }

      console.log('Claim status updated successfully');

      // Refresh claim data
      console.log('Refreshing claim data...');
      await fetchClaimDetails();
      console.log('Claim data refreshed');

      alert(`Estado actualizado correctamente a: ${newStatus}`);
    } catch (error) {
      console.error('Error updating claim status:', error);
      alert('Error al actualizar el estado de la reclamación: ' + (error as Error).message);
    }
  };

  const approveClaimWithAmount = async () => {
    if (!claim || !userProfile) return;

    // Mostrar modal para ingresar monto aprobado
    const approvedAmount = prompt(
      'Ingrese el monto aprobado para esta reclamación:',
      claim.estimated_damage_cost?.toString() || '0'
    );

    if (!approvedAmount || isNaN(Number(approvedAmount))) {
      alert('Debe ingresar un monto válido');
      return;
    }

    try {
      // Actualizar reclamación con monto aprobado
      const { error } = await supabase
        .from('claims')
        .update({
          status: 'approved',
          approved_amount: Number(approvedAmount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      await fetchClaimDetails();
      alert(`Reclamación aprobada por $${Number(approvedAmount).toLocaleString()}`);
    } catch (error) {
      console.error('Error approving claim:', error);
      alert('Error al aprobar la reclamación: ' + (error as Error).message);
    }
  };

  const processPayment = async () => {
    if (!claim || !userProfile) return;

    const confirmed = confirm(
      `¿Está seguro de iniciar el proceso de pago por $${claim.approved_amount?.toLocaleString() || '0'}?`
    );

    if (!confirmed) return;

    try {
      // Actualizar estado a processing_payment
      const { error } = await supabase
        .from('claims')
        .update({
          status: 'processing_payment',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      await fetchClaimDetails();
      alert('Proceso de pago iniciado. Se enviará notificación al cliente.');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error al procesar el pago: ' + (error as Error).message);
    }
  };

  const confirmPayment = async () => {
    if (!claim || !userProfile) return;

    const paymentReference = prompt('Ingrese la referencia o número de transacción del pago:');

    if (!paymentReference) {
      alert('Debe ingresar una referencia de pago');
      return;
    }

    try {
      // Actualizar estado a paid con monto pagado
      const { error } = await supabase
        .from('claims')
        .update({
          status: 'paid',
          paid_amount: claim.approved_amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      await fetchClaimDetails();
      alert(`Pago confirmado. Referencia: ${paymentReference}`);
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Error al confirmar el pago: ' + (error as Error).message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: {
        label: 'Enviada',
        classes: 'status-badge status-submitted',
      },
      under_review: {
        label: 'En Revisión',
        classes: 'status-badge status-under-review',
      },
      pending_documentation: {
        label: 'Pendiente Documentos',
        classes: 'status-badge status-pending',
      },
      waiting_approval: {
        label: 'Esperando Aprobación',
        classes: 'status-badge status-waiting',
      },
      investigating: {
        label: 'Investigando',
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
      denied: {
        label: 'Denegada',
        classes: 'status-badge status-denied',
      },
      closed: { label: 'Cerrada', classes: 'status-badge status-closed' },
      paid: { label: 'Pagada', classes: 'status-badge status-paid' },
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
      collision: 'Colisión',
      theft: 'Robo',
      vandalism: 'Vandalismo',
      fire: 'Incendio',
      flood: 'Inundación',
      hail: 'Granizo',
      glass: 'Cristales',
      other: 'Otro',
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'agent', 'adjuster']}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!claim) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'agent', 'adjuster']}>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Reclamación no encontrada</h1>
            <Button onClick={() => router.push('/claims')}>Volver a Reclamaciones</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'agent', 'adjuster', 'customer']}>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Cargando...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!claim) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'agent', 'adjuster', 'customer']}>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p>Reclamación no encontrada</p>
            <Button onClick={() => router.push('/claims')} className="mt-4">
              Volver a Reclamaciones
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'agent', 'adjuster']}>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/claims')}>
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
          <div className="flex items-center gap-2 justify-center">
            {getStatusBadge(claim.status)}
            {getPriorityBadge(claim.priority)}
            {claim.injury_involved && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Lesiones
              </Badge>
            )}
          </div>
        </div>

        {/* Status Actions - Funciones Separadas por Rol */}
        {(userProfile?.role === 'adjuster' ||
          userProfile?.role === 'agent' ||
          userProfile?.role === 'admin') && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Acciones de Estado</CardTitle>
                  <CardDescription>
                    {userProfile?.role === 'agent' &&
                      'Funciones de Agente - Revisión Documental y Asignación'}
                    {userProfile?.role === 'adjuster' &&
                      'Funciones de Ajustador - Evaluación Técnica y Aprobación'}
                    {userProfile?.role === 'admin' &&
                      'Funciones de Administrador - Control Total del Sistema'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  {userProfile?.role === 'agent' && '📋 AGENTE'}
                  {userProfile?.role === 'adjuster' && '🔍 AJUSTADOR'}
                  {userProfile?.role === 'admin' && '👨‍💻 ADMIN'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* FUNCIONES DE AGENTE - Solo revisión documental y asignación a evaluadores */}
              {userProfile?.role === 'agent' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      📋 Especialización: Revisión Documental y Asignación
                    </h4>
                    <p className="text-sm text-blue-700">
                      Como agente, tu función es revisar la documentación inicial y asignar casos a
                      evaluadores técnicos.
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {claim.status === 'submitted' && (
                      <>
                        <Button
                          onClick={() => updateClaimStatus('under_review')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Iniciar Revisión Documental
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('pending_documentation')}
                        >
                          📄 Solicitar Más Documentos
                        </Button>
                      </>
                    )}

                    {claim.status === 'under_review' && (
                      <>
                        <Button
                          onClick={() => updateClaimStatus('investigating')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <User className="h-4 w-4 mr-2" />
                          🔍 Asignar a Evaluador Técnico
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('pending_documentation')}
                        >
                          📄 Solicitar Más Documentos
                        </Button>
                        <Button variant="destructive" onClick={() => updateClaimStatus('denied')}>
                          ❌ Rechazar por Documentación Insuficiente
                        </Button>
                      </>
                    )}

                    {claim.status === 'pending_documentation' && (
                      <>
                        <Button
                          onClick={() => updateClaimStatus('under_review')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          📋 Continuar Revisión Documental
                        </Button>
                        <Button variant="destructive" onClick={() => updateClaimStatus('denied')}>
                          ❌ Denegar por Falta de Documentos
                        </Button>
                      </>
                    )}

                    {[
                      'investigating',
                      'waiting_approval',
                      'approved',
                      'processing_payment',
                      'paid',
                    ].includes(claim.status) && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          ⏳ <strong>Caso en proceso técnico:</strong> El ajustador está manejando
                          la evaluación y aprobación.
                        </p>
                      </div>
                    )}

                    {claim.status === 'denied' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('under_review')}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          🔄 Reabrir para Nueva Revisión Documental
                        </Button>
                        <Button onClick={() => updateClaimStatus('closed')}>
                          📁 Cerrar Definitivamente
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* FUNCIONES DE AJUSTADOR - Solo evaluación técnica y aprobación de montos */}
              {userProfile?.role === 'adjuster' && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      🔍 Especialización: Evaluación Técnica y Aprobación de Montos
                    </h4>
                    <p className="text-sm text-green-700">
                      Como ajustador, tu función es realizar evaluaciones técnicas de daños y
                      aprobar montos de indemnización.
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {['submitted', 'under_review', 'pending_documentation'].includes(
                      claim.status
                    ) && (
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          ⏳ <strong>Caso en revisión documental:</strong> El agente está revisando
                          la documentación antes de asignarte el caso.
                        </p>
                      </div>
                    )}

                    {claim.status === 'investigating' && (
                      <>
                        <Button
                          onClick={() => setShowAssessmentForm(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          🔍 Realizar Evaluación Técnica de Daños
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => updateClaimStatus('waiting_approval')}
                          className="bg-green-100 text-green-700 hover:bg-green-200"
                        >
                          📤 Enviar a Aprobación Final
                        </Button>
                        <Button
                          onClick={approveClaimWithAmount}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          💰 Aprobar Directamente con Monto
                        </Button>
                        <Button variant="destructive" onClick={() => updateClaimStatus('denied')}>
                          ❌ Denegar por Evaluación Técnica
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('under_review')}
                          className="border-blue-600 text-blue-600"
                        >
                          ⬅️ Devolver a Agente para Más Documentos
                        </Button>
                      </>
                    )}

                    {claim.status === 'waiting_approval' && (
                      <>
                        <Button
                          onClick={approveClaimWithAmount}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />✅ Aprobar con Monto Final
                        </Button>
                        <Button variant="destructive" onClick={() => updateClaimStatus('denied')}>
                          ❌ Denegar Reclamación
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('investigating')}
                          className="border-green-600 text-green-600"
                        >
                          🔍 Continuar Investigación Técnica
                        </Button>
                      </>
                    )}

                    {claim.status === 'approved' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('investigating')}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          📝 Revisar Evaluación Técnica
                        </Button>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <p className="text-sm text-blue-700">
                            ✅ <strong>Aprobación completada:</strong> El proceso de pago será
                            manejado por el agente o administrador.
                          </p>
                        </div>
                      </>
                    )}

                    {['processing_payment', 'paid', 'closed'].includes(claim.status) && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          💰 <strong>Proceso completado:</strong> Tu evaluación técnica ha sido
                          aprobada y está en proceso de pago.
                        </p>
                      </div>
                    )}

                    {claim.status === 'denied' && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                        <p className="text-sm text-red-700">
                          ❌ <strong>Caso denegado:</strong> Solo un administrador puede reabrir
                          este caso.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FUNCIONES DE ADMINISTRADOR - Control total del sistema */}
              {userProfile?.role === 'admin' && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">
                      👨‍💻 Administrador: Control Total del Sistema
                    </h4>
                    <p className="text-sm text-purple-700">
                      Como administrador, tienes acceso completo a todas las funciones del sistema.
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {claim.status === 'submitted' && (
                      <>
                        <Button onClick={() => updateClaimStatus('under_review')}>
                          Iniciar Revisión
                        </Button>
                        <Button onClick={() => updateClaimStatus('investigating')}>
                          <User className="h-4 w-4 mr-2" />
                          Asignar Directamente a Evaluador
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('pending_documentation')}
                        >
                          Solicitar Más Documentos
                        </Button>
                      </>
                    )}

                    {claim.status === 'under_review' && (
                      <>
                        <Button onClick={() => updateClaimStatus('investigating')}>
                          Asignar a Evaluador
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => updateClaimStatus('waiting_approval')}
                        >
                          Enviar a Aprobación
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('pending_documentation')}
                        >
                          Solicitar Más Documentos
                        </Button>
                      </>
                    )}

                    {claim.status === 'pending_documentation' && (
                      <>
                        <Button onClick={() => updateClaimStatus('under_review')}>
                          Continuar Revisión
                        </Button>
                        <Button variant="destructive" onClick={() => updateClaimStatus('denied')}>
                          Denegar por Falta de Documentos
                        </Button>
                      </>
                    )}

                    {claim.status === 'investigating' && (
                      <>
                        <Button onClick={() => setShowAssessmentForm(true)}>
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Nueva Evaluación
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => updateClaimStatus('waiting_approval')}
                        >
                          Enviar a Aprobación
                        </Button>
                        <Button onClick={approveClaimWithAmount}>Aprobar Directamente</Button>
                        <Button variant="destructive" onClick={() => updateClaimStatus('denied')}>
                          Denegar Reclamación
                        </Button>
                        <Button variant="outline" onClick={() => updateClaimStatus('under_review')}>
                          Regresar a Revisión
                        </Button>
                      </>
                    )}

                    {claim.status === 'waiting_approval' && (
                      <>
                        <Button onClick={approveClaimWithAmount}>Aprobar con Monto</Button>
                        <Button variant="destructive" onClick={() => updateClaimStatus('denied')}>
                          Denegar Reclamación
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('investigating')}
                        >
                          Regresar a Investigación
                        </Button>
                      </>
                    )}

                    {claim.status === 'approved' && (
                      <>
                        <Button onClick={processPayment}>Iniciar Proceso de Pago</Button>
                        <Button
                          variant="outline"
                          onClick={() => updateClaimStatus('investigating')}
                        >
                          Revisar Nuevamente
                        </Button>
                      </>
                    )}

                    {claim.status === 'processing_payment' && (
                      <>
                        <Button onClick={confirmPayment}>Confirmar Pago Realizado</Button>
                        <Button variant="outline" onClick={() => updateClaimStatus('approved')}>
                          Cancelar Procesamiento
                        </Button>
                      </>
                    )}

                    {claim.status === 'paid' && (
                      <Button onClick={() => updateClaimStatus('closed')}>
                        Cerrar Reclamación
                      </Button>
                    )}

                    {claim.status === 'denied' && (
                      <>
                        <Button variant="outline" onClick={() => updateClaimStatus('under_review')}>
                          Reabrir para Revisión
                        </Button>
                        <Button onClick={() => updateClaimStatus('closed')}>
                          Cerrar Definitivamente
                        </Button>
                      </>
                    )}

                    {claim.status === 'closed' && (
                      <Button variant="outline" onClick={() => updateClaimStatus('under_review')}>
                        Reabrir Reclamación
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Status for approved/processing/paid claims */}
        {claim && ['approved', 'processing_payment', 'paid'].includes(claim.status) && (
          <PaymentStatus
            claim={claim}
            onProcessPayment={processPayment}
            onConfirmPayment={confirmPayment}
          />
        )}

        <Tabs defaultValue={initialTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            {(userProfile?.role === 'agent' ||
              userProfile?.role === 'adjuster' ||
              userProfile?.role === 'admin') && (
              <TabsTrigger value="processing">Procesamiento</TabsTrigger>
            )}
            <TabsTrigger value="assessments">Evaluaciones ({assessments.length})</TabsTrigger>
            <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
            <TabsTrigger value="communications">Comunicaciones</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Claim Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información de la Reclamación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Número</label>
                      <p className="font-mono">{claim.claim_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                      <p>{getClaimTypeLabel(claim.claim_type)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Fecha del Siniestro
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <p>
                          {format(new Date(claim.incident_date), 'dd/MM/yyyy HH:mm', {
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Fecha de Reporte
                      </label>
                      <p>{format(new Date(claim.created_at), 'dd/MM/yyyy', { locale: es })}</p>
                    </div>
                  </div>

                  {claim.incident_location && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <p>{claim.incident_location}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                    <p className="text-sm bg-muted p-3 rounded-md">{claim.incident_description}</p>
                  </div>

                  {claim.police_report_number && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Reporte Policial
                      </label>
                      <p className="font-mono">{claim.police_report_number}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Terceros Involucrados
                      </label>
                      <p>{claim.third_party_involved ? 'Sí' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lesiones</label>
                      <p>{claim.injury_involved ? 'Sí' : 'No'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Información Financiera
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {claim.estimated_damage_cost && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Daño Estimado
                      </label>
                      <p className="text-lg font-semibold">
                        ${claim.estimated_damage_cost.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {claim.approved_amount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Monto Aprobado
                      </label>
                      <p className="text-lg font-semibold text-green-600">
                        ${claim.approved_amount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {claim.paid_amount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Monto Pagado
                      </label>
                      <p className="text-lg font-semibold text-blue-600">
                        ${claim.paid_amount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {claim.deductible_amount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Deducible</label>
                      <p className="text-lg">${claim.deductible_amount.toLocaleString()}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Porcentaje de Culpa
                    </label>
                    <p className="text-lg">{claim.fault_percentage}%</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p>
                      {claim.customer?.user?.first_name} {claim.customer?.user?.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{claim.customer?.user?.email}</p>
                  </div>
                  {claim.customer?.user?.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                      <p>{claim.customer?.user?.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Información del Vehículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vehículo</label>
                    <p>
                      {claim.policy?.vehicle?.year} {claim.policy?.vehicle?.make}{' '}
                      {claim.policy?.vehicle?.model}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Placa</label>
                    <p className="font-mono">{claim.policy?.vehicle?.license_plate}</p>
                  </div>
                  {claim.policy?.vehicle?.vin && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">VIN</label>
                      <p className="font-mono text-sm">{claim.policy?.vehicle?.vin}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Póliza</label>
                    <p className="font-mono">{claim.policy?.policy_number}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="processing">
            <ClaimProcessing
              claim={claim}
              onClaimUpdated={updatedClaim => {
                setClaim(updatedClaim);
                fetchClaimDetails();
              }}
            />
          </TabsContent>

          <TabsContent value="assessments">
            {showAssessmentForm ? (
              <DamageAssessmentForm
                claim={claim}
                adjusterId={userProfile?.id || ''}
                onSuccess={() => {
                  setShowAssessmentForm(false);
                  fetchClaimDetails();
                }}
                onCancel={() => setShowAssessmentForm(false)}
              />
            ) : (
              <div className="space-y-6">
                {/* Sección especializada para Ajustador */}
                {userProfile?.role === 'adjuster' && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <ClipboardCheck className="h-5 w-5" />
                        🔍 Área de Evaluación Técnica
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        Como <strong>Ajustador</strong>, tu especialización es realizar evaluaciones
                        técnicas de daños y determinar montos de reparación.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-green-700">
                          <p>• Evalúa daños técnicamente</p>
                          <p>• Determina costos de reparación</p>
                          <p>• Recomienda acciones técnicas</p>
                        </div>
                        <Button
                          onClick={() => setShowAssessmentForm(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Nueva Evaluación Técnica
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Información para Agente */}
                {userProfile?.role === 'agent' && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <FileText className="h-5 w-5" />
                        📋 Evaluaciones Técnicas del Caso
                      </CardTitle>
                      <CardDescription className="text-blue-700">
                        Como <strong>Agente</strong>, puedes ver las evaluaciones técnicas
                        realizadas por los ajustadores pero no crear nuevas.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                {assessments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No hay evaluaciones de daños registradas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {assessments.map(assessment => (
                      <Card key={assessment.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                Evaluación -{' '}
                                {format(new Date(assessment.assessment_date), 'dd/MM/yyyy', {
                                  locale: es,
                                })}
                              </CardTitle>
                              <CardDescription>
                                Por: {assessment.adjuster?.first_name}{' '}
                                {assessment.adjuster?.last_name}
                                {assessment.is_final && <Badge className="ml-2">Final</Badge>}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Descripción de Daños
                            </label>
                            <p className="text-sm bg-muted p-3 rounded-md">
                              {assessment.damage_description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {assessment.repair_estimate && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Estimado Reparación
                                </label>
                                <p className="text-lg font-semibold">
                                  ${assessment.repair_estimate.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {assessment.replacement_estimate && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Estimado Reemplazo
                                </label>
                                <p className="text-lg font-semibold">
                                  ${assessment.replacement_estimate.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {assessment.recommended_action && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Acción Recomendada
                                </label>
                                <p className="capitalize">
                                  {assessment.recommended_action.replace('_', ' ')}
                                </p>
                              </div>
                            )}
                          </div>

                          {assessment.assessment_notes && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Notas
                              </label>
                              <p className="text-sm">{assessment.assessment_notes}</p>
                            </div>
                          )}

                          {assessment.photos && assessment.photos.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Fotografías
                              </label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                {assessment.photos.map((photo, index) => (
                                  <img
                                    key={index}
                                    src={photo || '/placeholder.svg'}
                                    alt={`Foto ${index + 1}`}
                                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(photo, '_blank')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos de la Reclamación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay documentos adjuntos</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {doc.document_type === 'photo' ? (
                            <Camera className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.document_type === 'photo' ? 'Fotografía' : 'Documento'} •
                              {doc.file_size &&
                                ` ${(doc.file_size / 1024 / 1024).toFixed(2)} MB • `}
                              {format(new Date(doc.created_at), 'dd/MM/yyyy', {
                                locale: es,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.is_verified && <Badge variant="secondary">Verificado</Badge>}
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communications">
            <ClaimCommunications claim={claim} />
          </TabsContent>

          <TabsContent value="history">
            <ClaimStatusHistory claim={claim} />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
