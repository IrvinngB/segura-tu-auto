'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { ClaimCustomerDocument } from '@/lib/types/database';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CustomerDocumentsPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<ClaimCustomerDocument[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (userProfile?.id) {
      fetchCustomerId();
    }
  }, [userProfile]);

  useEffect(() => {
    if (customerId) {
      fetchDocuments();
    }
  }, [customerId]);

  const fetchCustomerId = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userProfile?.id)
        .single();

      if (error) throw error;
      setCustomerId(data.id);
    } catch (error) {
      console.error('Error fetching customer ID:', error);
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!customerId) return;

    try {
      const { data, error } = await supabase
        .from('customer_documents')
        .select('*')
        .eq('customer_id', customerId)
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
    if (!file || !customerId) return;

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo debe ser menor a 10MB');
      return;
    }

    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos PDF, JPG y PNG');
      return;
    }

    setUploading(true);

    try {
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `${customerId}/${timestamp}_${file.name}`;

      // Subir archivo al bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clientes-adjuntos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('clientes-adjuntos').getPublicUrl(fileName);

      // Guardar registro en base de datos
      const { error: dbError } = await supabase.from('customer_documents').insert({
        customer_id: customerId,
        document_type: getDocumentType(file.name),
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        upload_date: new Date().toISOString(),
        status: 'pending',
      });

      if (dbError) throw dbError;

      // Actualizar lista
      await fetchDocuments();
      alert('Documento subido exitosamente');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo: ' + (error as Error).message);
    } finally {
      setUploading(false);
      // Resetear input
      event.target.value = '';
    }
  };

  const getDocumentType = (fileName: string): string => {
    const name = fileName.toLowerCase();
    if (name.includes('licencia') || name.includes('license')) return 'license';
    if (name.includes('ine') || name.includes('id')) return 'id';
    if (name.includes('comprobante') || name.includes('proof')) return 'proof_of_address';
    if (name.includes('factura') || name.includes('invoice')) return 'invoice';
    return 'other';
  };

  const handleDeleteDocument = async (documentId: string, fileUrl: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      // Extraer path del archivo de la URL
      const urlParts = fileUrl.split('/clientes-adjuntos/');
      const filePath = urlParts[1];

      // Eliminar archivo del storage
      const { error: storageError } = await supabase.storage
        .from('clientes-adjuntos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Eliminar registro de base de datos
      const { error: dbError } = await supabase
        .from('customer_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      // Actualizar lista
      await fetchDocuments();
      alert('Documento eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento: ' + (error as Error).message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      license: 'Licencia de Conducir',
      id: 'Identificación Oficial',
      proof_of_address: 'Comprobante de Domicilio',
      invoice: 'Factura',
      other: 'Otro',
    };
    return types[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Cargando documentos...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis Documentos</h1>
            <p className="text-muted-foreground">
              Gestiona tus documentos y comprobantes de seguro
            </p>
          </div>
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Subir Documento'}
            </Button>
          </div>
        </div>

        {/* Información sobre tipos de archivos permitidos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Formatos permitidos: PDF, JPG, PNG</li>
              <li>Tamaño máximo: 10MB por archivo</li>
              <li>Tus documentos serán revisados por nuestro equipo</li>
              <li>Nombra tus archivos descriptivamente (ej: "licencia_conducir.pdf")</li>
            </ul>
          </CardContent>
        </Card>

        {/* Lista de documentos */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No tienes documentos cargados. Sube tu primer documento para comenzar.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map(doc => (
              <Card key={doc.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.file_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{getDocumentTypeLabel(doc.document_type)}</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(doc.upload_date), "d 'de' MMMM, yyyy", {
                              locale: es,
                            })}
                          </span>
                        </div>
                        {doc.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Nota: {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.file_url;
                          link.download = doc.file_name;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                      {doc.status === 'pending' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id, doc.file_url)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
