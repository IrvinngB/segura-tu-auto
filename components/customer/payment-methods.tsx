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
    AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";

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

type PaymentFormData = {
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
};

export function PaymentMethods({
    onMethodAdded,
    showAddButton = true,
    allowEdit = true,
}: PaymentMethodsProps) {
    const { customerData } = useCustomerDataSimple();
    const { toast } = useToast();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
        null
    );
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string>("");
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        methodId: string;
        methodName: string;
    }>({
        open: false,
        methodId: "",
        methodName: "",
    });
    const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
    const supabase = createClient();

    // Form data for new/edit payment method
    const [formData, setFormData] = useState<PaymentFormData>({
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
            // Obtener métodos de pago reales de Supabase
            const { data, error } = await supabase
                .from("payment_methods")
                .select("*")
                .eq("customer_id", customerData.id)
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching payment methods:", error);
                // Si hay error, mostrar array vacío en lugar de datos simulados
                setPaymentMethods([]);
                return;
            }

            setPaymentMethods(data || []);
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
        setFormError("");

        try {
            // Validate form based on payment method type
            if (
                formData.type === "credit_card" ||
                formData.type === "debit_card"
            ) {
                if (!formData.card_number) {
                    throw new Error("El número de tarjeta es requerido");
                }
                if (!validateCardNumber(formData.card_number)) {
                    throw new Error(
                        "El número de tarjeta no es válido (debe tener 13-19 dígitos)"
                    );
                }
                if (!formData.expiry_date) {
                    throw new Error("La fecha de expiración es requerida");
                }
                if (!validateExpiryDate(formData.expiry_date)) {
                    throw new Error(
                        "La fecha de expiración no es válida o ya expiró (formato: MM/YY)"
                    );
                }
                if (!formData.cvv) {
                    throw new Error("El CVV es requerido");
                }
                if (!validateCVV(formData.cvv)) {
                    throw new Error(
                        "El CVV no es válido (debe tener 3-4 dígitos)"
                    );
                }
                if (!formData.cardholder_name.trim()) {
                    throw new Error("El nombre del titular es requerido");
                }
            } else if (formData.type === "bank_account") {
                if (!formData.account_number) {
                    throw new Error("El número de cuenta es requerido");
                }
                if (!validateAccountNumber(formData.account_number)) {
                    throw new Error(
                        "El número de cuenta no es válido (debe tener 8-17 dígitos)"
                    );
                }
                if (!formData.routing_number) {
                    throw new Error("El número de ruta es requerido");
                }
                if (!validateRoutingNumber(formData.routing_number)) {
                    throw new Error(
                        "El número de ruta no es válido (debe tener 9 dígitos)"
                    );
                }
                if (!formData.bank_name.trim()) {
                    throw new Error("El nombre del banco es requerido");
                }
            } else if (formData.type === "digital_wallet") {
                if (!formData.wallet_email) {
                    throw new Error(
                        "El email de la billetera digital es requerido"
                    );
                }
                if (!validateEmail(formData.wallet_email)) {
                    throw new Error("El email no tiene un formato válido");
                }
            }

            // Preparar datos para Supabase
            const paymentMethodData = {
                customer_id: customerData.id,
                type: formData.type,
                name:
                    formData.cardholder_name ||
                    formData.bank_name ||
                    "Método de Pago",
                last_four:
                    formData.card_number.slice(-4) ||
                    formData.account_number.slice(-4) ||
                    "****",
                expiry_date: formData.expiry_date || null,
                brand:
                    formData.type === "credit_card" ||
                    formData.type === "debit_card"
                        ? "Visa"
                        : null,
                bank_name: formData.bank_name || null,
                is_primary: formData.is_primary,
                is_active: true,
            };

            let newMethod: PaymentMethod;

            if (editingMethod) {
                // Actualizar método existente
                const { data, error } = await supabase
                    .from("payment_methods")
                    .update(paymentMethodData)
                    .eq("id", editingMethod.id)
                    .select()
                    .single();

                if (error)
                    throw new Error(
                        "Error al actualizar el método de pago: " +
                            error.message
                    );

                newMethod = data;

                // Actualizar en el estado local
                setPaymentMethods((methods) =>
                    methods.map((method) =>
                        method.id === editingMethod.id ? newMethod : method
                    )
                );
            } else {
                // Crear nuevo método
                const { data, error } = await supabase
                    .from("payment_methods")
                    .insert(paymentMethodData)
                    .select()
                    .single();

                if (error)
                    throw new Error(
                        "Error al guardar el método de pago: " + error.message
                    );

                newMethod = data;

                // Agregar al estado local
                setPaymentMethods((methods) => [...methods, newMethod]);
                onMethodAdded?.(newMethod);
            }

            setShowAddModal(false);
        } catch (error) {
            console.error("Error saving payment method:", error);
            setFormError((error as Error).message);
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

    const handleDeleteMethod = (methodId: string, methodName: string) => {
        // Abrir el diálogo de confirmación
        setDeleteDialog({
            open: true,
            methodId,
            methodName,
        });
    };

    const confirmDeleteMethod = async () => {
        const { methodId, methodName } = deleteDialog;

        try {
            setDeletingMethodId(methodId);
            setFormError("");

            // Eliminar de la base de datos
            const { error } = await supabase
                .from("payment_methods")
                .delete()
                .eq("id", methodId);

            if (error) {
                console.error("Error deleting payment method:", error);
                setFormError("Error al eliminar el método de pago");
                return;
            }

            // Solo actualizar el estado local si la eliminación fue exitosa
            setPaymentMethods((methods) =>
                methods.filter((method) => method.id !== methodId)
            );

            // Cerrar el diálogo
            setDeleteDialog({
                open: false,
                methodId: "",
                methodName: "",
            });

            // Mostrar mensaje de éxito
            toast({
                title: "¡Método de pago eliminado!",
                description: `${methodName} ha sido eliminado exitosamente.`,
                variant: "default",
            });

            console.log("Payment method deleted successfully");
        } catch (error) {
            console.error("Error deleting payment method:", error);
            setFormError("Error inesperado al eliminar el método de pago");
        } finally {
            setDeletingMethodId(null);
        }
    };

    // Validation functions
    const validateExpiryDate = (expiry: string): boolean => {
        const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!regex.test(expiry)) return false;

        const [month, year] = expiry.split("/");
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        const expiryYear = parseInt(year);
        const expiryMonth = parseInt(month);

        if (expiryYear < currentYear) return false;
        if (expiryYear === currentYear && expiryMonth < currentMonth)
            return false;

        return true;
    };

    const validateCardNumber = (cardNumber: string): boolean => {
        const cleaned = cardNumber.replace(/\s+/g, "");
        return /^\d{13,19}$/.test(cleaned);
    };

    const validateCVV = (cvv: string): boolean => {
        return /^\d{3,4}$/.test(cvv);
    };

    const validateAccountNumber = (accountNumber: string): boolean => {
        return /^\d{8,17}$/.test(accountNumber);
    };

    const validateRoutingNumber = (routingNumber: string): boolean => {
        return /^\d{9}$/.test(routingNumber);
    };

    const validateEmail = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    // Helper function to update form data and clear errors
    const updateFormData = (updates: Partial<PaymentFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        if (formError) {
            setFormError("");
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
                                                        method.id,
                                                        `${method.name} ****${method.last_four}`
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-700"
                                                title="Eliminar"
                                                disabled={
                                                    deletingMethodId === method.id
                                                }
                                            >
                                                {deletingMethodId === method.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
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

                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            <p className="text-sm">{formError}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo de Método</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: any) =>
                                    updateFormData({ type: value })
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
                                            updateFormData({
                                                cardholder_name: e.target.value,
                                            })
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
                                            updateFormData({
                                                card_number: value,
                                            });
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

            {/* Diálogo de confirmación para eliminar método de pago */}
            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog((prev) => ({ ...prev, open }))
                }
                title="Eliminar Método de Pago"
                description={
                    <div className="space-y-2">
                        <p>
                            ¿Estás seguro de que deseas eliminar el método de pago{" "}
                            <span className="font-semibold">
                                {deleteDialog.methodName}
                            </span>
                            ?
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Esta acción no se puede deshacer y se eliminará
                            permanentemente de tu cuenta.
                        </p>
                    </div>
                }
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                onConfirm={confirmDeleteMethod}
                variant="destructive"
                icon={<AlertTriangle className="h-5 w-5" />}
            />
        </>
    );
}
