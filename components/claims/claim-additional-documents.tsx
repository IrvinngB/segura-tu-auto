import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, AlertCircle, CheckCircle, Clock, Info, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { ClaimCustomerDocument } from '@/lib/types/database';

interface ClaimAdditionalDocumentsProps {
  claimId: string;
  customerId: string;
  onUploadComplete?: (doc: ClaimCustomerDocument) => void;
  documents?: ClaimCustomerDocument[];
  currentUserRole?: string;
}

interface RequestedDocument {
  label: string;
}

export function ClaimAdditionalDocuments({
  claimId,
  customerId,
  onUploadComplete,
  documents = [],
  currentUserRole,
}: ClaimAdditionalDocumentsProps) {
  const [loading, setLoading] = useState(true);
  const [requestedDocs, setRequestedDocs] = useState<RequestedDocument[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchRequirements();
  }, [claimId]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar TODAS las comunicaciones de tipo "Docs requeridos"
      const { data: communications, error: commError } = await supabase
        .from('communications')
        .select('*')
        .eq('claim_id', claimId)
        .ilike('subject', '%Docs requeridos%')
        .order('created_at', { ascending: true }); // Orden cronológico para procesar en orden

      if (commError) throw commError;

      if (!communications || communications.length === 0) {
        setHasRequest(false);
        return;
      }

      setHasRequest(true);

      // 2. Parsear el contenido de TODAS las comunicaciones para extraer la lista acumulada
      const uniqueLabels = new Set<string>();
      
      communications.forEach(comm => {
        const content = comm.content;
        const lines = content.split('\n');
        
        lines.forEach((line: string) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const label = trimmed.substring(1).trim();
            if (label) uniqueLabels.add(label);
          }
        });
      });

      if (uniqueLabels.size === 0) {
        console.warn('No se pudieron extraer documentos de las comunicaciones');
        if (communications.length > 0 && uniqueLabels.size === 0) {
             setHasRequest(false);
             return;
        }
      }

      setRequestedDocs(Array.from(uniqueLabels).map(label => ({ label })));

    } catch (error) {
      console.error('Error fetching additional requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLabel) return;

    // Validaciones básicas
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos JPG, PNG o PDF');
      return;
    }

    setUploading(true);

    try {
      // 1. Subir archivo
      const fileExt = file.name.split('.').pop();
      const cleanLabel = selectedLabel.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `extra_${cleanLabel}_${Date.now()}.${fileExt}`;
      const storagePath = `drafts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clientes-adjuntos')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('clientes-adjuntos')
        .getPublicUrl(storagePath);

      // 2. Guardar en BD
      const { data: insertedDoc, error: dbError } = await supabase
        .from('claim_customer_documents')
        .insert({
          claim_id: claimId,
          customer_id: customerId,
          document_type: 'other',
          file_name: fileName,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          is_extra_document: true,
          extra_document_label: selectedLabel
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Documento subido exitosamente');
      
      // Recargar para actualizar estado
      await fetchRequirements();
      if (onUploadComplete && insertedDoc) {
        onUploadComplete(insertedDoc);
      }
      setSelectedLabel(''); // Reset selection

    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
      event.target.value = '';
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

  // Helper para encontrar el documento correspondiente a un label solicitado
  const findMatchingDocument = (label: string) => {
    // Buscar primero por coincidencia exacta en extra_document_label
    let match = documents.find(d => d.is_extra_document && d.extra_document_label === label);
    
    // Si no, buscar por coincidencia parcial en el nombre del archivo (fallback para legacy)
    if (!match) {
      const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '');
      match = documents.find(d => {
        const normalizedName = d.file_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedName.includes(normalizedLabel);
      });
    }
    
    return match;
  };

  if (loading) return null;
  if (!hasRequest || requestedDocs.length === 0) return null;

  const isAgent = currentUserRole !== 'customer';

  return (
    <div className="mb-6 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 rounded-r-lg overflow-hidden shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full shrink-0">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Solicitud del agente de documentos adicionales
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              El agente ha solicitado documentos adicionales para esta reclamación. 
              {isAgent 
                ? " Revise el estado de los documentos solicitados a continuación."
                : " Por favor suba aquí los documentos indicados."}
            </p>
          </div>
        </div>

        {/* Vista para AGENTE: Lista con estados */}
        {isAgent ? (
          <div className="space-y-3">
            <h4 className="font-medium mb-2 text-sm text-muted-foreground">Estado de documentos solicitados:</h4>
            <div className="grid gap-3">
              {requestedDocs.map((doc, index) => {
                const matchingDoc = findMatchingDocument(doc.label);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{doc.label}</span>
                    </div>
                    
                    <div>
                      {matchingDoc ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            Subido el {new Date(matchingDoc.upload_date).toLocaleDateString()}
                          </span>
                          {getStatusBadge(matchingDoc.status)}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente de carga
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Vista para CLIENTE: Lista simple + Formulario de carga */
          <>
            <div className="mb-6 ml-11">
              <h4 className="font-medium mb-2 text-sm text-muted-foreground">Documentos solicitados:</h4>
              <ul className="list-disc list-inside space-y-1">
                {requestedDocs.map((doc, index) => (
                  <li key={index} className="text-sm font-medium">
                    {doc.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-1/2">
                  <label className="text-sm font-medium mb-2 block">Seleccione el documento a subir</label>
                  <Select
                    value={selectedLabel}
                    onValueChange={setSelectedLabel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar documento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {requestedDocs.map((doc, index) => (
                        <SelectItem key={index} value={doc.label}>
                          {doc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-1/2">
                  <div className="relative">
                    <input
                      type="file"
                      id="extra-file-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={uploading || !selectedLabel}
                    />
                    <label htmlFor="extra-file-upload" className="w-full">
                      <Button
                        className="w-full cursor-pointer"
                        disabled={uploading || !selectedLabel}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
