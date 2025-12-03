'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import type { Quote } from '@/lib/types/database';
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Download,
  Eye,
  Edit,
  Plus,
  Car,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { POLICY_PLANS } from '@/lib/policy-plans';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface QuoteListProps {
  customerId?: string;
}

export function QuoteList({ customerId }: QuoteListProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [highlightedQuoteId, setHighlightedQuoteId] = useState<string | null>(null);
  
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchQuotes();
  }, [customerId]);

  useEffect(() => {
    const highlightId = searchParams.get('highlightQuoteId');
    if (highlightId && quotes.length > 0) {
      setHighlightedQuoteId(highlightId);
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const el = document.getElementById(`quote-card-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('quote-card--highlight');
          
          const timer = setTimeout(() => {
            el.classList.remove('quote-card--highlight');
            setHighlightedQuoteId(null);
          }, 1000);
          
          return () => clearTimeout(timer);
        }
      }, 100);
    }
  }, [searchParams, quotes]);

  const fetchQuotes = async () => {
    try {
      console.log('Fetching quotes...');
      const response = await fetch('/api/quotes', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        setError(`Error del servidor: ${response.status}`);
        return;
      }

      const result = await response.json();
      console.log('Quotes response:', result);

      if (result.error) {
        console.error('API error:', result.error);
        setError(result.error);
        return;
      }

      setQuotes(result.quotes || []);
      console.log('Quotes loaded successfully:', result.quotes?.length || 0);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setError('Error al cargar las cotizaciones: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateQuotePDF = (quote: Quote) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('es-ES');
    const selectedPlanDetails = POLICY_PLANS[quote.policy_type as keyof typeof POLICY_PLANS];
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
    doc.text('CONSTANCIA DE COTIZACIÓN', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('SeguraTuAuto - Tu seguridad, nuestra prioridad', pageWidth / 2, 30, { align: 'center' });

    // Quote Info Box
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, 50, 180, 30, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(15, 50, 180, 30);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('COTIZACIÓN No:', 20, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.quote_number, 70, 58);

    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', 20, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(quote.created_at), 'dd/MM/yyyy'), 50, 66);

    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO:', 120, 66);
    doc.setFont('helvetica', 'normal');
    const statusText = quote.status === 'approved' ? 'APROBADA' : quote.status === 'rejected' ? 'RECHAZADA' : 'PENDIENTE';
    const statusColor = quote.status === 'approved' ? [46, 204, 113] : quote.status === 'rejected' ? [231, 76, 60] : [243, 156, 18];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusText, 150, 66);

    // Customer Section
    let yPos = 90;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 20, yPos + 6.5);

    yPos += 15;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Nombre: ${quote.customer?.user?.first_name || ''} ${quote.customer?.user?.last_name || ''}`, 20, yPos);
    yPos += 7;
    doc.text(`Email: ${quote.customer?.user?.email || 'No disponible'}`, 20, yPos);
    yPos += 7;
    doc.text(`Teléfono: ${quote.customer?.user?.phone || 'No especificado'}`, 20, yPos);
    
    if (quote.customer?.country) {
      yPos += 7;
      doc.text(`País: ${quote.customer.country}`, 20, yPos);
    }

    // Vehicle Section
    yPos += 15;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL VEHÍCULO', 20, yPos + 6.5);

    yPos += 15;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (quote.vehicle) {
      doc.text(`Vehículo: ${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`, 20, yPos);
      yPos += 7;
      doc.text(`Placa: ${quote.vehicle.license_plate || 'No especificada'}`, 20, yPos);
      if (quote.vehicle.estimated_value) {
        yPos += 7;
        doc.text(`Valor Estimado: $${quote.vehicle.estimated_value.toLocaleString()}`, 20, yPos);
      }
    }

    // Plan Section
    yPos += 15;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`PLAN: ${selectedPlanDetails?.name || quote.policy_type}`, 20, yPos + 6.5);

    yPos += 15;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prima Anual: $${quote.premium_amount.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Prima Mensual: $${Math.round(quote.premium_amount / 12).toLocaleString()}`, 20, yPos);

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
          doc.text(`• ${coverage.name}`, 20, yPos + index * 6);
        } else {
          doc.text(`• ${coverage.name}`, 115, yPos + (index - itemsPerColumn) * 6);
        }
      });
      yPos += itemsPerColumn * 6 + 10;
    }

    // Validity period
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VIGENCIA:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${format(new Date(quote.start_date), 'dd/MM/yyyy')} - ${format(new Date(quote.end_date), 'dd/MM/yyyy')}`,
      50,
      yPos
    );

    // Agent Notes (if any)
    yPos += 10;
    if (quote.agent_notes || quote.rejected_reason) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPos, 180, 25, 'F');
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, yPos, 180, 25);
      
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(quote.status === 'rejected' ? 'MOTIVO DE RECHAZO:' : 'NOTAS DEL AGENTE:', 20, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const noteText = quote.rejected_reason || quote.agent_notes || '';
      const lines = doc.splitTextToSize(noteText, 170);
      doc.text(lines, 20, yPos + 16);
      yPos += 30;
    }

    // Footer
    const footerY = 285;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(15, footerY - 5, 195, footerY - 5);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Esta cotización tiene una validez de 30 días a partir de la fecha de emisión.',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el ${currentDate} - SeguraTuAuto`, pageWidth / 2, footerY + 5, {
      align: 'center',
    });

    // Save the PDF
    const fileName = `Cotizacion_${quote.quote_number}_${format(
      new Date(quote.created_at),
      'dd-MM-yyyy'
    )}.pdf`;
    doc.save(fileName);
  };

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedQuote(null);
  };

  const handleEditQuote = (quote: Quote) => {
    // Redirect to quote form with pre-filled data
    window.location.href = `/customer/quote?edit=${quote.id}`;
  };

  const getStatusBadge = (quote: Quote) => {
    const status = quote.status;
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'approved':
        if (!(quote as any).isPaid) {
            return (
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aprobada — Pendiente de pago
                </Badge>
                <InfoTooltip
                  content="Tu cotización fue aprobada. Realiza el pago para activar tu póliza."
                  side="right"
                />
              </div>
            );
        }
        // Fallthrough if paid (should be treated as converted)
      case 'converted':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <FileText className="h-3 w-3 mr-1" />
            Convertida a Póliza
          </Badge>
        );
      default:
        // Check if it's approved but paid (handled above but just in case)
        if (status === 'approved' && (quote as any).isPaid) {
             return (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <FileText className="h-3 w-3 mr-1" />
                Convertida a Póliza
              </Badge>
            );
        }
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Tu cotización está siendo revisada por un agente. Te notificaremos cuando tengamos una respuesta.';
      case 'approved':
        return 'Tu cotización ha sido aprobada. Puedes proceder a contratar la póliza.';
      case 'rejected':
        return 'Tu cotización ha sido rechazada. Puedes crear una nueva cotización con diferentes parámetros.';
      case 'converted':
        return 'Tu cotización fue aprobada y se ha creado automáticamente tu póliza de seguro.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes cotizaciones</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera cotización para obtener cobertura de seguro.
            </p>
            <Button asChild>
              <a href="/customer/quote">Crear Cotización</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {quotes.map(quote => (
        <Card key={quote.id} id={`quote-card-${quote.id}`} className="w-full transition-colors duration-300">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Cotización {quote.quote_number}
                </CardTitle>
                <CardDescription>
                  Creada el {format(new Date(quote.created_at), 'dd/MM/yyyy')}
                </CardDescription>
              </div>
              {getStatusBadge(quote)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Description */}
            <Alert>
              <AlertDescription>{getStatusDescription(quote.status)}</AlertDescription>
            </Alert>

            {/* Quote Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Prima Anual</p>
                  <p className="font-semibold">${quote.premium_amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vigencia</p>
                  <p className="font-semibold">
                    {format(new Date(quote.start_date), 'dd/MM/yyyy')} -{' '}
                    {format(new Date(quote.end_date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold capitalize">{quote.policy_type}</p>
              </div>
            </div>

            {/* Vehicle Info */}
            {quote.vehicle && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Vehículo Asegurado</h4>
                <p className="text-sm text-muted-foreground">
                  {quote.vehicle.year} {quote.vehicle.make} {quote.vehicle.model}
                  {quote.vehicle.license_plate && ` - ${quote.vehicle.license_plate}`}
                </p>
              </div>
            )}

            {/* Agent Notes */}
            {(quote.agent_notes || quote.rejected_reason) && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">
                  {quote.status === 'rejected' ? 'Motivo del Rechazo' : 'Notas del Agente'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {quote.rejected_reason || quote.agent_notes}
                </p>
                {quote.reviewed_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Revisado el {format(new Date(quote.reviewed_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
              </div>
            )}

            {/* Expires At */}
            {quote.status === 'pending' && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Esta cotización expira el {format(new Date(quote.expires_at), 'dd/MM/yyyy')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4 flex flex-wrap gap-2">
              {/* Always show these buttons */}
              <Button variant="outline" size="sm" onClick={() => handleViewDetails(quote)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalles
              </Button>

              <Button variant="outline" size="sm" onClick={() => generateQuotePDF(quote)}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>

              {/* Status-specific buttons */}
              {quote.status === 'pending' && (
                <Button variant="outline" size="sm" onClick={() => handleEditQuote(quote)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Cotización
                </Button>
              )}

              {quote.status === 'approved' && !(quote as any).isPaid && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => window.location.href = `/customer/payments?payQuoteId=${quote.id}`}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar
                </Button>
              )}

              {quote.status === 'rejected' && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/customer/quote">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Cotización
                  </a>
                </Button>
              )}

              {((quote.status === 'converted') || ((quote as any).isPaid)) && (
                <Button size="sm" asChild>
                  <a href="/customer/policies">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Mi Póliza
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalles de Cotización {selectedQuote?.quote_number}
            </DialogTitle>
            <DialogDescription>Información completa de la cotización</DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Estado:</span>
                {getStatusBadge(selectedQuote)}
              </div>

              {/* Quote Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Número de Cotización:</span>
                  <p className="text-muted-foreground">{selectedQuote.quote_number}</p>
                </div>
                <div>
                  <span className="font-medium">Fecha de Creación:</span>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedQuote.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Prima Anual:</span>
                  <p className="text-lg font-bold text-primary">
                    ${selectedQuote.premium_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Plan:</span>
                  <p className="text-muted-foreground capitalize">{selectedQuote.policy_type}</p>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-3">Desglose de Precios</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Prima Mensual:</span>
                  <span>${Math.round(selectedQuote.premium_amount / 12).toLocaleString()}</span>
                  <span>Prima Trimestral:</span>
                  <span>
                    ${Math.round((selectedQuote.premium_amount / 12) * 3).toLocaleString()}
                  </span>
                  <span>Prima Semestral:</span>
                  <span>
                    ${Math.round((selectedQuote.premium_amount / 12) * 6).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Vehicle Info */}
              {selectedQuote.vehicle && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Información del Vehículo
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Vehículo:</span>
                    <span>
                      {selectedQuote.vehicle.year} {selectedQuote.vehicle.make}{' '}
                      {selectedQuote.vehicle.model}
                    </span>
                    {selectedQuote.vehicle.license_plate && (
                      <>
                        <span>Placa:</span>
                        <span>{selectedQuote.vehicle.license_plate}</span>
                      </>
                    )}
                    {selectedQuote.vehicle.estimated_value && (
                      <>
                        <span>Valor Estimado:</span>
                        <span>${selectedQuote.vehicle.estimated_value.toLocaleString()}</span>
                      </>
                    )}
                    {selectedQuote.vehicle.usage_type && (
                      <>
                        <span>Tipo de Uso:</span>
                        <span className="capitalize">{selectedQuote.vehicle.usage_type}</span>
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
                  <span>{format(new Date(selectedQuote.start_date), 'dd/MM/yyyy')}</span>
                  <span>Fecha de Fin:</span>
                  <span>{format(new Date(selectedQuote.end_date), 'dd/MM/yyyy')}</span>
                  <span>Duración:</span>
                  <span>1 año</span>
                </div>
              </div>

              {/* Agent Notes */}
              {(selectedQuote.agent_notes || selectedQuote.rejected_reason) && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">
                    {selectedQuote.status === 'rejected'
                      ? 'Motivo del Rechazo'
                      : 'Notas del Agente'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuote.rejected_reason || selectedQuote.agent_notes}
                  </p>
                  {selectedQuote.reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Revisado el {format(new Date(selectedQuote.reviewed_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}

              {/* Actions in Modal */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => generateQuotePDF(selectedQuote)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button variant="outline" onClick={closeDetailsModal}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
