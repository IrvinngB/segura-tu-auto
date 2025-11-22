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

import { Upload, FileText, Download, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
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
}: ClaimCustomerDocumentsProps) {
  const [documents, setDocuments] = useState<ClaimCustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<ClaimCustomerDocument['document_type']>('other');

  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, [claimId]);

  const fetchDocuments = async () => {
    try {
      console.log('📥 Fetching documents para claim:', claimId);
      const { data, error } = await supabase
        .from('claim_customer_documents')
        .select('*')
        .eq('claim_id', claimId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      console.log('✅ Documentos cargados desde BD:', data?.length || 0, 'documentos');
      
      // Mostrar TODOS los documentos, incluyendo los extra
      const documentsData = data || [];
      
      setDocuments(documentsData);
      // Notificar al componente padre sobre el cambio en el conteo
      onDocumentCountChange?.(documentsData.length);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtraDocUpload = (newDoc: ClaimCustomerDocument) => {
    console.log('✨ Nuevo documento extra subido:', newDoc);
    
    // Actualización optimista del estado
    setDocuments(prev => {
      // Evitar duplicados por si acaso
      if (prev.some(d => d.id === newDoc.id)) return prev;
      return [newDoc, ...prev];
    });

    // También recargar para asegurar consistencia
    fetchDocuments();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      // Obtener extensión del archivo original
      const fileExt = file.name.split('.').pop();

      // Generar nombre limpio usando la función centralizada
      const newFileName = generateCleanFileName(selectedDocumentType, fileExt || 'pdf');
      const storagePath = `drafts/${newFileName}`;

      console.log('🆕🆕🆕 SUBIDA NUEVA - Tipo seleccionado:', selectedDocumentType);
      console.log('🆕🆕🆕 SUBIDA NUEVA - Archivo generado:', newFileName);
      console.log('🆕🆕🆕 SUBIDA NUEVA - Path completo:', storagePath);

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clientes-adjuntos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('❌ Error en upload:', uploadError);
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      console.log('✅ Archivo subido:', uploadData);

      // Verificar que el archivo existe listando la carpeta
      const { data: listData, error: listError } = await supabase.storage
        .from('clientes-adjuntos')
        .list('drafts');

      console.log('📁 Archivos en carpeta drafts:', listData);

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('clientes-adjuntos').getPublicUrl(storagePath);

      console.log('🔗 URL pública generada:', publicUrl);

      // Verificar accesibilidad del archivo
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        console.log('🌐 Status de verificación:', response.status, response.statusText);
      } catch (fetchError) {
        console.warn('⚠️ Error verificando archivo:', fetchError);
      }

      // Usar el tipo de documento seleccionado por el usuario
      const documentType = selectedDocumentType;

      // Guardar en base de datos con el nombre generado
      const { data: dbData, error: dbError } = await supabase
        .from('claim_customer_documents')
        .insert({
          claim_id: claimId,
          customer_id: customerId,
          document_type: documentType,
          file_name: newFileName, // Usar el nuevo nombre
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Error en base de datos:', dbError);
        // Intentar eliminar el archivo subido
        await supabase.storage.from('clientes-adjuntos').remove([storagePath]);

        // Mensaje de error más específico
        if (dbError.message.includes('row-level security')) {
          throw new Error(
            'Permisos insuficientes. Por favor contacta al administrador para configurar las políticas RLS.'
          );
        } else if (dbError.message.includes('violates foreign key')) {
          throw new Error('Reclamación o cliente no encontrado. Verifica los datos.');
        } else {
          throw new Error(`Error al guardar en BD: ${dbError.message}`);
        }
      }

      console.log('✅ Documento guardado en BD:', dbData);

      toast.success('Documento subido exitosamente');
      fetchDocuments();
    } catch (error) {
      console.error('❌ Error completo:', error);

      // Mensaje más amigable según el tipo de error
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Bucket not found')) {
        toast.error('Error: El bucket de almacenamiento no existe. Contacta al administrador.');
      } else if (errorMessage.includes('Permisos insuficientes')) {
        toast.error(errorMessage, {
          description:
            '💡 El administrador debe ejecutar el archivo SETUP_COMPLETE_CLAIM_DOCUMENTS.sql en Supabase.',
          duration: 6000,
        });
      } else {
        toast.error('Error al subir el documento: ' + errorMessage);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
      // Resetear selector al valor por defecto
      setSelectedDocumentType('other');
    }
  };

  const handleReplaceDocument = async (docId: string, oldFileUrl: string, documentType: string) => {
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
          docId,
          oldFileUrl,
          documentType,
          newFileName: file.name,
          newFileSize: file.size,
        });

        // Obtener extensión del archivo nuevo
        const fileExt = file.name.split('.').pop();

        // Generar nombre limpio usando la misma función centralizada
        const newFileName = generateCleanFileName(documentType, fileExt || 'pdf');

        console.log('✅ REPLACE - Tipo documento:', documentType);
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
        console.log('🔍 Verificando existencia del documento con ID:', docId);
        const { data: existingDoc, error: checkError } = await supabase
          .from('claim_customer_documents')
          .select('*')
          .eq('id', docId)
          .single();

        console.log('📋 Documento existente:', existingDoc);
        console.log('❌ Error de verificación:', checkError);

        if (checkError || !existingDoc) {
          throw new Error(
            `Documento no encontrado o sin acceso: ${checkError?.message || 'No existe'}`
          );
        }

        // Actualizar el documento en la base de datos
        console.log('📝 Iniciando actualización en BD con datos:', {
          docId,
          newFileName,
          newUrl: publicUrl,
          fileSize: file.size,
          mimeType: file.type,
        });

        // Usar API endpoint para bypasear RLS
        console.log('🔄 Llamando API para actualizar documento...');
        const response = await fetch('/api/documents/replace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            docId,
            newFileName,
            newUrl: publicUrl,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });

        const result = await response.json();
        console.log('📋 Resultado de la API:', result);

        if (!result.success) {
          throw new Error(`Error en API: ${result.error}`);
        }

        console.log('✅ Documento actualizado via API exitosamente:', {
          docId,
          newFileName,
          newUrl: publicUrl,
          updatedRecord: result.data,
        });

        // Eliminar el archivo anterior del storage
        try {
          console.log('🗑️ Intentando eliminar archivo anterior:', oldFileUrl);
          const oldUrlParts = oldFileUrl.split('/');
          const bucketIndex = oldUrlParts.findIndex(part => part === 'clientes-adjuntos');

          if (bucketIndex !== -1 && bucketIndex < oldUrlParts.length - 1) {
            const oldFilePath = oldUrlParts.slice(bucketIndex + 1).join('/');
            console.log('📂 Path del archivo anterior:', oldFilePath);

            const { error: deleteError } = await supabase.storage
              .from('clientes-adjuntos')
              .remove([oldFilePath]);

            if (deleteError) {
              console.warn('⚠️ Error eliminando archivo anterior:', deleteError);
            } else {
              console.log('✅ Archivo anterior eliminado exitosamente');
            }
          } else {
            console.warn('⚠️ No se pudo extraer el path del archivo anterior');
          }
        } catch (cleanupError) {
          console.warn('⚠️ Error en cleanup:', cleanupError);
        }

        toast.success('Documento actualizado exitosamente');

        // Forzar actualización del estado local inmediatamente
        console.log('🔄 Actualizando estado local...');
        setDocuments(prevDocs =>
          prevDocs.map(doc =>
            doc.id === docId
              ? { ...doc, file_name: newFileName, file_url: publicUrl, status: 'pending' as const }
              : doc
          )
        );

        // Recargar documentos inmediatamente
        console.log('🔄 Recargando lista de documentos...');
        await fetchDocuments();

        // Recargar datos con delay adicional para asegurar que la BD esté actualizada
        setTimeout(async () => {
          console.log('🔄 Recargando documentos después del delay...');
          await fetchDocuments();
        }, 2000);
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
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        label: 'Pendiente',
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
        <Icon className="h-3 w-3 mr-1" />
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Cargando documentos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ClaimAdditionalDocuments 
        claimId={claimId} 
        customerId={customerId} 
        onUploadComplete={handleExtraDocUpload}
        documents={documents}
        currentUserRole={currentUserRole}
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

            {/* Controles de subida solo para clientes */}
            {currentUserRole === 'customer' && (
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-1/3">
                  <label className="text-sm font-medium mb-2 block">Tipo de Documento</label>
                  <Select
                    value={selectedDocumentType}
                    onValueChange={(value: any) => setSelectedDocumentType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-2/3">
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <label htmlFor="file-upload" className="w-full">
                      <Button
                        className="w-full cursor-pointer"
                        disabled={uploading}
                        asChild
                      >
                        <span>
                          {uploading ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span> Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Subir Documento
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            )}
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
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 dark:border-gray-700 dark:hover:bg-gray-800/50 transition-colors"
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
                      {getStatusBadge(doc.status)}

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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            console.log('📥 Verificando archivo para descarga:', doc.file_url);
                            const response = await fetch(doc.file_url, { method: 'HEAD' });

                            if (response.ok) {
                              const link = document.createElement('a');
                              link.href = `${doc.file_url}?t=${Date.now()}`;
                              link.download = translateFileName(doc.file_name);
                              link.click();
                            } else {
                              console.error(
                                '❌ Archivo no disponible para descarga (status:',
                                response.status,
                                ')'
                              );
                              toast.error(
                                `El archivo no está disponible para descarga (Error ${response.status}).`
                              );
                            }
                          } catch (error) {
                            console.error('❌ Error descargando archivo:', error);
                            toast.error('Error al descargar el archivo.');
                          }
                        }}
                        className="dark:hover:bg-gray-700"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {/* Reemplazo solo si NO es extra (o si se permite reemplazar extra desde aquí también) */}
                      {currentUserRole === 'customer' && !doc.is_extra_document && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleReplaceDocument(doc.id, doc.file_url, doc.document_type)
                          }
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700"
                          disabled={uploading}
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
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const notes = prompt('Razón del rechazo (opcional):');
                                updateDocumentStatus(doc.id, 'rejected', notes || undefined);
                              }}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
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
    </>
  );
}
