"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
    CreditCard,
    Building2,
    Smartphone,
    Shield,
    Plus,
    AlertCircle,
    Star,
    Lock,
    CheckCircle,
    Loader2,
    Eye,
    EyeOff,
    ArrowLeft,
    DollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface CustomerPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    policyNumber: string;
    policyId: string;
    paymentType: string;
    customerId: string;
    onPaymentSuccess: () => void;
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

interface NewPaymentMethod {
    type: "credit_card" | "debit_card" | "bank_account";
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolderName: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    isPrimary?: boolean;
}

export function CustomerPaymentModal({
    open,
    onOpenChange,
    amount,
    policyNumber,
    policyId,
    paymentType,
    customerId,
    onPaymentSuccess,
    onPaymentError,
}: CustomerPaymentModalProps) {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentStep, setPaymentStep] = useState<"select" | "new" | "processing" | "success">("select");
    const [showCvv, setShowCvv] = useState(false);
    const [newPaymentMethod, setNewPaymentMethod] = useState<NewPaymentMethod>({
        type: "credit_card",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardHolderName: "",
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        isPrimary: false,
    });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [saveMethod, setSaveMethod] = useState(false);
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Load payment methods when modal opens
    useEffect(() => {
        if (open && customerId) {
            loadPaymentMethods();
        }
    }, [open, customerId]);

    const loadPaymentMethods = async () => {
        try {
            setLoadingMethods(true);
            const response = await fetch("/api/payment-methods");
            
            if (!response.ok) {
                throw new Error("Error loading payment methods");
            }

            const data = await response.json();
            setPaymentMethods(data.paymentMethods || []);
            
            // Auto-select primary method if available
            const primaryMethod = data.paymentMethods?.find((m: PaymentMethod) => m.is_primary);
            if (primaryMethod) {
                setSelectedPaymentMethod(primaryMethod.id);
            }
        } catch (error) {
            console.error("Error loading payment methods:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los métodos de pago",
                variant: "destructive",
            });
        } finally {
            setLoadingMethods(false);
        }
    };

    const validateCardNumber = (cardNumber: string): boolean => {
        // Nueva regla: exactamente 16 dígitos numéricos
        const cleanNumber = cardNumber.replace(/\s/g, "");
        return /^\d{16}$/.test(cleanNumber);
    };

    const validateExpiryDate = (expiry: string): boolean => {
        const match = expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return false;
        
        const month = parseInt(match[1], 10);
        const year = parseInt("20" + match[2], 10);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        if (month < 1 || month > 12) return false;
        if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
        
        return true;
    };

    const validateNewPaymentMethod = (): boolean => {
        const errors: string[] = [];

        if (newPaymentMethod.type === "credit_card" || newPaymentMethod.type === "debit_card") {
            if (!newPaymentMethod.cardHolderName.trim()) {
                errors.push("El nombre del titular es requerido");
            }
            
            if (!newPaymentMethod.cardNumber.trim()) {
                errors.push("El número de tarjeta es requerido");
            } else if (!validateCardNumber(newPaymentMethod.cardNumber)) {
                errors.push("El número de tarjeta no es válido (debe tener exactamente 16 dígitos)");
            }
            
            if (!newPaymentMethod.expiryDate.trim()) {
                errors.push("La fecha de expiración es requerida");
            } else if (!validateExpiryDate(newPaymentMethod.expiryDate)) {
                errors.push("La fecha de expiración no es válida");
            }
            
            if (!newPaymentMethod.cvv.trim()) {
                errors.push("El CVV es requerido");
            } else if (newPaymentMethod.cvv.length < 3 || newPaymentMethod.cvv.length > 4) {
                errors.push("El CVV debe tener 3 o 4 dígitos");
            }
        } else if (newPaymentMethod.type === "bank_account") {
            if (!newPaymentMethod.bankName?.trim()) {
                errors.push("El nombre del banco es requerido");
            }
            
            if (!newPaymentMethod.accountNumber?.trim()) {
                errors.push("El número de cuenta es requerido");
            }
            
            if (!newPaymentMethod.routingNumber?.trim()) {
                errors.push("El número de ruta es requerido");
            }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const formatCardNumber = (value: string): string => {
        const cleanValue = value.replace(/\D/g, "").slice(0, 16); // Solo dígitos, max 16
        const formatted = cleanValue.replace(/(\d{4})(?=\d)/g, "$1 "); // Agrupar de 4 en 4
        return formatted;
    };

    const formatExpiryDate = (value: string): string => {
        const cleanValue = value.replace(/\D/g, "");
        if (cleanValue.length >= 2) {
            return cleanValue.substring(0, 2) + "/" + cleanValue.substring(2, 4);
        }
        return cleanValue;
    };

    const getCardIcon = (type: string) => {
        switch (type) {
            case "credit_card":
                return <CreditCard className="h-5 w-5 text-blue-600" />;
            case "debit_card":
                return <CreditCard className="h-5 w-5 text-green-600" />;
            case "bank_account":
                return <Building2 className="h-5 w-5 text-gray-600" />;
            case "digital_wallet":
                return <Smartphone className="h-5 w-5 text-purple-600" />;
            default:
                return <CreditCard className="h-5 w-5" />;
        }
    };

    const handlePayment = async () => {
        // Validación inicial
        if (paymentStep === "select" && !selectedPaymentMethod) {
            toast({
                title: "Error",
                description: "Por favor selecciona un método de pago",
                variant: "destructive",
            });
            return;
        }

        if (paymentStep === "new" && !validateNewPaymentMethod()) {
            return;
        }

        setPaymentStep("processing");
        setProcessingPayment(true);

        try {
            let paymentMethodId = selectedPaymentMethod;
            let paymentMethodType = "credit_card";

            // Si es un nuevo método, primero lo creamos en el backend
            if (paymentStep === "new") {
                paymentMethodType = newPaymentMethod.type;
                
                // Preparar datos para crear el método
                const methodData = {
                    type: newPaymentMethod.type,
                    name: newPaymentMethod.type === "bank_account" 
                        ? newPaymentMethod.bankName 
                        : newPaymentMethod.cardHolderName,
                    last_four: newPaymentMethod.type === "bank_account"
                        ? newPaymentMethod.accountNumber?.slice(-4)
                        : newPaymentMethod.cardNumber.slice(-4),
                    expiry_date: newPaymentMethod.expiryDate,
                    is_primary: newPaymentMethod.isPrimary, // Usar el checkbox del usuario
                    billing_address: "Dirección registrada", // Placeholder o tomar del perfil
                };

                console.log("Creating new payment method:", methodData);

                const createMethodResponse = await fetch("/api/payment-methods", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(methodData),
                });

                if (!createMethodResponse.ok) {
                    const errorData = await createMethodResponse.json();
                    throw new Error(errorData.error || "Error al guardar el método de pago");
                }

                const { paymentMethod } = await createMethodResponse.json();
                paymentMethodId = paymentMethod.id;
                
                // Si el usuario eligió guardar, recargamos la lista para el futuro
                if (saveMethod) {
                    loadPaymentMethods();
                }
            } else {
                const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
                if (method) {
                    paymentMethodType = method.type;
                }
            }

            // Procesar el pago usando el ID del método (existente o recién creado)
            console.log("Processing payment with method:", paymentMethodId);
            
            const paymentResponse = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    policy_id: policyId,
                    payment_method_id: paymentMethodId,
                    amount: amount,
                    payment_type: paymentType.includes("Inicial") || paymentType.includes("Activación") ? "premium" : "premium",
                    payment_method: paymentMethodType,
                }),
            });

            if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json();
                throw new Error(errorData.error || "Error procesando el pago");
            }

            const paymentData = await paymentResponse.json();

            setPaymentStep("success");
            
            // Invalidate queries to update UI
            queryClient.invalidateQueries({ queryKey: ["customer-payments-summary"] });
            queryClient.invalidateQueries({ queryKey: ["customer-upcoming-payments"] });
            queryClient.invalidateQueries({ queryKey: ["customer-policies"] });
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            
            // Esperar un momento para mostrar el éxito antes de cerrar
            setTimeout(() => {
                onPaymentSuccess();
                onOpenChange(false);
                // Resetear estado
                setPaymentStep("select");
                setNewPaymentMethod({
                    type: "credit_card",
                    cardNumber: "",
                    expiryDate: "",
                    cvv: "",
                    cardHolderName: "",
                    bankName: "",
                    accountNumber: "",
                    routingNumber: "",
                    isPrimary: false,
                });
                setSelectedPaymentMethod("");
            }, 2500);

            toast({
                title: "¡Pago Exitoso!",
                description: `El pago de $${amount.toLocaleString()} ha sido procesado correctamente.`,
                className: "bg-green-50 border-green-200 text-green-900",
            });

        } catch (error) {
            console.error("Error procesando pago:", error);
            // Mantener en el paso actual para permitir reintentar o corregir
            if (paymentStep === "processing") {
                setPaymentStep(selectedPaymentMethod ? "select" : "new");
            }
            
            onPaymentError(error instanceof Error ? error.message : "Error desconocido");
            
            toast({
                title: "Error en el Pago",
                description: error instanceof Error ? error.message : "No se pudo procesar el pago. Intenta nuevamente.",
                variant: "destructive",
            });
        } finally {
            setProcessingPayment(false);
        }
    };

    const renderSelectPaymentStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Realizar Pago - ${amount.toLocaleString()}
                </DialogTitle>
                <DialogDescription>
                    {paymentType} • Póliza: {policyNumber}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
                <div className="space-y-4">
                    <Label className="text-base font-semibold">
                        Seleccionar Método de Pago
                    </Label>
                    
                    {paymentMethods.map((method) => (
                        <Card
                            key={method.id}
                            className={`cursor-pointer transition-all ${
                                selectedPaymentMethod === method.id
                                    ? "ring-2 ring-primary border-primary"
                                    : "hover:shadow-md"
                            }`}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    {getCardIcon(method.type)}
                                    <div>
                                        <div className="font-semibold">
                                            {method.name} •••• {method.last_four}
                                        </div>
                                        {method.expiry_date && (
                                            <div className="text-sm text-muted-foreground">
                                                Exp: {method.expiry_date}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {method.is_primary && (
                                        <Badge variant="secondary">
                                            <Star className="h-3 w-3 mr-1" />
                                            Principal
                                        </Badge>
                                    )}
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 ${
                                            selectedPaymentMethod === method.id
                                                ? "border-primary bg-primary"
                                                : "border-gray-300"
                                        }`}
                                    >
                                        {selectedPaymentMethod === method.id && (
                                            <CheckCircle className="h-3 w-3 text-white" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Separator />

                <Button
                    variant="outline"
                    onClick={() => setPaymentStep("new")}
                    className="w-full"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Usar Nuevo Método de Pago
                </Button>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                </Button>
                <Button 
                    onClick={handlePayment} 
                    disabled={!selectedPaymentMethod || processingPayment}
                    className="min-w-[120px]"
                >
                    {processingPayment ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <Lock className="h-4 w-4 mr-2" />
                            Pagar ${amount.toLocaleString()}
                        </>
                    )}
                </Button>
            </DialogFooter>
        </>
    );

    const renderNewPaymentStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <ArrowLeft 
                        className="h-5 w-5 cursor-pointer" 
                        onClick={() => setPaymentStep("select")}
                    />
                    Agregar Método de Pago
                </DialogTitle>
                <DialogDescription>
                    Completa la información para procesar el pago
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
                {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <ul className="list-disc list-inside">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <div>
                        <Label>Tipo de Método</Label>
                        <Select
                            value={newPaymentMethod.type}
                            onValueChange={(value: "credit_card" | "debit_card" | "bank_account") =>
                                setNewPaymentMethod(prev => ({ ...prev, type: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                                <SelectItem value="debit_card">Tarjeta Débito</SelectItem>
                                <SelectItem value="bank_account">Cuenta Bancaria</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(newPaymentMethod.type === "credit_card" || newPaymentMethod.type === "debit_card") && (
                        <>
                            <div>
                                <Label>Nombre del Titular</Label>
                                <Input
                                    placeholder="Nombre completo como aparece en la tarjeta"
                                    value={newPaymentMethod.cardHolderName}
                                    onChange={(e) =>
                                        setNewPaymentMethod(prev => ({ 
                                            ...prev, 
                                            cardHolderName: e.target.value.toUpperCase() 
                                        }))
                                    }
                                />
                            </div>

                            <div>
                                <Label>Número de Tarjeta</Label>
                                <Input
                                    placeholder="1234 5678 9012 3456"
                                    value={formatCardNumber(newPaymentMethod.cardNumber)}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\s/g, "");
                                        setNewPaymentMethod(prev => ({ 
                                            ...prev, 
                                            cardNumber: rawValue 
                                        }));
                                        // Auto-clear error if valid
                                        if (validationErrors.length > 0 && /^\d{16}$/.test(rawValue)) {
                                            setValidationErrors(prev => prev.filter(err => !err.includes("número de tarjeta")));
                                        }
                                    }}
                                    maxLength={19}
                                    className={
                                        validationErrors.some(err => err.includes("número de tarjeta")) 
                                            ? "border-red-500 focus-visible:ring-red-500" 
                                            : ""
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Fecha de Expiración</Label>
                                    <Input
                                        placeholder="MM/AA"
                                        value={newPaymentMethod.expiryDate}
                                        onChange={(e) =>
                                            setNewPaymentMethod(prev => ({ 
                                                ...prev, 
                                                expiryDate: formatExpiryDate(e.target.value) 
                                            }))
                                        }
                                        maxLength={5}
                                    />
                                </div>

                                <div>
                                    <Label>CVV</Label>
                                    <div className="relative">
                                        <Input
                                            type={showCvv ? "text" : "password"}
                                            placeholder="123"
                                            value={newPaymentMethod.cvv}
                                            onChange={(e) =>
                                                setNewPaymentMethod(prev => ({ 
                                                    ...prev, 
                                                    cvv: e.target.value.replace(/\D/g, "") 
                                                }))
                                            }
                                            maxLength={4}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowCvv(!showCvv)}
                                        >
                                            {showCvv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {newPaymentMethod.type === "bank_account" && (
                        <>
                            <div>
                                <Label>Nombre del Banco</Label>
                                <Input
                                    placeholder="Banco Nacional de Panamá"
                                    value={newPaymentMethod.bankName || ""}
                                    onChange={(e) =>
                                        setNewPaymentMethod(prev => ({ 
                                            ...prev, 
                                            bankName: e.target.value 
                                        }))
                                    }
                                />
                            </div>

                            <div>
                                <Label>Número de Cuenta</Label>
                                <Input
                                    placeholder="1234567890"
                                    value={newPaymentMethod.accountNumber || ""}
                                    onChange={(e) =>
                                        setNewPaymentMethod(prev => ({ 
                                            ...prev, 
                                            accountNumber: e.target.value.replace(/\D/g, "") 
                                        }))
                                    }
                                />
                            </div>

                            <div>
                                <Label>Número de Ruta</Label>
                                <Input
                                    placeholder="123456789"
                                    value={newPaymentMethod.routingNumber || ""}
                                    onChange={(e) =>
                                        setNewPaymentMethod(prev => ({ 
                                            ...prev, 
                                            routingNumber: e.target.value.replace(/\D/g, "") 
                                        }))
                                    }
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="save-method"
                            checked={saveMethod}
                            onCheckedChange={(checked) => setSaveMethod(checked === true)}
                        />
                        <Label htmlFor="save-method" className="text-sm">
                            Guardar este método para futuros pagos
                        </Label>
                    </div>

                    {saveMethod && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is-primary"
                                checked={newPaymentMethod.isPrimary}
                                onCheckedChange={(checked) => 
                                    setNewPaymentMethod(prev => ({ ...prev, isPrimary: checked === true }))
                                }
                            />
                            <Label htmlFor="is-primary" className="text-sm">
                                Establecer como método principal
                            </Label>
                        </div>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentStep("select")}>
                    Atrás
                </Button>
                <Button 
                    onClick={handlePayment}
                    disabled={processingPayment || (newPaymentMethod.type !== "bank_account" && !/^\d{16}$/.test(newPaymentMethod.cardNumber))}
                    className="min-w-[120px]"
                >
                    {processingPayment ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <Lock className="h-4 w-4 mr-2" />
                            Pagar ${amount.toLocaleString()}
                        </>
                    )}
                </Button>
            </DialogFooter>
        </>
    );

    const renderProcessingStep = () => (
        <>
            <DialogHeader>
                <DialogTitle>Procesando Pago...</DialogTitle>
                <DialogDescription>
                    Por favor espera mientras procesamos tu pago de forma segura
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <Lock className="h-8 w-8 text-primary absolute inset-0 m-auto" />
                </div>
                
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Procesando tu pago</h3>
                    <p className="text-muted-foreground">
                        Esto puede tomar unos momentos...
                    </p>
                </div>

                <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        Tu información está protegida con encriptación de nivel bancario
                    </AlertDescription>
                </Alert>
            </div>
        </>
    );

    const renderSuccessStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    ¡Pago Exitoso!
                </DialogTitle>
                <DialogDescription>
                    Tu pago ha sido procesado correctamente
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Pago Completado</h3>
                    <p className="text-muted-foreground">
                        Monto: ${amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {paymentType} • Póliza: {policyNumber}
                    </p>
                </div>
            </div>
        </>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                {paymentStep === "select" && renderSelectPaymentStep()}
                {paymentStep === "new" && renderNewPaymentStep()}
                {paymentStep === "processing" && renderProcessingStep()}
                {paymentStep === "success" && renderSuccessStep()}
            </DialogContent>
        </Dialog>
    );
}