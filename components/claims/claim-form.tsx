'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import type { Policy, Customer } from '@/lib/types/database';

// Interfaces para documentos requeridos
interface RequiredDocument {
  id: string;
  type: 'license' | 'id' | 'invoice' | 'police_report' | 'photos';
  name: string;
  description: string;
  required: boolean;
  category: 'identity' | 'vehicle' | 'incident' | 'legal';
  icon: any;
}

interface UploadedDocument {
  file: File;
  url: string;
  fileName: string;
  storagePath: string;
}
import {
  FileText,
  Calendar,
  MapPin,
  AlertTriangle,
  Upload,
  X,
  CheckCircle,
  Users,
  Loader2,
  Camera,
  Shield,
  ExternalLink,
  Eye,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { toast } from 'sonner';

interface ClaimFormProps {
  policyId?: string;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClaimForm({ policyId, customerId, onSuccess, onCancel }: ClaimFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState(customerId || '');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState(policyId || '');
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [claimData, setClaimData] = useState({
    incidentDate: format(new Date(), 'yyyy-MM-dd'),
    incidentTime: '12:00',
    claimType: 'Colisión',
    incidentDescription: '',
    incidentLocation: '',
    policeReportNumber: '',
    estimatedDamageCost: '',
    thirdPartyInvolved: false,
    injuryInvolved: false,
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Estados para documentos requeridos
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: UploadedDocument }>(
    {}
  );
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const supabase = createClient();

  // Efecto para el temporizador del modal de éxito
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 1) {
          // Cuando llegue a 0, cerrar el modal y ejecutar onSuccess
          setSuccess('');
          if (onSuccess) {
            onSuccess();
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, countdown, onSuccess]);

  useEffect(() => {
    // Si no hay customerId (caso de agentes), cargar lista de clientes
    if (!customerId) {
      fetchCustomers();
    } else {
      // Si hay customerId (caso de customer), usar ese ID
      setSelectedCustomer(customerId);
    }
  }, [customerId]);

  useEffect(() => {
    // Cargar pólizas cuando se selecciona un cliente
    if (selectedCustomer) {
      fetchPolicies();
    } else {
      setPolicies([]);
      setSelectedPolicy('');
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const { data, error } = await supabase
        .from('customers')
        .select(
          `
                    *,
                    user:users(*)
                `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Error cargando clientes');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      setLoadingPolicies(true);
      console.log('🔍 Fetching policies for customer:', selectedCustomer);

      let query = supabase
        .from('policies')
        .select(
          `
          *,
          customer:customers(
            *,
            user:users(*)
          ),
          vehicle:vehicles(*)
        `
        )
        // Incluir pólizas activas, suspendidas (que pueden ser reactivadas) y draft que pueden haber sido activadas
        // Excluir canceladas y expiradas que no son válidas para reclamaciones
        .in('status', ['active', 'suspended', 'draft'])
        .order('created_at', { ascending: false });

      // Usar selectedCustomer en lugar de customerId
      if (selectedCustomer) {
        query = query.eq('customer_id', selectedCustomer);
      }

      const { data, error } = await query;

      console.log('📋 Policies query result:', { data, error, selectedCustomer });

      if (error) throw error;

      if (data) {
        // Filtrar adicionalmente en el frontend para asegurar que tenemos pólizas válidas
        const validPolicies = data.filter(policy => {
          const endDate = new Date(policy.end_date);
          const today = new Date();
          // Incluir pólizas que no hayan expirado hace más de 30 días (para reclamaciones tardías)
          const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return endDate >= thirtyDaysAgo;
        });

        console.log(
          '✅ Found valid policies:',
          validPolicies.map(p => ({
            id: p.id,
            policy_number: p.policy_number,
            status: p.status,
            customer_id: p.customer_id,
            end_date: p.end_date,
          }))
        );
        setPolicies(validPolicies);
      } else {
        console.log('⚠️ No policies found');
        setPolicies([]);
      }
    } catch (error) {
      console.error('❌ Error fetching policies:', error);
      setError('Error cargando pólizas');
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setClaimData(prev => ({ ...prev, [field]: value }));
  };

  const generateClaimNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `CLM-${year}-${random}`;
  };

  // Determinar prioridad automáticamente basado en los datos del siniestro
  const determinePriority = (data: any) => {
    let priorityScore = 0;

    // Aumentar prioridad si hay lesiones
    if (data.injuryInvolved) priorityScore += 3;

    // Aumentar prioridad si hay terceros involucrados
    if (data.thirdPartyInvolved) priorityScore += 2;

    // Tipos de siniestro que requieren alta prioridad
    const highPriorityTypes = ['Incendio', 'Robo'];
    if (highPriorityTypes.includes(data.claimType)) priorityScore += 2;

    // Costo estimado alto
    const estimatedCost = parseFloat(data.estimatedDamageCost || '0');
    if (estimatedCost > 100000) priorityScore += 2;
    else if (estimatedCost > 50000) priorityScore += 1;

    // Determinar prioridad final
    if (priorityScore >= 5) return 'urgent';
    if (priorityScore >= 3) return 'high';
    if (priorityScore >= 1) return 'medium';
    return 'low';
  };

  // Obtener documentos requeridos basados en el tipo de reclamación
  const getRequiredDocuments = (claimType: string): RequiredDocument[] => {
    const baseDocuments: RequiredDocument[] = [
      {
        id: 'id',
        type: 'id',
        name: 'Cédula de Identidad',
        description: 'Documento de identidad del titular de la póliza',
        required: true,
        category: 'identity',
        icon: FileText,
      },
      {
        id: 'license',
        type: 'license',
        name: 'Licencia de Conducir',
        description: 'Licencia de conducir vigente del conductor al momento del siniestro',
        required: true,
        category: 'identity',
        icon: FileText,
      },
      {
        id: 'invoice',
        type: 'invoice',
        name: 'Póliza de Seguro',
        description: 'Copia de la póliza de seguro vigente',
        required: true,
        category: 'vehicle',
        icon: Shield,
      },
      {
        id: 'photos',
        type: 'photos',
        name: 'Fotografías del Daño',
        description: 'Fotos claras de todos los daños del vehículo',
        required: true,
        category: 'incident',
        icon: Camera,
      },
    ];

    // Documentos adicionales según tipo de siniestro
    if (claimType === 'Colisión' || claimType === 'Vandalismo') {
      baseDocuments.push({
        id: 'police_report',
        type: 'police_report',
        name: 'Parte Policial',
        description: 'Reporte oficial de la policía de tránsito',
        required: true,
        category: 'legal',
        icon: FileText,
      });
    }

    if (claimType === 'Robo') {
      baseDocuments.push({
        id: 'police_report',
        type: 'police_report',
        name: 'Parte Policial',
        description: 'Reporte oficial de la policía de tránsito',
        required: true,
        category: 'legal',
        icon: FileText,
      });
    }

    return baseDocuments;
  };

  // Actualizar documentos requeridos cuando cambia el tipo de reclamación
  useEffect(() => {
    const docs = getRequiredDocuments(claimData.claimType);
    setRequiredDocuments(docs);
    // Limpiar documentos subidos si cambia el tipo
    setUploadedDocuments({});
  }, [claimData.claimType]);

  // Función para subir un documento
  const handleDocumentUpload = async (docType: string, file: File) => {
    try {
      setUploadingDocs(true);

      // Validar archivo
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('El archivo no debe superar los 10MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }

      console.log(`📤 Subiendo documento ${docType} inmediatamente...`);

      // Mapeo de tipos de documentos a nombres en español
      const documentNames = {
        id: 'Cedula_Identidad',
        license: 'Licencia_Conducir', 
        invoice: 'Poliza_Seguro',
        photos: 'Fotografias_Siniestro',
        police_report: 'Reporte_Policial'
      };

      // Subir archivo inmediatamente a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const spanishName = documentNames[docType as keyof typeof documentNames] || docType;
      const fileName = `${spanishName}_${timestamp}.${fileExt}`;
      const storagePath = `drafts/${fileName}`;

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clientes-adjuntos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error(`❌ Error subiendo ${docType}:`, uploadError);

        // Mensajes de error más específicos
        if (uploadError.message.includes('row-level security')) {
          throw new Error(
            'Permisos insuficientes. El administrador debe configurar las políticas RLS del bucket clientes-adjuntos.'
          );
        } else if (uploadError.message.includes('Bucket not found')) {
          throw new Error('El bucket clientes-adjuntos no existe. Contacta al administrador.');
        } else {
          throw new Error(`Error al subir archivo: ${uploadError.message}`);
        }
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('clientes-adjuntos').getPublicUrl(storagePath);

      console.log(`✅ Documento ${docType} subido a:`, publicUrl);

      // Guardar información del archivo en el estado para usar en la creación
      setUploadedDocuments(prev => ({
        ...prev,
        [docType]: {
          file: file,
          url: publicUrl,
          fileName: fileName,
          storagePath: storagePath,
        },
      }));

      toast.success(`Documento ${docType} subido correctamente`);
    } catch (error) {
      console.error(`Error uploading document ${docType}:`, error);
      toast.error((error as Error).message || 'Error al subir el documento');
    } finally {
      setUploadingDocs(false);
    }
  };

  // Función para eliminar un documento
  const handleDocumentRemove = async (docType: string) => {
    try {
      const docInfo = uploadedDocuments[docType];
      if (docInfo && docInfo.storagePath) {
        // Eliminar del storage
        const { error: deleteError } = await supabase.storage
          .from('clientes-adjuntos')
          .remove([docInfo.storagePath]);

        if (deleteError) {
          console.error(`Error eliminando archivo ${docType}:`, deleteError);
        }
      }

      // Eliminar del estado
      setUploadedDocuments(prev => {
        const newDocs = { ...prev };
        delete newDocs[docType];
        return newDocs;
      });

      toast.success('Documento eliminado');
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Error al eliminar el documento');
    }
  };

  // Calcular progreso de documentos
  const getDocumentProgress = () => {
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const uploadedCount = requiredDocs.filter(doc => uploadedDocuments[doc.type]).length;
    return requiredDocs.length > 0 ? (uploadedCount / requiredDocs.length) * 100 : 0;
  };

  // Verificar si todos los documentos requeridos están subidos
  const areAllRequiredDocumentsUploaded = () => {
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    return requiredDocs.every(doc => uploadedDocuments[doc.type]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔍 Starting claim submission:', {
        selectedCustomer,
        selectedPolicy,
      });

      if (!selectedCustomer) {
        throw new Error('Debe seleccionar un cliente');
      }

      if (!selectedPolicy) {
        throw new Error('Debe seleccionar una póliza');
      }

      // Validar que todos los documentos requeridos estén subidos
      if (!areAllRequiredDocumentsUploaded()) {
        const missingDocs = requiredDocuments
          .filter(doc => doc.required && !uploadedDocuments[doc.type])
          .map(doc => doc.name)
          .join(', ');
        throw new Error(`Faltan documentos requeridos: ${missingDocs}`);
      }

      const policy = policies.find(p => p.id === selectedPolicy);
      if (!policy) {
        throw new Error('Póliza no encontrada');
      }

      console.log('📋 Policy found:', policy);

      const claimNumber = generateClaimNumber();
      const incidentDateTime = new Date(`${claimData.incidentDate}T${claimData.incidentTime}:00`);

      console.log('📝 Creating claim with data:', {
        claim_number: claimNumber,
        policy_id: selectedPolicy,
        customer_id: selectedCustomer,
        incident_date: incidentDateTime.toISOString(),
        claim_type: claimData.claimType,
        incident_description: claimData.incidentDescription,
      });

      // Create claim
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert({
          claim_number: claimNumber,
          policy_id: selectedPolicy,
          customer_id: selectedCustomer,
          incident_date: incidentDateTime.toISOString(),
          claim_type: claimData.claimType,
          status: 'submitted',
          incident_description: claimData.incidentDescription,
          incident_location: claimData.incidentLocation || null,
          estimated_damage_cost: claimData.estimatedDamageCost
            ? Number.parseFloat(claimData.estimatedDamageCost)
            : null,
          priority: determinePriority(claimData),
        })
        .select()
        .single();

      console.log('✅ Claim creation result:', { claim, claimError });

      if (claimError) throw claimError;

      console.log('📄 Uploading documents for claim:', claim.id);

      // Subir documentos a Supabase Storage y guardar en base de datos
      let uploadedCount = 0;
      const totalDocs = Object.keys(uploadedDocuments).length;

      for (const [docType, docInfo] of Object.entries(uploadedDocuments)) {
        try {
          console.log(`📄 Registrando documento ${docType} en BD:`, docInfo.fileName);

          // Guardar en base de datos (el archivo ya está subido)
          const { error: dbError } = await supabase.from('claim_customer_documents').insert({
            claim_id: claim.id,
            customer_id: selectedCustomer,
            document_type: docType,
            file_name: docInfo.fileName,
            file_url: docInfo.url,
            file_size: docInfo.file.size,
            mime_type: docInfo.file.type,
            status: 'pending',
          });

          if (dbError) {
            console.error(`❌ Error guardando ${docType} en BD:`, dbError);
          } else {
            uploadedCount++;
            console.log(`✅ Documento ${docType} registrado en BD correctamente`);
          }
        } catch (docError) {
          console.error(`❌ Error procesando documento ${docType}:`, docError);
        }
      }

      console.log(`✅ Documentos subidos: ${uploadedCount}/${totalDocs}`);

      setSuccess(
        `¡Reclamación ${claimNumber} creada exitosamente! Se han subido ${uploadedCount} de ${totalDocs} documentos. Los documentos están siendo procesados y serán revisados por nuestro equipo.`
      );
      setCountdown(5); // Más tiempo para leer el mensaje con info de documentos
    } catch (error) {
      console.error('💥 Error creating claim:', error);
      let errorMessage = 'Error al crear la reclamación';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const claimTypes = [
    { value: 'Colisión', label: 'Colisión' },
    { value: 'Robo', label: 'Robo' },
    { value: 'Vandalismo', label: 'Vandalismo' },
    { value: 'Incendio', label: 'Incendio' },
    { value: 'Daño por clima', label: 'Daño por clima (Inundación)' },
    { value: 'Daño por granizo', label: 'Daño por granizo' },
    { value: 'Otros', label: 'Otros (Cristales, etc.)' },
  ];

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nueva Reclamación
          </CardTitle>
          <CardDescription>
            Complete la información del siniestro para procesar su reclamación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Customer Selection - Only show if no customerId (for agents) */}
            {!customerId && (
              <div className="space-y-3">
                <Label htmlFor="customer" className="text-sm font-medium">
                  Cliente *
                </Label>
                <Select
                  value={selectedCustomer}
                  onValueChange={value => {
                    // Only process if it's not a special value
                    if (value && !value.startsWith('__')) {
                      setSelectedCustomer(value);
                      setSelectedPolicy(''); // Reset policy selection when customer changes
                    }
                  }}
                  disabled={loadingCustomers}
                >
                  <SelectTrigger className="h-12 px-6 py-4 text-sm">
                    <SelectValue
                      placeholder={
                        loadingCustomers ? 'Cargando clientes...' : 'Seleccionar cliente'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-popover border border-border shadow-lg">
                    {loadingCustomers ? (
                      <SelectItem
                        value="__loading__"
                        disabled
                        className="py-3 px-4 text-muted-foreground"
                      >
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Cargando clientes...</span>
                        </div>
                      </SelectItem>
                    ) : customers.length === 0 ? (
                      <SelectItem
                        value="__no_customers__"
                        disabled
                        className="py-3 px-4 text-muted-foreground"
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-foreground/70">No hay clientes disponibles</span>
                        </div>
                      </SelectItem>
                    ) : (
                      customers.map(customer => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id}
                          className="py-3 px-4 cursor-pointer hover:bg-accent/80 focus:bg-accent data-highlighted:bg-accent/60 transition-colors border-b border-border/20 last:border-0 group"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground group-hover:text-white group-focus:text-white group-data-highlighted:text-white" />
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-sm text-foreground group-hover:text-white group-focus:text-white group-data-highlighted:text-white">
                                {customer.user?.first_name} {customer.user?.last_name}
                              </span>
                              <span className="text-xs text-muted-foreground/80 group-hover:text-white/90 group-focus:text-white/90 group-data-highlighted:text-white/90">
                                {customer.user?.email}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedCustomer && (
                  <p className="text-sm text-muted-foreground">
                    Cliente seleccionado:{' '}
                    {customers.find(c => c.id === selectedCustomer)?.user?.first_name}{' '}
                    {customers.find(c => c.id === selectedCustomer)?.user?.last_name}
                  </p>
                )}
              </div>
            )}

            {/* Policy Selection */}
            <div className="space-y-3">
              <Label htmlFor="policy" className="text-sm font-medium">
                Póliza *
              </Label>
              <Select
                value={selectedPolicy}
                onValueChange={value => {
                  // Only process if it's not a special value
                  if (value && !value.startsWith('__')) {
                    setSelectedPolicy(value);
                  }
                }}
                disabled={!!policyId || !selectedCustomer || loadingPolicies}
              >
                <SelectTrigger className="h-12 px-6 py-4 text-sm">
                  <SelectValue
                    placeholder={
                      !selectedCustomer
                        ? 'Primero seleccione un cliente'
                        : loadingPolicies
                          ? 'Cargando pólizas...'
                          : policies.length === 0
                            ? 'No hay pólizas disponibles para este cliente'
                            : 'Seleccionar póliza'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-popover border border-border shadow-lg">
                  {loadingPolicies ? (
                    <SelectItem
                      value="__loading_policies__"
                      disabled
                      className="py-3 px-4 text-muted-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando pólizas...</span>
                      </div>
                    </SelectItem>
                  ) : policies.length === 0 ? (
                    <SelectItem
                      value="__no_policies__"
                      disabled
                      className="py-3 px-4 text-muted-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-foreground/70">
                          No hay pólizas disponibles para este cliente
                        </span>
                      </div>
                    </SelectItem>
                  ) : (
                    policies.map(policy => (
                      <SelectItem
                        key={policy.id}
                        value={policy.id}
                        className="py-3 px-4 hover:bg-accent/80 focus:bg-accent data-highlighted:bg-accent/60 cursor-pointer border-b border-border/20 last:border-0 transition-colors group"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground group-hover:text-white group-focus:text-white group-data-highlighted:text-white">
                              {policy.policy_number}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                policy.status === 'active'
                                  ? 'text-green-600 border-green-600 bg-green-50'
                                  : policy.status === 'draft'
                                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                                    : policy.status === 'suspended'
                                      ? 'text-yellow-600 border-yellow-600 bg-yellow-50'
                                      : 'text-gray-600 border-gray-600 bg-gray-50'
                              }`}
                            >
                              {policy.status === 'active'
                                ? 'Activa'
                                : policy.status === 'draft'
                                  ? 'Borrador'
                                  : policy.status === 'suspended'
                                    ? 'Suspendida'
                                    : policy.status}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground/80 group-hover:text-white/90 group-focus:text-white/90 group-data-highlighted:text-white/90">
                            {policy.vehicle?.year} {policy.vehicle?.make} {policy.vehicle?.model} -{' '}
                            {policy.vehicle?.license_plate}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Incident Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="incidentDate">Fecha del Siniestro *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="incidentDate"
                    type="date"
                    value={claimData.incidentDate}
                    onChange={e => handleInputChange('incidentDate', e.target.value)}
                    className="pl-10"
                    max={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incidentTime">Hora del Siniestro</Label>
                <Input
                  id="incidentTime"
                  type="time"
                  value={claimData.incidentTime}
                  onChange={e => handleInputChange('incidentTime', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="claimType" className="flex items-center gap-2">
                  Tipo de Siniestro *
                  <InfoTooltip
                    content="Selecciona el tipo de incidente que ocurrió. Esto ayuda a asignar tu caso al ajustador correcto y determinar la cobertura aplicable."
                    side="right"
                  />
                </Label>
                <Select
                  value={claimData.claimType}
                  onValueChange={value => handleInputChange('claimType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {claimTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={claimData.priority}
                  onValueChange={value => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location and Description */}
            <div className="space-y-2">
              <Label htmlFor="incidentLocation">Ubicación del Siniestro</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="incidentLocation"
                  placeholder="Calle, colonia, ciudad..."
                  value={claimData.incidentLocation}
                  onChange={e => handleInputChange('incidentLocation', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentDescription" className="flex items-center gap-2">
                Descripción del Siniestro *
                <InfoTooltip
                  content="Proporciona todos los detalles relevantes: qué pasó, cómo ocurrió, si hubo testigos, condiciones del clima, etc. Esto acelera el proceso de investigación."
                  side="right"
                />
              </Label>
              <Textarea
                id="incidentDescription"
                placeholder="Describa detalladamente lo que ocurrió..."
                value={claimData.incidentDescription}
                onChange={e => handleInputChange('incidentDescription', e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="policeReportNumber">Número de Reporte Policial</Label>
                <Input
                  id="policeReportNumber"
                  placeholder="Si aplica"
                  value={claimData.policeReportNumber}
                  onChange={e => handleInputChange('policeReportNumber', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDamageCost">Costo Estimado de Daños</Label>
                <Input
                  id="estimatedDamageCost"
                  type="number"
                  placeholder="0.00"
                  value={claimData.estimatedDamageCost}
                  onChange={e => handleInputChange('estimatedDamageCost', e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="thirdPartyInvolved"
                  checked={claimData.thirdPartyInvolved}
                  onCheckedChange={checked =>
                    handleInputChange('thirdPartyInvolved', checked as boolean)
                  }
                />
                <Label htmlFor="thirdPartyInvolved">Involucra terceros</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="injuryInvolved"
                  checked={claimData.injuryInvolved}
                  onCheckedChange={checked =>
                    handleInputChange('injuryInvolved', checked as boolean)
                  }
                />
                <Label htmlFor="injuryInvolved">Hay lesiones personales</Label>
              </div>
            </div>

            {/* Sistema de Documentación Requerida */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-lg font-semibold">
                  📋 Sistema de Documentación Requerida
                  <InfoTooltip
                    content="Debes subir TODOS los documentos requeridos antes de poder enviar la reclamación. Los documentos son verificados automáticamente."
                    side="right"
                  />
                </Label>
                <Badge variant={areAllRequiredDocumentsUploaded() ? 'default' : 'destructive'}>
                  {Object.keys(uploadedDocuments).length} /{' '}
                  {requiredDocuments.filter(d => d.required).length} documentos
                </Badge>
              </div>

              {/* Barra de Progreso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de Documentación</span>
                  <span>{Math.round(getDocumentProgress())}% completado</span>
                </div>
                <Progress value={getDocumentProgress()} className="h-2" />
              </div>

              {/* Documentos por Categoría */}
              {['identity', 'vehicle', 'incident', 'legal'].map(category => {
                const categoryDocs = requiredDocuments.filter(doc => doc.category === category);
                if (categoryDocs.length === 0) return null;

                const categoryNames = {
                  identity: 'Documentos de Identidad',
                  vehicle: 'Documentos del Vehículo',
                  incident: 'Documentos del Siniestro',
                  legal: 'Documentos Legales',
                };

                const categoryProgress = categoryDocs.filter(
                  doc => uploadedDocuments[doc.type]
                ).length;
                const categoryTotal = categoryDocs.filter(doc => doc.required).length;

                return (
                  <Card key={category} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {category === 'identity' && <FileText className="h-5 w-5" />}
                          {category === 'vehicle' && <Shield className="h-5 w-5" />}
                          {category === 'incident' && <Camera className="h-5 w-5" />}
                          {category === 'legal' && <FileText className="h-5 w-5" />}
                          {categoryNames[category as keyof typeof categoryNames]}
                        </CardTitle>
                        <Badge variant={categoryProgress === categoryTotal ? 'default' : 'outline'}>
                          {categoryProgress}/{categoryTotal}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {categoryDocs.map(doc => {
                        const isUploaded = !!uploadedDocuments[doc.type];
                        const docInfo = uploadedDocuments[doc.type];

                        return (
                          <div
                            key={doc.id}
                            className={`border rounded-lg p-4 transition-colors ${
                              isUploaded
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <doc.icon className="h-4 w-4" />
                                  <span className="font-medium">{doc.name}</span>
                                  {doc.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      Requerido
                                    </Badge>
                                  )}
                                  {isUploaded && <CheckCircle className="h-4 w-4 text-green-600" />}
                                  {!isUploaded && (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {doc.description}
                                </p>

                                {/* Información del archivo subido */}
                                {isUploaded && docInfo && (
                                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>{docInfo.file.name}</span>
                                    <span>({(docInfo.file.size / 1024 / 1024).toFixed(1)} MB)</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 ml-4">
                                {!isUploaded ? (
                                  <div>
                                    <input
                                      type="file"
                                      id={`doc-${doc.type}`}
                                      className="hidden"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleDocumentUpload(doc.type, file);
                                        }
                                      }}
                                      disabled={uploadingDocs}
                                    />
                                    <label htmlFor={`doc-${doc.type}`}>
                                      <Button
                                        asChild
                                        size="sm"
                                        disabled={uploadingDocs}
                                        className="cursor-pointer"
                                      >
                                        <span>
                                          <Upload className="h-4 w-4 mr-1" />
                                          Subir
                                        </span>
                                      </Button>
                                    </label>
                                  </div>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        // Usar la URL ya subida a Supabase en lugar de crear una local
                                        window.open(docInfo.url, '_blank');
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDocumentRemove(doc.type)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Mensaje de validación */}
              {!areAllRequiredDocumentsUploaded() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>
                      Faltan{' '}
                      {
                        requiredDocuments.filter(d => d.required && !uploadedDocuments[d.type])
                          .length
                      }{' '}
                      documentos requeridos.
                    </strong>
                    <br />
                    Debes subir todos los documentos marcados como "Requerido" antes de poder enviar
                    la reclamación.
                  </AlertDescription>
                </Alert>
              )}

              {areAllRequiredDocumentsUploaded() && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>¡Excelente!</strong> Todos los documentos requeridos han sido subidos.
                    Ya puedes proceder a crear la reclamación.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !selectedPolicy ||
                  !claimData.incidentDescription ||
                  !areAllRequiredDocumentsUploaded() ||
                  uploadingDocs
                }
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando reclamación y subiendo documentos...
                  </>
                ) : uploadingDocs ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo documentos...
                  </>
                ) : !areAllRequiredDocumentsUploaded() ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Faltan documentos requeridos
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Crear Reclamación con Documentos
                  </>
                )}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de Éxito */}
      {success && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Éxito!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{success}</p>
          </div>
        </div>
      )}
    </>
  );
}
