'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import type { Claim } from '@/lib/types/database';
import { Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StatusHistoryEntry {
  id: string;
  claim_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  change_reason: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface ClaimStatusHistoryProps {
  claim: Claim;
}

export function ClaimStatusHistory({ claim }: ClaimStatusHistoryProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (claim.id) {
      fetchStatusHistory();
    }
  }, [claim.id]);

  const fetchStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('claim_status_history')
        .select(
          `
          *,
          user:users(first_name, last_name, role)
        `
        )
        .eq('claim_id', claim.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Enviada', variant: 'outline' as const },
      under_review: { label: 'En Revisión', variant: 'secondary' as const },
      pending_documentation: { label: 'Pendiente Docs', variant: 'outline' as const },
      waiting_approval: { label: 'Esperando Aprobación', variant: 'secondary' as const },
      investigating: { label: 'Investigando', variant: 'default' as const },
      approved: { label: 'Aprobada', variant: 'default' as const },
      processing_payment: { label: 'Procesando Pago', variant: 'secondary' as const },
      denied: { label: 'Denegada', variant: 'destructive' as const },
      closed: { label: 'Cerrada', variant: 'secondary' as const },
      paid: { label: 'Pagada', variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      admin: 'Administrador',
      agent: 'Agente',
      adjuster: 'Ajustador',
      customer: 'Cliente',
      evaluator: 'Evaluador',
    };
    return roles[role as keyof typeof roles] || role;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando historial...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Estados
        </CardTitle>
        <CardDescription>Registro de todos los cambios de estado de la reclamación</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay cambios de estado registrados
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estado actual */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium">Estado Actual</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(claim.updated_at || claim.created_at), 'dd/MM/yyyy HH:mm', {
                      locale: es,
                    })}
                  </div>
                </div>
              </div>
              <div>{getStatusBadge(claim.status)}</div>
            </div>

            {/* Historial de cambios */}
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {entry.user?.first_name} {entry.user?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getRoleLabel(entry.user?.role)} •{' '}
                      {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                    {entry.change_reason && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {entry.change_reason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(entry.previous_status)}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  {getStatusBadge(entry.new_status)}
                </div>
              </div>
            ))}

            {/* Estado inicial */}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Reclamación Creada</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(claim.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </div>
                </div>
              </div>
              <div>{getStatusBadge('submitted')}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
