"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import type { Quote } from "@/lib/types/database";
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
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { POLICY_PLANS } from "@/lib/policy-plans";

interface QuoteListProps {
    customerId?: string;
}

export function QuoteList({ customerId }: QuoteListProps) {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchQuotes();
    }, [customerId]);

    const fetchQuotes = async () => {
        try {
            console.log("Fetching quotes...");
            const response = await fetch("/api/quotes");

            if (!response.ok) {
                console.error(
                    "Response not ok:",
                    response.status,
                    response.statusText
                );
                setError(`Error del servidor: ${response.status}`);
                return;
            }

            const result = await response.json();
            console.log("Quotes response:", result);

            if (result.error) {
                console.error("API error:", result.error);
                setError(result.error);
                return;
            }

            setQuotes(result.quotes || []);
            console.log(
                "Quotes loaded successfully:",
                result.quotes?.length || 0
            );
        } catch (error) {
            console.error("Error fetching quotes:", error);
            setError(
                "Error al cargar las cotizaciones: " + (error as Error).message
            );
        } finally {
            setLoading(false);
        }
    };

    const generateQuotePDF = (quote: Quote) => {
        const doc = new jsPDF();
        const currentDate = new Date().toLocaleDateString("es-ES");
        const selectedPlanDetails =
            POLICY_PLANS[quote.policy_type as keyof typeof POLICY_PLANS];

        // Header
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("CONSTANCIA DE COTIZACIÓN", 105, 25, { align: "center" });

        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text("SeguraTuAuto", 105, 35, { align: "center" });

        // Quote number and date
        doc.setFontSize(10);
        doc.text(`Cotización No: ${quote.quote_number}`, 20, 50);
        doc.text(
            `Fecha: ${format(new Date(quote.created_at), "dd/MM/yyyy")}`,
            150,
            50
        );
        doc.text(
            `Estado: ${
                quote.status === "approved"
                    ? "APROBADA"
                    : quote.status === "rejected"
                    ? "RECHAZADA"
                    : "PENDIENTE"
            }`,
            20,
            60
        );

        // Customer Information (if available from quote)
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("INFORMACIÓN DEL CLIENTE", 20, 75);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(
            `Cliente: ${quote.customer?.user?.first_name || ""} ${
                quote.customer?.user?.last_name || ""
            }`,
            20,
            85
        );
        doc.text(
            `Email: ${quote.customer?.user?.email || "No disponible"}`,
            20,
            95
        );

        // Vehicle Information
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("INFORMACIÓN DEL VEHÍCULO", 20, 110);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (quote.vehicle) {
            doc.text(
                `Vehículo: ${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`,
                20,
                120
            );
            doc.text(
                `Placa: ${quote.vehicle.license_plate || "No especificada"}`,
                20,
                130
            );
            if (quote.vehicle.estimated_value) {
                doc.text(
                    `Valor Estimado: $${quote.vehicle.estimated_value.toLocaleString()}`,
                    20,
                    140
                );
            }
        }

        // Plan Information
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("PLAN SELECCIONADO", 20, 155);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(
            `Plan: ${selectedPlanDetails?.name || quote.policy_type}`,
            20,
            165
        );
        doc.text(
            `Prima Anual: $${quote.premium_amount.toLocaleString()}`,
            20,
            175
        );
        doc.text(
            `Prima Mensual: $${(quote.premium_amount / 12).toFixed(2)}`,
            20,
            185
        );

        // Coverage Details (if available)
        if (selectedPlanDetails?.coverages) {
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("COBERTURAS INCLUIDAS:", 20, 200);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            let yPos = 210;
            selectedPlanDetails.coverages
                .filter((c) => c.included)
                .forEach((coverage) => {
                    if (yPos > 270) return; // Avoid overflow
                    doc.text(`• ${coverage.name}`, 25, yPos);
                    yPos += 8;
                });
        }

        // Validity period
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Vigencia: ${format(
                new Date(quote.start_date),
                "dd/MM/yyyy"
            )} - ${format(new Date(quote.end_date), "dd/MM/yyyy")}`,
            20,
            250
        );

        // Agent Notes (if any)
        if (quote.agent_notes || quote.rejected_reason) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(
                quote.status === "rejected" ? "MOTIVO DE RECHAZO:" : "NOTAS:",
                20,
                265
            );
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const noteText = quote.rejected_reason || quote.agent_notes || "";
            const lines = doc.splitTextToSize(noteText, 170);
            doc.text(lines, 20, 275);
        }

        // Footer
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
            "Esta cotización tiene una validez de 30 días a partir de la fecha de emisión.",
            20,
            285
        );
        doc.text(`Generado el ${currentDate} - SeguraTuAuto`, 105, 292, {
            align: "center",
        });

        // Save the PDF
        const fileName = `Cotizacion_${quote.quote_number}_${format(
            new Date(quote.created_at),
            "dd-MM-yyyy"
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                    >
                        <Clock className="h-3 w-3" />
                        Pendiente
                    </Badge>
                );
            case "approved":
                return (
                    <Badge
                        variant="default"
                        className="flex items-center gap-1 bg-green-600"
                    >
                        <CheckCircle className="h-3 w-3" />
                        Aprobada
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge
                        variant="destructive"
                        className="flex items-center gap-1"
                    >
                        <XCircle className="h-3 w-3" />
                        Rechazada
                    </Badge>
                );
            case "converted":
                return (
                    <Badge
                        variant="default"
                        className="flex items-center gap-1 bg-blue-600"
                    >
                        <FileText className="h-3 w-3" />
                        Convertida a Póliza
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getStatusDescription = (status: string) => {
        switch (status) {
            case "pending":
                return "Tu cotización está siendo revisada por un agente. Te notificaremos cuando tengamos una respuesta.";
            case "approved":
                return "Tu cotización ha sido aprobada. Puedes proceder a contratar la póliza.";
            case "rejected":
                return "Tu cotización ha sido rechazada. Puedes crear una nueva cotización con diferentes parámetros.";
            case "converted":
                return "Tu cotización fue aprobada y se ha creado automáticamente tu póliza de seguro.";
            default:
                return "";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        Cargando cotizaciones...
                    </p>
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
                        <h3 className="text-lg font-semibold mb-2">
                            No tienes cotizaciones
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Crea tu primera cotización para obtener cobertura de
                            seguro.
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
            {quotes.map((quote) => (
                <Card key={quote.id} className="w-full">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Cotización {quote.quote_number}
                                </CardTitle>
                                <CardDescription>
                                    Creada el{" "}
                                    {format(
                                        new Date(quote.created_at),
                                        "dd/MM/yyyy"
                                    )}
                                </CardDescription>
                            </div>
                            {getStatusBadge(quote.status)}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Status Description */}
                        <Alert>
                            <AlertDescription>
                                {getStatusDescription(quote.status)}
                            </AlertDescription>
                        </Alert>

                        {/* Quote Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Prima Anual
                                    </p>
                                    <p className="font-semibold">
                                        ${quote.premium_amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Vigencia
                                    </p>
                                    <p className="font-semibold">
                                        {format(
                                            new Date(quote.start_date),
                                            "dd/MM/yyyy"
                                        )}{" "}
                                        -{" "}
                                        {format(
                                            new Date(quote.end_date),
                                            "dd/MM/yyyy"
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Plan
                                </p>
                                <p className="font-semibold capitalize">
                                    {quote.policy_type}
                                </p>
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        {quote.vehicle && (
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">
                                    Vehículo Asegurado
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {quote.vehicle.year} {quote.vehicle.make}{" "}
                                    {quote.vehicle.model}
                                    {quote.vehicle.license_plate &&
                                        ` - ${quote.vehicle.license_plate}`}
                                </p>
                            </div>
                        )}

                        {/* Agent Notes */}
                        {(quote.agent_notes || quote.rejected_reason) && (
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">
                                    {quote.status === "rejected"
                                        ? "Motivo del Rechazo"
                                        : "Notas del Agente"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {quote.rejected_reason || quote.agent_notes}
                                </p>
                                {quote.reviewed_at && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Revisado el{" "}
                                        {format(
                                            new Date(quote.reviewed_at),
                                            "dd/MM/yyyy HH:mm"
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Expires At */}
                        {quote.status === "pending" && (
                            <div className="border-t pt-4">
                                <p className="text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4 inline mr-1" />
                                    Esta cotización expira el{" "}
                                    {format(
                                        new Date(quote.expires_at),
                                        "dd/MM/yyyy"
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="border-t pt-4 flex flex-wrap gap-2">
                            {/* Always show these buttons */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(quote)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateQuotePDF(quote)}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar PDF
                            </Button>

                            {/* Status-specific buttons */}
                            {quote.status === "pending" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditQuote(quote)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Cotización
                                </Button>
                            )}

                            {quote.status === "approved" && (
                                <Button size="sm" asChild>
                                    <a
                                        href={`/customer/policies/new?quote=${quote.id}`}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Contratar Póliza
                                    </a>
                                </Button>
                            )}

                            {quote.status === "rejected" && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href="/customer/quote">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nueva Cotización
                                    </a>
                                </Button>
                            )}

                            {quote.status === "converted" && (
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
                        <DialogDescription>
                            Información completa de la cotización
                        </DialogDescription>
                    </DialogHeader>

                    {selectedQuote && (
                        <div className="space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Estado:</span>
                                {getStatusBadge(selectedQuote.status)}
                            </div>

                            {/* Quote Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="font-medium">
                                        Número de Cotización:
                                    </span>
                                    <p className="text-muted-foreground">
                                        {selectedQuote.quote_number}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">
                                        Fecha de Creación:
                                    </span>
                                    <p className="text-muted-foreground">
                                        {format(
                                            new Date(selectedQuote.created_at),
                                            "dd/MM/yyyy HH:mm"
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">
                                        Prima Anual:
                                    </span>
                                    <p className="text-lg font-bold text-primary">
                                        $
                                        {selectedQuote.premium_amount.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">Plan:</span>
                                    <p className="text-muted-foreground capitalize">
                                        {selectedQuote.policy_type}
                                    </p>
                                </div>
                            </div>

                            {/* Pricing Breakdown */}
                            <div className="border rounded-lg p-4 bg-muted/50">
                                <h4 className="font-medium mb-3">
                                    Desglose de Precios
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span>Prima Mensual:</span>
                                    <span>
                                        $
                                        {(
                                            selectedQuote.premium_amount / 12
                                        ).toFixed(2)}
                                    </span>
                                    <span>Prima Trimestral:</span>
                                    <span>
                                        $
                                        {(
                                            selectedQuote.premium_amount / 4
                                        ).toFixed(2)}
                                    </span>
                                    <span>Prima Semestral:</span>
                                    <span>
                                        $
                                        {(
                                            selectedQuote.premium_amount / 2
                                        ).toFixed(2)}
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
                                            {selectedQuote.vehicle.year}{" "}
                                            {selectedQuote.vehicle.make}{" "}
                                            {selectedQuote.vehicle.model}
                                        </span>
                                        {selectedQuote.vehicle
                                            .license_plate && (
                                            <>
                                                <span>Placa:</span>
                                                <span>
                                                    {
                                                        selectedQuote.vehicle
                                                            .license_plate
                                                    }
                                                </span>
                                            </>
                                        )}
                                        {selectedQuote.vehicle
                                            .estimated_value && (
                                            <>
                                                <span>Valor Estimado:</span>
                                                <span>
                                                    $
                                                    {selectedQuote.vehicle.estimated_value.toLocaleString()}
                                                </span>
                                            </>
                                        )}
                                        {selectedQuote.vehicle.usage_type && (
                                            <>
                                                <span>Tipo de Uso:</span>
                                                <span className="capitalize">
                                                    {
                                                        selectedQuote.vehicle
                                                            .usage_type
                                                    }
                                                </span>
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
                                    <span>
                                        {format(
                                            new Date(selectedQuote.start_date),
                                            "dd/MM/yyyy"
                                        )}
                                    </span>
                                    <span>Fecha de Fin:</span>
                                    <span>
                                        {format(
                                            new Date(selectedQuote.end_date),
                                            "dd/MM/yyyy"
                                        )}
                                    </span>
                                    <span>Duración:</span>
                                    <span>1 año</span>
                                </div>
                            </div>

                            {/* Agent Notes */}
                            {(selectedQuote.agent_notes ||
                                selectedQuote.rejected_reason) && (
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-3">
                                        {selectedQuote.status === "rejected"
                                            ? "Motivo del Rechazo"
                                            : "Notas del Agente"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedQuote.rejected_reason ||
                                            selectedQuote.agent_notes}
                                    </p>
                                    {selectedQuote.reviewed_at && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Revisado el{" "}
                                            {format(
                                                new Date(
                                                    selectedQuote.reviewed_at
                                                ),
                                                "dd/MM/yyyy HH:mm"
                                            )}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions in Modal */}
                            <div className="flex gap-2 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        generateQuotePDF(selectedQuote)
                                    }
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={closeDetailsModal}
                                >
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
