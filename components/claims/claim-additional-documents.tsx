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
  onRefresh?: () => void;
  agentId?: string;
  claimNumber?: string;
  refreshTrigger?: number;
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
  onRefresh,
  agentId,
  claimNumber,
  refreshTrigger = 0,
}: ClaimAdditionalDocumentsProps) {
  const [loading, setLoading] = useState(true);
  const [requestedDocs, setRequestedDocs] = useState<RequestedDocument[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);

  console.log('🔄 ClaimAdditionalDocuments RENDER:', { claimId, refreshTrigger });

  const supabase = createClient();

  // Helper para normalizar texto de forma robusta (Mapa directo)
  const normalizeString = (str: string) => {
    const map: { [key: string]: string } = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
      'ñ': 'n', 'Ñ': 'n',
      'ü': 'u', 'Ü': 'u'
    };
    
    return str
      .split('')
      .map(char => map[char] || char)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
  };

  useEffect(() => {
    console.log('⚡ useEffect triggered by:', { claimId, refreshTrigger });
    fetchRequirements();

    // Suscribirse a nuevas comunicaciones para actualizar en tiempo real
    console.log('🔌 Setting up subscription for claim:', claimId);
    const channel = supabase
      .channel(`claim-docs-${claimId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications'
        },
        (payload) => {
          console.log('📨 Realtime event received (unfiltered):', payload);
          
          // Filter client-side to debug
          if (payload.new.claim_id === claimId) {
             console.log('🎯 Event matches current claim!');
             if (payload.new.subject && payload.new.subject.includes('Docs requeridos')) {
                console.log('🔔 Nueva solicitud de documentos detectada, actualizando...');
                fetchRequirements();
                toast.info('Nueva solicitud de documentos recibida');
             }
          } else {
             console.log(`⚠️ Event for different claim: ${payload.new.claim_id} vs ${claimId}`);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status for ${claimId}:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [claimId, refreshTrigger]);

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

  const checkAndNotifyAgent = async () => {
    console.log('🕵️ checkAndNotifyAgent START');
    console.log('Props:', { agentId, claimNumber, claimId });

    if (!claimNumber) {
      console.log('❌ Missing claimNumber');
      return;
    }
    
    // Si no hay agente asignado, igual permitimos la notificación para que llegue al sistema general
    if (!agentId) {
       console.warn('⚠️ No agentId provided, but proceeding with notification check');
    }

    try {
      // 1. Obtener etiquetas requeridas (misma lógica que fetchRequirements)
      const { data: communications } = await supabase
        .from('communications')
        .select('*')
        .eq('claim_id', claimId)
        .ilike('subject', '%Docs requeridos%');
      
      console.log('📨 Communications found:', communications?.length);

      if (!communications) return;

      const uniqueLabels = new Set<string>();
      communications.forEach(comm => {
        const lines = comm.content.split('\n');
        lines.forEach((line: string) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const label = trimmed.substring(1).trim();
            if (label) uniqueLabels.add(label);
          }
        });
      });

      console.log('🏷️ Unique labels required:', Array.from(uniqueLabels));

      if (uniqueLabels.size === 0) return;

      // 2. Obtener documentos subidos
      const { data: uploadedDocs } = await supabase
        .from('claim_customer_documents')
        .select('*')
        .eq('claim_id', claimId);
      
      console.log('📂 Uploaded docs count:', uploadedDocs?.length);
      
      if (!uploadedDocs) return;

      // 3. Verificar si todos están presentes
      const allUploaded = Array.from(uniqueLabels).every(label => {
        const found = uploadedDocs.some(d => {
          // Normalización robusta
          const normLabel = normalizeString(label).replace(/_/g, ''); // Remove underscores for loose matching if needed, or keep consistent
          
          if (d.is_extra_document) {
             if (d.extra_document_label === label) return true;
             const normDocLabel = normalizeString(d.extra_document_label || '').replace(/_/g, '');
             if (normDocLabel === normLabel) return true;
          }
          
          const normalizedName = normalizeString(d.file_name).replace(/_/g, '');
          return normalizedName.includes(normLabel);
        });
        console.log(`🔍 Checking label "${label}": ${found ? '✅ Found' : '❌ Missing'}`);
        return found;
      });

      console.log('🏁 All uploaded?', allUploaded);

      if (allUploaded) {
        const subject = `Documentos completados - ${claimNumber}`;
        
        // Check for existing notification (reduced time window to 1 minute for testing)
        const { data: existing } = await supabase
          .from('communications')
          .select('id')
          .eq('claim_id', claimId)
          .eq('subject', subject)
          .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString()) 
          .single();

        if (!existing) {
          console.log('🚀 Sending notification...');
          const { error: insertError } = await supabase.from('communications').insert({
            claim_id: claimId,
            customer_id: customerId,
            subject: subject,
            content: `El cliente ha subido todos los documentos adicionales solicitados para la reclamación ${claimNumber}.`,
            communication_type: 'system',
            direction: 'inbound',
            status: 'unread'
          });
          
          if (insertError) {
            console.error('❌ Error inserting notification:', insertError);
            toast.error(`Error al notificar al agente: ${insertError.message}`);
          } else {
            console.log('✅ Notificación enviada al agente: Documentos completados');
            // toast.success('Se ha notificado al agente que los documentos están completos');
          }
        } else {
          console.log('⚠️ Notification already sent recently');
        }
      }
    } catch (error) {
      console.error('Error checking completion:', error);
      toast.error('Error verificando documentos');
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
      const cleanLabel = normalizeString(selectedLabel);
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

      // toast.success('Documento subido exitosamente');
      
      // Recargar para actualizar estado
      await fetchRequirements();
      if (onRefresh) onRefresh();
      
      // Verificar si se completaron todos y notificar
      await checkAndNotifyAgent();
      
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
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Helper para obtener el estado del documento solicitado
  const getRequestedDocStatus = (label: string) => {
    // 1. Filtrar documentos que coincidan con el label
    const docsForLabel = documents.filter(d => {
      // Coincidencia exacta por label (prioridad)
      if (d.is_extra_document && d.extra_document_label === label) return true;
      
      // Fallback: coincidencia por nombre de archivo (legacy)
      const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedName = d.file_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedName.includes(normalizedLabel);
    });

    if (docsForLabel.length === 0) {
      return { state: 'missing' as const, doc: null };
    }

    // 2. Ordenar por fecha (más reciente primero) y tomar el último
    const lastDoc = docsForLabel.sort((a, b) => 
      new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
    )[0];

    return { 
      state: lastDoc.status, // 'pending' | 'approved' | 'rejected'
      doc: lastDoc 
    };
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

        {/* Vista para AGENTE: Lista con estados dinámicos */}
        {isAgent ? (
          <div className="space-y-3">
            <h4 className="font-medium mb-2 text-sm text-muted-foreground">Estado de documentos solicitados:</h4>
            <div className="grid gap-3">
              {requestedDocs.map((docItem, index) => {
                const { state, doc } = getRequestedDocStatus(docItem.label);
                
                // Configuración de badges según estado
                const statusConfig = {
                  missing: {
                    label: 'Pendiente de carga',
                    variant: 'outline',
                    className: 'bg-orange-50 text-orange-700 border-orange-200',
                    icon: Clock
                  },
                  pending: {
                    label: 'Pendiente por revisar o por aprobar',
                    variant: 'default',
                    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
                    icon: Clock
                  },
                  approved: {
                    label: 'Aprobado',
                    variant: 'default',
                    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200',
                    icon: CheckCircle
                  },
                  rejected: {
                    label: 'Rechazado',
                    variant: 'destructive',
                    className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200',
                    icon: AlertCircle
                  }
                };

                const config = statusConfig[state as keyof typeof statusConfig] || statusConfig.missing;
                const StatusIcon = config.icon;

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{docItem.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {doc && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Subido el {new Date(doc.upload_date).toLocaleDateString()}
                        </span>
                      )}
                      
                      <Badge variant={config.variant as any} className={config.className}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
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
                {requestedDocs.map((doc, index) => {
                  const { state } = getRequestedDocStatus(doc.label);
                  const isUploaded = state !== 'missing';
                  return (
                    <li key={index} className={`text-sm font-medium ${isUploaded ? 'text-green-600 dark:text-green-400 line-through' : ''}`}>
                      {doc.label}
                      {isUploaded && <span className="ml-2 text-xs no-underline">(Subido)</span>}
                    </li>
                  );
                })}
              </ul>
            </div>

            {(() => {
              const pendingRequestedDocs = requestedDocs.filter(doc => {
                 const { state } = getRequestedDocStatus(doc.label);
                 return state === 'missing';
              });
              
              if (pendingRequestedDocs.length === 0) {
                return (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                    <p className="text-green-800 dark:text-green-200 font-medium">
                      ¡Todo listo! No tienes documentos adicionales pendientes por subir.
                    </p>
                  </div>
                );
              }

              return (
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
                          {pendingRequestedDocs.map((doc, index) => (
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
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
