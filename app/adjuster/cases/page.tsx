'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  User as UserIcon,
  FileText,
  XCircle
} from 'lucide-react';

interface Case {
  id: string;
  claim_id: string;
  claim_number: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  assigned_date: string;
  closed_date?: string;
  customer_name: string;
  vehicle_info: string;
  incident_description: string;
  claim_amount?: number;
}

export default function CasesPage() {
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [historyCases, setHistoryCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const response = await fetch('/api/adjuster/cases');
      if (response.ok) {
        const data = await response.json();
        setActiveCases(data.active || []);
        setHistoryCases(data.history || []);
      }
    } catch (error) {
      console.error('Error cargando casos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          label: 'Pendiente',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        };
      case 'under_review':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          label: 'En Revisión',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          label: 'Aprobado',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-5 w-5" />,
          label: 'Rechazado',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          label: 'Desconocido',
          color: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const CaseCard = ({ caseItem, isHistory = false }: { caseItem: Case; isHistory?: boolean }) => {
    const statusInfo = getStatusInfo(caseItem.status);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">{caseItem.claim_number}</CardTitle>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3 w-3" />
                  <span>{caseItem.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{caseItem.vehicle_info}</span>
                </div>
              </div>
            </div>
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {caseItem.incident_description}
          </p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {isHistory && caseItem.closed_date
                    ? `Cerrado: ${new Date(caseItem.closed_date).toLocaleDateString('es-ES')}`
                    : `Asignado: ${new Date(caseItem.assigned_date).toLocaleDateString('es-ES')}`}
                </span>
              </div>
              {caseItem.claim_amount && (
                <div className="font-medium text-foreground">
                  {formatCurrency(caseItem.claim_amount)}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/claims/${caseItem.claim_id}`)}
            >
              Ver Detalles
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['adjuster']}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis Casos</h1>
            <p className="text-muted-foreground">
              Gestiona tus casos activos y consulta el histórico
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">{activeCases.length}</p>
              <p className="text-sm text-muted-foreground">Casos activos</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{historyCases.length}</p>
              <p className="text-sm text-muted-foreground">Casos cerrados</p>
            </div>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-muted-foreground text-center">Cargando casos...</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="active">
                Casos Activos ({activeCases.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                Histórico ({historyCases.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeCases.length === 0 ? (
                <EmptyState message="No tienes casos activos en este momento. Cuando se te asigne un caso, aparecerá aquí." />
              ) : (
                <div className="grid gap-4">
                  {activeCases.map(caseItem => (
                    <CaseCard key={caseItem.id} caseItem={caseItem} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {historyCases.length === 0 ? (
                <EmptyState message="No tienes casos cerrados todavía. Los casos aprobados o rechazados aparecerán aquí." />
              ) : (
                <div className="grid gap-4">
                  {historyCases.map(caseItem => (
                    <CaseCard key={caseItem.id} caseItem={caseItem} isHistory />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProtectedRoute>
  );
}
