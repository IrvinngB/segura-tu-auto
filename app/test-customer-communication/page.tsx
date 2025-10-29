'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClaimCommunication } from '@/components/claims/claim-communication';
import { Info, MessageCircle, Upload, FileText, Image, CheckCircle } from 'lucide-react';

export default function TestCustomerCommunicationPage() {
  // Mock data para la prueba
  const mockClaimId = 'test-claim-123';
  const mockCustomerId = 'test-customer-456';
  const mockClaimNumber = 'CL-2024-001';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            📱 Prueba de Comunicación de Cliente
          </h1>
          <p className="text-xl text-muted-foreground">
            Prueba el envío de mensajes y archivos desde la perspectiva del cliente
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Vista de Cliente
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-300">
              Archivos Habilitados
            </Badge>
          </div>
        </div>

        {/* Información de la Reclamación Mock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Información de la Reclamación (Simulada)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Número:</span> {mockClaimNumber}
              </div>
              <div>
                <span className="font-medium">ID Reclamación:</span> {mockClaimId}
              </div>
              <div>
                <span className="font-medium">ID Cliente:</span> {mockCustomerId}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Instrucciones de prueba:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Esta página simula la vista de un cliente en su página de reclamación</li>
              <li>Prueba enviar mensajes de texto normales</li>
              <li>Prueba adjuntar archivos PNG, JPG, JPEG o PDF</li>
              <li>Los mensajes aparecerán inmediatamente en el historial</li>
              <li>Los agentes recibirán notificaciones en tiempo real</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Funcionalidades Disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Funcionalidades Disponibles para Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Mensajes
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Chat en tiempo real con agentes</li>
                  <li>• Mensajes instantáneos</li>
                  <li>• Historial completo de conversaciones</li>
                  <li>• Indicadores de estado (enviado/recibido)</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-green-500" />
                  Archivos Adjuntos
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    • <Image className="inline h-3 w-3" /> Fotos del daño (PNG, JPG, JPEG)
                  </li>
                  <li>
                    • <FileText className="inline h-3 w-3" /> Documentos (PDF)
                  </li>
                  <li>• Máximo 10MB por archivo</li>
                  <li>• Validación automática de tipos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Comunicación Real */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              Sistema de Comunicación Real
            </CardTitle>
            <CardDescription>
              Este es el sistema real que verían los clientes en su página de reclamación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClaimCommunication
              claimId={mockClaimId}
              customerId={mockCustomerId}
              claimNumber={mockClaimNumber}
              currentUserRole="customer"
            />
          </CardContent>
        </Card>

        {/* Pasos para Probar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Pasos para Probar la Funcionalidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  📝 Prueba de Mensajes de Texto:
                </h3>
                <ol className="space-y-1 text-blue-700 dark:text-blue-300 text-sm list-decimal list-inside">
                  <li>Escribe un mensaje en el área de texto arriba</li>
                  <li>Haz clic en "Enviar Mensaje"</li>
                  <li>El mensaje aparecerá en el historial inmediatamente</li>
                  <li>Los agentes recibirán una notificación en tiempo real</li>
                </ol>
              </div>

              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  📎 Prueba de Archivos Adjuntos:
                </h3>
                <ol className="space-y-1 text-green-700 dark:text-green-300 text-sm list-decimal list-inside">
                  <li>Haz clic en "Adjuntar archivo"</li>
                  <li>Selecciona una imagen PNG/JPG o archivo PDF</li>
                  <li>El archivo aparecerá en la vista previa</li>
                  <li>Haz clic en "Enviar archivo"</li>
                  <li>El archivo se subirá y aparecerá en el historial</li>
                  <li>Los agentes podrán ver/descargar el archivo</li>
                </ol>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  🔍 Verificar en el Dashboard de Agentes:
                </h3>
                <ol className="space-y-1 text-purple-700 dark:text-purple-300 text-sm list-decimal list-inside">
                  <li>Ve al dashboard principal como agente</li>
                  <li>Verifica las notificaciones en el icono de campana</li>
                  <li>Ve a la página de reclamaciones como agente</li>
                  <li>Abre la misma reclamación en la pestaña "Comunicaciones"</li>
                  <li>Confirma que se ven los mensajes y archivos del cliente</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nota Final */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>¡Perfecto!</strong> Ahora los clientes pueden enviar tanto mensajes como
            archivos PNG/PDF directamente a sus agentes. El sistema funciona en tiempo real y los
            agentes reciben notificaciones instantáneas.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
