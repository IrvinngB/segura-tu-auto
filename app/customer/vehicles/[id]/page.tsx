"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Car,
    Calendar,
    DollarSign,
    Gauge,
    Shield,
    Settings,
    MapPin,
    Fuel,
    Edit,
    Palette,
    Hash,
    CreditCard,
} from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types/database";

export default function VehicleDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const vehicleId = params.id as string;

    const {
        customerData,
        loading: customerLoading,
        error: customerError,
    } = useCustomerDataSimple();

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const supabase = createClient();

    useEffect(() => {
        if (customerData && !customerLoading && vehicleId) {
            fetchVehicle();
        }
    }, [customerData, customerLoading, vehicleId]);

    const fetchVehicle = async () => {
        if (!customerData || !vehicleId) return;

        try {
            setLoading(true);
            setError("");

            // Verificar que el vehículo pertenece al cliente actual
            const { data: vehicleData, error: vehicleError } = await supabase
                .from("vehicles")
                .select("*")
                .eq("id", vehicleId)
                .eq("customer_id", customerData.id)
                .single();

            if (vehicleError) {
                console.error("Error obteniendo vehículo:", vehicleError);
                if (vehicleError.code === "PGRST116") {
                    setError(
                        "Vehículo no encontrado o no tienes permisos para verlo"
                    );
                } else {
                    setError(
                        `Error al cargar el vehículo: ${vehicleError.message}`
                    );
                }
                return;
            }

            setVehicle(vehicleData);
        } catch (error) {
            console.error("Error inesperado:", error);
            setError("Error inesperado al cargar el vehículo");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (!amount) return "No especificado";
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "COP",
        }).format(amount);
    };

    const formatNumber = (number: number | null | undefined) => {
        if (!number) return "No especificado";
        return new Intl.NumberFormat("es-ES").format(number);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (customerLoading || loading) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="container mx-auto py-8 px-4">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">
                                {customerLoading
                                    ? "Cargando perfil..."
                                    : "Cargando vehículo..."}
                            </p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (customerError) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="container mx-auto py-8 px-4">
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-destructive">{customerError}</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="container mx-auto py-8 px-4">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/customer/vehicles">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">
                                Detalles del Vehículo
                            </h1>
                            <p className="text-muted-foreground">
                                Información completa del vehículo
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-destructive">{error}</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (!vehicle) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="container mx-auto py-8 px-4">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/customer/vehicles">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">
                                Detalles del Vehículo
                            </h1>
                            <p className="text-muted-foreground">
                                Información completa del vehículo
                            </p>
                        </div>
                    </div>

                    <div className="text-center py-12">
                        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            Vehículo no encontrado
                        </h3>
                        <p className="text-muted-foreground">
                            El vehículo que intentas ver no existe o no tienes
                            permisos para verlo.
                        </p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/customer/vehicles">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Car className="h-8 w-8" />
                                {vehicle.year} {vehicle.make} {vehicle.model}
                            </h1>
                            <p className="text-muted-foreground">
                                Información completa del vehículo
                            </p>
                        </div>
                    </div>

                    <Button asChild>
                        <Link href={`/customer/vehicles/${vehicle.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Vehículo
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información Básica */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                Información Básica
                            </CardTitle>
                            <CardDescription>
                                Datos principales del vehículo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Car className="h-4 w-4" />
                                        <span>Marca</span>
                                    </div>
                                    <p className="font-semibold">
                                        {vehicle.make}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Settings className="h-4 w-4" />
                                        <span>Modelo</span>
                                    </div>
                                    <p className="font-semibold">
                                        {vehicle.model}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Año</span>
                                    </div>
                                    <p className="font-semibold">
                                        {vehicle.year}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Palette className="h-4 w-4" />
                                        <span>Color</span>
                                    </div>
                                    <p className="font-semibold">
                                        {vehicle.color || "No especificado"}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Hash className="h-4 w-4" />
                                        <span>VIN</span>
                                    </div>
                                    <p className="font-mono text-sm bg-muted p-2 rounded">
                                        {vehicle.vin || "No especificado"}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CreditCard className="h-4 w-4" />
                                        <span>Placas</span>
                                    </div>
                                    <p className="font-mono text-lg font-bold">
                                        {vehicle.license_plate ||
                                            "No especificado"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Especificaciones Técnicas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Especificaciones Técnicas
                            </CardTitle>
                            <CardDescription>
                                Detalles técnicos del vehículo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Settings className="h-4 w-4" />
                                        <span>Motor</span>
                                    </div>
                                    <p className="font-semibold">
                                        {vehicle.engine_size ||
                                            "No especificado"}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Fuel className="h-4 w-4" />
                                        <span>Combustible</span>
                                    </div>
                                    <Badge variant="secondary">
                                        {vehicle.fuel_type || "No especificado"}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Settings className="h-4 w-4" />
                                        <span>Transmisión</span>
                                    </div>
                                    <p className="font-semibold">
                                        {vehicle.transmission ||
                                            "No especificado"}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Car className="h-4 w-4" />
                                        <span>Tipo</span>
                                    </div>
                                    <Badge variant="outline">
                                        {vehicle.vehicle_type ||
                                            "No especificado"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Financiera y Uso */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Información Financiera y Uso
                            </CardTitle>
                            <CardDescription>
                                Valor y patrones de uso del vehículo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <DollarSign className="h-4 w-4" />
                                        <span>Valor Estimado</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(
                                            vehicle.estimated_value
                                        )}
                                    </p>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Gauge className="h-4 w-4" />
                                            <span>Kilometraje Actual</span>
                                        </div>
                                        <p className="font-semibold">
                                            {formatNumber(vehicle.mileage)} km
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Gauge className="h-4 w-4" />
                                            <span>Km Anuales</span>
                                        </div>
                                        <p className="font-semibold">
                                            {formatNumber(
                                                vehicle.annual_mileage
                                            )}{" "}
                                            km/año
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Settings className="h-4 w-4" />
                                            <span>Uso</span>
                                        </div>
                                        <Badge variant="secondary">
                                            {vehicle.usage_type ||
                                                "No especificado"}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>Estacionamiento</span>
                                        </div>
                                        <Badge variant="outline">
                                            {vehicle.garage_type ===
                                                "enclosed" && "Garage cerrado"}
                                            {vehicle.garage_type ===
                                                "covered" && "Cochera techada"}
                                            {vehicle.garage_type === "street" &&
                                                "Calle"}
                                            {!vehicle.garage_type &&
                                                "No especificado"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Características de Seguridad */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Seguridad y Protección
                            </CardTitle>
                            <CardDescription>
                                Características de seguridad y dispositivos
                                antirrobo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Características de Seguridad */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-muted-foreground">
                                    CARACTERÍSTICAS DE SEGURIDAD
                                </h4>
                                {vehicle.safety_features &&
                                vehicle.safety_features.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {vehicle.safety_features.map(
                                            (feature, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {feature}
                                                </Badge>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No se han especificado características
                                        de seguridad
                                    </p>
                                )}
                            </div>

                            <Separator />

                            {/* Dispositivos Antirrobo */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-muted-foreground">
                                    DISPOSITIVOS ANTIRROBO
                                </h4>
                                {vehicle.anti_theft_devices &&
                                vehicle.anti_theft_devices.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {vehicle.anti_theft_devices.map(
                                            (device, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {device}
                                                </Badge>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No se han especificado dispositivos
                                        antirrobo
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Información de Registro */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Información de Registro
                        </CardTitle>
                        <CardDescription>
                            Fechas de creación y última modificación
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Fecha de Registro
                                </p>
                                <p className="font-semibold">
                                    {formatDate(vehicle.created_at)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Última Modificación
                                </p>
                                <p className="font-semibold">
                                    {formatDate(vehicle.updated_at)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
