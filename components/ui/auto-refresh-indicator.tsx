'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Wifi, WifiOff, RotateCcw } from 'lucide-react';

interface AutoRefreshIndicatorProps {
  lastUpdated?: Date | null;
  isLoading?: boolean;
  refreshInterval?: number; // en segundos
  showRealtimeStatus?: boolean;
}

export function AutoRefreshIndicator({
  lastUpdated,
  isLoading = false,
  refreshInterval = 15,
  showRealtimeStatus = true,
}: AutoRefreshIndicatorProps) {
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(refreshInterval);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);

  // Countdown para el próximo refresh
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      setSecondsUntilRefresh(prev => {
        if (prev <= 1) {
          return refreshInterval; // Reiniciar contador
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, isLoading]);

  // Reiniciar contador cuando se hace una actualización
  useEffect(() => {
    if (lastUpdated) {
      setSecondsUntilRefresh(refreshInterval);
    }
  }, [lastUpdated, refreshInterval]);

  // Simular estado de conexión realtime (en producción esto vendría de Supabase)
  useEffect(() => {
    // Detectar estado de conexión (simulado)
    const checkConnection = () => {
      setIsRealtimeConnected(navigator.onLine);
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="border-0 shadow-none bg-muted/30">
      <CardContent className="p-3">
        <div className="flex items-center justify-between text-xs">
          {/* Estado de actualización */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-1 text-blue-600">
                <RotateCcw className="h-3 w-3 animate-spin" />
                <span>Actualizando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-600">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span>Tiempo Real Activo</span>
              </div>
            )}
          </div>

          {/* Estado de tiempo real */}
          {showRealtimeStatus && (
            <div className="flex items-center gap-2">
              <Badge
                variant={isRealtimeConnected ? 'default' : 'destructive'}
                className="text-xs py-0 px-2"
              >
                {isRealtimeConnected ? (
                  <div className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    <span>Tiempo Real</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    <span>Desconectado</span>
                  </div>
                )}
              </Badge>
            </div>
          )}

          {/* Última actualización */}
          {lastUpdated && (
            <div className="text-muted-foreground">Actualizado: {formatTime(lastUpdated)}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
