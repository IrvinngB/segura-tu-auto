/**
 * Componente de desarrollo para probar el auto-logout por inactividad
 * SOLO PARA DESARROLLO - Eliminar en producción
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInactivityLogout } from '@/hooks/use-inactivity-logout';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

export function InactivityTestPanel() {
  const [testTimeout, setTestTimeout] = useState<number>(30); // 30 segundos para pruebas
  const [isTestActive, setIsTestActive] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Hook con timeout de prueba (30 segundos)
  useInactivityLogout({
    enabled: isTestActive,
    timeout: testTimeout * 1000,
    onInactivity: () => {
      console.log('⚠️ [TEST] Inactividad detectada');
      alert('¡AUTO-LOGOUT ACTIVADO! Simulando cierre de sesión...');
    },
    onLogout: () => {
      console.log('✅ [TEST] Logout ejecutado');
      setIsTestActive(false);
    },
  });

  const startTest = () => {
    setIsTestActive(true);
    setLastActivity(new Date());
    console.log(`🧪 Test iniciado: logout en ${testTimeout} segundos`);
  };

  const stopTest = () => {
    setIsTestActive(false);
    console.log('🛑 Test detenido');
  };

  const resetActivity = () => {
    setLastActivity(new Date());
    console.log('🔄 Actividad registrada');
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8 border-dashed border-2 border-amber-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Panel de Prueba - Auto-Logout
        </CardTitle>
        <CardDescription>
          Herramienta de desarrollo para probar la funcionalidad de cierre de sesión automático
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Solo para Desarrollo
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Este componente permite probar el auto-logout con un timeout reducido.
                En producción, el timeout real es de 10 minutos.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Timeout de Prueba (segundos):</label>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestTimeout(10)}
                disabled={isTestActive}
              >
                10s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestTimeout(30)}
                disabled={isTestActive}
              >
                30s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestTimeout(60)}
                disabled={isTestActive}
              >
                60s
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isTestActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm font-medium">
              Estado: {isTestActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {isTestActive && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Timer activo. No interactúes con la página durante {testTimeout} segundos para
                activar el auto-logout.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Última actividad: {lastActivity.toLocaleTimeString()}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!isTestActive ? (
              <Button onClick={startTest} className="flex-1">
                Iniciar Test
              </Button>
            ) : (
              <>
                <Button onClick={stopTest} variant="destructive" className="flex-1">
                  Detener Test
                </Button>
                <Button onClick={resetActivity} variant="outline" className="flex-1">
                  Simular Actividad
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>📋 <strong>Instrucciones:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Selecciona un timeout de prueba (10, 30 o 60 segundos)</li>
            <li>Haz clic en "Iniciar Test"</li>
            <li>NO muevas el mouse, NO hagas clic, NO presiones teclas</li>
            <li>Espera el tiempo configurado</li>
            <li>Verás una alerta cuando se active el auto-logout</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
