'use client';

import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

interface SimpleRealtimeIndicatorProps {
  lastUpdated?: Date | null;
  isLoading?: boolean;
  showTimestamp?: boolean;
}

export function SimpleRealtimeIndicator({
  lastUpdated,
  isLoading = false,
  showTimestamp = true,
}: SimpleRealtimeIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex items-center justify-between text-xs py-2 px-3 bg-muted/20 rounded-lg border">
      {/* Estado en tiempo real */}
      <div className="flex items-center gap-2">
        {isLoading ? (
          <div className="flex items-center gap-1 text-blue-600">
            <RotateCcw className="h-3 w-3 animate-spin" />
            <span>Actualizando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <Badge variant="secondary" className="text-xs">
              <Wifi className="h-3 w-3 mr-1" />
              Tiempo Real
            </Badge>
          </div>
        )}
      </div>

      {/* Timestamp */}
      {showTimestamp && lastUpdated && (
        <span className="text-muted-foreground">{formatTime(lastUpdated)}</span>
      )}
    </div>
  );
}
