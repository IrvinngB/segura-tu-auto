"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Policy } from "@/lib/types/database";
import { useAuth } from "@/components/auth/auth-provider";

interface PolicyCancellationModalProps {
    policy: Policy | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    mode?: "agent" | "customer";
}

const CUSTOMER_CANCELLATION_REASONS = [
    { value: "better_price", label: "Encontré un mejor precio" },
    { value: "sold_vehicle", label: "Vendí el vehículo" },
    { value: "service_issues", label: "Insatisfecho con el servicio" },
    { value: "financial", label: "Razones económicas" },
    { value: "other", label: "Otro motivo" },
];

const AGENT_CANCELLATION_REASONS = [
    { value: "sold_vehicle", label: "Cancelación por venta del vehículo" },
    { value: "better_price", label: "Cancelación por mejor oferta externa" },
    { value: "service_issues", label: "Cancelación por inconformidad del cliente" },
    { value: "financial", label: "Cancelación por factores económicos" },
    { value: "other", label: "Cancelación por motivo no especificado" },
];

export function PolicyCancellationModal({
    policy,
    open,
    onOpenChange,
    onSuccess,
    mode = "customer",
}: PolicyCancellationModalProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [comments, setComments] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const supabase = createClient();
    const { userProfile } = useAuth();

    const isAgent = mode === "agent";
    const reasons = isAgent ? AGENT_CANCELLATION_REASONS : CUSTOMER_CANCELLATION_REASONS;

    const handleSubmit = async () => {
        if (!policy || !reason || !confirmed) return;

        try {
            setLoading(true);

            if (mode === "agent") {
                // Lógica para AGENTE: Cancelación directa
                
                // 1. Actualizar estado de la póliza
                const { error: updateError } = await supabase
                    .from("policies")
                    .update({ status: "cancelled" })
                    .eq("id", policy.id);

                if (updateError) throw updateError;

                // 2. Registrar en historial (usando la tabla de requests como log, o podrías tener una tabla de auditoría)
                // En este caso, creamos un request ya aprobado para mantener registro
                const { error: logError } = await supabase
                    .from("policy_cancellation_requests")
                    .insert({
                        policy_id: policy.id,
                        customer_id: policy.customer_id,
                        reason,
                        comments: `[Cancelado por Agente] ${comments}`,
                        status: "approved", // Ya aprobado porque lo hizo el agente
                        reviewed_by: userProfile?.id,
                        reviewed_at: new Date().toISOString(),
                    });

                if (logError) {
                    console.error("Error logging cancellation:", logError);
                    // No bloqueamos si falla el log, pero es bueno saberlo
                }

                toast.success("Póliza cancelada exitosamente", {
                    description: "La póliza fue cancelada y ya no aparecerá como activa para el cliente.",
                });

            } else {
                // Lógica para CLIENTE: Solicitud de cancelación (existente)
                const { error } = await supabase
                    .from("policy_cancellation_requests")
                    .insert({
                        policy_id: policy.id,
                        customer_id: policy.customer_id,
                        reason,
                        comments,
                        status: "pending",
                    });

                if (error) throw error;

                toast.success("Solicitud de cancelación enviada correctamente");
            }

            onSuccess();
            onOpenChange(false);

            // Reset form
            setReason("");
            setComments("");
            setConfirmed(false);
        } catch (error) {
            console.error("Error processing cancellation:", error);
            toast.error("Error al procesar la solicitud. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {isAgent ? "Cancelar póliza del cliente" : "Solicitar Cancelación de Póliza"}
                    </DialogTitle>
                    <DialogDescription>
                        {isAgent ? (
                            <>
                                Estás a punto de cancelar la póliza{" "}
                                <span className="font-medium text-foreground">
                                    {policy?.policy_number}
                                </span>{" "}
                                correspondiente al cliente{" "}
                                <span className="font-medium text-foreground">
                                    {policy?.customer?.user?.first_name} {policy?.customer?.user?.last_name}
                                </span>
                                . Esta acción actualizará el estado de la póliza y quedará registrada en el historial del cliente.
                            </>
                        ) : (
                            <>
                                Estás a punto de solicitar la cancelación de la póliza{" "}
                                <span className="font-medium text-foreground">
                                    {policy?.policy_number}
                                </span>
                                . Un agente revisará tu solicitud.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            {isAgent ? "Motivo reportado por el cliente" : "Motivo de cancelación"}
                        </Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Selecciona un motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {reasons.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comments">Comentarios adicionales (opcional)</Label>
                        <Textarea
                            id="comments"
                            placeholder={isAgent ? "Agrega información relevante sobre la cancelación..." : "Cuéntanos más detalles..."}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex items-start space-x-2 pt-2">
                        <Checkbox
                            id="confirm"
                            checked={confirmed}
                            onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="confirm"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {isAgent 
                                    ? "Confirmo que deseo cancelar esta póliza inmediatamente" 
                                    : "Entiendo que esta acción iniciará un proceso de revisión"
                                }
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {isAgent
                                    ? "Esta acción es irreversible y detendrá la cobertura."
                                    : "La póliza permanecerá activa hasta que un agente apruebe la cancelación."
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!reason || !confirmed || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAgent ? "Confirmar cancelación" : "Enviar Solicitud"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
