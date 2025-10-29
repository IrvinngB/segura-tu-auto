'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { DocumentRequestModal } from '@/components/claims/document-request-modal';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function TestDocumentRequestPage() {
  const [claimId, setClaimId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const supabase = createClient();

  const testDirectUpdate = async () => {
    if (!claimId.trim()) {
      setResult({
        success: false,
        message: 'Por favor ingresa un ID de reclamación válido',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Probando actualización directa a pending_documentation...');

      // 1. Verificar que la reclamación existe
      const { data: existingClaim, error: fetchError } = await supabase
        .from('claims')
        .select('id, status, customer_id')
        .eq('id', claimId.trim())
        .single();

      if (fetchError || !existingClaim) {
        throw new Error(`Reclamación no encontrada: ${fetchError?.message || 'ID inválido'}`);
      }

      console.log('✅ Reclamación encontrada:', existingClaim);

      // 2. Intentar actualizar directamente
      const { data: updatedClaim, error: updateError } = await supabase
        .from('claims')
        .update({
          status: 'pending_documentation',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId.trim())
        .select('*')
        .single();

      if (updateError) {
        throw new Error(`Error actualizando: ${updateError.message}`);
      }

      console.log('✅ Actualización exitosa:', updatedClaim);

      // 3. Verificar que el cambio se aplicó
      const { data: verificationClaim, error: verifyError } = await supabase
        .from('claims')
        .select('id, status, updated_at')
        .eq('id', claimId.trim())
        .single();

      if (verifyError) {
        throw new Error(`Error verificando: ${verifyError.message}`);
      }

      setResult({
        success: true,
        message: 'Actualización exitosa ✅',
        details: {
          originalStatus: existingClaim.status,
          newStatus: verificationClaim.status,
          updatedAt: verificationClaim.updated_at,
          claimData: verificationClaim,
        },
      });
    } catch (error) {
      console.error('❌ Error en prueba directa:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        details: error,
      });
    } finally {
      setLoading(false);
    }
  };

  const testModalFunction = () => {
    if (!claimId.trim()) {
      setResult({
        success: false,
        message: 'Por favor ingresa un ID de reclamación válido para probar el modal',
      });
      return;
    }

    setResult({
      success: true,
      message: 'Prueba el modal clickeando el botón de abajo 👇',
    });
  };

  const handleModalSuccess = () => {
    setResult({
      success: true,
      message: 'Modal ejecutado exitosamente ✅ - Revisa la consola para logs detallados',
    });
  };

  const resetTest = () => {
    setResult(null);
    setClaimId('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧪 Prueba de Solicitud de Documentos
            </CardTitle>
            <CardDescription>
              Herramienta para diagnosticar el error al solicitar documentos adicionales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="claimId">ID de Reclamación:</Label>
              <Input
                id="claimId"
                placeholder="Ingresa el ID de una reclamación existente"
                value={claimId}
                onChange={e => setClaimId(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={testDirectUpdate} disabled={loading} variant="outline">
                {loading ? 'Probando...' : '🔧 Prueba Directa'}
              </Button>

              <Button onClick={testModalFunction} disabled={!claimId.trim()} variant="outline">
                🎯 Preparar Modal
              </Button>

              <Button onClick={resetTest} variant="ghost">
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {result && (
              <Alert
                className={
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }
              >
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                      {result.message}
                    </p>
                    {result.details && (
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {claimId.trim() && result?.success && result.message.includes('modal') && (
          <Card>
            <CardHeader>
              <CardTitle>Prueba del Modal Mejorado</CardTitle>
              <CardDescription>
                Usa este modal para probar la funcionalidad mejorada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentRequestModal
                claimId={claimId.trim()}
                onDocumentRequested={handleModalSuccess}
                trigger={
                  <Button className="w-full">📄 Probar Modal de Solicitud de Documentos</Button>
                }
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>1. Prueba Directa:</strong> Intenta actualizar directamente el estado de la
              reclamación.
            </p>
            <p>
              <strong>2. Preparar Modal:</strong> Configura el ID para usar el modal mejorado.
            </p>
            <p>
              <strong>3. Probar Modal:</strong> Usa el modal que incluye manejo de errores
              detallado.
            </p>
            <p>
              <strong>4. Revisa Consola:</strong> Los logs detallados aparecen en la consola del
              navegador.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
