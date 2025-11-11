'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Camera,
  Shield,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface ClaimDocumentProgress {
  id: string;
  claim_number: string;
  claim_type: string;
  status: string;
  customer_name: string;
  created_at: string;
  total_required: number;
  completed_documents: number;
  progress_percentage: number;
  missing_documents: string[];
  customer_documents: {
    id: string;
    document_type: string;
    status: string;
    upload_date: string;
  }[];
}

const DOCUMENT_TYPE_LABELS: Record<string, { name: string; icon: any }> = {
  id: { name: 'Cédula de Identidad', icon: FileText },
  license: { name: 'Licencia de Conducir', icon: FileText },
  invoice: { name: 'Póliza de Seguro', icon: Shield },
  photos: { name: 'Fotografías del Daño', icon: Camera },
  police_report: { name: 'Parte Policial', icon: FileText },
};

const CATEGORY_LABELS: Record<string, string> = {
  identity: 'Documentos de Identidad',
  vehicle: 'Documentos del Vehículo', 
  incident: 'Documentos del Siniestro',
  legal: 'Documentos Legales',
};

export default function ClaimDocumentProgressPage() {
  const [claims, setClaims] = useState<ClaimDocumentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchClaimsProgress();

    // Suscripción en tiempo real para actualizaciones
    const channel = supabase
      .channel('claim-documents-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claim_customer_documents',
        },
        () => {
          console.log('📄 Documento actualizado, recargando progreso...');
          fetchClaimsProgress();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
        },
        () => {
          console.log('📋 Reclamación actualizada, recargando progreso...');
          fetchClaimsProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchClaimsProgress = async () => {
    try {
      setLoading(true);

      // Obtener reclamaciones con información del cliente
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          claim_number,
          claim_type,
          status,
          created_at,
          customer_id,
          customers!inner(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (claimsError) throw claimsError;

      // Para cada reclamación, calcular el progreso de documentos
      const claimsWithProgress = await Promise.all(
        (claimsData || []).map(async (claim) => {
          // Obtener documentos subidos por el cliente
          const { data: documents } = await supabase
            .from('claim_customer_documents')
            .select('id, document_type, status, upload_date')
            .eq('claim_id', claim.id);

          // Definir documentos requeridos según tipo de reclamación
          const getRequiredDocuments = (claimType: string): string[] => {
            const baseDocuments = ['id', 'license', 'invoice', 'photos'];
            
            if (claimType === 'Colisión' || claimType === 'Vandalismo' || claimType === 'Robo') {
              baseDocuments.push('police_report');
            }
            
            return baseDocuments;
          };

          const requiredDocs = getRequiredDocuments(claim.claim_type);
          const uploadedDocTypes = (documents || []).map(doc => doc.document_type);
          const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));
          
          const totalRequired = requiredDocs.length;
          const completed = totalRequired - missingDocs.length;
          const progressPercentage = totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;

          return {
            id: claim.id,
            claim_number: claim.claim_number,
            claim_type: claim.claim_type,
            status: claim.status,
            customer_name: `${(claim as any).customers?.[0]?.first_name || ''} ${(claim as any).customers?.[0]?.last_name || ''}`.trim(),
            created_at: claim.created_at,
            total_required: totalRequired,
            completed_documents: completed,
            progress_percentage: progressPercentage,
            missing_documents: missingDocs.map(docType => DOCUMENT_TYPE_LABELS[docType]?.name || docType),
            customer_documents: documents || [],
          };
        })
      );

      setClaims(claimsWithProgress);
    } catch (error) {
      console.error('Error fetching claims progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Enviada', variant: 'outline' as const, icon: Clock },
      under_review: { label: 'En Revisión', variant: 'secondary' as const, icon: FileText },
      pending_documentation: { label: 'Documentos Pendientes', variant: 'destructive' as const, icon: AlertCircle },
      investigating: { label: 'Investigando', variant: 'default' as const, icon: AlertCircle },
      approved: { label: 'Aprobada', variant: 'default' as const, icon: CheckCircle },
      denied: { label: 'Denegada', variant: 'destructive' as const, icon: AlertCircle },
      closed: { label: 'Cerrada', variant: 'outline' as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredClaims = claims.filter(claim => {
    const statusMatch = statusFilter === 'all' || claim.status === statusFilter;
    
    let progressMatch = true;
    if (progressFilter === 'incomplete') {
      progressMatch = claim.progress_percentage < 100;
    } else if (progressFilter === 'complete') {
      progressMatch = claim.progress_percentage === 100;
    }
    
    return statusMatch && progressMatch;
  });

  const groupedClaims = filteredClaims.reduce((groups, claim) => {
    // Agrupar por categorías de documentos requeridos
    const requiredDocs = ['id', 'license', 'invoice', 'photos'];
    if (claim.claim_type === 'Colisión' || claim.claim_type === 'Vandalismo' || claim.claim_type === 'Robo') {
      requiredDocs.push('police_report');
    }

    // Categorizar por progreso
    let category = 'Documentación Completa';
    if (claim.progress_percentage === 0) {
      category = 'Sin Documentos';
    } else if (claim.progress_percentage < 50) {
      category = 'Documentación Inicial';
    } else if (claim.progress_percentage < 100) {
      category = 'Documentación Parcial';
    }

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(claim);
    return groups;
  }, {} as Record<string, ClaimDocumentProgress[]>);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'agent', 'adjuster']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando progreso de documentos...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'agent', 'adjuster']}>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sistema de Documentación Requerida</h1>
          <p className="text-muted-foreground">
            Documentos necesarios para procesar la reclamación de colisión
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="submitted">Enviada</SelectItem>
              <SelectItem value="under_review">En Revisión</SelectItem>
              <SelectItem value="pending_documentation">Documentos Pendientes</SelectItem>
              <SelectItem value="investigating">Investigando</SelectItem>
              <SelectItem value="approved">Aprobada</SelectItem>
              <SelectItem value="denied">Denegada</SelectItem>
              <SelectItem value="closed">Cerrada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={progressFilter} onValueChange={setProgressFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por progreso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="incomplete">Documentos Incompletos</SelectItem>
              <SelectItem value="complete">Documentos Completos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{claims.length}</p>
                  <p className="text-sm text-muted-foreground">Total Reclamaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {claims.filter(c => c.progress_percentage === 100).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Documentación Completa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {claims.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Documentación Parcial</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {claims.filter(c => c.progress_percentage === 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Sin Documentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de reclamaciones agrupada */}
        {Object.entries(groupedClaims).map(([category, categoryClims]) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category === 'Documentación Completa' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {category === 'Documentación Parcial' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                {category === 'Documentación Inicial' && <Clock className="h-5 w-5 text-blue-500" />}
                {category === 'Sin Documentos' && <AlertCircle className="h-5 w-5 text-red-500" />}
                {category}
                <Badge variant="outline">{categoryClims.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryClims.map(claim => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-medium">{claim.claim_number}</h3>
                        {getStatusBadge(claim.status)}
                        <Badge variant="outline">{claim.claim_type}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {claim.customer_name}
                        </span>
                        <span>
                          {format(new Date(claim.created_at), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progreso de Documentación</span>
                            <span className="font-medium">{claim.progress_percentage}% completado</span>
                          </div>
                          <Progress 
                            value={claim.progress_percentage} 
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {claim.completed_documents} de {claim.total_required} documentos subidos
                          </div>
                        </div>
                      </div>

                      {claim.missing_documents.length > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm font-medium text-yellow-800 mb-1">
                            Faltan {claim.missing_documents.length} documentos por completar:
                          </p>
                          <ul className="text-xs text-yellow-700 list-disc list-inside">
                            {claim.missing_documents.map((doc, index) => (
                              <li key={index}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/claims/${claim.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredClaims.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No hay reclamaciones</h3>
              <p className="text-muted-foreground">
                No se encontraron reclamaciones que coincidan con los filtros seleccionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}