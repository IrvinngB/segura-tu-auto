'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import {
  Upload,
  FileText,
  Image,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Camera,
  FileSearch,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface ClaimDocument {
  id: string;
  claim_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  uploaded_by: string;
  upload_source: string;
  description?: string;
  is_verified: boolean;
  verification_notes?: string;
  created_at: string;
  uploader_first_name?: string;
  uploader_last_name?: string;
  uploader_role?: string;
}

interface ClaimEvidenceSystemProps {
  claimId: string;
  claimType?: string;
  canUpload?: boolean;
  canVerify?: boolean;
  currentUserRole?: string;
  customerId?: string;
}

const DOCUMENT_TYPES = {
  evidence: { label: 'Evidencia/Fotos del daño', icon: Camera, color: 'blue' },
  repair_estimate: { label: 'Cotización de reparación', icon: FileText, color: 'green' },
  police_report: { label: 'Reporte policial', icon: FileSearch, color: 'red' },
  medical_report: { label: 'Reporte médico', icon: FileText, color: 'purple' },
  witness_statement: { label: 'Declaración de testigos', icon: FileText, color: 'orange' },
  third_party_info: { label: 'Información de terceros', icon: FileText, color: 'yellow' },
  other: { label: 'Otros documentos', icon: FileText, color: 'gray' },
};

export function ClaimEvidenceSystem({
  claimId,
  claimType,
  canUpload = true,
  canVerify = false,
}: ClaimEvidenceSystemProps) {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('evidence');
  const [description, setDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadDocuments();

    // Suscripción en tiempo real para nuevos documentos
    const channel = supabase
      .channel(`claim-documents-${claimId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claim_documents',
          filter: `claim_id=eq.${claimId}`,
        },
        () => {
          console.log('📄 Documento actualizado, recargando...');
          loadDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [claimId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando evidencias para claim:', claimId);
      
      const { data, error } = await supabase
        .from('claim_documents')
        .select(`
          *,
          uploader:uploaded_by(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error al cargar evidencias:', error);
        throw error;
      }
      
      console.log('✅ Evidencias cargadas:', data?.length || 0, 'documentos');
      console.log('Datos:', data);
      
      setDocuments((data as any) || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      // Crear un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${claimId}/${documentType}/${timestamp}.${fileExt}`;

      console.log('📤 Subiendo evidencia:', fileName);

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage.from('claim-evidence').upload(fileName, file);

      if (error) {
        console.error('❌ Error en upload de evidencia:', error);
        
        // Mensajes de error más específicos
        if (error.message.includes('row-level security')) {
          throw new Error('Permisos insuficientes. El administrador debe configurar las políticas RLS del bucket claim-evidence.');
        } else if (error.message.includes('Bucket not found')) {
          throw new Error('El bucket claim-evidence no existe. Contacta al administrador.');
        } else {
          throw new Error(`Error al subir archivo: ${error.message}`);
        }
      }

      console.log('✅ Evidencia subida:', data);

      // Obtener URL pública del archivo
      const {
        data: { publicUrl },
      } = supabase.storage.from('claim-evidence').getPublicUrl(fileName);

      console.log('🔗 URL pública evidencia:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('❌ Error completo al subir evidencia:', error);
      toast.error((error as Error).message || 'Error al subir el archivo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos PNG, JPG, JPEG y PDF');
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 10MB');
        return;
      }

      setSelectedFile(file);
      toast.success(`Archivo ${file.name} seleccionado`);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) return;

    try {
      console.log('📤 Iniciando subida de evidencia...');
      console.log('- Archivo:', selectedFile.name);
      console.log('- Tipo documento:', documentType);
      console.log('- Claim ID:', claimId);
      
      // Subir archivo
      const fileUrl = await uploadFile(selectedFile);
      if (!fileUrl) {
        console.error('❌ No se obtuvo URL del archivo');
        return;
      }

      console.log('✅ Archivo subido, guardando en BD...');
      console.log('- URL:', fileUrl);

      // Guardar información del documento en la base de datos
      const { data, error } = await supabase.from('claim_documents').insert({
        claim_id: claimId,
        document_type: documentType,
        file_name: selectedFile.name,
        file_url: fileUrl,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        uploaded_by: userProfile?.id,
        upload_source: 'web',
        description: description.trim() || null,
      }).select();

      if (error) {
        console.error('❌ Error al guardar en BD:', error);
        throw error;
      }

      console.log('✅ Evidencia guardada en BD:', data);

      // Limpiar formulario
      setSelectedFile(null);
      setDescription('');
      setDocumentType('evidence');

      // Reset file input
      const fileInput = document.getElementById('evidence-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast.success('Documento subido exitosamente');

      // También crear una comunicación para notificar a los agentes
      const customerData =
        userProfile?.role === 'customer'
          ? await supabase.from('customers').select('id').eq('user_id', userProfile.id).single()
          : null;

      await supabase.from('communications').insert({
        claim_id: claimId,
        customer_id: customerData?.data?.id || null,
        agent_id: userProfile?.role !== 'customer' ? userProfile?.id : null,
        communication_type: 'system',
        direction: userProfile?.role === 'customer' ? 'inbound' : 'outbound',
        subject: 'Nueva evidencia cargada',
        content: `📸 Se ha cargado nueva evidencia: ${DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES]?.label || documentType} - ${selectedFile.name}`,
        status: 'sent',
        attachment_url: fileUrl,
        attachment_name: selectedFile.name,
        attachment_type: selectedFile.type,
      });

      // Recargar documentos para mostrar el nuevo documento
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    }
  };

  const verifyDocument = async (documentId: string, isVerified: boolean, notes?: string) => {
    try {
      const { error } = await supabase
        .from('claim_documents')
        .update({
          is_verified: isVerified,
          verification_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (error) throw error;

      toast.success(isVerified ? 'Documento verificado' : 'Verificación removida');
      loadDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Error al verificar el documento');
    }
  };

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const { error } = await supabase.from('claim_documents').delete().eq('id', documentToDelete);

      if (error) throw error;

      toast.success('Documento eliminado');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar el documento');
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const translateFileName = (fileName: string) => {
    // Mapeo de nombres en inglés a español
    const translations = {
      'draft_police_report': 'Reporte_Policial',
      'draft_photos': 'Fotografias_del_Siniestro',
      'draft_invoice': 'Factura_del_Vehiculo',
      'draft_proof_of_address': 'Comprobante_de_Domicilio',
      'draft_license': 'Licencia_de_Conducir',
      'draft_id': 'Identificacion_Oficial',
      'police_report': 'Reporte_Policial',
      'photos': 'Fotografias_del_Siniestro',
      'invoice': 'Factura_del_Vehiculo',
      'proof_of_address': 'Comprobante_de_Domicilio',
      'license': 'Licencia_de_Conducir',
      'id': 'Identificacion_Oficial'
    };

    let translatedName = fileName;
    
    // Buscar y reemplazar cada patrón en inglés
    Object.entries(translations).forEach(([english, spanish]) => {
      const regex = new RegExp(english, 'gi');
      translatedName = translatedName.replace(regex, spanish);
    });

    return translatedName;
  };

  const getRequiredDocuments = (claimType: string) => {
    const baseRequired = ['evidence'];

    switch (claimType.toLowerCase()) {
      case 'collision':
      case 'colisión':
        return [...baseRequired, 'police_report', 'repair_estimate'];
      case 'theft':
      case 'robo':
        return [...baseRequired, 'police_report'];
      case 'vandalism':
      case 'vandalismo':
        return [...baseRequired, 'police_report', 'repair_estimate'];
      default:
        return baseRequired;
    }
  };

  const requiredDocs = getRequiredDocuments(claimType || 'collision');
  const uploadedTypes = documents.map(doc => doc.document_type);
  const missingDocs = requiredDocs.filter(type => !uploadedTypes.includes(type));

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Evidencias y Documentos
          <InfoTooltip 
            content="Sube fotos claras del daño, reportes policiales, cotizaciones de reparación y cualquier otro documento relevante. Esto acelera el proceso de tu reclamación."
            side="right"
          />
        </CardTitle>
        <CardDescription>Documentos y evidencias relacionadas con esta reclamación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Documentos requeridos faltantes */}
        {missingDocs.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Documentos requeridos pendientes:</strong>
              <ul className="mt-2 list-disc list-inside">
                {missingDocs.map(type => (
                  <li key={type}>
                    {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]?.label || type}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario de subida */}
        {canUpload && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h3 className="font-semibold">Subir Nuevo Documento</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Archivo</Label>
                <input
                  type="file"
                  id="evidence-file-upload"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('evidence-file-upload')?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                </Button>
              </div>
            </div>

            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                placeholder="Describe el contenido del documento..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Archivo seleccionado */}
            {selectedFile && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  {(() => {
                    const FileIcon = getFileIcon(selectedFile.type);
                    return <FileIcon className="h-6 w-6 text-blue-500" />;
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} •{' '}
                      {selectedFile.type.split('/')[1]?.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={uploadDocument} disabled={uploading} size="sm">
                      {uploading ? 'Subiendo...' : 'Subir'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        const fileInput = document.getElementById(
                          'evidence-file-upload'
                        ) as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de documentos */}
        <div className="space-y-4">
          <h3 className="font-semibold">Documentos Cargados ({documents.length})</h3>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando documentos...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay documentos cargados</p>
            </div>
          ) : (
            documents.map(doc => {
              const FileIcon = getFileIcon(doc.file_type);
              const docTypeConfig =
                DOCUMENT_TYPES[doc.document_type as keyof typeof DOCUMENT_TYPES];

              return (
                <div
                  key={doc.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <FileIcon className="h-8 w-8 text-blue-500 mt-1" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">{translateFileName(doc.file_name)}</h4>
                        <Badge variant="outline">{docTypeConfig?.label || doc.document_type}</Badge>
                        {doc.is_verified && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                      </div>

                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Subido por: {doc.uploader_first_name} {doc.uploader_last_name} (
                          {doc.uploader_role})
                        </span>
                        <span>
                          {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                        {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                      </div>

                      {doc.verification_notes && (
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 rounded">
                          <strong>Notas de verificación:</strong> {doc.verification_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {doc.file_type.startsWith('image/') ? 'Ver' : 'Descargar'}
                      </Button>

                      {canVerify && (
                        <Button
                          size="sm"
                          variant={doc.is_verified ? 'outline' : 'default'}
                          onClick={() => verifyDocument(doc.id, !doc.is_verified)}
                        >
                          {doc.is_verified ? (
                            <XCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          {doc.is_verified ? 'Desverificar' : 'Verificar'}
                        </Button>
                      )}

                      {(userProfile?.role === 'admin' || doc.uploaded_by === userProfile?.id) && (
                        <Button size="sm" variant="outline" onClick={() => handleDeleteClick(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El documento será eliminado permanentemente del sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
