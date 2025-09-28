"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createBrowserClient } from "@supabase/ssr";
import type { Customer } from "@/lib/types/database";
import {
    ArrowLeft,
    Eye,
    Edit,
    Phone,
    Mail,
    MapPin,
    Calendar,
    TrendingUp,
    FileText,
    Shield,
    User,
    Users,
    AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ClientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [policies, setPolicies] = useState<any[]>([]);
    const [claims, setClaims] = useState<any[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (params.id) {
            fetchCustomerDetails();
        }
    }, [params.id]);

    const fetchCustomerDetails = async () => {
        try {
            const { data: customerData, error: customerError } = await supabase
                .from("customers")
                .select(`
                    *,
                    user:users(*)
                `)
                .eq("id", params.id)
                .single();

            if (customerError) throw customerError;
            if (customerData) {
                setCustomer(customerData);

                // Fetch policies
                const { data: policiesData } = await supabase
                    .from("policies")
                    .select("*")
                    .eq("customer_id", customerData.id)
                    .order("created_at", { ascending: false });

                if (policiesData) {
                    setPolicies(policiesData);
                }

                // Fetch claims
                const { data: claimsData } = await supabase
                    .from("claims")
                    .select("*")
                    .eq("customer_id", customerData.id)
                    .order("created_at", { ascending: false });

                if (claimsData) {
                    setClaims(claimsData);
                }
            }
        } catch (error) {
            console.error("Error fetching customer details:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskBadge = (riskScore: number) => {
        if (riskScore <= 30) {
            return (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Bajo
                </Badge>
            );
        } else if (riskScore <= 70) {
            return (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Medio
                </Badge>
            );
        } else {
            return <Badge variant="destructive">Alto</Badge>;
        }
    };

    const getAgeFromBirthDate = (birthDate: string | null) => {
        if (!birthDate) return "N/A";
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
            return age - 1;
        }
        return age;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex min-h-screen bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Cliente no encontrado</h2>
                        <Button onClick={() => router.push("/clients")}>
                            Volver a la lista
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <div className="flex-1">
                <div className="max-w-7xl mx-auto p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/clients")}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    Detalles del Cliente
                                </h1>
                                <p className="text-muted-foreground">
                                    Información completa del cliente y sus pólizas
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Información del Cliente */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Información Personal */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Información Personal
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Nombre Completo
                                            </label>
                                            <p className="text-lg font-semibold">
                                                {customer.user?.first_name} {customer.user?.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Correo Electrónico
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <p>{customer.user?.email}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Teléfono
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <p>{customer.user?.phone || "No especificado"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Edad
                                            </label>
                                            <p>{getAgeFromBirthDate(customer.date_of_birth)} años</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                País
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <p>{customer.country || "Panamá"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Fecha de Registro
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <p>
                                                    {format(
                                                        new Date(customer.created_at),
                                                        "dd/MM/yyyy",
                                                        { locale: es }
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Información de Riesgo */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Evaluación de Riesgo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Nivel de Riesgo Actual
                                            </p>
                                            <div className="flex items-center gap-3">
                                                {getRiskBadge(customer.risk_score || 0)}
                                                <span className="text-2xl font-bold">
                                                    {customer.risk_score || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pólizas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Pólizas ({policies.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {policies.length === 0 ? (
                                        <p className="text-muted-foreground">
                                            Este cliente no tiene pólizas activas.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {policies.map((policy) => (
                                                <div
                                                    key={policy.id}
                                                    className="p-4 border rounded-lg"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium">
                                                                Póliza #{policy.policy_number}
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {policy.plan_type} - {policy.vehicle_make} {policy.vehicle_model}
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline">
                                                            {policy.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        Vigencia: {format(
                                                            new Date(policy.start_date),
                                                            "dd/MM/yyyy",
                                                            { locale: es }
                                                        )} - {format(
                                                            new Date(policy.end_date),
                                                            "dd/MM/yyyy",
                                                            { locale: es }
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Reclamos */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Reclamos ({claims.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {claims.length === 0 ? (
                                        <p className="text-muted-foreground">
                                            Este cliente no tiene reclamos registrados.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {claims.map((claim) => (
                                                <div
                                                    key={claim.id}
                                                    className="p-4 border rounded-lg"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium">
                                                                Reclamo #{claim.claim_number}
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {claim.description}
                                                            </p>
                                                        </div>
                                                        <Badge variant={claim.status === "approved" ? "default" : "secondary"}>
                                                            {claim.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        Fecha: {format(
                                                            new Date(claim.created_at),
                                                            "dd/MM/yyyy",
                                                            { locale: es }
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Panel Lateral */}
                        <div className="space-y-6">
                            {/* Acciones Rápidas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Acciones Rápidas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        className="w-full"
                                        onClick={() => router.push(`/clients/${customer.id}/edit`)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar Cliente
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.push("/policies/new")}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Nueva Póliza
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Estadísticas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Estadísticas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Pólizas Activas
                                        </span>
                                        <span className="font-semibold">{policies.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Reclamos Totales
                                        </span>
                                        <span className="font-semibold">{claims.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Score de Riesgo
                                        </span>
                                        <span className="font-semibold">
                                            {customer.risk_score || 0}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
