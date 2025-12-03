'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import type { Claim } from '@/lib/types/database';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  User,
  Car,
  Calendar,
  MapPin,
  Shield,
  Eye,
  Edit,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClaimProcessingProps {
  claim: Claim;
  onClaimUpdated?: (updatedClaim: Claim) => void;
}

export function ClaimProcessing({ claim, onClaimUpdated }: ClaimProcessingProps) {
  const { userProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionData, setActionData] = useState<{
    status:
      | 'submitted'
      | 'under_review'
      | 'pending_documentation'
      | 'waiting_approval'
      | 'investigating'
      | 'approved'
      | 'processing_payment'
      | 'denied'
      | 'closed'
      | 'paid';
    notes: string;
    approvedAmount: number;
    deductibleAmount: number;
    adjusterNotes: string;
  }>({
    status: claim.status,
    notes: '',
    approvedAmount: claim.approved_amount || 0,
    deductibleAmount: claim.deductible_amount || 0,
    adjusterNotes: '',
  });
  const supabase = createClient();

  const canProcess =
    userProfile?.role === 'agent' ||
    userProfile?.role === 'adjuster' ||
    userProfile?.role === 'admin';

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Enviada', variant: 'outline' as const, icon: Clock },
      under_review: { label: 'En Revisión', variant: 'secondary' as const, icon: Eye },
      pending_documentation: {
        label: 'Pendiente Documentos',
        variant: 'outline' as const,
        icon: FileText,
      },
      waiting_approval: {
        label: 'Esperando Aprobación',
        variant: 'secondary' as const,
        icon: Clock,
      },
      investigating: { label: 'Investigando', variant: 'default' as const, icon: AlertTriangle },
      approved: { label: 'Aprobada', variant: 'default' as const, icon: CheckCircle },
      processing_payment: {
        label: 'Procesando Pago',
        variant: 'secondary' as const,
        icon: DollarSign,
      },
      denied: { label: 'Denegada', variant: 'destructive' as const, icon: XCircle },
      closed: { label: 'Cerrada', variant: 'secondary' as const, icon: FileText },
      paid: { label: 'Pagada', variant: 'default' as const, icon: DollarSign },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getClaimTypeLabel = (type: string) => {
    const types = {
      Colisión: 'Colisión',
      Robo: 'Robo',
      Vandalismo: 'Vandalismo',
      Incendio: 'Incendio',
      'Daño por clima': 'Inundación',
      'Daño por granizo': 'Granizo',
      Otros: 'Otros',
    };
    return types[type as keyof typeof types] || type;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!canProcess) {
      setError('No tienes permisos para procesar esta reclamación');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Actualizando estado de reclamación:', {
        claimId: claim.id,
        currentStatus: claim.status,
        newStatus,
        userId: userProfile?.id,
      });

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Asignar adjuster si no tiene uno y el usuario actual es adjuster
      if (!claim.adjuster_id && userProfile?.role === 'adjuster') {
        updateData.adjuster_id = userProfile.id;
      }

      // Si se está aprobando, incluir montos
      if (newStatus === 'approved' && actionData.approvedAmount > 0) {
        updateData.approved_amount = actionData.approvedAmount;
        updateData.deductible_amount = actionData.deductibleAmount || 0;
      }

      const { data, error } = await supabase
        .from('claims')
        .update(updateData)
        .eq('id', claim.id)
        .select(
          `
          *,
          policy:policies(*),
          customer:customers(*),
          adjuster:users(*)
        `
        )
        .single();

      if (error) throw error;

      // Crear registro de comunicación/nota
      if (actionData.notes) {
        await supabase.from('communications').insert({
          claim_id: claim.id,
          customer_id: claim.customer_id,
          agent_id: userProfile?.id,
          communication_type: 'note',
          direction: 'internal',
          subject: `Actualización de estado: ${newStatus}`,
          content: actionData.notes,
          status: 'sent',
        });
      }

      setSuccess(`Reclamación actualizada a: ${getStatusBadge(newStatus).props.children[1]}`);

      if (onClaimUpdated && data) {
        onClaimUpdated(data);
      }

      // Limpiar formulario
      setActionData(prev => ({ ...prev, notes: '' }));
    } catch (error) {
      console.error('Error actualizando reclamación:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar la reclamación');
    } finally {
      setProcessing(false);
    }
  };

  const getNextPossibleStatuses = (currentStatus: string) => {
    const transitions = {
      submitted: ['under_review', 'pending_documentation', 'denied'],
      under_review: ['investigating', 'waiting_approval', 'pending_documentation', 'denied'],
      pending_documentation: ['under_review', 'denied'],
      waiting_approval: ['approved', 'denied', 'under_review'],
      investigating: ['waiting_approval', 'approved', 'denied', 'under_review'],
      approved: ['processing_payment', 'investigating'],
      processing_payment: ['paid', 'approved'],
      denied: ['closed', 'under_review'],
      paid: ['closed'],
      closed: ['under_review'],
    };

    return transitions[currentStatus as keyof typeof transitions] || [];
  };

  const nextStatuses = getNextPossibleStatuses(claim.status);

  return (
    <div className="space-y-6">
      {/* Información de la Reclamación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reclamación #{claim.claim_number}
              </CardTitle>
              <CardDescription>
                Creada el {format(new Date(claim.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={claim.priority} />
              {getStatusBadge(claim.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </Label>
              <div className="p-2 bg-muted/30 rounded">
                <p className="font-medium">
                  {claim.customer?.user?.first_name} {claim.customer?.user?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{claim.customer?.user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Póliza
              </Label>
              <div className="p-2 bg-muted/30 rounded">
                <p className="font-medium">{claim.policy?.policy_number}</p>
                <p className="text-sm text-muted-foreground">
                  {claim.policy?.vehicle?.year} {claim.policy?.vehicle?.make}{' '}
                  {claim.policy?.vehicle?.model}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Tipo de Siniestro
              </Label>
              <div className="p-2 bg-muted/30 rounded">
                <p className="font-medium">{getClaimTypeLabel(claim.claim_type)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha del Incidente
              </Label>
              <div className="p-2 bg-muted/30 rounded">
                <p className="font-medium">
                  {format(new Date(claim.incident_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción del Incidente</Label>
            <div className="p-3 bg-muted/20 rounded border">
              <p>{claim.incident_description}</p>
            </div>
          </div>

          {/* Ubicación si existe */}
          {claim.incident_location && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </Label>
              <div className="p-2 bg-muted/30 rounded">
                <p>{claim.incident_location}</p>
              </div>
            </div>
          )}

          {/* Montos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {claim.estimated_damage_cost && (
              <div className="space-y-2">
                <Label>Daño Estimado</Label>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="font-medium">${claim.estimated_damage_cost.toLocaleString()}</p>
                </div>
              </div>
            )}

            {claim.approved_amount && (
              <div className="space-y-2">
                <Label>Monto Aprobado</Label>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="font-medium text-green-700 dark:text-green-400">
                    ${claim.approved_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {claim.deductible_amount && (
              <div className="space-y-2">
                <Label>Deducible</Label>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    ${claim.deductible_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Panel de Procesamiento - Solo para agentes/adjusters */}
      {canProcess && nextStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Procesar Reclamación
            </CardTitle>
            <CardDescription>
              Actualiza el estado y agrega notas sobre el procesamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Selector de nuevo estado */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nuevo Estado</Label>
              <Select
                value={actionData.status}
                onValueChange={(
                  value:
                    | 'submitted'
                    | 'under_review'
                    | 'pending_documentation'
                    | 'waiting_approval'
                    | 'investigating'
                    | 'approved'
                    | 'processing_payment'
                    | 'denied'
                    | 'closed'
                    | 'paid'
                ) => setActionData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="h-10 w-64 bg-card border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary transition-colors">
                  <SelectValue placeholder="Seleccionar nuevo estado" />
                </SelectTrigger>
                <SelectContent className="bg-card border-muted-foreground/20">
                  {nextStatuses.map(status => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="cursor-pointer hover:bg-muted/60 focus:bg-muted/80 transition-colors py-2"
                    >
                      <span className="flex items-center gap-2 w-full">
                        {getStatusBadge(status)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos adicionales para aprobación */}
            {actionData.status === 'approved' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-100 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <div className="space-y-2">
                  <Label>Monto Aprobado *</Label>
                  <Input
                    type="number"
                    value={actionData.approvedAmount}
                    onChange={e =>
                      setActionData(prev => ({ ...prev, approvedAmount: Number(e.target.value) }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deducible</Label>
                  <Input
                    type="number"
                    value={actionData.deductibleAmount}
                    onChange={e =>
                      setActionData(prev => ({ ...prev, deductibleAmount: Number(e.target.value) }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notas del Procesamiento
              </Label>
              <Textarea
                value={actionData.notes}
                onChange={e => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Agregar notas sobre la decisión, investigación realizada, etc..."
                rows={3}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusChange(actionData.status)}
                disabled={
                  processing ||
                  actionData.status === claim.status ||
                  (actionData.status === 'approved' && actionData.approvedAmount <= 0)
                }
                className="flex items-center gap-2"
              >
                {processing ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Actualizar Estado
              </Button>

              {actionData.status === 'denied' && (
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange('denied')}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Denegar Reclamación
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
