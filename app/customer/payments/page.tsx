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
import { CustomerPaymentModal } from "@/components/customer/customer-payment-modal";
import { PaymentMethods } from "@/components/customer/payment-methods";

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
    total_coverage_limit?: number;
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
    const [autopayEnabled, setAutopayEnabled] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingPayment, setPendingPayment] = useState<{
        amount: number;
        policyNumber: string;
        policyId: string;
        paymentType: string;
    } | null>(null);
    const [customerId, setCustomerId] = useState<string>("");
    const supabase = createClient();

    // Función auxiliar para obtener la frecuencia de pago de una póliza
    const getPaymentFrequencyFromPolicy = (policy: any) => {
        return policy.payment_frequency || (policy.auto_renewal ? "monthly" : "annual");
    };

    // Función auxiliar para calcular la próxima fecha de pago
    const calculateNextPaymentDate = (policy: any) => {
        if (!policy.end_date) return "";
        
        const endDate = new Date(policy.end_date);
        const today = new Date();
        
        // Si la póliza se renueva automáticamente
        if (policy.auto_renewal) {
            // Calcular la próxima fecha basada en la frecuencia
            const frequency = getPaymentFrequencyFromPolicy(policy);
            switch (frequency) {
                case "monthly":
                    return addMonths(today, 1).toISOString().split("T")[0];
                case "quarterly":
                    return addMonths(today, 3).toISOString().split("T")[0];
                case "biannual":
                    return addMonths(today, 6).toISOString().split("T")[0];
                case "annual":
                default:
                    return addMonths(today, 12).toISOString().split("T")[0];
            }
        }
        
        return policy.end_date;
    };

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

            setCustomerId(customer.id);

            // Cargar pólizas del cliente con vehículos
            const { data: policiesData, error: policiesError } = await supabase
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

            console.log("📋 Policies loaded:", policiesData);
            console.log("❌ Policies error:", policiesError);

            if (policiesData) {
                setPolicies(policiesData);
            } else {
                setPolicies([]);
            }

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
            if (paymentsData && paymentsData.length > 0) {
                // Obtener métodos de pago para mostrar nombres legibles
                const { data: paymentMethodsForNames } = await supabase
                    .from("payment_methods")
                    .select("id, name, last_four")
                    .eq("customer_id", customer.id);

                const paymentMethodsMap = new Map(
                    (paymentMethodsForNames || []).map(pm => [pm.id, pm.name])
                );

                const processedPayments = paymentsData.map((payment) => ({
                    ...payment,
                    payment_date: payment.payment_date || payment.created_at,
                    payment_method: payment.payment_method || 
                        (paymentMethodsMap.get(payment.transaction_id || '') || 'Método no especificado'),
                    description: `Pago ${
                        payment.payment_type === "premium"
                            ? "de prima"
                            : payment.payment_type === "claim"
                            ? "de reclamación"
                            : payment.payment_type
                    }${
                        payment.policy?.vehicle
                            ? ` - ${payment.policy.vehicle.make} ${payment.policy.vehicle.model}`
                            : payment.policy
                            ? ` - Póliza ${payment.policy.policy_number}`
                            : ""
                    }`,
                    policy: payment.policy
                        ? {
                              id: payment.policy_id || "",
                              policy_number: payment.policy.policy_number,
                              premium_amount: payment.policy.premium_amount,
                              payment_frequency: getPaymentFrequencyFromPolicy(payment.policy),
                              next_payment_date: calculateNextPaymentDate(payment.policy),
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

            // Cargar métodos de pago reales de la base de datos
            const { data: paymentMethodsData } = await supabase
                .from("payment_methods")
                .select("*")
                .eq("customer_id", customer.id)
                .eq("is_active", true)
                .order("is_primary", { ascending: false })
                .order("created_at", { ascending: false });

            if (paymentMethodsData) {
                const formattedPaymentMethods: PaymentMethod[] = paymentMethodsData.map(method => ({
                    id: method.id,
                    type: method.type,
                    name: method.name,
                    last_four: method.last_four,
                    expiry_date: method.expiry_date,
                    is_primary: method.is_primary,
                    is_autopay: method.is_primary, // Por ahora usamos is_primary como autopay
                }));

                setPaymentMethods(formattedPaymentMethods);
                setAutopayEnabled(
                    formattedPaymentMethods.some((pm) => pm.is_autopay)
                );
            } else {
                setPaymentMethods([]);
                setAutopayEnabled(false);
            }
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

    const handlePayment = (paymentId: string, paymentType: string, amount: number, policyNumber: string) => {
        // Abrir modal de pago con los datos
        setPendingPayment({
            amount,
            policyNumber,
            policyId: paymentId, // En este caso usamos paymentId como policyId temporal
            paymentType,
        });
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setPendingPayment(null);
        // Recargar datos de pagos
        loadPaymentData();
    };

    const handlePaymentError = (error: string) => {
        console.error("Error en pago:", error);
        toast({
            title: "Error en el Pago",
            description: error,
            variant: "destructive",
        });
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

                                        {/* Debug info */}


                                        {/* Pólizas reales del cliente */}
                                        {policies.length > 0 ? (
                                            <>
                                                {/* Mostrar pólizas pendientes de pago */}
                                                {policies
                                                    .filter(policy => policy.status === 'draft')
                                                    .map((policy) => {
                                                        const monthlyAmount = Math.round(policy.premium_amount / 12);
                                                        const nextPaymentDate = calculateNextPaymentDate(policy);
                                                        
                                                        return (
                                                            <div key={policy.id} className="border rounded-lg p-6 space-y-4">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <Shield className="h-5 w-5 text-green-600" />
                                                                            <h4 className="font-semibold">
                                                                                Póliza {policy.policy_type === 'basica' ? 'Básica' : 
                                                                                       policy.policy_type === 'limitada' ? 'Limitada' : 
                                                                                       'Todo Riesgo'}
                                                                            </h4>
                                                                            <Badge className={
                                                                                policy.status === 'draft' 
                                                                                    ? "bg-yellow-100 text-yellow-800" 
                                                                                    : policy.status === 'active'
                                                                                    ? "bg-green-100 text-green-800"
                                                                                    : "bg-gray-100 text-gray-800"
                                                                            }>
                                                                                {policy.status === 'draft' ? 'Pendiente de Pago' : 
                                                                                 policy.status === 'active' ? 'Activa' : 
                                                                                 'Inactiva'}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Número: {policy.policy_number}
                                                                            {policy.vehicle && ` • Vehículo: ${policy.vehicle.make} ${policy.vehicle.model} ${policy.vehicle.year}`}
                                                                        </p>
                                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                                            <div>
                                                                                <span className="font-medium">Prima Mensual:</span> ${monthlyAmount.toLocaleString()}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium">Próximo Pago:</span> {
                                                                                    nextPaymentDate ? format(new Date(nextPaymentDate), "d MMM yyyy", { locale: es }) : 'N/A'
                                                                                }
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium">Prima Anual:</span> ${policy.premium_amount.toLocaleString()}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium">Cobertura Total:</span> ${policy.total_coverage_limit?.toLocaleString() || 'N/A'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right space-y-2">
                                                                        <div className="text-2xl font-bold text-green-600">
                                                                            ${monthlyAmount.toLocaleString()}
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handlePayment(
                                                                                policy.id, 
                                                                                "Prima Mensual", 
                                                                                monthlyAmount, 
                                                                                policy.policy_number
                                                                            )}
                                                                            disabled={loading}
                                                                            className="w-full"
                                                                        >
                                                                            Pagar Prima
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                }


                                            
                                                {/* Mostrar pólizas activas */}
                                                {policies.filter(p => p.status === 'active').length > 0 && (
                                                    <div className="mt-6">
                                                        <h3 className="text-lg font-semibold mb-4 text-green-600 flex items-center gap-2">
                                                            <Shield className="h-5 w-5" />
                                                            Pólizas Activas
                                                        </h3>
                                                        {policies.filter(p => p.status === 'active').map((policy) => {
                                                            const monthlyAmount = Math.round(policy.premium_amount / 12);
                                                            
                                                            return (
                                                                <div key={policy.id} className="border border-green-200 rounded-lg p-4 mb-3 bg-green-50">
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="font-semibold">
                                                                                    Póliza {policy.policy_type === 'basica' ? 'Básica' : 
                                                                                           policy.policy_type === 'limitada' ? 'Limitada' : 
                                                                                           'Todo Riesgo'}
                                                                                </h4>
                                                                                <Badge className="bg-green-100 text-green-800">
                                                                                    Activa
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                {policy.policy_number}
                                                                                {policy.vehicle && ` • ${policy.vehicle.make} ${policy.vehicle.model}`}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm text-muted-foreground">Prima Mensual</p>
                                                                            <p className="text-lg font-semibold text-green-600">
                                                                                ${monthlyAmount.toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg font-medium mb-2">No tienes pólizas activas</p>
                                                <p className="text-sm">Contacta a tu agente para crear una nueva póliza</p>
                                            </div>
                                        )}
                                        {/* Fin de sección de pólizas reales */}
                                    </div>

                                    {/* Resumen de Pólizas */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                                        <Card className="bg-green-50 border-green-200">
                                            <CardContent className="pt-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {policies.filter(p => p.status === 'active').length}
                                                    </div>
                                                    <p className="text-sm text-green-700">Pólizas Activas</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-blue-50 border-blue-200">
                                            <CardContent className="pt-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        ${policies
                                                            .filter(p => p.status === 'active')
                                                            .reduce((sum, p) => sum + Math.round(p.premium_amount / 12), 0)
                                                            .toLocaleString()}
                                                    </div>
                                                    <p className="text-sm text-blue-700">Prima Mensual Total</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-purple-50 border-purple-200">
                                            <CardContent className="pt-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        ${policies
                                                            .filter(p => p.status === 'active')
                                                            .reduce((sum, p) => sum + (p.total_coverage_limit || 0), 0)
                                                            .toLocaleString()}
                                                    </div>
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
                        <PaymentMethods />
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

            {/* Modal de Pago */}
            {pendingPayment && (
                <CustomerPaymentModal
                    open={showPaymentModal}
                    onOpenChange={setShowPaymentModal}
                    amount={pendingPayment.amount}
                    policyNumber={pendingPayment.policyNumber}
                    policyId={pendingPayment.policyId}
                    paymentType={pendingPayment.paymentType}
                    customerId={customerId}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                />
            )}
        </ProtectedRoute>
    );
}
