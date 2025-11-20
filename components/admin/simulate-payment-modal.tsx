"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Policy {
    id: string;
    policy_number: string;
    premium_amount: number;
    customer_id: string;
    customer: {
        user: {
            first_name: string;
            last_name: string;
        };
    };
}

interface SimulatePaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function SimulatePaymentModal({
    open,
    onOpenChange,
    onSuccess,
}: SimulatePaymentModalProps) {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedPolicy, setSelectedPolicy] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentType, setPaymentType] = useState("premium");
    const [paymentStatus, setPaymentStatus] = useState("completed");
    const [paymentMethod, setPaymentMethod] = useState("credit_card");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingPolicies, setLoadingPolicies] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (open) {
            fetchPolicies();
        }
    }, [open]);

    useEffect(() => {
        if (selectedPolicy) {
            const policy = policies.find(p => p.id === selectedPolicy);
            if (policy && !amount) {
                setAmount(policy.premium_amount.toString());
                setDescription(`Pago simulado de prima - Póliza ${policy.policy_number}`);
            }
        }
    }, [selectedPolicy, policies]);

    const fetchPolicies = async () => {
        try {
            setLoadingPolicies(true);
            const { data, error } = await supabase
                .from("policies")
                .select(`
                    id,
                    policy_number,
                    premium_amount,
                    customer_id,
                    customer:customers(
                        user:users(first_name, last_name)
                    )
                `)
                .eq("status", "active")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPolicies((data as any) || []);
        } catch (error) {
            console.error("Error fetching policies:", error);
            toast.error("Error al cargar las pólizas");
        } finally {
            setLoadingPolicies(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedPolicy || !amount || parseFloat(amount) <= 0) {
            toast.error("Por favor completa todos los campos requeridos");
            return;
        }

        try {
            setLoading(true);

            const policy = policies.find(p => p.id === selectedPolicy);
            if (!policy) {
                toast.error("Póliza no encontrada");
                return;
            }

            const paymentData = {
                policy_id: selectedPolicy,
                customer_id: policy.customer_id,
                amount: parseFloat(amount),
                payment_type: paymentType,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                payment_date: paymentStatus === "completed" ? new Date().toISOString() : null,
                due_date: paymentStatus === "pending" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
                reference_number: `SIM-${Date.now()}`,
                description: description || `Pago simulado - ${paymentType}`,
                transaction_id: `TXN-${Date.now()}`,
            };

            const { error } = await supabase
                .from("payments")
                .insert([paymentData]);

            if (error) throw error;

            toast.success("Pago simulado creado exitosamente");
            resetForm();
            onSuccess();
        } catch (error) {
            console.error("Error simulating payment:", error);
            toast.error("Error al simular el pago");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedPolicy("");
        setAmount("");
        setPaymentType("premium");
        setPaymentStatus("completed");
        setPaymentMethod("credit_card");
        setDescription("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Simular Pago</DialogTitle>
                    <DialogDescription>
                        Crea un pago simulado para pruebas. Los datos se guardarán en la base de datos.
                    </DialogDescription>
                </DialogHeader>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Este es un pago simulado para fines académicos. No se procesará ninguna transacción real.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="policy">Póliza *</Label>
                        {loadingPolicies ? (
                            <div className="text-sm text-muted-foreground">Cargando pólizas...</div>
                        ) : (
                            <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                                <SelectTrigger id="policy">
                                    <SelectValue placeholder="Selecciona una póliza" />
                                </SelectTrigger>
                                <SelectContent>
                                    {policies.map(policy => (
                                        <SelectItem key={policy.id} value={policy.id}>
                                            {policy.policy_number} - {policy.customer.user.first_name} {policy.customer.user.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentType">Tipo de Pago</Label>
                            <Select value={paymentType} onValueChange={setPaymentType}>
                                <SelectTrigger id="paymentType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="premium">Prima</SelectItem>
                                    <SelectItem value="claim">Reclamación</SelectItem>
                                    <SelectItem value="refund">Reembolso</SelectItem>
                                    <SelectItem value="fee">Comisión</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="paymentStatus">Estado del Pago</Label>
                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger id="paymentStatus">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="completed">Pagado (Éxito)</SelectItem>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="failed">Fallido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Método de Pago</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="paymentMethod">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                                    <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                                    <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                                    <SelectItem value="cash">Efectivo</SelectItem>
                                    <SelectItem value="digital_wallet">Billetera Digital</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            placeholder="Descripción del pago simulado..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            resetForm();
                            onOpenChange(false);
                        }}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedPolicy || !amount}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Simular Pago
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
