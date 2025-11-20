'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Document {
  id: string;
  claim_id: string;
  customer_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string | null;
  upload_date: string;
  status: string;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  claim?: {
    claim_number: string;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  reviewer?: {
    first_name: string;
    last_name: string;
  };
}

interface DocumentStats {
  total_documents: number;
  pending_review: number;
  approved: number;
  rejected: number;
  storage_used: number;
}

const DOCUMENT_TYPES = {
  license: 'Licencia',
  id: 'Cédula',
  proof_of_address: 'Comprobante de Domicilio',
  invoice: 'Factura',
  police_report: 'Reporte Policial',
  photos: 'Fotografías',
  other: 'Otros',
};

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total_documents: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    storage_used: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchDocumentsAndStats();
  }, [statusFilter, typeFilter]);

  const fetchDocumentsAndStats = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('claim_customer_documents')
        .select(
          `
          *,
          claim:claims(claim_number),
          customer:customers(first_name, last_name, email),
          reviewer:users!claim_customer_documents_reviewed_by_fkey(first_name, last_name)
        `
        )
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('document_type', typeFilter);
      }

      const { data: documentsData, error: documentsError } = await query;

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        setDocuments([]);
        setStats({
          total_documents: 0,
          pending_review: 0,
          approved: 0,
          rejected: 0,
          storage_used: 0,
        });
        setLoading(false);
        return;
      }

      const enrichedDocuments = documentsData || [];

      // Calculate stats
      const totalDocs = enrichedDocuments.length;
      const pendingReview = enrichedDocuments.filter(d => d.status === 'pending').length;
      const approved = enrichedDocuments.filter(d => d.status === 'approved').length;
      const rejected = enrichedDocuments.filter(d => d.status === 'rejected').length;
      const storageUsed = enrichedDocuments.reduce((total, doc) => total + (doc.file_size || 0), 0);

      setDocuments(enrichedDocuments);
      setStats({
        total_documents: totalDocs,
        pending_review: pendingReview,
        approved: approved,
        rejected: rejected,
        storage_used: storageUsed,
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      setMessage({ type: 'error', text: 'Error al cargar los documentos' });
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/claim-documents/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          newStatus,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Error al actualizar el estado del documento';

        try {
          const data = await response.json();
          if (data?.error) {
            errorMessage = data.error;
          }
        } catch {
          // Ignorar errores al parsear la respuesta
        }

        throw new Error(errorMessage);
      }

      setMessage({
        type: 'success',
        text: `Documento ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}`,
      });

      fetchDocumentsAndStats();
    } catch (error) {
      console.error('Error updating document status:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el estado del documento' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const downloadDocument = (fileUrl: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredDocuments = documents.filter(
    doc =>
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.customer?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.customer?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.claim?.claim_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'agent', 'adjuster']}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Gestión de Documentos</h1>
              <p className="text-muted-foreground">Documentos de reclamaciones y clientes</p>
            </div>
          </div>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {!loading && documents.length === 0 && !searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              <strong>Sistema de Gestión Documental</strong>
              <p className="mt-2 text-sm">
                Los documentos subidos por clientes en sus reclamaciones aparecerán aquí automáticamente.
                Puedes revisar, aprobar o rechazar cada documento.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_documents}</div>
              <p className="text-xs text-muted-foreground">documentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_review}</div>
              <p className="text-xs text-muted-foreground">por revisar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">aprobados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">rechazados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.storage_used)}</div>
              <p className="text-xs text-muted-foreground">utilizado</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Tipos</SelectItem>
                  {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'No se encontraron documentos'
                    : 'No hay documentos'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda.'
                    : 'Los documentos subidos por clientes aparecerán aquí.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map(document => (
              <Card key={document.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">{document.file_name}</h3>
                        <Badge className={getStatusColor(document.status)}>
                          {getStatusIcon(document.status)}
                          <span className="ml-1">
                            {document.status === 'pending'
                              ? 'Pendiente'
                              : document.status === 'approved'
                                ? 'Aprobado'
                                : 'Rechazado'}
                          </span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                          <p className="font-medium">
                            {DOCUMENT_TYPES[document.document_type as keyof typeof DOCUMENT_TYPES] ||
                              document.document_type}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                          <p className="font-medium">
                            {document.customer?.first_name} {document.customer?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{document.customer?.email}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reclamación</p>
                          <p className="font-medium">{document.claim?.claim_number || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(document.file_size)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                          <p className="font-medium">
                            {format(new Date(document.upload_date), 'dd MMM yyyy', { locale: es })}
                          </p>
                          {document.reviewed_at && document.reviewer && (
                            <p className="text-sm text-muted-foreground">
                              Revisado por {document.reviewer.first_name}
                            </p>
                          )}
                        </div>
                      </div>

                      {document.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Notas:</p>
                          <p className="text-sm">{document.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDocument(document.file_url, document.file_name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>

                        {document.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateDocumentStatus(document.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateDocumentStatus(document.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
