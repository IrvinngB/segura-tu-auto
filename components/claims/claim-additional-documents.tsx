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
import { Upload, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ClaimCustomerDocument } from '@/lib/types/database';

interface ClaimAdditionalDocumentsProps {
  claimId: string;
  customerId: string;
  onUploadComplete?: (doc: ClaimCustomerDocument) => void;
}

interface RequestedDocument {
  label: string;
}

export function ClaimAdditionalDocuments({
  claimId,
  customerId,
  onUploadComplete,
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
      
      // 1. Buscar la última comunicación de tipo "Docs requeridos"
      const { data: communications, error: commError } = await supabase
        .from('communications')
        .select('*')
        .eq('claim_id', claimId)
        .ilike('subject', '%Docs requeridos%')
        .order('created_at', { ascending: false })
        .limit(1);

      if (commError) throw commError;

      if (!communications || communications.length === 0) {
        setHasRequest(false);
        return;
      }

      const latestRequest = communications[0];
      setHasRequest(true);

      // 2. Parsear el contenido para extraer la lista de documentos
      const content = latestRequest.content;
      const lines = content.split('\n');
      const docLabels: string[] = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const label = trimmed.substring(1).trim();
          if (label) docLabels.push(label);
        }
      });

      if (docLabels.length === 0) {
        console.warn('No se pudieron extraer documentos de la comunicación:', latestRequest.id);
        setHasRequest(false);
        return;
      }

      setRequestedDocs(docLabels.map(label => ({ label })));

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) return null;
  if (!hasRequest || requestedDocs.length === 0) return null;

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
              Por favor suba aquí los documentos indicados.
            </p>
          </div>
        </div>

        {/* Lista de documentos solicitados */}
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

        {/* Formulario de carga */}
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
      </div>
    </div>
  );
}
