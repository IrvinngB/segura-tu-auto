'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import type { Claim } from '@/lib/types/database';
import { AlertTriangle, Clock, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClaimAlert {
  claim: Claim;
  daysInStatus: number;
  alertType: 'overdue' | 'warning' | 'urgent';
  reason: string;
}

export function ClaimAlerts() {
  const { userProfile } = useAuth();
  const [alerts, setAlerts] = useState<ClaimAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Solo mostrar para roles que pueden procesar reclamaciones
  const canViewAlerts =
    userProfile?.role === 'agent' ||
    userProfile?.role === 'adjuster' ||
    userProfile?.role === 'admin';

  useEffect(() => {
    if (canViewAlerts) {
      fetchClaimAlerts();
    }
  }, [userProfile]);

  const fetchClaimAlerts = async () => {
    try {
      const { data: claims, error } = await supabase
        .from('claims')
        .select(
          `
          *,
          policy:policies(*),
          customer:customers(
            *,
            user:users(*)
          )
        `
        )
        .in('status', [
          'submitted',
          'under_review',
          'pending_documentation',
          'waiting_approval',
          'investigating',
        ])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const claimAlerts: ClaimAlert[] = [];
      const now = new Date();

      claims?.forEach(claim => {
        const statusUpdatedAt = new Date(claim.updated_at || claim.created_at);
        const daysInStatus = Math.floor(
          (now.getTime() - statusUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        let alertType: 'overdue' | 'warning' | 'urgent' = 'warning';
        let reason = '';

        // Lógica de alertas según estado y tiempo
        switch (claim.status) {
          case 'submitted':
            if (daysInStatus > 3) {
              alertType = 'overdue';
              reason = 'Reclamación enviada hace más de 3 días sin revisar';
            } else if (daysInStatus > 1) {
              alertType = 'warning';
              reason = 'Reclamación enviada hace más de 1 día';
            }
            break;

          case 'under_review':
            if (daysInStatus > 7) {
              alertType = 'urgent';
              reason = 'En revisión hace más de 7 días - Requiere acción inmediata';
            } else if (daysInStatus > 3) {
              alertType = 'overdue';
              reason = 'En revisión hace más de 3 días';
            }
            break;

          case 'pending_documentation':
            if (daysInStatus > 14) {
              alertType = 'urgent';
              reason = 'Esperando documentos hace más de 14 días - Considerar denegar';
            } else if (daysInStatus > 7) {
              alertType = 'overdue';
              reason = 'Esperando documentos hace más de 7 días';
            }
            break;

          case 'waiting_approval':
            if (daysInStatus > 5) {
              alertType = 'urgent';
              reason = 'Esperando aprobación hace más de 5 días';
            } else if (daysInStatus > 2) {
              alertType = 'overdue';
              reason = 'Esperando aprobación hace más de 2 días';
            }
            break;

          case 'investigating':
            if (daysInStatus > 10) {
              alertType = 'urgent';
              reason = 'Investigación en curso hace más de 10 días';
            } else if (daysInStatus > 5) {
              alertType = 'overdue';
              reason = 'Investigación en curso hace más de 5 días';
            }
            break;
        }

        if (reason) {
          claimAlerts.push({
            claim,
            daysInStatus,
            alertType,
            reason,
          });
        }
      });

      // Ordenar por urgencia y luego por días
      claimAlerts.sort((a, b) => {
        const urgencyOrder = { urgent: 3, overdue: 2, warning: 1 };
        if (urgencyOrder[a.alertType] !== urgencyOrder[b.alertType]) {
          return urgencyOrder[b.alertType] - urgencyOrder[a.alertType];
        }
        return b.daysInStatus - a.daysInStatus;
      });

      setAlerts(claimAlerts);
    } catch (error) {
      console.error('Error fetching claim alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'overdue':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getAlertBadge = (alertType: string) => {
    switch (alertType) {
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
      case 'overdue':
        return (
          <Badge variant="secondary" className="bg-orange-500 text-white">
            Atrasado
          </Badge>
        );
      default:
        return <Badge variant="outline">Advertencia</Badge>;
    }
  };

  if (!canViewAlerts || loading) {
    return null;
  }

  if (alerts.length === 0) {
    return (
      <Alert className="mb-6">
        <Bell className="h-4 w-4" />
        <AlertDescription>
          No hay reclamaciones que requieran atención especial en este momento.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Reclamaciones que Requieren Atención ({alerts.length})
        </CardTitle>
        <CardDescription>
          Reclamaciones que han estado mucho tiempo en el mismo estado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.slice(0, 5).map(alert => (
          <div
            key={alert.claim.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              {getAlertIcon(alert.alertType)}
              <div>
                <div className="font-medium">
                  {alert.claim.claim_number} - {alert.claim.customer?.user?.first_name}{' '}
                  {alert.claim.customer?.user?.last_name}
                </div>
                <div className="text-sm text-muted-foreground">{alert.reason}</div>
                <div className="text-xs text-muted-foreground">
                  Actualizado:{' '}
                  {format(
                    new Date(alert.claim.updated_at || alert.claim.created_at),
                    'dd/MM/yyyy',
                    { locale: es }
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getAlertBadge(alert.alertType)}
              <Badge variant="outline">{alert.daysInStatus} días</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/claims/${alert.claim.id}?tab=processing`, '_blank')}
              >
                Procesar
              </Button>
            </div>
          </div>
        ))}
        {alerts.length > 5 && (
          <div className="text-center text-sm text-muted-foreground">
            ... y {alerts.length - 5} reclamaciones más que requieren atención
          </div>
        )}
      </CardContent>
    </Card>
  );
}
