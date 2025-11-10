'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import {
  FileText,
  Camera,
  CheckCircle,
  AlertTriangle,
  Upload,
  Car,
  User,
  Shield,
  FileCheck,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  icon: any;
  required: boolean;
  category: 'identity' | 'vehicle' | 'incident' | 'medical' | 'legal';
}

interface DocumentRequirementSystemProps {
  claimId: string;
  claimType: string;
  hasInjuries?: boolean;
  hasThirdParty?: boolean;
}

export function DocumentRequirementSystem({
  claimId,
  claimType,
  hasInjuries = false,
  hasThirdParty = false,
}: DocumentRequirementSystemProps) {
  const { userProfile } = useAuth();
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([]);
  const [submittedDocs, setSubmittedDocs] = useState<string[]>([]);
  const [requestSent, setRequestSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    generateRequiredDocuments();
    loadSubmittedDocuments();
  }, [claimType, hasInjuries, hasThirdParty]);

  const generateRequiredDocuments = () => {
    let docs: RequiredDocument[] = [
      // Documentos básicos siempre requeridos
      {
        id: 'cedula',
        name: 'Cédula de Identidad',
        description: 'Documento de identidad del titular de la póliza',
        icon: User,
        required: true,
        category: 'identity',
      },
      {
        id: 'licencia',
        name: 'Licencia de Conducir',
        description: 'Licencia de conducir vigente del conductor al momento del siniestro',
        icon: Car,
        required: true,
        category: 'identity',
      },
      {
        id: 'poliza',
        name: 'Póliza de Seguro',
        description: 'Copia de la póliza de seguro vigente',
        icon: Shield,
        required: true,
        category: 'vehicle',
      },
      {
        id: 'fotos_daño',
        name: 'Fotografías del Daño',
        description: 'Fotos claras de todos los daños del vehículo',
        icon: Camera,
        required: true,
        category: 'incident',
      },
    ];

    // Documentos específicos según el tipo de siniestro
    switch (claimType) {
      case 'Colisión':
        docs.push(
          {
            id: 'parte_policial',
            name: 'Parte Policial',
            description: 'Reporte oficial de la policía de tránsito',
            icon: FileText,
            required: true,
            category: 'legal',
          },
          {
            id: 'croquis',
            name: 'Croquis del Accidente',
            description: 'Diagrama detallado de cómo ocurrió el accidente',
            icon: FileText,
            required: true,
            category: 'incident',
          }
        );
        break;

      case 'Robo':
        docs.push(
          {
            id: 'denuncia_fiscalia',
            name: 'Denuncia en Fiscalía',
            description: 'Denuncia formal por robo ante la Fiscalía General',
            icon: FileText,
            required: true,
            category: 'legal',
          },
          {
            id: 'llaves_vehiculo',
            name: 'Todas las Llaves',
            description: 'Entrega de todas las llaves del vehículo',
            icon: Car,
            required: true,
            category: 'vehicle',
          },
          {
            id: 'ultima_ubicacion',
            name: 'Prueba de Última Ubicación',
            description: 'Comprobantes de dónde se encontraba el vehículo antes del robo',
            icon: FileText,
            required: false,
            category: 'incident',
          }
        );
        break;

      case 'Incendio':
        docs.push(
          {
            id: 'informe_bomberos',
            name: 'Informe de Bomberos',
            description: 'Reporte oficial del Cuerpo de Bomberos',
            icon: FileText,
            required: true,
            category: 'legal',
          },
          {
            id: 'investigacion_incendio',
            name: 'Investigación de Causa',
            description: 'Informe técnico sobre la causa del incendio',
            icon: FileText,
            required: true,
            category: 'incident',
          }
        );
        break;

      case 'Vandalismo':
        docs.push({
          id: 'denuncia_policia',
          name: 'Denuncia Policial',
          description: 'Denuncia por vandalismo ante la policía',
          icon: FileText,
          required: true,
          category: 'legal',
        });
        break;

      case 'Daño por clima':
        docs.push({
          id: 'reporte_meteorologico',
          name: 'Reporte Meteorológico',
          description: 'Reporte oficial del clima del día del siniestro',
          icon: FileText,
          required: true,
          category: 'incident',
        });
        break;
    }

    // Documentos adicionales si hay lesiones
    if (hasInjuries) {
      docs.push(
        {
          id: 'certificado_medico',
          name: 'Certificado Médico',
          description: 'Certificado médico de las lesiones',
          icon: FileCheck,
          required: true,
          category: 'medical',
        },
        {
          id: 'facturas_medicas',
          name: 'Facturas Médicas',
          description: 'Todas las facturas de gastos médicos',
          icon: FileText,
          required: true,
          category: 'medical',
        }
      );
    }

    // Documentos adicionales si hay terceros involucrados
    if (hasThirdParty) {
      docs.push(
        {
          id: 'datos_tercero',
          name: 'Datos del Tercero',
          description: 'Información completa de la otra parte involucrada',
          icon: User,
          required: true,
          category: 'legal',
        },
        {
          id: 'seguro_tercero',
          name: 'Seguro del Tercero',
          description: 'Información del seguro de la otra parte (si aplica)',
          icon: Shield,
          required: false,
          category: 'legal',
        }
      );
    }

    setRequiredDocs(docs);
  };

  const loadSubmittedDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('claim_documents')
        .select('document_type')
        .eq('claim_id', claimId);

      if (error) throw error;

      setSubmittedDocs(data?.map(doc => doc.document_type) || []);
    } catch (error) {
      console.error('Error loading submitted documents:', error);
    }
  };

  const sendDocumentRequest = async () => {
    try {
      const missingDocs = requiredDocs
        .filter(doc => doc.required && !submittedDocs.includes(doc.id))
        .map(doc => doc.name);

      if (missingDocs.length === 0) {
        toast.success('Todos los documentos requeridos han sido enviados');
        return;
      }

      // Crear comunicación con lista de documentos requeridos
      const message = `
Para procesar su reclamación, necesitamos que nos envíe los siguientes documentos:

DOCUMENTOS REQUERIDOS:
${missingDocs.map((doc, index) => `${index + 1}. ${doc}`).join('\n')}

IMPORTANTE:
- Envíe fotografías claras y legibles de cada documento
- Asegúrese de que toda la información sea visible
- Puede enviar los documentos por email a documentos@seguratvauto.com
- O entregarlos en nuestras oficinas

Una vez recibidos todos los documentos, continuaremos con el procesamiento de su reclamación.

Cualquier consulta puede comunicarse al 0800-SEGURO (734876).
      `;

      const { error } = await supabase.from('communications').insert({
        claim_id: claimId,
        communication_type: 'email',
        direction: 'outbound',
        subject: `Documentos requeridos para su reclamación`,
        content: message,
        status: 'sent',
      });

      if (error) throw error;

      // Actualizar estado de la reclamación
      await supabase.from('claims').update({ status: 'pending_documentation' }).eq('id', claimId);

      setRequestSent(true);
      toast.success('Solicitud de documentos enviada al cliente');
    } catch (error) {
      console.error('Error sending document request:', error);
      toast.error('Error al enviar la solicitud de documentos');
    }
  };

  const getCompletionPercentage = () => {
    const totalRequired = requiredDocs.filter(doc => doc.required).length;
    const completed = requiredDocs.filter(
      doc => doc.required && submittedDocs.includes(doc.id)
    ).length;
    return totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity':
        return User;
      case 'vehicle':
        return Car;
      case 'incident':
        return Camera;
      case 'medical':
        return FileCheck;
      case 'legal':
        return FileText;
      default:
        return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'identity':
        return 'bg-blue-100 text-blue-800';
      case 'vehicle':
        return 'bg-green-100 text-green-800';
      case 'incident':
        return 'bg-orange-100 text-orange-800';
      case 'medical':
        return 'bg-red-100 text-red-800';
      case 'legal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completionPercentage = getCompletionPercentage();
  const canSendRequest =
    userProfile?.role && ['admin', 'agent', 'adjuster'].includes(userProfile.role);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Sistema de Documentación Requerida
        </CardTitle>
        <CardDescription>
          Documentos necesarios para procesar la reclamación de {claimType.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium dark:text-gray-200">Progreso de Documentación</span>
            <span className="text-sm text-muted-foreground dark:text-gray-400">
              {completionPercentage}% completado
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                completionPercentage === 100
                  ? 'bg-green-500 dark:bg-green-600'
                  : completionPercentage >= 70
                    ? 'bg-blue-500 dark:bg-blue-600'
                    : 'bg-orange-500 dark:bg-orange-600'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Document Categories */}
        {['identity', 'vehicle', 'incident', 'legal', 'medical'].map(category => {
          const categoryDocs = requiredDocs.filter(doc => doc.category === category);
          if (categoryDocs.length === 0) return null;

          const CategoryIcon = getCategoryIcon(category);
          const categoryName = {
            identity: 'Documentos de Identidad',
            vehicle: 'Documentos del Vehículo',
            incident: 'Documentos del Siniestro',
            legal: 'Documentos Legales',
            medical: 'Documentos Médicos',
          }[category];

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-4 w-4 dark:text-gray-300" />
                <h4 className="font-medium dark:text-gray-200">{categoryName}</h4>
                <Badge className={`${getCategoryColor(category)} dark:bg-opacity-20 dark:border dark:border-gray-600`}>
                  {categoryDocs.filter(doc => submittedDocs.includes(doc.id)).length}/
                  {categoryDocs.length}
                </Badge>
              </div>

              <div className="space-y-2 pl-6">
                {categoryDocs.map(doc => {
                  const isSubmitted = submittedDocs.includes(doc.id);
                  const DocIcon = doc.icon;

                  return (
                    <div
                      key={doc.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isSubmitted
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                          : doc.required
                            ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <DocIcon className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm dark:text-gray-200">{doc.name}</span>
                            {doc.required && (
                              <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                                Requerido
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">{doc.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {isSubmitted ? (
                          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                        ) : doc.required ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Action Buttons */}
        {canSendRequest && (
          <div className="space-y-4 border-t dark:border-gray-700 pt-4">
            {completionPercentage < 100 && (
              <Alert className="dark:bg-yellow-950 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="dark:text-yellow-200">
                  Faltan{' '}
                  {
                    requiredDocs.filter(doc => doc.required && !submittedDocs.includes(doc.id))
                      .length
                  }{' '}
                  documentos requeridos para completar la reclamación.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={sendDocumentRequest}
                disabled={requestSent || completionPercentage === 100}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {requestSent ? 'Solicitud Enviada' : 'Solicitar Documentos Faltantes'}
              </Button>

              {completionPercentage === 100 && (
                <Button variant="outline" className="flex-1 dark:border-gray-600 dark:text-gray-200">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Documentación Completa
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Customer Instructions */}
        {!canSendRequest && (
          <Alert className="dark:bg-blue-950 dark:border-blue-800">
            <FileText className="h-4 w-4" />
            <AlertDescription className="dark:text-blue-200">
              Para completar su reclamación, debe enviar todos los documentos marcados como
              "Requerido". Puede enviarlos por email a documentos@seguratvauto.com o entregarlos en
              nuestras oficinas.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
