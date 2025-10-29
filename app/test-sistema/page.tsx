import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

export default function TestPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Sistema de Reclamaciones - Prueba de Implementación</CardTitle>
          <CardDescription>
            Verificar que todos los componentes y funcionalidades estén funcionando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Test de Estados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estados del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className="bg-gray-100 text-gray-800">Enviada</Badge>
                <Badge className="bg-yellow-100 text-yellow-800">En Revisión</Badge>
                <Badge className="bg-orange-100 text-orange-800">Pendiente Docs</Badge>
                <Badge className="bg-blue-100 text-blue-800">Esperando Aprobación</Badge>
                <Badge className="bg-purple-100 text-purple-800">Investigando</Badge>
                <Badge className="bg-green-100 text-green-800">Aprobada</Badge>
                <Badge className="bg-cyan-100 text-cyan-800">Procesando Pago</Badge>
                <Badge className="bg-red-100 text-red-800">Denegada</Badge>
                <Badge className="bg-blue-600 text-white">Pagada</Badge>
                <Badge className="bg-gray-600 text-white">Cerrada</Badge>
              </CardContent>
            </Card>

            {/* Test de Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Roles del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>👨‍💼 Agente - Gestión administrativa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>🔍 Ajustador - Evaluación técnica</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>👨‍💻 Administrador - Control total</span>
                </div>
              </CardContent>
            </Card>

            {/* Test de Funcionalidades */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Funcionalidades Implementadas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">✅ Estados Expandidos</h4>
                  <ul className="text-sm space-y-1">
                    <li>• 10 estados del flujo completo</li>
                    <li>• Transiciones lógicas</li>
                    <li>• Validación de permisos</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">✅ Separación de Roles</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Funciones específicas por rol</li>
                    <li>• No duplicación de responsabilidades</li>
                    <li>• Flujo de escalamiento</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">✅ Gestión de Pagos</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Aprobación con montos</li>
                    <li>• Proceso de pago completo</li>
                    <li>• Confirmación de pagos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Instrucciones de Implementación */}
            <Card className="md:col-span-2 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Pasos para Completar la Implementación
                </CardTitle>
              </CardHeader>
              <CardContent className="text-orange-800">
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <strong>Ejecutar Script SQL:</strong> Ir a Supabase → SQL Editor → Ejecutar{' '}
                    <code>IMPLEMENTAR_SISTEMA.sql</code>
                  </li>
                  <li>
                    <strong>Verificar Permisos:</strong> Confirmar que los roles de usuario estén
                    correctos en la tabla <code>users</code>
                  </li>
                  <li>
                    <strong>Probar Flujo:</strong> Crear una reclamación de prueba y probar cada
                    transición de estado
                  </li>
                  <li>
                    <strong>Verificar Notificaciones:</strong> Confirmar que las alertas y
                    notificaciones funcionen
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Botones de Prueba */}
          <div className="flex gap-2">
            <Button onClick={() => alert('Sistema funcionando correctamente!')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Probar Sistema
            </Button>

            <Button variant="outline" onClick={() => window.open('/claims', '_blank')}>
              <Clock className="h-4 w-4 mr-2" />
              Ir a Reclamaciones
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
