"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, User, CreditCard, Calendar, DollarSign } from "lucide-react";

interface Payment {
    id: string;
    amount: number;
    payment_type: string;
    payment_method: string | null;
    payment_status: string;
    payment_date: string | null;
    due_date: string | null;
    reference_number: string | null;
    description: string;
    fees?: number;
    discount?: number;
    transaction_id?: string | null;
    created_at: string;
    policy?: {
        policy_number: string;
        status: string;
    };
    customer?: {
        user: {
            first_name: string;
            last_name: string;
            email: string;
        };
    };
}

interface PaymentDetailsModalProps {
    payment: Payment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PaymentDetailsModal({ payment, open, onOpenChange }: PaymentDetailsModalProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-green-600">Pagado</Badge>;
            case "pending":
                return <Badge className="bg-yellow-600">Pendiente</Badge>;
            case "failed":
                return <Badge variant="destructive">Fallido</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            premium: "Prima de Seguro",
            claim: "Pago de Reclamación",
            refund: "Reembolso",
            fee: "Comisión",
        };
        return types[type] || type;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Detalles del Pago
                    </DialogTitle>
                    <DialogDescription>
                        Información completa de la transacción
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Estado:</span>
                        {getStatusBadge(payment.payment_status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Referencia</span>
                            <p className="font-medium">{payment.reference_number || "Sin referencia"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">ID Transacción</span>
                            <p className="font-medium text-xs">{payment.transaction_id || "N/A"}</p>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Información del Pago
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground">Tipo de Pago</span>
                                <p className="font-medium">{getPaymentTypeLabel(payment.payment_type)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Método de Pago</span>
                                <p className="font-medium">{payment.payment_method || "No especificado"}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Monto</span>
                                <p className="text-lg font-bold text-primary">
                                    ${payment.amount.toLocaleString()}
                                </p>
                            </div>
                            {payment.fees && payment.fees > 0 && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Comisiones</span>
                                    <p className="font-medium text-red-600">
                                        ${payment.fees.toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {payment.discount && payment.discount > 0 && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Descuento</span>
                                    <p className="font-medium text-green-600">
                                        -${payment.discount.toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {payment.customer && (
                        <div className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Información del Cliente
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Nombre</span>
                                    <p className="font-medium">
                                        {payment.customer.user.first_name} {payment.customer.user.last_name}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Email</span>
                                    <p className="font-medium">{payment.customer.user.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {payment.policy && (
                        <div className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Información de la Póliza
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Número de Póliza</span>
                                    <p className="font-medium">{payment.policy.policy_number}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Estado de Póliza</span>
                                    <p className="font-medium capitalize">{payment.policy.status}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Fechas
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground">Fecha de Creación</span>
                                <p className="font-medium">
                                    {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                </p>
                            </div>
                            {payment.payment_date && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Fecha de Pago</span>
                                    <p className="font-medium">
                                        {format(new Date(payment.payment_date), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </p>
                                </div>
                            )}
                            {payment.due_date && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Fecha de Vencimiento</span>
                                    <p className="font-medium">
                                        {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: es })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {payment.description && (
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Descripción</span>
                            <p className="mt-1 text-sm">{payment.description}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
