"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useCustomerData } from "@/hooks/use-customer-data";
import { createClient } from "@/lib/supabase/client";
import { EditVehicleForm } from "@/components/vehicles";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car } from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types/database";

export default function EditVehiclePage() {
    const params = useParams();
    const router = useRouter();
    const vehicleId = params.id as string;

    const {
        customerData,
        loading: customerLoading,
        error: customerError,
    } = useCustomerData();

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
                        "Vehículo no encontrado o no tienes permisos para editarlo"
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

    const handleSuccess = () => {
        // Redirigir a la página de vehículos después de una edición exitosa
        router.push("/customer/vehicles");
    };

    const handleCancel = () => {
        // Regresar a la página de vehículos
        router.push("/customer/vehicles");
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
                                Editar Vehículo
                            </h1>
                            <p className="text-muted-foreground">
                                Modificar información del vehículo
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
                                Editar Vehículo
                            </h1>
                            <p className="text-muted-foreground">
                                Modificar información del vehículo
                            </p>
                        </div>
                    </div>

                    <div className="text-center py-12">
                        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            Vehículo no encontrado
                        </h3>
                        <p className="text-muted-foreground">
                            El vehículo que intentas editar no existe o no
                            tienes permisos para modificarlo.
                        </p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

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
                        <h1 className="text-3xl font-bold">Editar Vehículo</h1>
                        <p className="text-muted-foreground">
                            Modificar información de {vehicle.year}{" "}
                            {vehicle.make} {vehicle.model}
                        </p>
                    </div>
                </div>

                <EditVehicleForm
                    vehicle={vehicle}
                    customerId={customerData!.id}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </ProtectedRoute>
    );
}
