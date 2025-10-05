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
} from "lucide-react";
import { format } from "date-fns";

interface QuoteListProps {
    customerId?: string;
}

export function QuoteList({ customerId }: QuoteListProps) {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
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
                        <div className="border-t pt-4 flex gap-2">
                            {quote.status === "approved" && (
                                <Button>Ver Detalles de la Póliza</Button>
                            )}
                            {quote.status === "rejected" && (
                                <Button variant="outline" asChild>
                                    <a href="/customer/quote">
                                        Nueva Cotización
                                    </a>
                                </Button>
                            )}
                            {quote.status === "converted" && (
                                <Button asChild>
                                    <a href="/customer/policies">
                                        Ver Mi Póliza
                                    </a>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
