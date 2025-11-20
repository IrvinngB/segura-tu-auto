'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import type { Policy, Vehicle, Customer } from '@/lib/types/database';
import {
  Calendar,
  RefreshCw,
  Shield,
  Car,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
} from 'lucide-react';
import { format, addYears } from 'date-fns';
import { es } from 'date-fns/locale';

interface PolicyRenewalProps {
  policy: Policy;
  onRenewalSuccess: (renewedPolicy: Policy) => void;
  onClose: () => void;
}

export function PolicyRenewal({ policy, onRenewalSuccess, onClose }: PolicyRenewalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'review' | 'confirm' | 'processing' | 'success'>('review');
  const [renewedPolicy, setRenewedPolicy] = useState<Policy | null>(null);

  const supabase = createClient();

  // Calcular nuevas fechas y prima
  const newStartDate = new Date();
  const newEndDate = addYears(newStartDate, 1);
  const renewalPremium = Math.round(policy.premium_amount * 1.05); // 5% de incremento anual

  const handleRenewal = async () => {
    if (step !== 'confirm') return;

    setLoading(true);
    setStep('processing');
    setError('');

    try {
      // Generar nuevo número de póliza
      const newPolicyNumber = `${policy.policy_number}-R${new Date().getFullYear()}`;

      // Crear nueva póliza renovada (aprobada, pendiente de pago)
      const { data: newPolicy, error: policyError } = await supabase
        .from('policies')
        .insert({
          policy_number: newPolicyNumber,
          customer_id: policy.customer_id,
          vehicle_id: policy.vehicle_id,
          agent_id: policy.agent_id,
          policy_type: policy.policy_type,
          status: 'approved',
          start_date: format(newStartDate, 'yyyy-MM-dd'),
          end_date: format(newEndDate, 'yyyy-MM-dd'),
          premium_amount: renewalPremium,
          total_coverage_limit: policy.total_coverage_limit,
          payment_frequency: policy.payment_frequency,
          auto_renewal: policy.auto_renewal,
          risk_assessment: policy.risk_assessment,
        })
        .select(
          `
          *,
          customer:customers(*),
          vehicle:vehicles(*),
          agent:users(first_name, last_name, email)
        `
        )
        .single();

      if (policyError) throw policyError;

      // Copiar coberturas de la póliza anterior
      const { data: oldCoverages } = await supabase
        .from('policy_coverages')
        .select('*')
        .eq('policy_id', policy.id);

      if (oldCoverages && oldCoverages.length > 0) {
        const newCoverages = oldCoverages.map(coverage => ({
          policy_id: newPolicy.id,
          coverage_type_id: coverage.coverage_type_id,
          coverage_limit: coverage.coverage_limit,
          deductible: coverage.deductible,
          premium: Math.round(coverage.premium * 1.05), // Mismo incremento que la prima total
        }));

        const { error: coverageError } = await supabase
          .from('policy_coverages')
          .insert(newCoverages);

        if (coverageError) throw coverageError;
      }

      // Actualizar póliza anterior como renovada
      const { error: updateError } = await supabase
        .from('policies')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', policy.id);

      if (updateError) throw updateError;

      // Crear comunicación automática
      await supabase.from('communications').insert({
        customer_id: policy.customer_id,
        policy_id: newPolicy.id,
        communication_type: 'email',
        direction: 'outbound',
        subject: `Póliza Renovada - ${newPolicyNumber}`,
        content: `Su póliza ha sido renovada y está pendiente de pago. Complete el pago para activarla. Nueva vigencia: ${format(newStartDate, 'dd/MM/yyyy', { locale: es })} al ${format(newEndDate, 'dd/MM/yyyy', { locale: es })}. Prima anual: $${renewalPremium.toLocaleString('es-CO')}`,
        status: 'sent',
      });

      setRenewedPolicy(newPolicy);
      setStep('success');

      setTimeout(() => {
        onRenewalSuccess(newPolicy);
      }, 2000);
    } catch (err: any) {
      console.error('Error renovando póliza:', err);
      setError(err.message || 'Error al renovar la póliza');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'review':
        return (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Su póliza está vencida desde el{' '}
                {format(new Date(policy.end_date), 'dd/MM/yyyy', { locale: es })}. Es importante
                renovarla para mantener su cobertura.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de la póliza actual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Shield className="h-5 w-5" />
                    Póliza Vencida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-medium">{policy.policy_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{policy.policy_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vigencia:</span>
                    <span className="font-medium">
                      {format(new Date(policy.start_date), 'dd/MM/yyyy', { locale: es })} -{' '}
                      {format(new Date(policy.end_date), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prima:</span>
                    <span className="font-medium">
                      ${policy.premium_amount.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <Badge variant="destructive" className="w-full justify-center">
                    VENCIDA
                  </Badge>
                </CardContent>
              </Card>

              {/* Información de la renovación */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <RefreshCw className="h-5 w-5" />
                    Nueva Póliza
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-medium">
                      {policy.policy_number}-R{new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{policy.policy_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vigencia:</span>
                    <span className="font-medium">
                      {format(newStartDate, 'dd/MM/yyyy', { locale: es })} -{' '}
                      {format(newEndDate, 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prima:</span>
                    <span className="font-medium">${renewalPremium.toLocaleString('es-CO')}</span>
                  </div>
                  <Badge variant="default" className="w-full justify-center bg-green-600">
                    NUEVA - 12 MESES
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Información del vehículo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehículo Asegurado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Marca</span>
                    <p className="font-medium">{policy.vehicle?.make}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Modelo</span>
                    <p className="font-medium">{policy.vehicle?.model}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Año</span>
                    <p className="font-medium">{policy.vehicle?.year}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Placa</span>
                    <p className="font-medium">{policy.vehicle?.license_plate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incremento de prima */}
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>Incremento anual:</strong> La prima ha sido ajustada con un incremento del
                5% (+${(renewalPremium - policy.premium_amount).toLocaleString('es-CO')}) según las
                tarifas vigentes.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Confirmar Renovación</h3>
              <p className="text-muted-foreground">
                ¿Está seguro que desea renovar su póliza con las condiciones mostradas?
              </p>
            </div>

            <Card className="border-green-200">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Nueva póliza:</span>
                    <span>
                      {policy.policy_number}-R{new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vigencia:</span>
                    <span>12 meses</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prima anual:</span>
                    <span className="text-green-600 font-bold">
                      ${renewalPremium.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-4 py-8">
            <Clock className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
            <h3 className="text-lg font-semibold">Procesando Renovación</h3>
            <p className="text-muted-foreground">
              Estamos creando su nueva póliza. Por favor espere...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold text-green-600">¡Renovación Exitosa!</h3>
            <p className="text-muted-foreground">Su póliza ha sido renovada. Complete el pago para activarla.</p>
            {renewedPolicy && (
              <Card className="border-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Nueva póliza:</span>
                      <span className="font-medium">{renewedPolicy.policy_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <Badge variant="default" className="bg-green-600">
                        ACTIVA
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'review':
        return (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => setStep('confirm')} className="bg-green-600 hover:bg-green-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Continuar Renovación
            </Button>
          </div>
        );

      case 'confirm':
        return (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStep('review')}>
              Volver
            </Button>
            <Button
              onClick={handleRenewal}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Confirmar y Pagar
            </Button>
          </div>
        );

      case 'processing':
        return null;

      case 'success':
        return (
          <div className="flex justify-center">
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              Entendido
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Renovación de Póliza
          </DialogTitle>
          <DialogDescription>
            Renueve su póliza vencida para continuar con su protección vehicular
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {renderStepContent()}

        <Separator />

        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}
