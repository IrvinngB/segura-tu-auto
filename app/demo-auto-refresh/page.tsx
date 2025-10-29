'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AutoRefreshIndicator } from '@/components/ui/auto-refresh-indicator';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { CheckCircle, Clock, Zap, Wifi, RotateCcw, Play, Pause } from 'lucide-react';

export default function AutoRefreshDemoPage() {
  const { userProfile } = useAuth();
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [claimsCount, setClaimsCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);
  const supabase = createClient();

  // Función para obtener conteo de reclamaciones
  const fetchClaimsCount = async () => {
    setLoading(true);
    try {
      let query = supabase.from('claims').select('id', { count: 'exact' });

      if (userProfile?.role === 'customer') {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', userProfile.id)
          .single();
        if (customer) {
          query = query.eq('customer_id', customer.id);
        }
      } else if (userProfile?.role === 'agent') {
        query = query.in('status', [
          'submitted',
          'under_review',
          'pending_documentation',
          'approved',
          'processing_payment',
          'paid',
          'denied',
        ]);
      } else if (userProfile?.role === 'adjuster') {
        query = query.in('status', ['investigating', 'waiting_approval', 'approved', 'denied']);
      }

      const { count, error } = await query;
      if (error) throw error;

      setClaimsCount(count || 0);
      setLastUpdate(new Date());
      setRefreshCount(prev => prev + 1);

      console.log(`✅ Actualización automática #${refreshCount + 1} - Reclamaciones: ${count}`);
    } catch (error) {
      console.error('❌ Error en auto-refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh cada 10 segundos (más rápido para demostración)
  useEffect(() => {
    if (!userProfile || !isAutoRefreshEnabled) return;

    fetchClaimsCount(); // Primera carga

    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh ejecutándose...');
      fetchClaimsCount();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [userProfile, isAutoRefreshEnabled]);

  // Suscripción en tiempo real
  useEffect(() => {
    if (!userProfile) return;

    const subscription = supabase
      .channel('demo-claims-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
        },
        payload => {
          const eventMsg = `${new Date().toLocaleTimeString()} - ${payload.eventType} en reclamaciones`;
          setRealtimeEvents(prev => [eventMsg, ...prev.slice(0, 4)]); // Mantener solo 5 eventos

          console.log('🔔 Evento en tiempo real:', payload);
          fetchClaimsCount(); // Actualizar inmediatamente
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userProfile]);

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(!isAutoRefreshEnabled);
    if (isAutoRefreshEnabled) {
      console.log('⏸️ Auto-refresh pausado');
    } else {
      console.log('▶️ Auto-refresh reanudado');
    }
  };

  const manualRefresh = () => {
    console.log('🔄 Refresh manual ejecutado');
    fetchClaimsCount();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!userProfile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Necesitas estar autenticado para ver esta demostración.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">⚡ Demostración de Auto-Actualización</h1>
        <p className="text-muted-foreground">
          Observa cómo las reclamaciones se actualizan automáticamente cada 10 segundos
        </p>
      </div>

      {/* Panel de Control */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Panel de Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleAutoRefresh}
                variant={isAutoRefreshEnabled ? 'destructive' : 'default'}
              >
                {isAutoRefreshEnabled ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar Auto-Refresh
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activar Auto-Refresh
                  </>
                )}
              </Button>

              <Button onClick={manualRefresh} variant="outline" disabled={loading}>
                <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Manual
              </Button>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Actualizaciones realizadas: <strong>{refreshCount}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Rol actual: <strong>{userProfile.role}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos en Tiempo Real */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📊 Datos de Reclamaciones</CardTitle>
            <CardDescription>Se actualiza automáticamente cada 10 segundos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Indicador de auto-refresh */}
            <AutoRefreshIndicator
              lastUpdated={lastUpdate}
              isLoading={loading}
              refreshInterval={10}
              showRealtimeStatus={true}
            />

            {/* Contador principal */}
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-4xl font-bold text-primary mb-2">{claimsCount}</div>
              <p className="text-sm text-muted-foreground">Reclamaciones para tu rol</p>
            </div>

            {/* Información de última actualización */}
            {lastUpdate && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Última actualización:</span>
                </div>
                <span className="font-mono">{formatTime(lastUpdate)}</span>
              </div>
            )}

            {/* Estado del auto-refresh */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isAutoRefreshEnabled ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600">Auto-refresh ACTIVO</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-red-500 rounded-full" />
                    <span className="text-red-600">Auto-refresh PAUSADO</span>
                  </>
                )}
              </div>
              <Badge variant="outline">Cada 10s</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Eventos en Tiempo Real */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Eventos en Tiempo Real
            </CardTitle>
            <CardDescription>Cambios detectados instantáneamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Wifi className="h-4 w-4 text-green-600" />
                <span>Conectado a Supabase Realtime</span>
              </div>

              <div className="border rounded-lg p-3 bg-muted/20">
                <h4 className="text-sm font-medium mb-2">Últimos eventos:</h4>
                {realtimeEvents.length > 0 ? (
                  <div className="space-y-1">
                    {realtimeEvents.map((event, index) => (
                      <div key={index} className="text-xs font-mono text-muted-foreground">
                        {event}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Esperando eventos... Modifica una reclamación para ver la actualización
                    instantánea.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Cómo Probar la Funcionalidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-primary mb-2">Auto-Actualización:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Observa el contador de 10 segundos</li>
                <li>• Ve cómo se actualiza automáticamente</li>
                <li>• Pausa/reanuda según necesites</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-primary mb-2">Tiempo Real:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Abre otra pestaña del sistema</li>
                <li>• Modifica una reclamación</li>
                <li>• Ve la actualización instantánea aquí</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
