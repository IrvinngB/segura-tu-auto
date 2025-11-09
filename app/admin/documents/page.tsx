'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  mime_type: string;
  document_category: string;
  status: string;
  reference_type: string;
  reference_id: string;
  uploaded_by: string;
  file_path: string;
  metadata: any;
  version: number;
  is_current_version: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  uploader: {
    first_name: string;
    last_name: string;
    email: string;
  };
  reference_data?: {
    policy_number?: string;
    claim_number?: string;
    customer_name?: string;
  };
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required_fields: string[];
  max_file_size: number;
  allowed_mime_types: string[];
}

interface DocumentStats {
  total_documents: number;
  pending_review: number;
  approved: number;
  expired: number;
  storage_used: number;
}

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total_documents: 0,
    pending_review: 0,
    approved: 0,
    expired: 0,
    storage_used: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: '',
    reference_type: '',
    reference_id: '',
    description: '',
    expires_at: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchDocumentsAndStats();
    fetchCategories();
  }, [statusFilter, categoryFilter]);

  const fetchDocumentsAndStats = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select(
          `
          *,
          uploader:users!documents_uploaded_by_fkey(first_name, last_name, email)
        `
        )
        .eq('is_current_version', true)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('document_category', categoryFilter);
      }

      const { data: documentsData, error: documentsError } = await query;

      if (documentsError) throw documentsError;

      // Enrich documents with reference data
      const enrichedDocuments = await Promise.all(
        (documentsData || []).map(async doc => {
          let reference_data = {};

          if (doc.reference_type === 'policy' && doc.reference_id) {
            const { data: policy } = await supabase
              .from('policies')
              .select('policy_number, customer:customers(first_name, last_name)')
              .eq('id', doc.reference_id)
              .single();

            if (policy && policy.customer) {
              reference_data = {
                policy_number: policy.policy_number,
                customer_name: `${(policy.customer as any).first_name} ${(policy.customer as any).last_name}`,
              };
            }
          } else if (doc.reference_type === 'claim' && doc.reference_id) {
            const { data: claim } = await supabase
              .from('claims')
              .select('claim_number, policy:policies(customer:customers(first_name, last_name))')
              .eq('id', doc.reference_id)
              .single();

            if (claim && (claim.policy as any)?.customer) {
              reference_data = {
                claim_number: claim.claim_number,
                customer_name: `${(claim.policy as any).customer.first_name} ${(claim.policy as any).customer.last_name}`,
              };
            }
          }

          return { ...doc, reference_data };
        })
      );

      // Calculate stats
      const totalDocs = enrichedDocuments.length;
      const pendingReview = enrichedDocuments.filter(d => d.status === 'pending').length;
      const approved = enrichedDocuments.filter(d => d.status === 'approved').length;
      const expired = enrichedDocuments.filter(
        d => d.expires_at && new Date(d.expires_at) < new Date()
      ).length;

      const storageUsed = enrichedDocuments.reduce((total, doc) => total + doc.size, 0);

      setDocuments(enrichedDocuments);
      setStats({
        total_documents: totalDocs,
        pending_review: pendingReview,
        approved: approved,
        expired: expired,
        storage_used: storageUsed,
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      setMessage({ type: 'error', text: 'Error al cargar los documentos' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('document_categories').select('*').order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.name || !uploadForm.category) {
      setMessage({ type: 'error', text: 'Por favor complete todos los campos requeridos' });
      return;
    }

    setUploading(true);
    try {
      const category = categories.find(c => c.id === uploadForm.category);

      // Validate file size
      if (category && selectedFile.size > category.max_file_size) {
        throw new Error(
          `Archivo muy grande. Máximo permitido: ${formatFileSize(category.max_file_size)}`
        );
      }

      // Validate MIME type
      if (category && !category.allowed_mime_types.includes(selectedFile.type)) {
        throw new Error(
          `Tipo de archivo no permitido. Tipos permitidos: ${category.allowed_mime_types.join(', ')}`
        );
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `documents/${uploadForm.category}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');

      const documentData = {
        name: uploadForm.name,
        type: fileExt || '',
        size: selectedFile.size,
        mime_type: selectedFile.type,
        document_category: uploadForm.category,
        status: 'pending',
        reference_type: uploadForm.reference_type || null,
        reference_id: uploadForm.reference_id || null,
        uploaded_by: userData.user.id,
        file_path: filePath,
        metadata: {
          description: uploadForm.description,
          original_filename: selectedFile.name,
        },
        version: 1,
        is_current_version: true,
        expires_at: uploadForm.expires_at || null,
      };

      const { error: insertError } = await supabase.from('documents').insert(documentData);

      if (insertError) throw insertError;

      setMessage({ type: 'success', text: 'Documento subido exitosamente' });
      setUploadModalOpen(false);
      setSelectedFile(null);
      setUploadForm({
        name: '',
        category: '',
        reference_type: '',
        reference_id: '',
        description: '',
        expires_at: '',
      });

      fetchDocumentsAndStats();
    } catch (error) {
      console.error('Error uploading document:', error);
      setMessage({ type: 'error', text: (error as any)?.message || 'Error al subir el documento' });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev =>
        prev.map(doc => (doc.id === documentId ? { ...doc, status: newStatus } : doc))
      );

      setMessage({
        type: 'success',
        text: `Documento ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}`,
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el estado del documento' });
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      setMessage({ type: 'error', text: 'Error al descargar el documento' });
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este documento?')) {
      return;
    }

    try {
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase.from('documents').delete().eq('id', documentId);

      if (dbError) throw dbError;

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      setMessage({ type: 'success', text: 'Documento eliminado exitosamente' });
    } catch (error) {
      console.error('Error deleting document:', error);
      setMessage({ type: 'error', text: 'Error al eliminar el documento' });
    }
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
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
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
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredDocuments = documents.filter(
    doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploader.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploader.last_name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <p className="text-muted-foreground">Administra todos los documentos del sistema</p>
            </div>
          </div>

          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Subir Nuevo Documento</DialogTitle>
                <DialogDescription>Complete la información del documento a subir</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Archivo</label>
                  <Input
                    type="file"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Documento</label>
                  <Input
                    value={uploadForm.name}
                    onChange={e => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Licencia de Conducir - Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Categoría</label>
                  <Select
                    value={uploadForm.category}
                    onValueChange={value => setUploadForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de Referencia</label>
                    <Select
                      value={uploadForm.reference_type}
                      onValueChange={value =>
                        setUploadForm(prev => ({ ...prev, reference_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policy">Póliza</SelectItem>
                        <SelectItem value="claim">Reclamo</SelectItem>
                        <SelectItem value="customer">Cliente</SelectItem>
                        <SelectItem value="vehicle">Vehículo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ID de Referencia</label>
                    <Input
                      value={uploadForm.reference_id}
                      onChange={e =>
                        setUploadForm(prev => ({ ...prev, reference_id: e.target.value }))
                      }
                      placeholder="ID opcional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de Expiración</label>
                  <Input
                    type="date"
                    value={uploadForm.expires_at}
                    onChange={e => setUploadForm(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={e =>
                      setUploadForm(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Descripción opcional del documento"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setUploadModalOpen(false)}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      uploading || !selectedFile || !uploadForm.name || !uploadForm.category
                    }
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Documento
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertDescription>{message.text}</AlertDescription>
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
              <CardTitle className="text-sm font-medium">Expirados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <p className="text-xs text-muted-foreground">expirados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
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
                  <SelectItem value="archived">Archivado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Categorías</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
                <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? 'No se encontraron documentos con esos criterios.'
                    : 'Sube tu primer documento para comenzar.'}
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
                        <h3 className="font-semibold text-lg">{document.name}</h3>
                        <Badge className={getStatusColor(document.status)}>
                          {getStatusIcon(document.status)}
                          <span className="ml-1">
                            {document.status === 'pending'
                              ? 'Pendiente'
                              : document.status === 'approved'
                                ? 'Aprobado'
                                : document.status === 'rejected'
                                  ? 'Rechazado'
                                  : document.status === 'archived'
                                    ? 'Archivado'
                                    : document.status}
                          </span>
                        </Badge>
                        {document.expires_at && new Date(document.expires_at) < new Date() && (
                          <Badge variant="destructive">Expirado</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                          <p className="font-medium">{document.document_category}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Subido por</p>
                          <p className="font-medium">
                            {document.uploader.first_name} {document.uploader.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{document.uploader.email}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                          <p className="font-medium">
                            {format(new Date(document.created_at), 'dd MMM yyyy', { locale: es })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(document.size)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Referencia</p>
                          {document.reference_data ? (
                            <>
                              <p className="font-medium">
                                {document.reference_data.policy_number ||
                                  document.reference_data.claim_number ||
                                  'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {document.reference_data.customer_name}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">Sin referencia</p>
                          )}
                        </div>
                      </div>

                      {document.expires_at && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-muted-foreground">
                            Expira:{' '}
                            {format(new Date(document.expires_at), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDocument(document)}
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

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDocument(document.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
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
