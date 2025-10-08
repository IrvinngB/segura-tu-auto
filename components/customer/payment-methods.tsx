"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    CreditCard,
    Building2,
    Smartphone,
    Plus,
    Edit,
    Trash2,
    Star,
    Shield,
    Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple";

interface PaymentMethod {
    id: string;
    type: "credit_card" | "debit_card" | "bank_account" | "digital_wallet";
    name: string;
    last_four: string;
    expiry_date?: string;
    is_primary: boolean;
    brand?: string;
    bank_name?: string;
    created_at: string;
}

interface PaymentMethodsProps {
    onMethodAdded?: (method: PaymentMethod) => void;
    showAddButton?: boolean;
    allowEdit?: boolean;
}

export function PaymentMethods({
    onMethodAdded,
    showAddButton = true,
    allowEdit = true,
}: PaymentMethodsProps) {
    const { customerData } = useCustomerDataSimple();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
        null
    );
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();

    // Form data for new/edit payment method
    const [formData, setFormData] = useState<{
        type: "credit_card" | "debit_card" | "bank_account" | "digital_wallet";
        card_number: string;
        expiry_date: string;
        cvv: string;
        cardholder_name: string;
        bank_name: string;
        account_number: string;
        routing_number: string;
        wallet_email: string;
        is_primary: boolean;
    }>({
        type: "credit_card",
        card_number: "",
        expiry_date: "",
        cvv: "",
        cardholder_name: "",
        bank_name: "",
        account_number: "",
        routing_number: "",
        wallet_email: "",
        is_primary: false,
    });

    useEffect(() => {
        fetchPaymentMethods();
    }, [customerData]);

    const fetchPaymentMethods = async () => {
        if (!customerData) return;

        try {
            // Por ahora usamos datos simulados, pero se podría conectar a Supabase
            const simulatedMethods: PaymentMethod[] = [
                {
                    id: "1",
                    type: "credit_card",
                    name: "Visa",
                    last_four: "4532",
                    expiry_date: "12/27",
                    is_primary: true,
                    brand: "Visa",
                    created_at: "2024-01-15T00:00:00Z",
                },
                {
                    id: "2",
                    type: "debit_card",
                    name: "Mastercard",
                    last_four: "8945",
                    expiry_date: "08/26",
                    is_primary: false,
                    brand: "Mastercard",
                    created_at: "2024-02-20T00:00:00Z",
                },
            ];

            setPaymentMethods(simulatedMethods);
        } catch (error) {
            console.error("Error fetching payment methods:", error);
        } finally {
            setLoading(false);
        }
    };

    const getPaymentMethodIcon = (type: string) => {
        switch (type) {
            case "credit_card":
            case "debit_card":
                return <CreditCard className="h-5 w-5" />;
            case "bank_account":
                return <Building2 className="h-5 w-5" />;
            case "digital_wallet":
                return <Smartphone className="h-5 w-5" />;
            default:
                return <CreditCard className="h-5 w-5" />;
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

    const handleAddMethod = () => {
        setFormData({
            type: "credit_card",
            card_number: "",
            expiry_date: "",
            cvv: "",
            cardholder_name: "",
            bank_name: "",
            account_number: "",
            routing_number: "",
            wallet_email: "",
            is_primary: paymentMethods.length === 0,
        });
        setEditingMethod(null);
        setShowAddModal(true);
    };

    const handleEditMethod = (method: PaymentMethod) => {
        setEditingMethod(method);
        setFormData({
            type: method.type,
            card_number: "",
            expiry_date: method.expiry_date || "",
            cvv: "",
            cardholder_name: method.name,
            bank_name: method.bank_name || "",
            account_number: "",
            routing_number: "",
            wallet_email: "",
            is_primary: method.is_primary,
        });
        setShowAddModal(true);
    };

    const handleSubmitMethod = async () => {
        if (!customerData) return;

        setSubmitting(true);
        try {
            // Validate form
            if (
                formData.type === "credit_card" ||
                formData.type === "debit_card"
            ) {
                if (
                    !formData.card_number ||
                    !formData.expiry_date ||
                    !formData.cvv
                ) {
                    throw new Error(
                        "Todos los campos de tarjeta son requeridos"
                    );
                }
            }

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const newMethod: PaymentMethod = {
                id: editingMethod?.id || `new-${Date.now()}`,
                type: formData.type,
                name:
                    formData.cardholder_name ||
                    formData.bank_name ||
                    "Método de Pago",
                last_four:
                    formData.card_number.slice(-4) ||
                    formData.account_number.slice(-4) ||
                    "****",
                expiry_date: formData.expiry_date,
                is_primary: formData.is_primary,
                brand: formData.type === "credit_card" ? "Visa" : undefined,
                bank_name: formData.bank_name,
                created_at:
                    editingMethod?.created_at || new Date().toISOString(),
            };

            if (editingMethod) {
                // Update existing method
                setPaymentMethods((methods) =>
                    methods.map((method) =>
                        method.id === editingMethod.id ? newMethod : method
                    )
                );
            } else {
                // Add new method
                setPaymentMethods((methods) => [...methods, newMethod]);
                onMethodAdded?.(newMethod);
            }

            // If set as primary, update other methods
            if (formData.is_primary) {
                setPaymentMethods((methods) =>
                    methods.map((method) => ({
                        ...method,
                        is_primary: method.id === newMethod.id,
                    }))
                );
            }

            setShowAddModal(false);
        } catch (error) {
            console.error("Error saving payment method:", error);
            alert(
                "Error al guardar el método de pago: " +
                    (error as Error).message
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetPrimary = async (methodId: string) => {
        setPaymentMethods((methods) =>
            methods.map((method) => ({
                ...method,
                is_primary: method.id === methodId,
            }))
        );
    };

    const handleDeleteMethod = async (methodId: string) => {
        if (
            confirm(
                "¿Estás seguro de que quieres eliminar este método de pago?"
            )
        ) {
            setPaymentMethods((methods) =>
                methods.filter((method) => method.id !== methodId)
            );
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Cargando métodos de pago...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Métodos de Pago
                            </CardTitle>
                            <CardDescription>
                                Gestiona tus métodos de pago para las primas de
                                tus pólizas
                            </CardDescription>
                        </div>
                        {showAddButton && (
                            <Button onClick={handleAddMethod}>
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {paymentMethods.length === 0 ? (
                        <div className="text-center py-8">
                            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                No tienes métodos de pago
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Agrega un método de pago para poder contratar
                                pólizas
                            </p>
                            {showAddButton && (
                                <Button onClick={handleAddMethod}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Método de Pago
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paymentMethods.map((method) => (
                                <div
                                    key={method.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 text-primary">
                                            {getPaymentMethodIcon(method.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {method.name} ****{" "}
                                                    {method.last_four}
                                                </span>
                                                {method.is_primary && (
                                                    <Badge
                                                        variant="default"
                                                        className="text-xs"
                                                    >
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Principal
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>
                                                    {getMethodTypeName(
                                                        method.type
                                                    )}
                                                </span>
                                                {method.expiry_date && (
                                                    <span>
                                                        Vence:{" "}
                                                        {method.expiry_date}
                                                    </span>
                                                )}
                                                {method.brand && (
                                                    <span>{method.brand}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {allowEdit && (
                                        <div className="flex items-center gap-2">
                                            {!method.is_primary && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleSetPrimary(
                                                            method.id
                                                        )
                                                    }
                                                    title="Establecer como principal"
                                                >
                                                    <Star className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleEditMethod(method)
                                                }
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteMethod(
                                                        method.id
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-700"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Payment Method Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingMethod ? "Editar" : "Agregar"} Método de
                            Pago
                        </DialogTitle>
                        <DialogDescription>
                            {editingMethod
                                ? "Actualiza la información de tu método de pago"
                                : "Agrega un nuevo método de pago para tus pólizas"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo de Método</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: any) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        type: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit_card">
                                        Tarjeta de Crédito
                                    </SelectItem>
                                    <SelectItem value="debit_card">
                                        Tarjeta de Débito
                                    </SelectItem>
                                    <SelectItem value="bank_account">
                                        Cuenta Bancaria
                                    </SelectItem>
                                    <SelectItem value="digital_wallet">
                                        Billetera Digital
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Card Fields */}
                        {(formData.type === "credit_card" ||
                            formData.type === "debit_card") && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="cardholder_name">
                                        Nombre del Titular
                                    </Label>
                                    <Input
                                        id="cardholder_name"
                                        value={formData.cardholder_name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                cardholder_name: e.target.value,
                                            }))
                                        }
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="card_number">
                                        Número de Tarjeta
                                    </Label>
                                    <Input
                                        id="card_number"
                                        value={formData.card_number}
                                        onChange={(e) => {
                                            const value = e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 16);
                                            setFormData((prev) => ({
                                                ...prev,
                                                card_number: value,
                                            }));
                                        }}
                                        placeholder="1234 5678 9012 3456"
                                        maxLength={16}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry_date">
                                            Fecha de Vencimiento
                                        </Label>
                                        <Input
                                            id="expiry_date"
                                            value={formData.expiry_date}
                                            onChange={(e) => {
                                                let value =
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        ""
                                                    );
                                                if (value.length >= 2) {
                                                    value =
                                                        value.slice(0, 2) +
                                                        "/" +
                                                        value.slice(2, 4);
                                                }
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    expiry_date: value,
                                                }));
                                            }}
                                            placeholder="MM/AA"
                                            maxLength={5}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvv">CVV</Label>
                                        <Input
                                            id="cvv"
                                            type="password"
                                            value={formData.cvv}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 3);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    cvv: value,
                                                }));
                                            }}
                                            placeholder="123"
                                            maxLength={3}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Bank Account Fields */}
                        {formData.type === "bank_account" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">
                                        Nombre del Banco
                                    </Label>
                                    <Input
                                        id="bank_name"
                                        value={formData.bank_name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                bank_name: e.target.value,
                                            }))
                                        }
                                        placeholder="Banco Nacional"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account_number">
                                        Número de Cuenta
                                    </Label>
                                    <Input
                                        id="account_number"
                                        value={formData.account_number}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                account_number: e.target.value,
                                            }))
                                        }
                                        placeholder="1234567890"
                                    />
                                </div>
                            </>
                        )}

                        {/* Primary checkbox */}
                        <div className="flex items-center space-x-2">
                            <input
                                id="is_primary"
                                type="checkbox"
                                checked={formData.is_primary}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        is_primary: e.target.checked,
                                    }))
                                }
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="is_primary" className="text-sm">
                                Establecer como método principal
                            </Label>
                        </div>

                        {/* Security Notice */}
                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                Tu información está protegida con encriptación
                                SSL de grado bancario. No almacenamos números
                                completos de tarjetas.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmitMethod}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    {editingMethod ? "Actualizar" : "Agregar"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
