"use client";

import { useState, useEffect } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
    Plus,
    Car,
    Calendar,
    DollarSign,
    Shield,
    Trash2,
    AlertTriangle,
    Edit,
    Eye,
} from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types/database";

export default function CustomerVehiclesPage() {
    const { toast } = useToast();
    const {
        customerData,
        loading: customerLoading,
        error: customerError,
    } = useCustomerDataSimple();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(
        null
    );
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        vehicleId: string;
        vehicleName: string;
    }>({
        open: false,
        vehicleId: "",
        vehicleName: "",
    });
    const supabase = createClient();

    useEffect(() => {
        if (customerData && !customerLoading) {
            fetchVehicles();
        }
    }, [customerData, customerLoading]);

    const fetchVehicles = async () => {
        if (!customerData) return;

        try {
            setLoading(true);
            setError("");

            console.log("Buscando vehículos para cliente:", customerData.id);

            // Obtener vehículos del cliente
            const { data: vehiclesData, error: vehiclesError } = await supabase
                .from("vehicles")
                .select("*")
                .eq("customer_id", customerData.id)
                .order("created_at", { ascending: false });

            if (vehiclesError) {
                console.error("Error obteniendo vehículos:", vehiclesError);
                setError(
                    `Error al cargar los vehículos: ${vehiclesError.message}`
                );
            } else {
                console.log(
                    "Vehículos encontrados:",
                    vehiclesData?.length || 0
                );
                setVehicles(vehiclesData || []);
            }
        } catch (error) {
            console.error("Error inesperado:", error);
            setError("Error inesperado al cargar los vehículos");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVehicle = async (
        vehicleId: string,
        vehicleName: string
    ) => {
        // Abrir el diálogo de confirmación
        setDeleteDialog({
            open: true,
            vehicleId,
            vehicleName,
        });
    };

    const confirmDeleteVehicle = async () => {
        const { vehicleId, vehicleName } = deleteDialog;

        try {
            setDeletingVehicleId(vehicleId);
            setError("");

            // Eliminar el vehículo de la base de datos
            const { error: deleteError } = await supabase
                .from("vehicles")
                .delete()
                .eq("id", vehicleId);

            if (deleteError) {
                console.error("Error eliminando vehículo:", deleteError);
                setError(
                    `Error al eliminar el vehículo: ${deleteError.message}`
                );
                return;
            }

            // Actualizar la lista de vehículos eliminando el vehículo borrado
            setVehicles((prevVehicles) =>
                prevVehicles.filter((vehicle) => vehicle.id !== vehicleId)
            );

            // Mostrar mensaje de éxito
            toast({
                title: "¡Vehículo eliminado!",
                description: `${deleteDialog.vehicleName} ha sido eliminado exitosamente.`,
                variant: "default",
            });
        } catch (error) {
            console.error("Error inesperado:", error);
            setError("Error inesperado al eliminar el vehículo");
        } finally {
            setDeletingVehicleId(null);
        }
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
                                    : "Cargando vehículos..."}
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

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Mis Vehículos</h1>
                        <p className="text-muted-foreground">
                            Administra tus vehículos asegurados
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/customer/vehicles/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Vehículo
                        </Link>
                    </Button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-destructive">{error}</p>
                    </div>
                )}

                {vehicles.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Car className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                No tienes vehículos registrados
                            </h3>
                            <p className="text-muted-foreground text-center mb-6">
                                Agrega tu primer vehículo para comenzar a
                                gestionar tus pólizas de seguro
                            </p>
                            <Button asChild>
                                <Link href="/customer/vehicles/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Vehículo
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map((vehicle) => (
                            <Card
                                key={vehicle.id}
                                className="hover:shadow-lg transition-shadow"
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Car className="h-5 w-5" />
                                            {vehicle.year} {vehicle.make}{" "}
                                            {vehicle.model}
                                        </CardTitle>
                                        <Badge variant="secondary">
                                            {vehicle.vehicle_type}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {vehicle.license_plate} •{" "}
                                        {vehicle.color}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{vehicle.year}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {vehicle.estimated_value?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm">
                                            <span className="font-medium">
                                                Motor:
                                            </span>{" "}
                                            {vehicle.engine_size}
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium">
                                                Combustible:
                                            </span>{" "}
                                            {vehicle.fuel_type}
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium">
                                                Transmisión:
                                            </span>{" "}
                                            {vehicle.transmission}
                                        </div>
                                    </div>

                                    {vehicle.safety_features &&
                                        vehicle.safety_features.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        Características de
                                                        Seguridad
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {vehicle.safety_features
                                                        .slice(0, 3)
                                                        .map(
                                                            (
                                                                feature,
                                                                index
                                                            ) => (
                                                                <Badge
                                                                    key={index}
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {feature}
                                                                </Badge>
                                                            )
                                                        )}
                                                    {vehicle.safety_features
                                                        .length > 3 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            +
                                                            {vehicle
                                                                .safety_features
                                                                .length -
                                                                3}{" "}
                                                            más
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    <div className="pt-4 border-t">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                asChild
                                            >
                                                <Link
                                                    href={`/customer/vehicles/${vehicle.id}`}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver Detalles
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                asChild
                                            >
                                                <Link
                                                    href={`/customer/vehicles/${vehicle.id}/edit`}
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="flex-none"
                                                onClick={() =>
                                                    handleDeleteVehicle(
                                                        vehicle.id,
                                                        `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                                                    )
                                                }
                                                disabled={
                                                    deletingVehicleId ===
                                                    vehicle.id
                                                }
                                            >
                                                {deletingVehicleId ===
                                                vehicle.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Diálogo de confirmación para eliminar vehículo */}
            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog((prev) => ({ ...prev, open }))
                }
                title="Eliminar Vehículo"
                description={
                    <div className="space-y-2">
                        <p>
                            ¿Estás seguro de que deseas eliminar el vehículo{" "}
                            <span className="font-semibold">
                                {deleteDialog.vehicleName}
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
                onConfirm={confirmDeleteVehicle}
                variant="destructive"
                icon={<AlertTriangle className="h-5 w-5" />}
            />
        </ProtectedRoute>
    );
}
