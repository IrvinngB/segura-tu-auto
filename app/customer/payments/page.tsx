"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    CreditCard,
    Calendar,
    DollarSign,
    CheckCircle,
    Clock,
    XCircle,
    AlertTriangle,
    Download,
    Plus,
    Settings,
    Eye,
    Banknote,
    Wallet,
    Receipt,
    CreditCardIcon,
    Building2,
    Smartphone,
    Shield,
    Calculator,
    Bell,
    FileText,
    ArrowUpRight,
    TrendingUp,
} from "lucide-react";
import {
    format,
    addMonths,
    isAfter,
    isBefore,
    differenceInDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";

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
    policy: {
        id: string;
        policy_number: string;
        premium_amount: number;
        payment_frequency: string;
        next_payment_date: string;
        status: string;
    } | null;
    // Campos adicionales de la base de datos
    policy_id?: string;
    customer_id?: string;
    claim_id?: string | null;
    transaction_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

interface PaymentMethod {
    id: string;
    type: "credit_card" | "debit_card" | "bank_account" | "digital_wallet";
    name: string;
    last_four: string;
    expiry_date?: string;
    is_primary: boolean;
    is_autopay: boolean;
}

interface Policy {
    id: string;
    policy_number: string;
    policy_type: string;
    premium_amount: number;
    payment_frequency: string;
    status: string;
    start_date: string;
    end_date: string;
    auto_renewal: boolean;
    vehicle: {
        id: string;
        make: string;
        model: string;
        year: number;
        license_plate: string;
    } | null;
}

interface UpcomingPayment {
    id: string;
    policy_number: string;
    amount: number;
    due_date: string;
    payment_type: string;
    status: "upcoming" | "overdue" | "grace_period";
}

export default function CustomerPaymentsPage() {
    const { userProfile } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
    const [autopayEnabled, setAutopayEnabled] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const supabase = createClient();

    // Datos simulados para demostración completa
    const simulatedPayments: Payment[] = [
        {
            id: "1",
            amount: 1250.0,
            payment_type: "Prima Mensual",
            payment_method: "Tarjeta Terminada en 4532",
            payment_status: "completed",
            payment_date: "2024-09-15",
            due_date: "2024-09-15",
            reference_number: "PAY-20240915-001",
            description: "Pago mensual póliza vehicular",
            policy: {
                id: "1",
                policy_number: "POL-2024-001",
                premium_amount: 15000,
                payment_frequency: "monthly",
                next_payment_date: "2024-10-15",
                status: "active",
            },
        },
        {
            id: "2",
            amount: 1250.0,
            payment_type: "Prima Mensual",
            payment_method: "Transferencia Bancaria",
            payment_status: "completed",
            payment_date: "2024-08-15",
            due_date: "2024-08-15",
            reference_number: "PAY-20240815-002",
            description: "Pago mensual póliza vehicular",
            policy: {
                id: "1",
                policy_number: "POL-2024-001",
                premium_amount: 15000,
                payment_frequency: "monthly",
                next_payment_date: "2024-10-15",
                status: "active",
            },
        },
        {
            id: "3",
            amount: 2100.0,
            payment_type: "Prima Mensual",
            payment_method: "Tarjeta Terminada en 8945",
            payment_status: "completed",
            payment_date: "2024-09-10",
            due_date: "2024-09-10",
            reference_number: "PAY-20240910-003",
            description: "Pago mensual póliza todo riesgo",
            fees: 50.0,
            policy: {
                id: "2",
                policy_number: "POL-2024-002",
                premium_amount: 25200,
                payment_frequency: "monthly",
                next_payment_date: "2024-10-10",
                status: "active",
            },
        },
    ];

    const simulatedUpcomingPayments: UpcomingPayment[] = [
        {
            id: "1",
            policy_number: "POL-2024-001",
            amount: 1250.0,
            due_date: "2024-10-15",
            payment_type: "Prima Mensual",
            status: "upcoming",
        },
        {
            id: "2",
            policy_number: "POL-2024-002",
            amount: 2100.0,
            due_date: "2024-10-10",
            payment_type: "Prima Mensual",
            status: "upcoming",
        },
    ];

    const simulatedPaymentMethods: PaymentMethod[] = [
        {
            id: "1",
            type: "credit_card",
            name: "Visa **** 4532",
            last_four: "4532",
            expiry_date: "12/27",
            is_primary: true,
            is_autopay: true,
        },
        {
            id: "2",
            type: "debit_card",
            name: "Mastercard **** 8945",
            last_four: "8945",
            expiry_date: "08/26",
            is_primary: false,
            is_autopay: false,
        },
        {
            id: "3",
            type: "bank_account",
            name: "Cuenta Bancolombia **** 1234",
            last_four: "1234",
            is_primary: false,
            is_autopay: false,
        },
    ];

    useEffect(() => {
        if (userProfile) {
            loadPaymentData();
        }
    }, [userProfile]);

    const loadPaymentData = async () => {
        try {
            setLoading(true);

            // Obtener el customer_id del usuario logueado
            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", userProfile?.id)
                .single();

            if (!customer) {
                setError("No se encontró información del cliente");
                return;
            }

            // Cargar pólizas del cliente con vehículos
            const { data: policiesData } = await supabase
                .from("policies")
                .select(
                    `
                    *,
                    vehicle:vehicles(*),
                    agent:users(first_name, last_name, email)
                `
                )
                .eq("customer_id", customer.id)
                .order("created_at", { ascending: false });

            // Cargar pagos reales del cliente con información de póliza
            const { data: paymentsData } = await supabase
                .from("payments")
                .select(
                    `
                    *,
                    policy:policies(
                        policy_number,
                        premium_amount,
                        status,
                        auto_renewal,
                        end_date,
                        vehicle:vehicles(make, model, year)
                    )
                `
                )
                .eq("customer_id", customer.id)
                .order("created_at", { ascending: false });

            // Procesar pagos reales
            if (paymentsData) {
                const processedPayments = paymentsData.map((payment) => ({
                    ...payment,
                    payment_date: payment.payment_date || payment.created_at,
                    description: `Pago ${
                        payment.payment_type === "premium"
                            ? "de prima"
                            : payment.payment_type
                    } - ${
                        payment.policy?.vehicle
                            ? `${payment.policy.vehicle.make} ${payment.policy.vehicle.model}`
                            : "Póliza"
                    }`,
                    policy: payment.policy
                        ? {
                              id: payment.policy_id || "",
                              policy_number: payment.policy.policy_number,
                              premium_amount: payment.policy.premium_amount,
                              payment_frequency: payment.policy.auto_renewal
                                  ? "monthly"
                                  : "manual",
                              next_payment_date: payment.policy.end_date,
                              status: payment.policy.status,
                          }
                        : null,
                }));
                setPayments(processedPayments);
            } else {
                setPayments([]);
            }

            // Calcular próximos pagos basados en pólizas activas
            if (policiesData) {
                const upcomingPaymentsData: UpcomingPayment[] = [];

                policiesData
                    .filter(
                        (policy) =>
                            policy.status === "active" && policy.auto_renewal
                    )
                    .forEach((policy) => {
                        // Calcular próximo pago basado en la fecha de fin de la póliza
                        const endDate = new Date(policy.end_date);
                        const today = new Date();

                        // Si la póliza vence pronto, generar pago próximo
                        const daysUntilExpiry = differenceInDays(
                            endDate,
                            today
                        );

                        // Si la póliza vence en menos de 30 días, el pago es próximo
                        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
                            // Calcular monto mensual (prima anual / 12)
                            const monthlyAmount = Math.round(
                                policy.premium_amount / 12
                            );

                            upcomingPaymentsData.push({
                                id: `upcoming_${policy.id}`,
                                policy_number: policy.policy_number,
                                amount: monthlyAmount,
                                due_date: endDate.toISOString().split("T")[0],
                                payment_type: "Prima Mensual",
                                status: getUpcomingPaymentStatus(
                                    endDate.toISOString().split("T")[0]
                                ),
                            });
                        }
                    });

                setUpcomingPayments(upcomingPaymentsData);
            } else {
                setUpcomingPayments([]);
            }

            // Por ahora usar métodos de pago simulados hasta implementar la tabla real
            setPaymentMethods(simulatedPaymentMethods);
            setAutopayEnabled(
                simulatedPaymentMethods.some((pm) => pm.is_autopay)
            );
        } catch (error) {
            console.error("Error cargando datos de pago:", error);
            setError("Error al cargar los datos de pago");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <span className="payment-badge payment-completed">
                        Pagado
                    </span>
                );
            case "pending":
                return (
                    <span className="payment-badge payment-pending">
                        Pendiente
                    </span>
                );
            case "failed":
                return (
                    <span className="payment-badge payment-failed">
                        Fallido
                    </span>
                );
            case "upcoming":
                return (
                    <span className="payment-badge payment-upcoming">
                        Próximo
                    </span>
                );
            case "overdue":
                return (
                    <span className="payment-badge payment-overdue">
                        Vencido
                    </span>
                );
            case "grace_period":
                return (
                    <span className="payment-badge payment-grace">
                        Periodo de Gracia
                    </span>
                );
            default:
                return (
                    <span className="payment-badge payment-upcoming">
                        {status}
                    </span>
                );
        }
    };

    const getPaymentMethodIcon = (type: string) => {
        switch (type) {
            case "credit_card":
                return <CreditCard className="h-4 w-4" />;
            case "debit_card":
                return <CreditCardIcon className="h-4 w-4" />;
            case "bank_account":
                return <Building2 className="h-4 w-4" />;
            case "digital_wallet":
                return <Smartphone className="h-4 w-4" />;
            default:
                return <DollarSign className="h-4 w-4" />;
        }
    };

    const getUpcomingPaymentStatus = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const daysUntilDue = differenceInDays(due, today);

        if (daysUntilDue < 0) {
            // Si ya pasó la fecha de vencimiento
            const daysPastDue = Math.abs(daysUntilDue);
            if (daysPastDue <= 30) {
                // Período de gracia: hasta 30 días después del vencimiento
                return "grace_period";
            } else {
                // Después de 30 días, está vencido
                return "overdue";
            }
        }
        return "upcoming";
    };

    const getTotalPaid = () => {
        return payments
            .filter((p) => p.payment_status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);
    };

    const getTotalUpcoming = () => {
        return upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    };

    const handlePayment = async (paymentId: string, paymentType: string, amount: number, policyId: string) => {
        try {
            setLoading(true);

            // Simular procesamiento de pago
            // En una implementación real, aquí se integraría con un procesador de pagos
            // como Stripe, PayPal, o un gateway bancario

            const { data: payment, error } = await supabase
                .from("payments")
                .insert({
                    policy_id: policyId,
                    customer_id: userProfile?.id,
                    payment_type: paymentType === "Prima Mensual" ? "premium" : "fee",
                    amount: amount,
                    payment_status: "completed",
                    payment_method: "Tarjeta de crédito",
                    payment_date: new Date().toISOString(),
                    reference_number: `PAY-${Date.now()}`,
                    transaction_id: `TXN-${Date.now()}`,
                })
                .select()
                .single();

            if (error) throw error;

            // Actualizar el estado local
            const newPayment: Payment = {
                id: payment.id,
                amount: payment.amount,
                payment_type: paymentType,
                payment_method: payment.payment_method,
                payment_status: payment.payment_status,
                payment_date: payment.payment_date,
                due_date: payment.due_date,
                reference_number: payment.reference_number,
                description: `Pago ${paymentType.toLowerCase()} procesado exitosamente`,
                policy: {
                    id: policyId,
                    policy_number: "POL-XXXX", // En una implementación real, obtener de la póliza
                    premium_amount: amount,
                    payment_frequency: "monthly",
                    next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: "active",
                },
            };

            setPayments(prev => [newPayment, ...prev]);

            toast({
                title: "Pago Exitoso",
                description: `El pago de $${amount.toLocaleString()} ha sido procesado correctamente.`,
                variant: "default",
            });

            // Recargar datos
            loadPaymentData();

        } catch (error) {
            console.error("Error procesando pago:", error);
            toast({
                title: "Error en el Pago",
                description: "No se pudo procesar el pago. Por favor, inténtalo de nuevo.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="container mx-auto py-8 px-4">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">
                                Cargando información de pagos...
                            </p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4 space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">Centro de Pagos</h1>
                        <p className="text-muted-foreground">
                            Gestiona tus pagos, métodos de pago y configura
                            autopago
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                        <Dialog
                            open={showAddPaymentMethod}
                            onOpenChange={setShowAddPaymentMethod}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Método
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Agregar Método de Pago
                                    </DialogTitle>
                                    <DialogDescription>
                                        Agrega una nueva tarjeta o cuenta
                                        bancaria para tus pagos
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Tipo de Método</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un tipo" />
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
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Número de Tarjeta</Label>
                                        <Input placeholder="**** **** **** 1234" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Vencimiento</Label>
                                            <Input placeholder="MM/YY" />
                                        </div>
                                        <div>
                                            <Label>CVV</Label>
                                            <Input placeholder="123" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Nombre del Titular</Label>
                                        <Input placeholder="Como aparece en la tarjeta" />
                                    </div>
                                    <Button className="w-full">
                                        Agregar Método de Pago
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-destructive">{error}</p>
                    </div>
                )}

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-6"
                >
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="policies">Mis Pólizas</TabsTrigger>
                        <TabsTrigger value="upcoming">
                            Próximos Pagos
                        </TabsTrigger>
                        <TabsTrigger value="history">Historial</TabsTrigger>
                        <TabsTrigger value="methods">
                            Métodos de Pago
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            Configuración
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Tarjetas de Resumen */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Pagado Este Año
                                    </CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        ${getTotalPaid().toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="text-green-600">
                                            +12%
                                        </span>{" "}
                                        vs año anterior
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Próximos Pagos
                                    </CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        ${getTotalUpcoming().toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Próximos 30 días
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Autopago
                                    </CardTitle>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {autopayEnabled ? "Activo" : "Inactivo"}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {autopayEnabled
                                            ? "Pagos automáticos activados"
                                            : "Configura autopago"}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Estado de Cuenta
                                    </CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        Al Día
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Todos los pagos al corriente
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Próximos Pagos Destacados */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Próximos Pagos Importantes
                                </CardTitle>
                                <CardDescription>
                                    Pagos que vencen en los próximos días
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {upcomingPayments
                                        .slice(0, 3)
                                        .map((payment) => {
                                            const status =
                                                getUpcomingPaymentStatus(
                                                    payment.due_date
                                                );
                                            const daysUntilDue =
                                                differenceInDays(
                                                    new Date(payment.due_date),
                                                    new Date()
                                                );

                                            return (
                                                <div
                                                    key={payment.id}
                                                    className="flex items-center justify-between p-4 border rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${
                                                                status ===
                                                                "overdue"
                                                                    ? "bg-red-500"
                                                                    : status ===
                                                                      "grace_period"
                                                                    ? "bg-orange-500"
                                                                    : "bg-blue-500"
                                                            }`}
                                                        />
                                                        <div>
                                                            <p className="font-medium">
                                                                {
                                                                    payment.policy_number
                                                                }
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {
                                                                    payment.payment_type
                                                                }{" "}
                                                                - Vence{" "}
                                                                {format(
                                                                    new Date(
                                                                        payment.due_date
                                                                    ),
                                                                    "dd 'de' MMMM",
                                                                    {
                                                                        locale: es,
                                                                    }
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-x-4">
                                                        <span className="font-bold">
                                                            $
                                                            {payment.amount.toLocaleString()}
                                                        </span>
                                                        {getStatusBadge(status)}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handlePayment(payment.id, payment.payment_type, payment.amount, payment.policy_number)}
                                                            disabled={loading}
                                                        >
                                                            Pagar Ahora
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gráfico de Pagos */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Tendencia de Pagos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <Calculator className="h-12 w-12 mx-auto mb-4" />
                                        <p>Gráfico de tendencia de pagos</p>
                                        <p className="text-sm">
                                            (Se implementaría con biblioteca de
                                            gráficos)
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="policies" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Mis Pólizas de Seguro
                                </CardTitle>
                                <CardDescription>
                                    Gestiona y paga las primas de tus pólizas activas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Pólizas Activas */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Pólizas Activas</h3>

                                        {/* Ejemplo de póliza - en implementación real vendría de la base de datos */}
                                        <div className="border rounded-lg p-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="h-5 w-5 text-green-600" />
                                                        <h4 className="font-semibold">Póliza Todo Riesgo</h4>
                                                        <Badge className="bg-green-100 text-green-800">Activa</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Número: POL-2024-001 • Vehículo: Toyota Camry 2022
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="font-medium">Prima Mensual:</span> $1,250.00
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Próximo Pago:</span> 15 Oct 2024
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Cobertura:</span> $50,000.00
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Deducible:</span> $500.00
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-2">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        $1,250.00
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePayment("pol1", "Prima Mensual", 1250, "POL-2024-001")}
                                                        disabled={loading}
                                                        className="w-full"
                                                    >
                                                        Pagar Prima
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t">
                                                <h5 className="font-medium mb-2">Coberturas Incluidas:</h5>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Responsabilidad Civil
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Daños Propios
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Robo Total
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Asistencia Vial
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Cobertura de Cristales
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Segunda póliza de ejemplo */}
                                        <div className="border rounded-lg p-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="h-5 w-5 text-blue-600" />
                                                        <h4 className="font-semibold">Póliza Básica</h4>
                                                        <Badge className="bg-blue-100 text-blue-800">Activa</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Número: POL-2024-002 • Vehículo: Honda Civic 2021
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="font-medium">Prima Mensual:</span> $850.00
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Próximo Pago:</span> 20 Oct 2024
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Cobertura:</span> $25,000.00
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Deducible:</span> $1,000.00
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-2">
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        $850.00
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handlePayment("pol2", "Prima Mensual", 850, "POL-2024-002")}
                                                        disabled={loading}
                                                        className="w-full"
                                                    >
                                                        Pagar Prima
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t">
                                                <h5 className="font-medium mb-2">Coberturas Incluidas:</h5>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Responsabilidad Civil
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Daños a Terceros
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resumen de Pólizas */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                                        <Card className="bg-green-50 border-green-200">
                                            <CardContent className="pt-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">2</div>
                                                    <p className="text-sm text-green-700">Pólizas Activas</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-blue-50 border-blue-200">
                                            <CardContent className="pt-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600">$2,100.00</div>
                                                    <p className="text-sm text-blue-700">Prima Mensual Total</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-purple-50 border-purple-200">
                                            <CardContent className="pt-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-purple-600">$75,000.00</div>
                                                    <p className="text-sm text-purple-700">Cobertura Total</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="upcoming" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Próximos Pagos</CardTitle>
                                <CardDescription>
                                    Pagos programados y vencimientos próximos
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {upcomingPayments.map((payment) => {
                                        const status = getUpcomingPaymentStatus(
                                            payment.due_date
                                        );
                                        const daysUntilDue = differenceInDays(
                                            new Date(payment.due_date),
                                            new Date()
                                        );

                                        return (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    {getStatusIcon(status)}
                                                    <div>
                                                        <p className="font-medium">
                                                            {
                                                                payment.policy_number
                                                            }
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                payment.payment_type
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Vence:{" "}
                                                            {format(
                                                                new Date(
                                                                    payment.due_date
                                                                ),
                                                                "dd 'de' MMMM yyyy",
                                                                { locale: es }
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">
                                                        $
                                                        {payment.amount.toLocaleString()}
                                                    </p>
                                                    {getStatusBadge(status)}
                                                    <div className="mt-2 space-x-2">
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handlePayment(payment.id, payment.payment_type, payment.amount, "policy_id_placeholder")}
                                                            disabled={loading}
                                                        >
                                                            Pagar Ahora
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            Ver Detalles
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Pagos</CardTitle>
                                <CardDescription>
                                    Todos tus pagos realizados
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Póliza</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {payment.payment_date
                                                            ? format(
                                                                  new Date(
                                                                      payment.payment_date
                                                                  ),
                                                                  "dd/MM/yyyy",
                                                                  { locale: es }
                                                              )
                                                            : "Pendiente"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {payment.policy
                                                            ?.policy_number ||
                                                            "N/A"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {payment.payment_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentMethodIcon(
                                                            "credit_card"
                                                        )}
                                                        <span className="text-sm">
                                                            {payment.payment_method ||
                                                                "No especificado"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        $
                                                        {payment.amount.toLocaleString()}
                                                    </div>
                                                    {payment.fees && (
                                                        <div className="text-xs text-muted-foreground">
                                                            +${payment.fees}{" "}
                                                            comisión
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(
                                                            payment.payment_status
                                                        )}
                                                        {getStatusBadge(
                                                            payment.payment_status
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="methods" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Métodos de Pago</CardTitle>
                                <CardDescription>
                                    Gestiona tus tarjetas y cuentas bancarias
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {paymentMethods.map((method) => (
                                        <div
                                            key={method.id}
                                            className="border rounded-lg p-4 space-y-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {getPaymentMethodIcon(
                                                        method.type
                                                    )}
                                                    <div>
                                                        <p className="font-medium">
                                                            {method.name}
                                                        </p>
                                                        {method.expiry_date && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Vence:{" "}
                                                                {
                                                                    method.expiry_date
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {method.is_primary && (
                                                        <Badge variant="default">
                                                            Principal
                                                        </Badge>
                                                    )}
                                                    {method.is_autopay && (
                                                        <Badge variant="secondary">
                                                            Autopago
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive"
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuración de Pagos</CardTitle>
                                <CardDescription>
                                    Personaliza tus preferencias de pago
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">
                                            Autopago
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Pagar automáticamente tus primas
                                            mensuales
                                        </p>
                                    </div>
                                    <Switch
                                        checked={autopayEnabled}
                                        onCheckedChange={setAutopayEnabled}
                                    />
                                </div>

                                {autopayEnabled && (
                                    <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                                        <div>
                                            <Label>
                                                Método de Pago Principal
                                            </Label>
                                            <Select
                                                value={selectedPaymentMethod}
                                                onValueChange={
                                                    setSelectedPaymentMethod
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona método de pago" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paymentMethods.map(
                                                        (method) => (
                                                            <SelectItem
                                                                key={method.id}
                                                                value={
                                                                    method.id
                                                                }
                                                            >
                                                                {method.name}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Días de Anticipación</Label>
                                            <Select defaultValue="5">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">
                                                        1 día antes
                                                    </SelectItem>
                                                    <SelectItem value="3">
                                                        3 días antes
                                                    </SelectItem>
                                                    <SelectItem value="5">
                                                        5 días antes
                                                    </SelectItem>
                                                    <SelectItem value="7">
                                                        7 días antes
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">
                                            Notificaciones de Pago
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Recibir recordatorios antes del
                                            vencimiento
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">
                                            Recibos por Email
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enviar comprobantes automáticamente
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <div className="pt-4">
                                    <Button>Guardar Configuración</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    );
}
