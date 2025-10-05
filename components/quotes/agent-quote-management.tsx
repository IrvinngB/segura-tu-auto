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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SuccessModal } from "@/components/ui/success-modal";
import { createClient } from "@/lib/supabase/client";
import type { Quote } from "@/lib/types/database";
import {
    Clock,
    CheckCircle,
    XCircle,
    FileText,
    Calendar,
    DollarSign,
    Eye,
    User,
    Car,
} from "lucide-react";
import { format } from "date-fns";

export function AgentQuoteManagement() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [action, setAction] = useState<"approve" | "reject" | "view">("view");
    const [notes, setNotes] = useState("");
    const [rejectedReason, setRejectedReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [successTitle, setSuccessTitle] = useState("");
    const supabase = createClient();

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            console.log("🔍 AgentQuoteManagement: Fetching quotes...");

            const response = await fetch("/api/quotes");
            console.log("📡 Response status:", response.status);

            const result = await response.json();
            console.log("📋 API Response:", result);

            if (result.error) {
                console.error("❌ API Error:", result.error);
                setError(result.error);
                return;
            }

            const quotesArray = result.quotes || [];
            console.log("✅ Quotes loaded:", quotesArray.length);
            setQuotes(quotesArray);
        } catch (error) {
            console.error("💥 Error fetching quotes:", error);
            setError(
                "Error al cargar las cotizaciones: " +
                    (error instanceof Error
                        ? error.message
                        : "Error desconocido")
            );
        } finally {
            setLoading(false);
        }
    };

    const handleQuoteAction = async (
        quoteId: string,
        actionType: "approve" | "reject"
    ) => {
        setProcessing(true);
        try {
            const response = await fetch(`/api/quotes/${quoteId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: actionType,
                    notes: notes,
                    rejected_reason:
                        actionType === "reject" ? rejectedReason : undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Error al procesar la cotización"
                );
            }

            // Refresh quotes list
            await fetchQuotes();
            setDialogOpen(false);
            setNotes("");
            setRejectedReason("");

            // Show success message with SuccessModal
            setSuccessTitle(actionType === 'approve' ? '¡Cotización Aprobada!' : '¡Cotización Rechazada!');
            setSuccessMessage(result.message || `La cotización ha sido ${actionType === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Error processing quote:", error);
            // Show error message with SuccessModal (we can use it for errors too)
            setSuccessTitle('Error al Procesar');
            setSuccessMessage('No se pudo procesar la cotización. Por favor, intente nuevamente.');
            setShowSuccessModal(true);
        } finally {
            setProcessing(false);
        }
    };

    const openDialog = (
        quote: Quote,
        actionType: "approve" | "reject" | "view"
    ) => {
        setSelectedQuote(quote);
        setAction(actionType);
        setDialogOpen(true);
        setNotes("");
        setRejectedReason("");
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

    const getPriorityLevel = (quote: Quote) => {
        const daysUntilExpiry = Math.ceil(
            (new Date(quote.expires_at).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry <= 3) return "high";
        if (daysUntilExpiry <= 7) return "medium";
        return "low";
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "high":
                return <Badge variant="destructive">Alta Prioridad</Badge>;
            case "medium":
                return <Badge variant="secondary">Prioridad Media</Badge>;
            default:
                return <Badge variant="outline">Prioridad Baja</Badge>;
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

    const pendingQuotes = quotes.filter((q) => q.status === "pending");
    const reviewedQuotes = quotes.filter((q) => q.status !== "pending");

    return (
        <div className="space-y-6">
            {/* Pending Quotes Section */}
            {pendingQuotes.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Cotizaciones Pendientes ({pendingQuotes.length})
                    </h2>
                    <div className="grid gap-4">
                        {pendingQuotes.map((quote) => (
                            <Card
                                key={quote.id}
                                className="border-l-4 border-l-orange-400"
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                {quote.quote_number}
                                            </CardTitle>
                                            <CardDescription>
                                                Cliente:{" "}
                                                {
                                                    quote.customer?.user
                                                        ?.first_name
                                                }{" "}
                                                {
                                                    quote.customer?.user
                                                        ?.last_name
                                                }
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {getPriorityBadge(
                                                getPriorityLevel(quote)
                                            )}
                                            {getStatusBadge(quote.status)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Prima Anual
                                                </p>
                                                <p className="font-semibold">
                                                    $
                                                    {quote.premium_amount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Car className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Vehículo
                                                </p>
                                                <p className="font-semibold">
                                                    {quote.vehicle?.year}{" "}
                                                    {quote.vehicle?.make}{" "}
                                                    {quote.vehicle?.model}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Creada
                                                </p>
                                                <p className="font-semibold">
                                                    {format(
                                                        new Date(
                                                            quote.created_at
                                                        ),
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

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                openDialog(quote, "view")
                                            }
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Ver Detalles
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() =>
                                                openDialog(quote, "approve")
                                            }
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Aprobar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                openDialog(quote, "reject")
                                            }
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Rechazar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviewed Quotes Section */}
            {reviewedQuotes.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Cotizaciones Revisadas ({reviewedQuotes.length})
                    </h2>
                    <div className="grid gap-4">
                        {reviewedQuotes.slice(0, 5).map((quote) => (
                            <Card key={quote.id} className="opacity-75">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                {quote.quote_number}
                                            </CardTitle>
                                            <CardDescription>
                                                Cliente:{" "}
                                                {
                                                    quote.customer?.user
                                                        ?.first_name
                                                }{" "}
                                                {
                                                    quote.customer?.user
                                                        ?.last_name
                                                }
                                            </CardDescription>
                                        </div>
                                        {getStatusBadge(quote.status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Prima Anual
                                            </p>
                                            <p className="font-semibold">
                                                $
                                                {quote.premium_amount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Revisada
                                            </p>
                                            <p className="font-semibold">
                                                {quote.reviewed_at
                                                    ? format(
                                                          new Date(
                                                              quote.reviewed_at
                                                          ),
                                                          "dd/MM/yyyy"
                                                      )
                                                    : "-"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Agente
                                            </p>
                                            <p className="font-semibold">
                                                {quote.agent
                                                    ? `${quote.agent.first_name} ${quote.agent.last_name}`
                                                    : "-"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() =>
                                            openDialog(quote, "view")
                                        }
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Ver Detalles
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {quotes.length === 0 && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                No hay cotizaciones
                            </h3>
                            <p className="text-muted-foreground">
                                No se han encontrado cotizaciones en el sistema.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quote Details/Action Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {action === "approve" && "Aprobar Cotización"}
                            {action === "reject" && "Rechazar Cotización"}
                            {action === "view" && "Detalles de Cotización"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedQuote?.quote_number}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedQuote && (
                        <div className="space-y-4">
                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <User className="h-4 w-4" />
                                            Información del Cliente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <p>
                                                <strong>Nombre:</strong>{" "}
                                                {
                                                    selectedQuote.customer?.user
                                                        ?.first_name
                                                }{" "}
                                                {
                                                    selectedQuote.customer?.user
                                                        ?.last_name
                                                }
                                            </p>
                                            <p>
                                                <strong>Email:</strong>{" "}
                                                {
                                                    selectedQuote.customer?.user
                                                        ?.email
                                                }
                                            </p>
                                            <p>
                                                <strong>Teléfono:</strong>{" "}
                                                {selectedQuote.customer?.user
                                                    ?.phone || "No disponible"}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Car className="h-4 w-4" />
                                            Información del Vehículo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <p>
                                                <strong>Vehículo:</strong>{" "}
                                                {selectedQuote.vehicle?.year}{" "}
                                                {selectedQuote.vehicle?.make}{" "}
                                                {selectedQuote.vehicle?.model}
                                            </p>
                                            <p>
                                                <strong>Placa:</strong>{" "}
                                                {selectedQuote.vehicle
                                                    ?.license_plate ||
                                                    "No disponible"}
                                            </p>
                                            <p>
                                                <strong>Valor Estimado:</strong>{" "}
                                                $
                                                {selectedQuote.vehicle?.estimated_value?.toLocaleString() ||
                                                    "No disponible"}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Quote Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Detalles de la Cotización
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Prima Anual
                                            </p>
                                            <p className="text-xl font-bold">
                                                $
                                                {selectedQuote.premium_amount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Plan
                                            </p>
                                            <p className="font-semibold capitalize">
                                                {selectedQuote.policy_type}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Frecuencia de Pago
                                            </p>
                                            <p className="font-semibold">
                                                {
                                                    selectedQuote.payment_frequency
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Form */}
                            {action !== "view" && (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="notes">
                                            Notas del Agente
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            placeholder="Escribe notas adicionales para el cliente..."
                                            rows={3}
                                        />
                                    </div>

                                    {action === "reject" && (
                                        <div>
                                            <Label htmlFor="rejected_reason">
                                                Motivo del Rechazo *
                                            </Label>
                                            <Textarea
                                                id="rejected_reason"
                                                value={rejectedReason}
                                                onChange={(e) =>
                                                    setRejectedReason(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Explica por qué se rechaza la cotización..."
                                                rows={3}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {action === "view" && (
                            <Button onClick={() => setDialogOpen(false)}>
                                Cerrar
                            </Button>
                        )}
                        {action !== "view" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() =>
                                        selectedQuote &&
                                        handleQuoteAction(
                                            selectedQuote.id,
                                            action
                                        )
                                    }
                                    disabled={
                                        processing ||
                                        (action === "reject" &&
                                            !rejectedReason.trim())
                                    }
                                    className={
                                        action === "approve"
                                            ? "bg-green-600 hover:bg-green-700"
                                            : ""
                                    }
                                >
                                    {processing
                                        ? "Procesando..."
                                        : action === "approve"
                                        ? "Aprobar Cotización"
                                        : "Rechazar Cotización"}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <SuccessModal
                show={showSuccessModal}
                title={successTitle}
                message={successMessage}
                duration={1500}
                onClose={() => setShowSuccessModal(false)}
            />
        </div>
    );
}
