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

interface PolicyCancellationModalProps {
    policy: Policy | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CANCELLATION_REASONS = [
    { value: "better_price", label: "Encontré un mejor precio" },
    { value: "sold_vehicle", label: "Vendí el vehículo" },
    { value: "service_issues", label: "Insatisfecho con el servicio" },
    { value: "financial", label: "Razones económicas" },
    { value: "other", label: "Otro motivo" },
];

export function PolicyCancellationModal({
    policy,
    open,
    onOpenChange,
    onSuccess,
}: PolicyCancellationModalProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [comments, setComments] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const supabase = createClient();

    const handleSubmit = async () => {
        if (!policy || !reason || !confirmed) return;

        try {
            setLoading(true);

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
            onSuccess();
            onOpenChange(false);

            // Reset form
            setReason("");
            setComments("");
            setConfirmed(false);
        } catch (error) {
            console.error("Error submitting cancellation request:", error);
            toast.error("Error al enviar la solicitud. Inténtalo de nuevo.");
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
                        Solicitar Cancelación de Póliza
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de solicitar la cancelación de la póliza{" "}
                        <span className="font-medium text-foreground">
                            {policy?.policy_number}
                        </span>
                        . Un agente revisará tu solicitud.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motivo de cancelación</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Selecciona un motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {CANCELLATION_REASONS.map((r) => (
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
                            placeholder="Cuéntanos más detalles..."
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
                                Entiendo que esta acción iniciará un proceso de revisión
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                La póliza permanecerá activa hasta que un agente apruebe la cancelación.
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
                        Enviar Solicitud
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
