'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { useRecentClaims } from '@/hooks/use-recent-claims';
import { CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function TestSyncPage() {
  const { userProfile } = useAuth();
  const { recentClaims, stats, loading, lastUpdated, refresh } = useRecentClaims(5);
  const [manualClaims, setManualClaims] = useState<any[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [lastManualUpdate, setLastManualUpdate] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'different' | 'checking'>('checking');
  const supabase = createClient();

  // Obtener datos manualmente para comparar
  const fetchManualData = async () => {
    if (!userProfile) return;

    setManualLoading(true);
    try {
      let query = supabase
        .from('claims')
        .select('id, claim_number, claim_type, priority, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (userProfile.role === 'customer') {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', userProfile.id)
          .single();

        if (customerData) {
          query = query.eq('customer_id', customerData.id);
        }
      } else if (userProfile.role === 'agent') {
        query = query.in('status', [
          'submitted',
          'under_review',
          'pending_documentation',
          'approved',
          'processing_payment',
          'paid',
          'denied',
        ]);
      } else if (userProfile.role === 'adjuster') {
        query = query.in('status', ['investigating', 'waiting_approval', 'approved', 'denied']);
      }

      const { data, error } = await query;
      if (error) throw error;

      setManualClaims(data || []);
      setLastManualUpdate(new Date());
    } catch (error) {
      console.error('Error fetching manual data:', error);
    } finally {
      setManualLoading(false);
    }
  };

  // Comparar datos para verificar sincronización
  useEffect(() => {
    if (recentClaims.length > 0 && manualClaims.length > 0) {
      const hookIds = recentClaims.map(c => c.id).sort();
      const manualIds = manualClaims.map(c => c.id).sort();

      const areSynced = JSON.stringify(hookIds) === JSON.stringify(manualIds);
      setSyncStatus(areSynced ? 'synced' : 'different');
    }
  }, [recentClaims, manualClaims]);

  // Fetch inicial
  useEffect(() => {
    fetchManualData();
  }, [userProfile]);

  const handleRefreshBoth = () => {
    refresh();
    fetchManualData();
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'submitted':
      case 'under_review':
        return 'secondary';
      case 'pending_documentation':
      case 'investigating':
      case 'waiting_approval':
        return 'outline';
      case 'approved':
      case 'paid':
        return 'default';
      case 'processing_payment':
        return 'secondary';
      case 'denied':
      case 'closed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      submitted: 'Enviada',
      under_review: 'En Revisión',
      pending_documentation: 'Documentos Pendientes',
      investigating: 'Investigando',
      waiting_approval: 'Esperando Aprobación',
      approved: 'Aprobada',
      processing_payment: 'Procesando Pago',
      paid: 'Pagada',
      denied: 'Denegada',
      closed: 'Cerrada',
    };
    return statusLabels[status] || status;
  };

  if (!userProfile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Necesitas estar autenticado para usar esta página de pruebas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧪 Prueba de Sincronización</h1>
          <p className="text-muted-foreground">
            Verificación de sincronización entre Dashboard y Lista de Reclamaciones
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {syncStatus === 'synced' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Sincronizado</span>
              </div>
            )}
            {syncStatus === 'different' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Diferencias detectadas</span>
              </div>
            )}
            {syncStatus === 'checking' && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Verificando...</span>
              </div>
            )}
          </div>
          <Button onClick={handleRefreshBoth} disabled={loading || manualLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Todo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos del Hook (Dashboard) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📊 Datos del Dashboard (Hook)</CardTitle>
            <CardDescription>
              Rol: {userProfile.role} | Último update: {lastUpdated?.toLocaleTimeString() || 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                Total Pólizas: <strong>{stats.totalPolicies}</strong>
              </div>
              <div>
                Reclamaciones Activas: <strong>{stats.activeClaims}</strong>
              </div>
              <div>
                Total Clientes: <strong>{stats.totalClients}</strong>
              </div>
              <div>
                Evaluaciones Pendientes: <strong>{stats.pendingAssessments}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Reclamaciones Recientes ({recentClaims.length})</h4>
              {recentClaims.length > 0 ? (
                recentClaims.map(claim => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="text-sm font-medium">{claim.claim_number}</p>
                      <p className="text-xs text-muted-foreground">{claim.claim_type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={getStatusBadgeVariant(claim.status)} className="text-xs">
                        {getStatusLabel(claim.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(claim.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay reclamaciones</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datos Manuales (Comparación) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Datos Manuales (Comparación)
            </CardTitle>
            <CardDescription>
              Consulta directa a BD | Último update:{' '}
              {lastManualUpdate?.toLocaleTimeString() || 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Reclamaciones Directas ({manualClaims.length})</h4>
              {manualClaims.length > 0 ? (
                manualClaims.map(claim => (
                  <div
                    key={claim.id}
                    className={`flex items-center justify-between p-2 border rounded ${
                      !recentClaims.find(c => c.id === claim.id) ? 'border-red-200 bg-red-50' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{claim.claim_number}</p>
                      <p className="text-xs text-muted-foreground">{claim.claim_type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={getStatusBadgeVariant(claim.status)} className="text-xs">
                        {getStatusLabel(claim.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(claim.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay reclamaciones</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de Sincronización */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert
            className={
              syncStatus === 'synced' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }
          >
            {syncStatus === 'synced' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              {syncStatus === 'synced' && (
                <div>
                  <strong>✅ Datos sincronizados correctamente</strong>
                  <p className="mt-1 text-sm">
                    El dashboard y la lista de reclamaciones muestran los mismos datos.
                  </p>
                </div>
              )}
              {syncStatus === 'different' && (
                <div>
                  <strong>⚠️ Se detectaron diferencias</strong>
                  <p className="mt-1 text-sm">
                    Los datos del dashboard y la consulta manual no coinciden. Esto podría indicar
                    un problema de sincronización.
                  </p>
                </div>
              )}
              {syncStatus === 'checking' && (
                <div>
                  <strong>🔄 Verificando sincronización...</strong>
                  <p className="mt-1 text-sm">Comparando datos entre fuentes.</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>1. Auto-actualización:</strong> Los datos se actualizan automáticamente cada 30
            segundos.
          </p>
          <p>
            <strong>2. Tiempo real:</strong> Los cambios en la base de datos activan actualizaciones
            inmediatas.
          </p>
          <p>
            <strong>3. Sincronización:</strong> El indicador muestra si los datos están
            sincronizados.
          </p>
          <p>
            <strong>4. Prueba:</strong> Modifica una reclamación en otro lugar y observa las
            actualizaciones aquí.
          </p>
          <p>
            <strong>5. Roles:</strong> Los datos mostrados varían según tu rol ({userProfile.role}).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
