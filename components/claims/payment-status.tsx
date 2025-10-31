'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Claim } from '@/lib/types/database';
import { DollarSign, CheckCircle, Clock, AlertCircle, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentStatusProps {
  claim: Claim;
  onProcessPayment?: () => void;
  onConfirmPayment?: () => void;
}

export function PaymentStatus({ claim, onProcessPayment, onConfirmPayment }: PaymentStatusProps) {
  const getPaymentStatusInfo = () => {
    switch (claim.status) {
      case 'approved':
        return {
          icon: <Clock className="h-6 w-6 text-blue-500" />,
          title: 'Reclamación Aprobada',
          description: 'Lista para procesar el pago',
          color: 'blue',
          action: onProcessPayment,
        };
      case 'processing_payment':
        return {
          icon: <CreditCard className="h-6 w-6 text-yellow-500" />,
          title: 'Procesando Pago',
          description: 'El pago está siendo procesado',
          color: 'yellow',
          action: onConfirmPayment,
        };
      case 'paid':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-500" />,
          title: 'Pago Completado',
          description: 'El pago ha sido realizado exitosamente',
          color: 'green',
        };
      default:
        return null;
    }
  };

  const statusInfo = getPaymentStatusInfo();

  if (!statusInfo || !['approved', 'processing_payment', 'paid'].includes(claim.status)) {
    return null;
  }

  const netAmount = (claim.approved_amount || 0) - (claim.deductible_amount || 0);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <CardTitle className="text-lg">{statusInfo.title}</CardTitle>
              <CardDescription>{statusInfo.description}</CardDescription>
            </div>
          </div>
          <Badge variant={statusInfo.color === 'green' ? 'default' : 'outline'}>
            {claim.status === 'approved' && 'Listo para Pago'}
            {claim.status === 'processing_payment' && 'En Proceso'}
            {claim.status === 'paid' && 'Pagado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen Financiero */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Resumen de Pago
          </h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto Aprobado:</span>
              <span className="font-medium">${claim.approved_amount?.toLocaleString() || '0'}</span>
            </div>

            {claim.deductible_amount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deducible:</span>
                <span className="font-medium text-red-600">
                  -${claim.deductible_amount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t pt-2 col-span-2">
              <span className="font-semibold">Monto a Pagar:</span>
              <span className="font-bold text-green-600 text-lg">
                ${netAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Información de Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Fecha de Aprobación:</span>
            <p className="font-medium">
              {format(new Date(claim.updated_at || claim.created_at), 'dd/MM/yyyy HH:mm', {
                locale: es,
              })}
            </p>
          </div>

          {claim.status === 'paid' && claim.paid_amount && (
            <div>
              <span className="text-muted-foreground">Fecha de Pago:</span>
              <p className="font-medium">
                {format(new Date(claim.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        {statusInfo.action && (
          <div className="flex gap-2 pt-2">
            <Button onClick={statusInfo.action} className="flex items-center gap-2">
              {claim.status === 'approved' && (
                <>
                  <CreditCard className="h-4 w-4" />
                  Iniciar Proceso de Pago
                </>
              )}
              {claim.status === 'processing_payment' && (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Pago Realizado
                </>
              )}
            </Button>
          </div>
        )}

        {/* Información Adicional */}
        {claim.status === 'processing_payment' && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Proceso de Pago en Curso</p>
                <p className="text-yellow-700">
                  El pago está siendo procesado. Una vez completado, confirme el pago para cerrar la
                  reclamación.
                </p>
              </div>
            </div>
          </div>
        )}

        {claim.status === 'paid' && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Pago Completado</p>
                <p className="text-green-700">
                  El pago de ${claim.paid_amount?.toLocaleString()} ha sido realizado exitosamente.
                  La reclamación puede ser cerrada.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
