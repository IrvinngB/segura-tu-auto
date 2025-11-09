'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Calendar, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { format, addYears, isBefore, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Policy {
  id: string;
  policy_number: string;
  policy_type: string;
  status: string;
  start_date: string;
  end_date: string;
  premium_amount: number;
  auto_renewal: boolean;
  customer_id: string;
  vehicle_id: string;
  payment_frequency?: string;
  selected_coverages?: any;
  driver_data?: any;
  vehicle_data?: any;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
}

interface RenewalStats {
  total_policies: number;
  expiring_soon: number;
  auto_renewal_enabled: number;
  manual_renewal_needed: number;
}

export default function PolicyRenewalPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [stats, setStats] = useState<RenewalStats>({
    total_policies: 0,
    expiring_soon: 0,
    auto_renewal_enabled: 0,
    manual_renewal_needed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processingRenewal, setProcessingRenewal] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPoliciesAndStats();
  }, []);

  const fetchPoliciesAndStats = async () => {
    setLoading(true);
    try {
      // Fetch policies expiring in the next 60 days
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const { data: policiesData, error: policiesError } = await supabase
        .from('policies')
        .select(
          `
          *,
          customer:customers(first_name, last_name, email),
          vehicle:vehicles(make, model, year)
        `
        )
        .eq('status', 'active')
        .lte('end_date', sixtyDaysFromNow.toISOString())
        .order('end_date', { ascending: true });

      if (policiesError) throw policiesError;

      // Calculate stats
      const totalPolicies = policiesData?.length || 0;
      const autoRenewalEnabled = policiesData?.filter(p => p.auto_renewal).length || 0;
      const manualRenewalNeeded = totalPolicies - autoRenewalEnabled;

      // Policies expiring in next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringSoon =
        policiesData?.filter(p => new Date(p.end_date) <= thirtyDaysFromNow).length || 0;

      setPolicies(policiesData || []);
      setStats({
        total_policies: totalPolicies,
        expiring_soon: expiringSoon,
        auto_renewal_enabled: autoRenewalEnabled,
        manual_renewal_needed: manualRenewalNeeded,
      });
    } catch (error) {
      console.error('Error fetching policies:', error);
      setMessage({ type: 'error', text: 'Error al cargar las pólizas' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRenewal = async (policyId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('policies')
        .update({ auto_renewal: !currentValue })
        .eq('id', policyId);

      if (error) throw error;

      setPolicies(prev =>
        prev.map(p => (p.id === policyId ? { ...p, auto_renewal: !currentValue } : p))
      );

      setMessage({
        type: 'success',
        text: `Renovación automática ${!currentValue ? 'activada' : 'desactivada'}`,
      });
    } catch (error) {
      console.error('Error updating auto renewal:', error);
      setMessage({ type: 'error', text: 'Error al actualizar la configuración' });
    }
  };

  const renewPolicy = async (policyId: string) => {
    setProcessingRenewal(policyId);
    try {
      const policy = policies.find(p => p.id === policyId);
      if (!policy) throw new Error('Póliza no encontrada');

      // Calculate new dates (1 year from current end date)
      const newStartDate = new Date(policy.end_date);
      const newEndDate = addYears(newStartDate, 1);

      // Generate unique policy number with timestamp and random components
      const timestamp = Date.now();
      const random1 = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      const random2 = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
      let newPolicyNumber = `POL-${timestamp}-${random1}-${random2}`;

      // Extra safety: Check if policy number already exists
      let attempts = 0;
      while (attempts < 5) {
        const { data: existingPolicy } = await supabase
          .from('policies')
          .select('policy_number')
          .eq('policy_number', newPolicyNumber)
          .single();

        if (!existingPolicy) break; // Number is unique, we can use it

        // Generate a new number
        const newTimestamp = Date.now() + Math.floor(Math.random() * 10000);
        const newRandom1 = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        const newRandom2 = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        newPolicyNumber = `POL-${newTimestamp}-${newRandom1}-${newRandom2}`;
        attempts++;
      }

      // Create new policy in pending payment status
      const { data: newPolicy, error: createError } = await supabase
        .from('policies')
        .insert({
          policy_number: newPolicyNumber,
          customer_id: policy.customer_id,
          vehicle_id: policy.vehicle_id,
          policy_type: policy.policy_type,
          status: 'pending_payment',
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString(),
          premium_amount: policy.premium_amount * 1.05, // 5% annual increase
          payment_frequency: policy.payment_frequency,
          auto_renewal: policy.auto_renewal,
          selected_coverages: policy.selected_coverages,
          driver_data: policy.driver_data,
          vehicle_data: policy.vehicle_data,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Don't expire old policy yet - wait for payment
      // It will be expired when payment is completed

      // Copy coverages to new policy
      const { data: oldCoverages } = await supabase
        .from('policy_coverages')
        .select('*')
        .eq('policy_id', policyId);

      if (oldCoverages && oldCoverages.length > 0) {
        const newCoverages = oldCoverages.map(coverage => ({
          policy_id: newPolicy.id,
          coverage_type_id: coverage.coverage_type_id,
          coverage_limit: coverage.coverage_limit,
          deductible: coverage.deductible,
          premium: coverage.premium * 1.05, // 5% increase
        }));

        await supabase.from('policy_coverages').insert(newCoverages);
      }

      // Create pending payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          policy_id: newPolicy.id,
          amount: newPolicy.premium_amount,
          payment_type: 'renewal',
          status: 'pending',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        });

      if (paymentError) console.error('Error creating payment record:', paymentError);

      // Create notification for customer to pay
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: policy.customer_id,
          title: '🔔 Renovación de Póliza - Pago Requerido',
          message: `¡Su póliza ha sido renovada exitosamente! 
          
Póliza anterior: ${policy.policy_number}
Nueva póliza: ${newPolicyNumber}
Monto a pagar: $${(policy.premium_amount * 1.05).toLocaleString()}
Vigencia: 12 meses

Para activar su nueva póliza, complete el pago en la sección "Pagos" de su cuenta.`,
          type: 'payment_required',
          reference_type: 'policy',
          reference_id: newPolicy.id,
        });

      if (notificationError) console.error('Error creating notification:', notificationError);

      // Create internal notification for agents/admins
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('notifications').insert({
          user_id: userData.user.id,
          title: '✅ Renovación Procesada',
          message: `Renovación completada: ${policy.policy_number} → ${newPolicyNumber}. Cliente notificado para pago de $${(policy.premium_amount * 1.05).toLocaleString()}.`,
          type: 'info',
          reference_type: 'policy',
          reference_id: newPolicy.id,
        });
      }

      // Refresh the policies list to get updated data
      await fetchPoliciesAndStats();

      setMessage({
        type: 'success',
        text: `✅ Renovación completada: ${policy.policy_number} → ${newPolicyNumber}. Cliente notificado para realizar el pago de $${(policy.premium_amount * 1.05).toLocaleString()}.`,
      });
    } catch (error) {
      console.error('Error renewing policy:', error);
      setMessage({ type: 'error', text: 'Error al renovar la póliza' });
    } finally {
      setProcessingRenewal(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getExpiryStatus = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return { label: 'Expirada', color: 'bg-red-100 text-red-800' };
    if (days <= 7) return { label: 'Crítica', color: 'bg-red-100 text-red-800' };
    if (days <= 30) return { label: 'Próxima', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Normal', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'agent']}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <RefreshCw className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Renovación de Pólizas</h1>
            <p className="text-muted-foreground">
              Gestiona la renovación automática y manual de pólizas
            </p>
          </div>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expirando</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_policies}</div>
              <p className="text-xs text-muted-foreground">Próximos 60 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expiring_soon}</div>
              <p className="text-xs text-muted-foreground">Próximos 30 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-renovación</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.auto_renewal_enabled}</div>
              <p className="text-xs text-muted-foreground">Activada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manual</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.manual_renewal_needed}
              </div>
              <p className="text-xs text-muted-foreground">Requiere acción</p>
            </CardContent>
          </Card>
        </div>

        {/* Policies List */}
        <div className="space-y-4">
          {policies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">¡Excelente!</h3>
                <p className="text-muted-foreground">
                  No hay pólizas que requieran renovación inmediata.
                </p>
              </CardContent>
            </Card>
          ) : (
            policies.map(policy => {
              const expiryStatus = getExpiryStatus(policy.end_date);
              const daysUntilExpiry = getDaysUntilExpiry(policy.end_date);

              return (
                <Card key={policy.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg">{policy.policy_number}</h3>
                          <Badge className={expiryStatus.color}>{expiryStatus.label}</Badge>
                          <Badge variant="outline">{policy.policy_type}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                            <p className="font-medium">
                              {policy.customer.first_name} {policy.customer.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{policy.customer.email}</p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Vehículo</p>
                            <p className="font-medium">
                              {policy.vehicle.year} {policy.vehicle.make} {policy.vehicle.model}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Vencimiento</p>
                            <p className="font-medium">
                              {format(new Date(policy.end_date), 'dd MMM yyyy', { locale: es })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {daysUntilExpiry > 0
                                ? `${daysUntilExpiry} días restantes`
                                : 'Expirada'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                ${policy.premium_amount.toLocaleString()}/año
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium">Auto-renovación:</label>
                              <Switch
                                checked={policy.auto_renewal}
                                onCheckedChange={() =>
                                  toggleAutoRenewal(policy.id, policy.auto_renewal)
                                }
                              />
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">
                                Nueva prima: ${(policy.premium_amount * 1.05).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cliente pagará después
                              </p>
                            </div>
                            <Button
                              onClick={() => renewPolicy(policy.id)}
                              disabled={processingRenewal === policy.id}
                              size="sm"
                            >
                              {processingRenewal === policy.id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Creando renovación...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Crear Renovación
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
