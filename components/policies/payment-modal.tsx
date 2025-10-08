"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building2, Smartphone, Shield, Plus, AlertCircle, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PaymentMethods } from "@/components/customer/payment-methods";
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple";

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
    const { customerData } = useCustomerDataSimple();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (open) {
            fetchPaymentMethods();
        }
    }, [open, customerData]);

    const fetchPaymentMethods = async () => {
        if (!customerData) return;
        
        setLoading(true);
        try {
            // Simular métodos de pago disponibles del cliente
            const simulatedPaymentMethods: PaymentMethod[] = [
                {
                    id: "1",
                    type: "credit_card",
                    name: "Visa",
                    last_four: "4532",
                    expiry_date: "12/27",
                    is_primary: true,
                },
                {
                    id: "2",
                    type: "debit_card",
                    name: "Mastercard",
                    last_four: "8945",
                    expiry_date: "08/26",
                    is_primary: false,
                },
            ];

            setPaymentMethods(simulatedPaymentMethods);
            
            // Auto-seleccionar el método principal si existe
            const primaryMethod = simulatedPaymentMethods.find(method => method.is_primary);
            setSelectedPaymentMethod(primaryMethod?.id || simulatedPaymentMethods[0]?.id || "");
        } catch (error) {
            console.error("Error fetching payment methods:", error);
            setPaymentMethods([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMethodAdded = (newMethod: PaymentMethod) => {
        setPaymentMethods(prev => [...prev, newMethod]);
        setSelectedPaymentMethod(newMethod.id);
        setShowAddPaymentMethod(false);
    };

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

    const getMethodTypeName = (type: string) => {
        switch (type) {
            case "credit_card":
                return "Tarjeta de Crédito";
            case "debit_card":
                return "Tarjeta de Débito";
            case "bank_account":
                return "Cuenta Bancaria";
            case "digital_wallet":
                return "Billetera Digital";
            default:
                return type;
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

            alert(`Pago Exitoso: El pago de $${amount.toLocaleString()} ha sido procesado correctamente.`);

            onPaymentSuccess(payment.id);
        } catch (error) {
            console.error("Error procesando pago:", error);
            alert("Error en el Pago: No se pudo procesar el pago. Por favor, inténtalo de nuevo.");
            onPaymentError("Error al procesar el pago");
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Procesar Pago de Prima
                        </DialogTitle>
                        <DialogDescription>
                            Complete el pago para activar la póliza {policyNumber}
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="py-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p>Cargando métodos de pago...</p>
                        </div>
                    ) : (
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

                            {/* No Payment Methods Alert */}
                            {paymentMethods.length === 0 && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="space-y-3">
                                            <p>
                                                <strong>No tienes métodos de pago registrados.</strong> 
                                                Para procesar el pago, primero debes agregar un método de pago.
                                            </p>
                                            <Button 
                                                size="sm" 
                                                onClick={() => setShowAddPaymentMethod(true)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Agregar Método de Pago
                                            </Button>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Payment Methods */}
                            {paymentMethods.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Selecciona Método de Pago</Label>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setShowAddPaymentMethod(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Nuevo
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {paymentMethods.map((method) => (
                                            <div
                                                key={method.id}
                                                className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                    selectedPaymentMethod === method.id
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-border hover:bg-muted/50 hover:border-primary/30"
                                                }`}
                                                onClick={() => setSelectedPaymentMethod(method.id)}
                                            >
                                                <div className="flex-shrink-0 text-primary">
                                                    {getPaymentMethodIcon(method.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium">
                                                            {method.name} **** {method.last_four}
                                                        </span>
                                                        {method.is_primary && (
                                                            <Badge variant="default" className="text-xs">
                                                                <Star className="h-3 w-3 mr-1" />
                                                                Principal
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <span>{getMethodTypeName(method.type)}</span>
                                                        {method.expiry_date && (
                                                            <span>Vence: {method.expiry_date}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {selectedPaymentMethod === method.id && (
                                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Security Notice */}
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-green-800 dark:text-green-200">
                                            Pago Seguro Garantizado
                                        </p>
                                        <p className="text-muted-foreground">
                                            Tu información está protegida con encriptación SSL de grado bancario.
                                            Cumplimos con estándares PCI DSS Level 1.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processingPayment}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={!selectedPaymentMethod || processingPayment || paymentMethods.length === 0}
                            className="min-w-[140px]"
                        >
                            {processingPayment ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Pagar $${amount.toLocaleString()}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Payment Method Modal */}
            <Dialog open={showAddPaymentMethod} onOpenChange={setShowAddPaymentMethod}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Agregar Método de Pago</DialogTitle>
                        <DialogDescription>
                            Agrega un método de pago para procesar el pago de tu póliza
                        </DialogDescription>
                    </DialogHeader>
                    <PaymentMethods 
                        onMethodAdded={handleMethodAdded}
                        showAddButton={false}
                        allowEdit={false}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddPaymentMethod(false)}
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
