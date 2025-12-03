'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { Upload, FileText, Download, Eye, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ClaimAdditionalDocuments } from './claim-additional-documents';
import type { ClaimCustomerDocument } from '@/lib/types/database';

interface ClaimCustomerDocumentsProps {
  claimId: string;
  customerId: string;
  currentUserRole?: string;
  onDocumentCountChange?: (count: number) => void;
  documents?: ClaimCustomerDocument[];
  onRefresh?: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  license: 'Licencia de Conducir',
  id: 'Identificación Oficial',
  invoice: 'Factura del Vehículo',
  police_report: 'Reporte Policial',
  photos: 'Fotografías del Siniestro',
  other: 'Otro Documento',
};

// Función simple para generar nombres limpios de archivos
const generateCleanFileName = (documentType: string, fileExtension: string): string => {
  console.log('🚀🚀🚀 NUEVA FUNCIÓN EJECUTÁNDOSE - Tipo:', documentType);

  const cleanNames: Record<string, string> = {
    id: 'Cedula_Identificacion',
    license: 'Licencia_Conducir',
    invoice: 'Factura_Vehiculo',
    photos: 'Fotografias_Siniestro',
    police_report: 'Reporte_Policial',
    other: 'Otro_Documento',
  };

  const baseName = cleanNames[documentType] || 'Documento';
  const timestamp = Date.now();
  const finalName = `${baseName}_${timestamp}.${fileExtension}`;

  console.log('🚀🚀🚀 NOMBRE FINAL GENERADO:', finalName);
  return finalName;
};

export function ClaimCustomerDocuments({
  claimId,
  customerId,
  currentUserRole,
  onDocumentCountChange,
  documents = [],
  onRefresh = () => {},
}: ClaimCustomerDocumentsProps) {
  // const [documents, setDocuments] = useState<ClaimCustomerDocument[]>([]); // Removed local state
  // const [loading, setLoading] = useState(true); // Removed loading state (handled by parent)
  const [uploading, setUploading] = useState(false);
  const [updatingDocIds, setUpdatingDocIds] = useState<Set<string>>(new Set());
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({});
  
  // Estados para el modal de rechazo
  const [rejectingDoc, setRejectingDoc] = useState<ClaimCustomerDocument | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);


  const supabase = createClient();

  // ... (fetchDocuments commented out code) ...

  const handleExtraDocUpload = (newDoc: ClaimCustomerDocument) => {
    console.log('✨ Nuevo documento extra subido:', newDoc);
    
    // Trigger refresh
    onRefresh();
  };



  const handleReplaceDocument = async (doc: ClaimCustomerDocument) => {
    // Crear input de archivo dinámicamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';

    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validar tamaño (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('El archivo no debe superar los 10MB');
        return;
      }

      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }

      setUploading(true);

      try {
        console.log('🔄 Iniciando reemplazo de documento:', {
          docId: doc.id,
          oldFileUrl: doc.file_url,
          documentType: doc.document_type,
          isExtra: doc.is_extra_document,
          newFileName: file.name,
          newFileSize: file.size,
        });

        // Obtener extensión del archivo nuevo
        const fileExt = file.name.split('.').pop() || 'pdf';

        // Generar nombre limpio
        let newFileName;
        if (doc.is_extra_document && doc.extra_document_label) {
          // Lógica para documentos extra (similar a ClaimAdditionalDocuments)
          const cleanLabel = doc.extra_document_label
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
          const timestamp = Date.now();
          newFileName = `extra_${cleanLabel}_${timestamp}.${fileExt}`;
        } else {
          // Lógica estándar
          newFileName = generateCleanFileName(doc.document_type, fileExt);
        }

        console.log('✅ REPLACE - Archivo generado:', newFileName);
        const storagePath = `drafts/${newFileName}`;

        // Subir nuevo archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('clientes-adjuntos')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(`Error al subir archivo: ${uploadError.message}`);
        }

        // Obtener URL pública del nuevo archivo
        const {
          data: { publicUrl },
        } = supabase.storage.from('clientes-adjuntos').getPublicUrl(storagePath);

        // Verificar que el documento existe antes de actualizar
        console.log('🔍 Verificando existencia del documento con ID:', doc.id);
        const { data: existingDoc, error: checkError } = await supabase
          .from('claim_customer_documents')
          .select('*')
          .eq('id', doc.id)
          .single();

        if (checkError || !existingDoc) {
          throw new Error(
            `Documento no encontrado o sin acceso: ${checkError?.message || 'No existe'}`
          );
        }

        // Actualizar el documento en la base de datos
        console.log('📝 Iniciando actualización en BD...');
        
        // Usar API endpoint para bypasear RLS
        const response = await fetch('/api/documents/replace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            docId: doc.id,
            newFileName,
            newUrl: publicUrl,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(`Error en API: ${result.error}`);
        }

        // Eliminar el archivo anterior del storage
        try {
          console.log('🗑️ Intentando eliminar archivo anterior:', doc.file_url);
          const oldUrlParts = doc.file_url.split('/');
          const bucketIndex = oldUrlParts.findIndex(part => part === 'clientes-adjuntos');

          if (bucketIndex !== -1 && bucketIndex < oldUrlParts.length - 1) {
            const oldFilePath = oldUrlParts.slice(bucketIndex + 1).join('/');
            const { error: deleteError } = await supabase.storage
              .from('clientes-adjuntos')
              .remove([oldFilePath]);

            if (deleteError) {
              console.warn('⚠️ Error eliminando archivo anterior:', deleteError);
            }
          }
        } catch (cleanupError) {
          console.warn('⚠️ Error en cleanup:', cleanupError);
        }

        toast.success('Documento actualizado exitosamente');

        // Trigger refresh
        await onRefresh();
        
      } catch (error) {
        console.error('Error replacing document:', error);
        toast.error('Error al actualizar el documento: ' + (error as Error).message);
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const updateDocumentStatus = async (
    docId: string,
    newStatus: 'approved' | 'rejected',
    notes?: string
  ) => {
    // Add to updating set
    setUpdatingDocIds(prev => new Set(prev).add(docId));
    
    // Optimistic update
    setOptimisticStatus(prev => ({
        ...prev,
        [docId]: newStatus
    }));

    try {
      const response = await fetch('/api/claim-documents/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: docId,
          newStatus,
          notes,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Error al actualizar el estado';

        try {
          const data = await response.json();
          if (data?.error) {
            errorMessage = data.error;
          }
        } catch {
          // Ignorar errores al parsear la respuesta
        }

        throw new Error(errorMessage);
      }

      toast.success(`Documento ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}`);
      await onRefresh();
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Error al actualizar el estado. Intente nuevamente.');
      
      // Revert optimistic update on error
      setOptimisticStatus(prev => {
          const newState = { ...prev };
          delete newState[docId];
          return newState;
      });
    } finally {
      // Remove from updating set
      setUpdatingDocIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(docId);
          return newSet;
      });
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingDoc) return;
    if (!rejectReason.trim()) return;

    try {
      setIsRejecting(true);
      // Usamos updateDocumentStatus pero manejamos el loading state localmente para el modal
      // updateDocumentStatus ya hace el fetch y el toast
      await updateDocumentStatus(rejectingDoc.id, 'rejected', rejectReason.trim());
      
      setRejectingDoc(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting document:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const isAgent = currentUserRole === 'agent';

    const config = {
      pending: {
        label: 'Pendiente por revisar o por aprobar',
        classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: Clock,
      },
      approved: {
        label: 'Aprobado',
        classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CheckCircle,
      },
      rejected: {
        label: 'Rechazado',
        classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: AlertCircle,
      },
    };

    const { label, classes, icon: Icon } = config[status as keyof typeof config] || config.pending;

    return (
      <Badge className={classes}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const translateFileName = (fileName: string) => {
    // Si el archivo ya tiene un nombre limpio generado por nuestra función, no lo modifiques
    const cleanPatterns = [
      'Cedula_Identificacion_',
      'Licencia_Conducir_',
      'Factura_Vehiculo_',
      'Fotografias_Siniestro_',
      'Reporte_Policial_',
      'Otro_Documento_',
    ];

    // Si el nombre ya está limpio, devuélvelo tal como está
    if (cleanPatterns.some(pattern => fileName.includes(pattern))) {
      return fileName;
    }

    // Solo traducir nombres viejos/corruptos
    const translations = {
      draft_police_report: 'Reporte_Policial',
      draft_photos: 'Fotografias_del_Siniestro',
      draft_invoice: 'Factura_del_Vehiculo',
      draft_license: 'Licencia_de_Conducir',
      draft_id: 'Identificacion_Oficial',
    };

    let translatedName = fileName;

    // Buscar y reemplazar cada patrón SOLO si no es un nombre limpio
    Object.entries(translations).forEach(([english, spanish]) => {
      const regex = new RegExp(english, 'gi');
      translatedName = translatedName.replace(regex, spanish);
    });

    return translatedName;
  };

  /*
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Cargando documentos...</p>
        </CardContent>
      </Card>
    );
  }
  */

  return (
    <>
      <ClaimAdditionalDocuments 
        claimId={claimId} 
        customerId={customerId} 
        onUploadComplete={handleExtraDocUpload}
        documents={documents}
        currentUserRole={currentUserRole}
        onRefresh={onRefresh}
      />

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos del Cliente
                  <InfoTooltip
                    content="Lista de todos los documentos subidos para esta reclamación."
                    side="right"
                  />
                </CardTitle>
                <CardDescription>
                  Documentos adicionales subidos por el cliente para esta reclamación
                </CardDescription>
              </div>
            </div>

            {/* Controles de subida eliminados para clientes - ahora solo usan el bloque de solicitud del agente */}

          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay documentos subidos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => {
                const isUpdating = updatingDocIds.has(doc.id);
                const currentStatus = optimisticStatus[doc.id] || doc.status;
                
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 dark:border-gray-700 dark:hover:bg-gray-800/50 transition-colors ${isUpdating ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-8 w-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate dark:text-gray-100">
                          {translateFileName(doc.file_name)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                          <span>
                            {doc.is_extra_document 
                              ? `Tipo: ${doc.extra_document_label}` 
                              : DOCUMENT_TYPE_LABELS[doc.document_type] || 'Otro Documento'}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(doc.upload_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                        {doc.notes && (
                          <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 italic">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUpdating ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Actualizando...
                        </Badge>
                      ) : (
                        getStatusBadge(currentStatus)
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            console.log('🔍 Verificando archivo:', doc.file_url);
                            const response = await fetch(doc.file_url, { method: 'HEAD' });
                            console.log('📡 Status de verificación:', response.status);

                            if (response.ok) {
                              const urlWithoutCache = `${doc.file_url}?t=${Date.now()}`;
                              window.open(urlWithoutCache, '_blank');
                            } else {
                              console.error(
                                '❌ Archivo no encontrado (status:',
                                response.status,
                                ')'
                              );
                              toast.error(
                                `El archivo no está disponible (Error ${response.status}). Puede haber sido movido o eliminado.`
                              );
                            }
                          } catch (error) {
                            console.error('❌ Error verificando archivo:', error);
                            toast.error('Error al verificar la disponibilidad del archivo.');
                          }
                        }}
                        className="dark:hover:bg-gray-700"
                        disabled={isUpdating}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>



                      {/* Reemplazo para TODOS los documentos (normales y extra) si es cliente */}
                      {currentUserRole === 'customer' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReplaceDocument(doc)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700"
                          disabled={uploading || isUpdating}
                          title="Reemplazar documento"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Si es extra, tal vez queramos permitir reemplazar también, pero el usuario pidió centralizar subida arriba. 
                          Sin embargo, el botón de reemplazar es útil. Lo dejaré solo para standard por ahora para seguir la instrucción de "centralizar subida". 
                          Aunque "reemplazar" es una acción sobre un documento existente. */}

                      {['admin', 'agent', 'adjuster'].includes(currentUserRole || '') &&
                        doc.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateDocumentStatus(doc.id, 'approved')}
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-gray-700"
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRejectingDoc(doc);
                                setRejectReason('');
                              }}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                              disabled={isUpdating}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!rejectingDoc}
        onOpenChange={(open) => {
          if (!open && !isRejecting) {
            setRejectingDoc(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="max-w-md bg-slate-900 border border-slate-700 text-slate-50 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Rechazar documento</DialogTitle>
            <DialogDescription className="text-slate-300">
              Indique el motivo por el cual está rechazando este documento.
              El mensaje será visible para el cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-sm">
            {rejectingDoc && (
              <p className="text-slate-400">
                Documento:{' '}
                <span className="font-medium text-slate-100">
                  {translateFileName(rejectingDoc.file_name)}
                </span>
              </p>
            )}

            <div className="space-y-2">
              <label className="block text-slate-200 text-sm font-medium">
                Motivo del rechazo <span className="text-red-400">*</span>
              </label>
              <Textarea
                autoFocus
                rows={4}
                placeholder="Ejemplo: el documento está borroso o no corresponde al vehículo asegurado."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-slate-950 border-slate-700 focus-visible:ring-sky-500 text-slate-100 placeholder:text-slate-500"
              />
              {!rejectReason.trim() && rejectReason !== '' && (
                <p className="text-xs text-red-400">
                  Debe escribir un motivo para poder rechazar el documento.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
              onClick={() => {
                if (isRejecting) return;
                setRejectingDoc(null);
                setRejectReason('');
              }}
              disabled={isRejecting}
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isRejecting ? 'Rechazando...' : 'Rechazar documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
