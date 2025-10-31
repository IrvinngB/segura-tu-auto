'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileCheck,
  CreditCard,
  MessageCircle,
  UserCheck,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface ClaimWorkflowProps {
  claimId: string;
  currentStatus: string;
  priority: string;
  onStatusUpdate?: (newStatus: string) => void;
}

export function ClaimWorkflow({
  claimId,
  currentStatus,
  priority,
  onStatusUpdate,
}: ClaimWorkflowProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const supabase = createClient();

  // Definir los estados del flujo de trabajo real de una aseguradora
  const workflowStates: Record<
    string,
    {
      label: string;
      description: string;
      color: string;
      icon: any;
      nextStates: string[];
      actions: string[];
    }
  > = {
    // Estados iniciales
    submitted: {
      label: 'Recibida',
      description: 'Reclamación recién enviada por el cliente',
      color: 'bg-blue-500',
      icon: FileText,
      nextStates: ['under_review', 'pending_documentation'],
      actions: ['Revisar', 'Solicitar Documentos'],
    },

    // Estados de revisión
    under_review: {
      label: 'En Revisión',
      description: 'Agente revisando la reclamación inicial',
      color: 'bg-yellow-500',
      icon: Eye,
      nextStates: ['investigating', 'pending_documentation', 'denied'],
      actions: ['Investigar', 'Solicitar Más Documentos', 'Denegar'],
    },

    pending_documentation: {
      label: 'Documentos Pendientes',
      description: 'Esperando documentos adicionales del cliente',
      color: 'bg-orange-500',
      icon: FileCheck,
      nextStates: ['under_review', 'denied'],
      actions: ['Continuar Revisión', 'Denegar por Falta de Documentos'],
    },

    // Estados de investigación
    investigating: {
      label: 'En Investigación',
      description: 'Investigación detallada del siniestro',
      color: 'bg-purple-500',
      icon: Search,
      nextStates: ['waiting_approval', 'denied', 'pending_documentation'],
      actions: ['Aprobar para Pago', 'Denegar', 'Solicitar Más Info'],
    },

    // Estados de aprobación
    waiting_approval: {
      label: 'Esperando Aprobación',
      description: 'Pendiente de aprobación del supervisor',
      color: 'bg-indigo-500',
      icon: UserCheck,
      nextStates: ['approved', 'denied', 'investigating'],
      actions: ['Aprobar', 'Denegar', 'Devolver a Investigación'],
    },

    approved: {
      label: 'Aprobada',
      description: 'Reclamación aprobada para pago',
      color: 'bg-green-500',
      icon: CheckCircle,
      nextStates: ['processing_payment'],
      actions: ['Procesar Pago'],
    },

    // Estados de pago
    processing_payment: {
      label: 'Procesando Pago',
      description: 'Pago en proceso',
      color: 'bg-teal-500',
      icon: CreditCard,
      nextStates: ['paid', 'approved'],
      actions: ['Confirmar Pago', 'Revisar Pago'],
    },

    paid: {
      label: 'Pagada',
      description: 'Pago completado exitosamente',
      color: 'bg-green-600',
      icon: CheckCircle,
      nextStates: ['closed'],
      actions: ['Cerrar Caso'],
    },

    // Estados finales
    denied: {
      label: 'Denegada',
      description: 'Reclamación denegada',
      color: 'bg-red-500',
      icon: XCircle,
      nextStates: ['closed'],
      actions: ['Cerrar Caso'],
    },

    closed: {
      label: 'Cerrada',
      description: 'Caso cerrado completamente',
      color: 'bg-gray-500',
      icon: FileCheck,
      nextStates: [],
      actions: [],
    },
  };

  const updateClaimStatus = async (newStatus: string, action: string) => {
    if (newStatus === currentStatus) return;

    setLoading(true);

    try {
      // Validar que el nuevo estado sea válido desde el estado actual
      const currentStateConfig = workflowStates[currentStatus];
      if (!currentStateConfig?.nextStates.includes(newStatus)) {
        throw new Error(`Transición inválida de ${currentStatus} a ${newStatus}`);
      }

      // Actualizar el estado en la base de datos
      const { error } = await supabase
        .from('claims')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (error) throw error;

      // Registrar la acción en el historial
      await logClaimAction(action, notes);

      // Enviar notificación al cliente si es necesario
      await sendCustomerNotification(newStatus, action);

      toast.success(`Estado actualizado a: ${workflowStates[newStatus]?.label}`);

      // Callback para actualizar la UI parent
      onStatusUpdate?.(newStatus);

      setNotes('');
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast.error('Error al actualizar el estado de la reclamación');
    } finally {
      setLoading(false);
    }
  };

  const logClaimAction = async (action: string, notes: string) => {
    try {
      const { error } = await supabase.from('claim_actions').insert({
        claim_id: claimId,
        action_type: action,
        notes: notes || null,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error logging claim action:', error);
      }
    } catch (error) {
      console.error('Error in logClaimAction:', error);
    }
  };

  const sendCustomerNotification = async (newStatus: string, action: string) => {
    try {
      // Obtener información del cliente
      const { data: claim, error } = await supabase
        .from('claims')
        .select(
          `
          customer:customers(
            id,
            user:users(first_name, email)
          )
        `
        )
        .eq('id', claimId)
        .single();

      if (error || !claim?.customer) return;

      // Crear mensaje personalizado según el estado
      let message = '';
      switch (newStatus) {
        case 'under_review':
          message = 'Su reclamación está siendo revisada por nuestro equipo.';
          break;
        case 'pending_documentation':
          message = 'Necesitamos documentos adicionales para procesar su reclamación.';
          break;
        case 'investigating':
          message = 'Estamos investigando los detalles de su reclamación.';
          break;
        case 'approved':
          message = '¡Buenas noticias! Su reclamación ha sido aprobada.';
          break;
        case 'processing_payment':
          message = 'Estamos procesando el pago de su reclamación.';
          break;
        case 'paid':
          message = 'El pago de su reclamación ha sido procesado exitosamente.';
          break;
        case 'denied':
          message = 'Lamentamos informarle que su reclamación ha sido denegada.';
          break;
        case 'closed':
          message = 'Su caso ha sido cerrado.';
          break;
      }

      // Registrar la comunicación
      await supabase.from('communications').insert({
        customer_id: (claim.customer as any).id,
        communication_type: 'system',
        direction: 'outbound',
        subject: `Actualización de su reclamación`,
        content: message,
        status: 'sent',
      });
    } catch (error) {
      console.error('Error sending customer notification:', error);
    }
  };

  const currentStateConfig = workflowStates[currentStatus];
  const CurrentIcon = currentStateConfig?.icon || AlertCircle;

  if (!currentStateConfig) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Estado de reclamación desconocido: {currentStatus}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CurrentIcon className="h-5 w-5" />
          Flujo de Trabajo
        </CardTitle>
        <CardDescription>Gestione el estado y progreso de la reclamación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado actual */}
        <div className="flex items-center gap-3 p-4 border rounded-lg">
          <CurrentIcon className="h-6 w-6" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{currentStateConfig.label}</h3>
              <Badge className={`${currentStateConfig.color} text-white`}>{currentStatus}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{currentStateConfig.description}</p>
          </div>
        </div>

        {/* Acciones disponibles */}
        {currentStateConfig.nextStates.length > 0 && (
          <div className="space-y-4">
            <Label>Acciones Disponibles</Label>

            {/* Área de notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Añadir notas sobre esta acción..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2">
              {currentStateConfig.nextStates.map((nextState, index) => {
                const nextStateConfig = workflowStates[nextState];
                const action = currentStateConfig.actions[index] || 'Actualizar';
                const NextIcon = nextStateConfig?.icon || AlertCircle;

                return (
                  <Button
                    key={nextState}
                    variant={
                      nextState === 'denied'
                        ? 'destructive'
                        : nextState === 'approved' || nextState === 'paid'
                          ? 'default'
                          : 'outline'
                    }
                    size="sm"
                    disabled={loading}
                    onClick={() => updateClaimStatus(nextState, action)}
                    className="flex items-center gap-2"
                  >
                    <NextIcon className="h-4 w-4" />
                    {action}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado final */}
        {currentStateConfig.nextStates.length === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Esta reclamación ha alcanzado un estado final.</AlertDescription>
          </Alert>
        )}

        {/* Prioridad */}
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Prioridad:</span>
          <Badge
            variant={
              priority === 'urgent'
                ? 'destructive'
                : priority === 'high'
                  ? 'destructive'
                  : priority === 'medium'
                    ? 'default'
                    : 'secondary'
            }
          >
            {priority === 'urgent'
              ? 'Urgente'
              : priority === 'high'
                ? 'Alta'
                : priority === 'medium'
                  ? 'Media'
                  : 'Baja'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
