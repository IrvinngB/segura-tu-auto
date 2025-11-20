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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Payment {
    id: string;
    payment_status: string;
    reference_number: string | null;
}

interface EditPaymentStatusModalProps {
    payment: Payment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditPaymentStatusModal({
    payment,
    open,
    onOpenChange,
    onSuccess,
}: EditPaymentStatusModalProps) {
    const [status, setStatus] = useState(payment.payment_status);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const updateData: any = {
                payment_status: status,
                updated_at: new Date().toISOString(),
            };

            if (status === "completed" && !payment.reference_number) {
                updateData.payment_date = new Date().toISOString();
                updateData.reference_number = `REF-${Date.now()}`;
            }

            if (notes) {
                updateData.description = payment.reference_number
                    ? `${payment.reference_number} - ${notes}`
                    : notes;
            }

            const { error } = await supabase
                .from("payments")
                .update(updateData)
                .eq("id", payment.id);

            if (error) throw error;

            toast.success("Estado del pago actualizado correctamente");
            onSuccess();
        } catch (error) {
            console.error("Error updating payment status:", error);
            toast.error("Error al actualizar el estado del pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Estado del Pago</DialogTitle>
                    <DialogDescription>
                        Cambia el estado del pago y agrega notas si es necesario
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Nuevo Estado</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="completed">Pagado</SelectItem>
                                <SelectItem value="failed">Fallido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Agrega notas sobre el cambio de estado..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
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
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
