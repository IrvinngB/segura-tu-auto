"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/client";
import {
    simpleUpdateExpiredPolicies,
    debugPolicyStatuses,
} from "@/lib/simple-update-policies";
import {
    forceUpdateExpiredPolicies,
    checkPolicyStatuses,
} from "@/lib/force-update-policies";
import type { Policy, Claim, Payment } from "@/lib/types/database";
import {
    Shield,
    FileText,
    DollarSign,
    Car,
    Plus,
    Eye,
    Calendar,
    AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export default function CustomerDashboard() {
    const { userProfile } = useAuth();
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (userProfile) {
            fetchCustomerData();
        }
    }, [userProfile]);

    const fetchCustomerData = async () => {
        try {
            // First, show current status for debugging
            console.log("🔍 DEBUG: Verificando estado actual...");
            await debugPolicyStatuses();

            // Then update expired policies
            console.log("🔄 Actualizando pólizas vencidas...");
            const updateResult = await simpleUpdateExpiredPolicies();
            console.log("📊 Resultado de actualización:", updateResult);

            // Get customer ID
            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", userProfile?.id)
                .single();

            if (!customer) return;

            // Fetch policies
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

            if (policiesData) setPolicies(policiesData);

            // Fetch recent claims
            const { data: claimsData } = await supabase
                .from("claims")
                .select(
                    `
          *,
          policy:policies(policy_number, vehicle:vehicles(*))
        `
                )
                .eq("customer_id", customer.id)
                .order("created_at", { ascending: false })
                .limit(5);

            if (claimsData) setClaims(claimsData);

            // Fetch recent payments
            const { data: paymentsData } = await supabase
                .from("payments")
                .select("*")
                .eq("customer_id", customer.id)
                .order("created_at", { ascending: false })
                .limit(5);

            if (paymentsData) setPayments(paymentsData);
        } catch (error) {
            console.error("Error fetching customer data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (
        status: string,
        type: "policy" | "claim" | "payment"
    ) => {
        if (type === "policy") {
            const config = {
                active: { label: "Activa", variant: "default" as const },
                expired: { label: "Vencida", variant: "destructive" as const },
                cancelled: {
                    label: "Cancelada",
                    variant: "secondary" as const,
                },
                suspended: { label: "Suspendida", variant: "outline" as const },
            };
            const statusConfig = config[status as keyof typeof config] || {
                label: status,
                variant: "outline" as const,
            };
            return (
                <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                </Badge>
            );
        }

        if (type === "claim") {
            const config = {
                submitted: { label: "Enviada", variant: "outline" as const },
                under_review: {
                    label: "En Revisión",
                    variant: "secondary" as const,
                },
                investigating: {
                    label: "Investigando",
                    variant: "default" as const,
                },
                approved: { label: "Aprobada", variant: "default" as const },
                denied: { label: "Denegada", variant: "destructive" as const },
                paid: { label: "Pagada", variant: "default" as const },
            };
            const statusConfig = config[status as keyof typeof config] || {
                label: status,
                variant: "outline" as const,
            };
            return (
                <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                </Badge>
            );
        }

        if (type === "payment") {
            const config = {
                pending: { label: "Pendiente", variant: "outline" as const },
                completed: { label: "Completado", variant: "default" as const },
                failed: { label: "Fallido", variant: "destructive" as const },
                cancelled: {
                    label: "Cancelado",
                    variant: "secondary" as const,
                },
            };
            const statusConfig = config[status as keyof typeof config] || {
                label: status,
                variant: "outline" as const,
            };
            return (
                <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                </Badge>
            );
        }

        return <Badge>{status}</Badge>;
    };

    const isExpiringSoon = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil(
            (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        // Mostrar "vence pronto" si vence en 30 días o menos, O si ya venció (daysUntilExpiry <= 0)
        return daysUntilExpiry <= 30;
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="container mx-auto py-8 px-4">
                    <div className="text-center">Cargando...</div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Bienvenido, {userProfile?.first_name}{" "}
                            {userProfile?.last_name}
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tus pólizas y reclamaciones de seguro
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={async () => {
                                console.log("� Verificando estado actual...");
                                await debugPolicyStatuses();
                                console.log(
                                    "🔄 Actualizando pólizas vencidas..."
                                );
                                const result =
                                    await simpleUpdateExpiredPolicies();
                                console.log("📊 Resultado:", result);
                                alert(
                                    `Resultado: ${
                                        result.message || result.error
                                    }`
                                );
                                // Recargar datos después de actualizar
                                fetchCustomerData();
                            }}
                            variant="outline"
                            size="sm"
                            className="border-2 border-border/70 hover:border-border dark:border-border/60 dark:hover:border-border/90 bg-background/50 dark:bg-background/30"
                        >
                            🔄 Actualizar Pólizas Vencidas
                        </Button>
                        <LogoutButton className="border-2 border-border/70 hover:border-border dark:border-border/60 dark:hover:border-border/90" />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="border hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Pólizas Activas
                                    </p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {
                                            policies.filter(
                                                (p) => p.status === "active"
                                            ).length
                                        }
                                    </p>
                                </div>
                                <Shield className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Reclamaciones
                                    </p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {claims.length}
                                    </p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Pagos Pendientes
                                    </p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {
                                            payments.filter(
                                                (p) =>
                                                    p.payment_status ===
                                                    "pending"
                                            ).length
                                        }
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Vehículos
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                        {policies.length}
                                    </p>
                                </div>
                                <Car className="h-8 w-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Policies Section */}
                    <Card className="border hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Mis Pólizas
                                    </CardTitle>
                                    <CardDescription>
                                        Estado actual de tus pólizas de seguro
                                    </CardDescription>
                                </div>
                                <Button asChild size="sm">
                                    <Link href="/customer/policies">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Ver todas
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {policies.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No tienes pólizas registradas</p>
                                        <Button asChild className="mt-4">
                                            <Link href="/customer/quote">
                                                Solicitar Cotización
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    policies.slice(0, 3).map((policy) => (
                                        <div
                                            key={policy.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">
                                                        {policy.policy_number}
                                                    </span>
                                                    {getStatusBadge(
                                                        policy.status,
                                                        "policy"
                                                    )}
                                                    {isExpiringSoon(
                                                        policy.end_date
                                                    ) && policy.status !== "expired" && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Vence pronto
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {policy.vehicle?.year}{" "}
                                                    {policy.vehicle?.make}{" "}
                                                    {policy.vehicle?.model}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Vence:{" "}
                                                        {format(
                                                            new Date(
                                                                policy.end_date
                                                            ),
                                                            "dd/MM/yyyy",
                                                            { locale: es }
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="h-3 w-3" />
                                                        $
                                                        {policy.premium_amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/customer/policies/${policy.id}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Claims Section */}
                    <Card className="border hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Mis Reclamaciones
                                    </CardTitle>
                                    <CardDescription>
                                        Estado de tus reclamaciones recientes
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="border-2 border-border/70 hover:border-border dark:border-border/60 dark:hover:border-border/90"
                                    >
                                        <Link href="/customer/claims">
                                            Ver todas
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link href="/customer/claims/new">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Nueva
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {claims.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>
                                            No tienes reclamaciones registradas
                                        </p>
                                    </div>
                                ) : (
                                    claims.map((claim) => (
                                        <div
                                            key={claim.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">
                                                        {claim.claim_number}
                                                    </span>
                                                    {getStatusBadge(
                                                        claim.status,
                                                        "claim"
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {
                                                        claim.policy
                                                            ?.policy_number
                                                    }{" "}
                                                    - {claim.claim_type}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(
                                                            new Date(
                                                                claim.incident_date
                                                            ),
                                                            "dd/MM/yyyy",
                                                            { locale: es }
                                                        )}
                                                    </span>
                                                    {claim.estimated_damage_cost && (
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="h-3 w-3" />
                                                            $
                                                            {claim.estimated_damage_cost.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/customer/claims/${claim.id}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Payments */}
                {payments.length > 0 && (
                    <Card className="mt-8 border hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Pagos Recientes
                            </CardTitle>
                            <CardDescription>
                                Historial de tus últimos pagos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:border-border/80 dark:hover:border-gray-500 transition-colors duration-200"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">
                                                    $
                                                    {payment.amount.toLocaleString()}
                                                </span>
                                                {getStatusBadge(
                                                    payment.payment_status,
                                                    "payment"
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {payment.payment_type ===
                                                "premium"
                                                    ? "Prima de seguro"
                                                    : "Pago de reclamación"}
                                            </p>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {payment.payment_date
                                                    ? format(
                                                          new Date(
                                                              payment.payment_date
                                                          ),
                                                          "dd/MM/yyyy",
                                                          { locale: es }
                                                      )
                                                    : "Fecha pendiente"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    );
}
