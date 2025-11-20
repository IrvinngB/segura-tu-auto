'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { simpleUpdateExpiredPolicies, activateDraftPolicies } from '@/lib/simple-update-policies';
import type { Policy } from '@/lib/types/database';
import { Search, Eye, Edit, FileText, Calendar, Download, Car, RefreshCw, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { POLICY_PLANS } from '@/lib/policy-plans';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PolicyRenewal } from '@/components/policies/policy-renewal';
import { PolicyCancellationModal } from '@/components/policies/policy-cancellation-modal';
import { Trash2 } from 'lucide-react';

interface PolicyListProps {
  customerId?: string;
  onViewPolicy?: (policy: Policy) => void;
  onEditPolicy?: (policy: Policy) => void;
}

export function PolicyList({ customerId, onViewPolicy, onEditPolicy }: PolicyListProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalPolicy, setRenewalPolicy] = useState<Policy | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [policyToCancel, setPolicyToCancel] = useState<Policy | null>(null);
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchPolicies();
  }, [customerId]);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchTerm, statusFilter, typeFilter]);

  const fetchPolicies = async () => {
    try {
      // First, activate draft policies that were approved by agents
      console.log('🔄 Activando pólizas aprobadas por agentes...');
      await activateDraftPolicies();

      // Then, force update any expired policies
      console.log('🔄 Actualizando pólizas vencidas en lista...');
      await simpleUpdateExpiredPolicies();

      let query = supabase
        .from('policies')
        .select(
          `
          *,
          customer:customers(
            *,
            user:users(*)
          ),
          vehicle:vehicles(*),
          agent:users(*)
        `
        )
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) {
        setPolicies(data);
        setFilteredPolicies(data);
      }

      // Fetch cancellation requests
      // Fetch cancellation requests for the fetched policies
      if (data && data.length > 0) {
        const policyIds = data.map(p => p.id);
        const { data: requests } = await supabase
          .from('policy_cancellation_requests')
          .select('policy_id, status')
          .in('policy_id', policyIds)
          .in('status', ['pending']);

        if (requests) {
          setCancellationRequests(requests);
        }
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPolicies = () => {
    let filtered = policies;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        policy =>
          policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.customer?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.customer?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.customer?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(policy => policy.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(policy => policy.policy_type === typeFilter);
    }

    setFilteredPolicies(filtered);
  };

  const generatePolicyPDF = (policy: Policy) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('es-ES');
    const selectedPlanDetails = POLICY_PLANS[policy.policy_type as keyof typeof POLICY_PLANS];
    const pageWidth = doc.internal.pageSize.width;

    // Colores
    const primaryColor = [41, 128, 185]; // Azul
    const secondaryColor = [52, 73, 94]; // Gris oscuro
    const accentColor = [46, 204, 113]; // Verde
    const lightGray = [236, 240, 241];

    // Header con color de fondo
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Título del header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSTANCIA DE PÓLIZA DE SEGURO', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('SeguraTuAuto - Protección y Tranquilidad', pageWidth / 2, 30, { align: 'center' });

    // Policy Info Box
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, 50, 180, 30, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(15, 50, 180, 30);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PÓLIZA No:', 20, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(policy.policy_number, 60, 58);

    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', 20, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(policy.created_at), 'dd/MM/yyyy'), 50, 66);

    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO:', 120, 66);
    doc.setFont('helvetica', 'normal');
    const statusText = policy.status === 'active' ? 'ACTIVA' : policy.status === 'expired' ? 'VENCIDA' : policy.status === 'cancelled' ? 'CANCELADA' : 'SUSPENDIDA';
    const statusColor = policy.status === 'active' ? [46, 204, 113] : policy.status === 'expired' ? [231, 76, 60] : [243, 156, 18];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusText, 150, 66);

    // Customer Section
    let yPos = 90;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL ASEGURADO', 20, yPos + 6.5);

    yPos += 15;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.text(`Nombre: ${policy.customer?.user?.first_name || ''} ${policy.customer?.user?.last_name || ''}`, 20, yPos);
    yPos += 7;
    doc.text(`Email: ${policy.customer?.user?.email || 'No disponible'}`, 20, yPos);
    yPos += 7;
    doc.text(`Teléfono: ${policy.customer?.user?.phone || 'No especificado'}`, 20, yPos);

    if (policy.customer?.country) {
      yPos += 7;
      doc.text(`País: ${policy.customer.country}`, 20, yPos);
    }
    if (policy.customer?.address) {
      yPos += 7;
      doc.text(`Dirección: ${policy.customer.address}`, 20, yPos);
    }

    // Vehicle Section
    yPos += 15;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('VEHÍCULO ASEGURADO', 20, yPos + 6.5);

    yPos += 15;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    if (policy.vehicle) {
      doc.text(`Vehículo: ${policy.vehicle.year} ${policy.vehicle.make} ${policy.vehicle.model}`, 20, yPos);
      yPos += 7;
      doc.text(`Placa: ${policy.vehicle.license_plate || 'No especificada'}`, 20, yPos);
      if (policy.vehicle.estimated_value) {
        yPos += 7;
        doc.text(`Valor Asegurado: $${policy.vehicle.estimated_value.toLocaleString()}`, 20, yPos);
      }
      if (policy.vehicle.vin) {
        yPos += 7;
        doc.text(`VIN: ${policy.vehicle.vin}`, 20, yPos);
      }
    }

    // Policy Information Section
    yPos += 15;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE LA PÓLIZA', 20, yPos + 6.5);

    yPos += 15;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.text(`Tipo de Póliza: ${getPolicyTypeLabel(policy.policy_type)}`, 20, yPos);
    yPos += 7;
    doc.text(
      `Prima ${policy.payment_frequency === 'annual' ? 'Anual' : policy.payment_frequency === 'monthly' ? 'Mensual' : 'Trimestral'}: $${policy.premium_amount.toLocaleString()}`,
      20,
      yPos
    );
    yPos += 7;
    doc.text(
      `Vigencia: ${format(new Date(policy.start_date), 'dd/MM/yyyy')} - ${format(new Date(policy.end_date), 'dd/MM/yyyy')}`,
      20,
      yPos
    );
    yPos += 7;
    doc.text(`Renovación Automática: ${policy.auto_renewal ? 'SÍ' : 'NO'}`, 20, yPos);

    // Coverage Details
    yPos += 15;
    if (selectedPlanDetails?.coverages) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('COBERTURAS INCLUIDAS:', 20, yPos);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      yPos += 8;
      const includedCoverages = selectedPlanDetails.coverages.filter(c => c.included);
      const itemsPerColumn = Math.ceil(includedCoverages.length / 2);

      includedCoverages.forEach((coverage, index) => {
        if (index < itemsPerColumn) {
          const text = `• ${coverage.name}`;
          doc.text(text, 20, yPos + index * 6);
          if (coverage.maxAmount) {
            doc.setFontSize(7);
            doc.text(`  Hasta: $${coverage.maxAmount.toLocaleString()}`, 25, yPos + index * 6 + 3);
            doc.setFontSize(8);
          }
        } else {
          const text = `• ${coverage.name}`;
          doc.text(text, 115, yPos + (index - itemsPerColumn) * 6);
          if (coverage.maxAmount) {
            doc.setFontSize(7);
            doc.text(`  Hasta: $${coverage.maxAmount.toLocaleString()}`, 120, yPos + (index - itemsPerColumn) * 6 + 3);
            doc.setFontSize(8);
          }
        }
      });
      yPos += itemsPerColumn * 6 + 10;
    }

    // Total coverage limit
    if (policy.total_coverage_limit) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPos, 180, 12, 'F');
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(15, yPos, 180, 12);

      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Límite Total de Cobertura: $${policy.total_coverage_limit.toLocaleString()}`,
        pageWidth / 2,
        yPos + 8,
        { align: 'center' }
      );
      yPos += 15;
    }

    // Footer
    const footerY = 280;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(15, footerY - 5, 195, footerY - 5);

    doc.setTextColor(100, 100, 100);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Esta constancia certifica que el vehículo descrito cuenta con cobertura de seguro vigente.',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    doc.text('Para cualquier reclamo o consulta, comuníquese con SeguraTuAuto.', pageWidth / 2, footerY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Documento generado el ${currentDate}`, pageWidth / 2, footerY + 10, {
      align: 'center',
    });

    // Save the PDF
    const fileName = `Poliza_${policy.policy_number}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
    doc.save(fileName);
  };

  const handleViewDetails = (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPolicy(null);
  };

  const handleEditPolicy = (policy: Policy) => {
    if (onEditPolicy) {
      onEditPolicy(policy);
    } else {
      window.location.href = `/policies/${policy.id}/edit`;
    }
  };

  const handleRenewPolicy = (policy: Policy) => {
    setRenewalPolicy(policy);
    setShowRenewalModal(true);
  };

  const handleRenewalSuccess = (renewedPolicy: Policy) => {
    // Actualizar la lista de pólizas
    fetchPolicies();
    setShowRenewalModal(false);
    setRenewalPolicy(null);
  };

  const closeRenewalModal = () => {
    setShowRenewalModal(false);
    setRenewalPolicy(null);
  };

  const isPolicyExpired = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: 'Activa',
        classes: 'status-badge status-active',
        tooltip: 'Tu póliza está activa y te protege en este momento. Recuerda renovarla antes de que expire.'
      },
      approved: {
        label: 'Aprobada',
        classes: 'status-badge status-approved',
        tooltip: 'Tu póliza fue aprobada por el agente. Completa el pago para activarla.'
      },
      expired: {
        label: 'Vencida',
        classes: 'status-badge status-expired',
        tooltip: 'Esta póliza ha expirado. Ya no estás protegido. Renuévala lo antes posible para mantener tu cobertura.'
      },
      cancelled: {
        label: 'Cancelada',
        classes: 'status-badge status-cancelled',
        tooltip: 'Esta póliza fue cancelada y ya no proporciona cobertura.'
      },
      suspended: {
        label: 'Suspendida',
        classes: 'status-badge status-suspended',
        tooltip: 'La póliza está suspendida por falta de pago. Contacta a tu agente para reactivarla.'
      },
      draft: {
        label: 'Borrador',
        classes: 'status-badge status-draft',
        tooltip: 'Esta póliza está en revisión. El agente debe aprobarla antes de que puedas pagarla.'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      classes: 'status-badge status-active',
      tooltip: ''
    };

    return (
      <div className="flex items-center gap-1.5">
        <span className={config.classes}>{config.label}</span>
        {config.tooltip && <InfoTooltip content={config.tooltip} side="right" />}
      </div>
    );
  };

  const getPolicyTypeLabel = (type: string) => {
    const types = {
      basica: 'Básica',
      limitada: 'Limitada',
      amplia: 'Amplia',
      // Mantener compatibilidad con valores antiguos
      Básica: 'Básica',
      Básico: 'Básica',
      Limitada: 'Limitada',
      Completo: 'Limitada',
      Amplia: 'Amplia',
      Premium: 'Amplia',
      comprehensive: 'Amplia',
      liability: 'Básica',
      basic: 'Básica',
    };
    return types[type as keyof typeof types] || type;
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    // Mostrar "vence pronto" si vence en 30 días o menos, O si ya venció (daysUntilExpiry <= 0)
    return daysUntilExpiry <= 30;
  };

  const hasPendingCancellation = (policyId: string) => {
    return cancellationRequests.some(req => req.policy_id === policyId && req.status === 'pending');
  };

  const handleRequestCancellation = (policy: Policy) => {
    setPolicyToCancel(policy);
    setShowCancellationModal(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando pólizas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pólizas de Seguro
        </CardTitle>
        <CardDescription>
          {customerId ? 'Pólizas del cliente' : 'Gestión de todas las pólizas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de póliza, cliente, vehículo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="approved">Aprobada</SelectItem>
              <SelectItem value="expired">Vencida</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="suspended">Suspendida</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="basica">Básica</SelectItem>
              <SelectItem value="limitada">Limitada</SelectItem>
              <SelectItem value="amplia">Amplia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Policies Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Póliza</TableHead>
                {!customerId && <TableHead>Cliente</TableHead>}
                <TableHead>Vehículo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Prima</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={customerId ? 7 : 8} className="text-center py-8">
                    No se encontraron pólizas
                  </TableCell>
                </TableRow>
              ) : (
                filteredPolicies.map(policy => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.policy_number}</TableCell>
                    {!customerId && (
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {policy.customer?.user?.first_name} {policy.customer?.user?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {policy.customer?.user?.email}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {policy.vehicle?.year} {policy.vehicle?.make} {policy.vehicle?.model}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {policy.vehicle?.license_plate}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getPolicyTypeLabel(policy.policy_type)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-2 items-center justify-center">
                        {getStatusBadge(policy.status)}
                        {isExpiringSoon(policy.end_date) && policy.status !== 'expired' && (
                          <Badge
                            variant="outline"
                            className="text-xs flex items-center justify-center px-3 py-1 min-w-[90px]"
                          >
                            Vence pronto
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(policy.start_date), 'dd/MM/yyyy', { locale: es })} -{' '}
                          {format(new Date(policy.end_date), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          $
                          {policy.payment_frequency === 'monthly'
                            ? (policy.premium_amount / 12).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                            : policy.payment_frequency === 'quarterly'
                              ? (policy.premium_amount / 4).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                              : policy.premium_amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {policy.payment_frequency === 'monthly' ? 'mensual' : policy.payment_frequency === 'annual' ? 'anual' : 'trimestral'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(policy)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generatePolicyPDF(policy)}
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {(policy.status === 'expired' || isPolicyExpired(policy.end_date)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRenewPolicy(policy)}
                            title="Renovar póliza"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {!customerId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPolicy(policy)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {policy.status?.toLowerCase() === 'active' && !hasPendingCancellation(policy.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRequestCancellation(policy)}
                            title={customerId ? "Solicitar Cancelación" : "Cancelar Póliza"}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {customerId ? <Trash2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </Button>
                        )}
                        {hasPendingCancellation(policy.id) && (
                          <Badge 
                            variant="outline" 
                            className="text-xs border-yellow-500 text-yellow-600 cursor-pointer hover:bg-yellow-50"
                            onClick={() => window.location.href = '/agent/requests'}
                            title="Ir a solicitudes de cancelación"
                          >
                            Cancelación Pendiente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredPolicies.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Activas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredPolicies.filter(p => isExpiringSoon(p.end_date)).length}
              </div>
              <div className="text-sm text-muted-foreground">Por vencer</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {filteredPolicies.filter(p => p.status === 'expired').length}
              </div>
              <div className="text-sm text-muted-foreground">Vencidas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">
                ${filteredPolicies.reduce((sum, p) => sum + p.premium_amount, 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-sm text-muted-foreground">Prima total</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>

      <PolicyCancellationModal
        policy={policyToCancel}
        open={showCancellationModal}
        onOpenChange={setShowCancellationModal}
        onSuccess={() => {
          fetchPolicies();
          setShowCancellationModal(false);
          setPolicyToCancel(null);
        }}
      />

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalles de Póliza {selectedPolicy?.policy_number}
            </DialogTitle>
            <DialogDescription>Información completa de la póliza de seguro</DialogDescription>
          </DialogHeader>

          {selectedPolicy && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Estado:</span>
                {getStatusBadge(selectedPolicy.status)}
              </div>

              {/* Policy Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Número de Póliza:</span>
                  <p className="text-muted-foreground">{selectedPolicy.policy_number}</p>
                </div>
                <div>
                  <span className="font-medium">Fecha de Creación:</span>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedPolicy.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Prima:</span>
                  <p className="text-lg font-bold text-primary">
                    ${selectedPolicy.premium_amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedPolicy.payment_frequency}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Tipo de Póliza:</span>
                  <p className="text-muted-foreground">
                    {getPolicyTypeLabel(selectedPolicy.policy_type)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              {selectedPolicy.customer && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Información del Asegurado</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Nombre:</span>
                    <span>
                      {selectedPolicy.customer.user?.first_name}{' '}
                      {selectedPolicy.customer.user?.last_name}
                    </span>
                    <span>Email:</span>
                    <span>{selectedPolicy.customer.user?.email}</span>
                    {selectedPolicy.customer.user?.phone && (
                      <>
                        <span>Teléfono:</span>
                        <span>{selectedPolicy.customer.user.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Info */}
              {selectedPolicy.vehicle && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehículo Asegurado
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Vehículo:</span>
                    <span>
                      {selectedPolicy.vehicle.year} {selectedPolicy.vehicle.make}{' '}
                      {selectedPolicy.vehicle.model}
                    </span>
                    {selectedPolicy.vehicle.license_plate && (
                      <>
                        <span>Placa:</span>
                        <span>{selectedPolicy.vehicle.license_plate}</span>
                      </>
                    )}
                    {selectedPolicy.vehicle.vin && (
                      <>
                        <span>VIN:</span>
                        <span>{selectedPolicy.vehicle.vin}</span>
                      </>
                    )}
                    {selectedPolicy.vehicle.estimated_value && (
                      <>
                        <span>Valor Asegurado:</span>
                        <span>${selectedPolicy.vehicle.estimated_value.toLocaleString()}</span>
                      </>
                    )}
                    {selectedPolicy.vehicle.usage_type && (
                      <>
                        <span>Tipo de Uso:</span>
                        <span className="capitalize">{selectedPolicy.vehicle.usage_type}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Coverage Period */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Período de Cobertura
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Fecha de Inicio:</span>
                  <span>{format(new Date(selectedPolicy.start_date), 'dd/MM/yyyy')}</span>
                  <span>Fecha de Vencimiento:</span>
                  <span>{format(new Date(selectedPolicy.end_date), 'dd/MM/yyyy')}</span>
                  <span>Renovación Automática:</span>
                  <span>{selectedPolicy.auto_renewal ? 'Sí' : 'No'}</span>
                  {selectedPolicy.total_coverage_limit && (
                    <>
                      <span>Límite Total de Cobertura:</span>
                      <span>${selectedPolicy.total_coverage_limit.toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Expiring Soon Alert */}
              {isExpiringSoon(selectedPolicy.end_date) && selectedPolicy.status !== 'expired' && (
                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <h4 className="font-medium mb-2 text-yellow-800">⚠️ Póliza por vencer</h4>
                  <p className="text-sm text-yellow-700">
                    Esta póliza vence el {format(new Date(selectedPolicy.end_date), 'dd/MM/yyyy')}.
                    {selectedPolicy.auto_renewal
                      ? ' Se renovará automáticamente.'
                      : ' Contacta a tu agente para renovar.'}
                  </p>
                </div>
              )}

              {/* Coverages */}
              {POLICY_PLANS[selectedPolicy.policy_type as keyof typeof POLICY_PLANS] && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Coberturas Incluidas</h4>
                  <div className="space-y-2">
                    {POLICY_PLANS[selectedPolicy.policy_type as keyof typeof POLICY_PLANS].coverages
                      .filter(c => c.included)
                      .map((coverage, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>• {coverage.name}</span>
                          {coverage.maxAmount && (
                            <span className="text-muted-foreground">
                              Hasta ${coverage.maxAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions in Modal */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => generatePolicyPDF(selectedPolicy)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button variant="outline" onClick={() => handleEditPolicy(selectedPolicy)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Póliza
                </Button>
                <Button variant="outline" onClick={closeDetailsModal}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Renewal Modal */}
      {showRenewalModal && renewalPolicy && (
        <PolicyRenewal
          policy={renewalPolicy}
          onRenewalSuccess={handleRenewalSuccess}
          onClose={closeRenewalModal}
        />
      )}
    </Card>
  );
}
