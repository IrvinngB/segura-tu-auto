"use client";

import { useState } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Building2, Smartphone, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    policyNumber: string;
    customerId: string;
    onPaymentSuccess: (paymentId: string) => void;
    onPaymentError: (error: string) => void;
}

interface PaymentMethod {
    id: string;
    type: "credit_card" | "debit_card" | "bank_account" | "digital_wallet";
    name: string;
    last_four: string;
    expiry_date?: string;
    is_primary: boolean;
}

export function PaymentModal({
    open,
    onOpenChange,
    amount,
    policyNumber,
    customerId,
    onPaymentSuccess,
    onPaymentError,
}: PaymentModalProps) {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const supabase = createClient();

    // Simular métodos de pago disponibles
    const simulatedPaymentMethods: PaymentMethod[] = [
        {
            id: "1",
            type: "credit_card",
            name: "Visa **** 4532",
            last_four: "4532",
            expiry_date: "12/27",
            is_primary: true,
        },
        {
            id: "2",
            type: "debit_card",
            name: "Mastercard **** 8945",
            last_four: "8945",
            expiry_date: "08/26",
            is_primary: false,
        },
        {
            id: "3",
            type: "bank_account",
            name: "Cuenta Bancolombia **** 1234",
            last_four: "1234",
            is_primary: false,
        },
    ];

    useState(() => {
        if (open) {
            // En una implementación real, cargar métodos de pago del cliente
            setPaymentMethods(simulatedPaymentMethods);
            setSelectedPaymentMethod(simulatedPaymentMethods[0]?.id || "");
        }
    });

    const getPaymentMethodIcon = (type: string) => {
        switch (type) {
            case "credit_card":
            case "debit_card":
                return <CreditCard className="h-4 w-4" />;
            case "bank_account":
                return <Building2 className="h-4 w-4" />;
            case "digital_wallet":
                return <Smartphone className="h-4 w-4" />;
            default:
                return <CreditCard className="h-4 w-4" />;
        }
    };

    const handlePayment = async () => {
        if (!selectedPaymentMethod) {
            onPaymentError("Selecciona un método de pago");
            return;
        }

        setProcessingPayment(true);

        try {
            // Simular procesamiento de pago
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Crear registro de pago en la base de datos
            const { data: payment, error } = await supabase
                .from("payments")
                .insert({
                    customer_id: customerId,
                    payment_type: "premium",
                    amount: amount,
                    payment_method: "Tarjeta de crédito",
                    payment_status: "completed",
                    payment_date: new Date().toISOString(),
                    reference_number: `PAY-${Date.now()}`,
                    transaction_id: `TXN-${Date.now()}`,
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            toast({
                title: "Pago Exitoso",
                description: `El pago de $${amount.toLocaleString()} ha sido procesado correctamente.`,
                variant: "default",
            });

            onPaymentSuccess(payment.id);
        } catch (error) {
            console.error("Error procesando pago:", error);
            toast({
                title: "Error en el Pago",
                description: "No se pudo procesar el pago. Por favor, inténtalo de nuevo.",
                variant: "destructive",
            });
            onPaymentError("Error al procesar el pago");
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Procesar Pago de Prima
                    </DialogTitle>
                    <DialogDescription>
                        Complete el pago para activar la póliza {policyNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Payment Summary */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">Monto a Pagar</p>
                                    <p className="text-sm text-muted-foreground">
                                        Póliza {policyNumber}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">
                                        ${amount.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Prima inicial
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                        <Label>Método de Pago</Label>
                        <div className="space-y-2">
                            {paymentMethods.map((method) => (
                                <div
                                    key={method.id}
                                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedPaymentMethod === method.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:bg-muted/50"
                                    }`}
                                    onClick={() => setSelectedPaymentMethod(method.id)}
                                >
                                    <div className="flex-shrink-0">
                                        {getPaymentMethodIcon(method.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{method.name}</span>
                                            {method.is_primary && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                    Principal
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {method.type === "credit_card" && "Tarjeta de Crédito"}
                                            {method.type === "debit_card" && "Tarjeta de Débito"}
                                            {method.type === "bank_account" && "Cuenta Bancaria"}
                                            {method.type === "digital_wallet" && "Billetera Digital"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-green-800 dark:text-green-200">
                                    Pago Seguro
                                </p>
                                <p className="text-muted-foreground">
                                    Tu información está protegida con encriptación SSL.
                                    Cumplimos con estándares PCI DSS.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processingPayment}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handlePayment}
                        disabled={!selectedPaymentMethod || processingPayment}
                        className="min-w-[120px]"
                    >
                        {processingPayment ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Procesando...
                            </>
                        ) : (
                            `Pagar $${amount.toLocaleString()}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
