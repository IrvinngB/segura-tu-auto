'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ClaimMonitorData {
  id: string;
  claim_number: string;
  status: string;
  updated_at: string;
  customer_name: string;
}

export function AdminClaimMonitor() {
  const [claims, setClaims] = useState<ClaimMonitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAllClaims();

    // Suscripción en tiempo real para monitorear cambios
    console.log('🔍 MONITOR ADMIN - Configurando suscripción...');
    const channel = supabase
      .channel('admin-claim-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
        },
        payload => {
          console.log('🔍 MONITOR ADMIN - Cambio detectado:', payload);
          console.log('🔍 MONITOR ADMIN - Tipo:', payload.eventType);
          console.log('🔍 MONITOR ADMIN - Datos nuevos:', payload.new);
          console.log('🔍 MONITOR ADMIN - Datos anteriores:', payload.old);

          setTimeout(() => {
            console.log('🔍 MONITOR ADMIN - Refrescando lista...');
            fetchAllClaims();
          }, 500);
        }
      )
      .subscribe(status => {
        console.log('🔍 MONITOR ADMIN - Estado suscripción:', status);
      });

    return () => {
      console.log('🔍 MONITOR ADMIN - Desconectando...');
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllClaims = async () => {
    try {
      setLoading(true);
      console.log('🔍 MONITOR ADMIN - Obteniendo todas las reclamaciones...');

      const { data, error } = await supabase
        .from('claims')
        .select(
          `
          id,
          claim_number,
          status,
          updated_at,
          customer:customers(
            user:users(first_name, last_name)
          )
        `
        )
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedClaims =
        data?.map((claim: any) => ({
          id: claim.id,
          claim_number: claim.claim_number,
          status: claim.status,
          updated_at: claim.updated_at,
          customer_name:
            `${claim.customer?.user?.first_name || ''} ${claim.customer?.user?.last_name || ''}`.trim(),
        })) || [];

      console.log('🔍 MONITOR ADMIN - Reclamaciones obtenidas:', formattedClaims.length);
      formattedClaims.forEach(claim => {
        console.log(`🔍 ${claim.claim_number}: ${claim.status} (${claim.updated_at})`);
      });

      setClaims(formattedClaims);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error obteniendo reclamaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Enviada', color: 'bg-blue-500' },
      under_review: { label: 'En Revisión', color: 'bg-yellow-500' },
      investigating: { label: 'En Investigación', color: 'bg-green-500' },
      waiting_approval: { label: 'Esperando Aprobación', color: 'bg-orange-500' },
      approved: { label: 'Aprobada', color: 'bg-green-600' },
      denied: { label: 'Denegada', color: 'bg-red-500' },
      paid: { label: 'Pagada', color: 'bg-purple-500' },
      closed: { label: 'Cerrada', color: 'bg-gray-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-400',
    };

    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}
      >
        {config.label}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            🔍 Monitor de Estados - Todas las Reclamaciones
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchAllClaims} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualizando...' : 'Refrescar'}
          </Button>
        </div>
        {lastUpdate && (
          <p className="text-sm text-muted-foreground">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {claims.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {loading ? 'Cargando reclamaciones...' : 'No hay reclamaciones'}
            </p>
          ) : (
            claims.map(claim => (
              <div
                key={claim.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">{claim.claim_number}</span>
                    {getStatusBadge(claim.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{claim.customer_name}</span>
                    <span className="mx-2">•</span>
                    <span>
                      Actualizado:{' '}
                      {format(new Date(claim.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                </div>
                <Link href={`/claims/${claim.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
