'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Trash2, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClaimCustomerDocument {
  id: string;
  claim_id: string;
  customer_id: string;
  document_type: 'license' | 'id' | 'proof_of_address' | 'invoice' | 'police_report' | 'photos' | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface ClaimCustomerDocumentsProps {
  claimId: string;
  customerId: string;
  currentUserRole?: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  license: 'Licencia de Conducir',
  id: 'Identificación Oficial',
  proof_of_address: 'Comprobante de Domicilio',
  invoice: 'Factura del Vehículo',
  police_report: 'Reporte Policial',
  photos: 'Fotografías del Siniestro',
  other: 'Otro Documento',
};

export function ClaimCustomerDocuments({ claimId, customerId, currentUserRole }: ClaimCustomerDocumentsProps) {
  const [documents, setDocuments] = useState<ClaimCustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, [claimId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('claim_customer_documents')
        .select('*')
        .eq('claim_id', claimId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('El archivo no debe superar los 10MB');
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos JPG, PNG o PDF');
      return;
    }

    setUploading(true);

    try {
      // Generar nombre único con timestamp
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${claimId}/${timestamp}-${randomStr}.${fileExt}`;

      console.log('📤 Subiendo archivo:', fileName);

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clientes-adjuntos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('❌ Error en upload:', uploadError);
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      console.log('✅ Archivo subido:', uploadData);

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('clientes-adjuntos')
        .getPublicUrl(fileName);

      console.log('🔗 URL pública:', publicUrl);

      // Detectar tipo de documento automáticamente
      const documentType = detectDocumentType(file.name);

      // Guardar en base de datos
      const { data: dbData, error: dbError } = await supabase
        .from('claim_customer_documents')
        .insert({
          claim_id: claimId,
          customer_id: customerId,
          document_type: documentType,
          file_name: file.name,
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
        await supabase.storage.from('clientes-adjuntos').remove([fileName]);
        
        // Mensaje de error más específico
        if (dbError.message.includes('row-level security')) {
          throw new Error('Permisos insuficientes. Por favor contacta al administrador para configurar las políticas RLS.');
        } else if (dbError.message.includes('violates foreign key')) {
          throw new Error('Reclamación o cliente no encontrado. Verifica los datos.');
        } else {
          throw new Error(`Error al guardar en BD: ${dbError.message}`);
        }
      }

      console.log('✅ Documento guardado en BD:', dbData);

      alert('✅ Documento subido exitosamente');
      fetchDocuments();
    } catch (error) {
      console.error('❌ Error completo:', error);
      
      // Mensaje más amigable según el tipo de error
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Bucket not found')) {
        alert('❌ Error: El bucket de almacenamiento no existe. Contacta al administrador.');
      } else if (errorMessage.includes('Permisos insuficientes')) {
        alert('❌ ' + errorMessage + '\n\n💡 El administrador debe ejecutar el archivo SETUP_COMPLETE_CLAIM_DOCUMENTS.sql en Supabase.');
      } else {
        alert('❌ Error al subir el documento: ' + errorMessage);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const detectDocumentType = (fileName: string): ClaimCustomerDocument['document_type'] => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('licencia') || lowerName.includes('license')) return 'license';
    if (lowerName.includes('identificacion') || lowerName.includes('id') || lowerName.includes('ine')) return 'id';
    if (lowerName.includes('comprobante') || lowerName.includes('domicilio')) return 'proof_of_address';
    if (lowerName.includes('factura') || lowerName.includes('invoice')) return 'invoice';
    if (lowerName.includes('policia') || lowerName.includes('police')) return 'police_report';
    if (lowerName.includes('foto') || lowerName.includes('photo') || lowerName.includes('img')) return 'photos';
    return 'other';
  };

  const handleDelete = async (docId: string, fileUrl: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    try {
      // Extraer path del archivo de la URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('clientes-adjuntos') + 1).join('/');

      // Eliminar de storage
      const { error: storageError } = await supabase.storage
        .from('clientes-adjuntos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Eliminar de base de datos
      const { error: dbError } = await supabase
        .from('claim_customer_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      alert('Documento eliminado');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const updateDocumentStatus = async (docId: string, newStatus: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('claim_customer_documents')
        .update({
          status: newStatus,
          notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', docId);

      if (error) throw error;

      alert(`Documento ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}`);
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      approved: { label: 'Aprobado', classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      rejected: { label: 'Rechazado', classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle },
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos del Cliente
            </CardTitle>
            <CardDescription>
              Documentos adicionales subidos por el cliente para esta reclamación
            </CardDescription>
          </div>
          
          {/* Permitir subir a: customer, agent, adjuster, admin */}
          {['customer', 'agent', 'adjuster', 'admin'].includes(currentUserRole || '') && (
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button asChild disabled={uploading}>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Subiendo...' : 'Subir Documento'}
                  </span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No hay documentos adicionales</p>
            {['customer', 'agent', 'adjuster', 'admin'].includes(currentUserRole || '') && (
              <p className="text-sm text-muted-foreground mt-2">
                Sube documentos de hasta 10MB (PDF, JPG, PNG)
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 dark:border-gray-700 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate dark:text-gray-100">{doc.file_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                      <span>{DOCUMENT_TYPE_LABELS[doc.document_type]}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.upload_date), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                    </div>
                    {doc.notes && (
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 italic">{doc.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(doc.status)}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(doc.file_url, '_blank')}
                    className="dark:hover:bg-gray-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = doc.file_url;
                      link.download = doc.file_name;
                      link.click();
                    }}
                    className="dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {currentUserRole === 'customer' && doc.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(doc.id, doc.file_url)}
                      className="text-destructive hover:text-destructive dark:hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  {['admin', 'agent', 'adjuster'].includes(currentUserRole || '') && doc.status === 'pending' && (
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
