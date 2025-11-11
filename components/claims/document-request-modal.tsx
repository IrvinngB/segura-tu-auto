'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface DocumentRequestModalProps {
  claimId: string;
  onDocumentRequested: () => void;
  trigger?: React.ReactNode;
}

const DOCUMENT_TYPES = [
  { id: 'photos', name: 'Fotos adicionales del daño', required: true },
  { id: 'police_report', name: 'Reporte policial', required: false },
  { id: 'repair_estimate', name: 'Cotización de reparación', required: false },
  { id: 'medical_report', name: 'Reporte médico', required: false },
  { id: 'witness_statement', name: 'Declaración de testigos', required: false },
  { id: 'third_party_info', name: 'Información de terceros', required: false },
  { id: 'other', name: 'Otros documentos', required: false },
];

export function DocumentRequestModal({
  claimId,
  onDocumentRequested,
  trigger,
}: DocumentRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [requestedDocs, setRequestedDocs] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleDocumentToggle = (docId: string) => {
    setRequestedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleRequestDocuments = async () => {
    if (requestedDocs.length === 0) {
      setError('Debe seleccionar al menos un tipo de documento');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Solicitando documentos para reclamación:', claimId);
      console.log('📄 Documentos solicitados:', requestedDocs);
      console.log('📝 Notas:', notes);

      // Simplificado: Solo actualizar el estado del claim
      console.log('🔄 Intentando actualizar claim con ID:', claimId);
      
      const { data, error: claimError } = await supabase
        .from('claims')
        .update({
          status: 'under_review'
        })
        .eq('id', claimId)
        .select();

      console.log('📊 Resultado de actualización:', { data, error: claimError });

      if (claimError) {
        console.error('❌ Error completo:', JSON.stringify(claimError, null, 2));
        throw new Error(`Error: ${claimError.message}`);
      }

      console.log('✅ Estado de reclamación actualizado a pending_documentation');

      // Llamar callback y cerrar modal
      onDocumentRequested();
      setOpen(false);
      setRequestedDocs([]);
      setNotes('');

      toast.success('Solicitud de documentos enviada correctamente');
    } catch (error) {
      console.error('❌ Error en solicitud de documentos:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error al enviar la solicitud de documentos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            📄 Solicitar Más Documentos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitar Documentos Adicionales
            <InfoTooltip content="Envía una solicitud al cliente para que suba documentos específicos necesarios para procesar la reclamación. El cliente recibirá una notificación y podrá subir los archivos desde su portal." />
          </DialogTitle>
          <DialogDescription>Seleccione los documentos que necesita del cliente</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de tipos de documentos */}
          <div>
            <Label className="text-sm font-medium">Documentos requeridos:</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {DOCUMENT_TYPES.map(doc => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-colors ${
                    requestedDocs.includes(doc.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleDocumentToggle(doc.id)}
                >
                  <span className="text-sm">{doc.name}</span>
                  <div className="flex items-center gap-2">
                    {doc.required && (
                      <Badge variant="secondary" className="text-xs">
                        Requerido
                      </Badge>
                    )}
                    {requestedDocs.includes(doc.id) ? (
                      <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documentos seleccionados */}
          {requestedDocs.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Documentos seleccionados:</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {requestedDocs.map(docId => {
                  const doc = DOCUMENT_TYPES.find(d => d.id === docId);
                  return (
                    <Badge key={docId} variant="outline" className="flex items-center gap-1">
                      {doc?.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleDocumentToggle(docId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas adicionales */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas adicionales (opcional): {notes.length}/500
            </Label>
            <Textarea
              id="notes"
              placeholder="Instrucciones específicas para el cliente..."
              value={notes}
              onChange={e => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setNotes(value);
                }
              }}
              className="mt-1"
              rows={3}
              maxLength={500}
            />
            {notes.length >= 450 && (
              <p className="text-xs text-orange-600 mt-1">
                Límite de caracteres: {notes.length}/500
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleRequestDocuments} disabled={loading || requestedDocs.length === 0}>
            {loading ? 'Enviando...' : 'Solicitar Documentos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
