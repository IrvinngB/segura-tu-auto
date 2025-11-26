
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
    Trash,
    CheckCircle,
} from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types/database";
import { Checkbox } from "@/components/ui/checkbox";

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
    const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
    const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(
        null
    );
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        vehicleId?: string;
        vehicleName?: string;
        isMultiple?: boolean;
    }>({
        open: false,
    });
    const [successDialog, setSuccessDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
    }>({
        open: false,
        title: "",
        description: "",
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

    const toggleVehicleSelection = (vehicleId: string) => {
        setSelectedVehicles((prev) =>
            prev.includes(vehicleId)
                ? prev.filter((id) => id !== vehicleId)
                : [...prev, vehicleId]
        );
    };

    const toggleAllVehicles = () => {
        if (selectedVehicles.length === vehicles.length) {
            setSelectedVehicles([]);
        } else {
            setSelectedVehicles(vehicles.map((v) => v.id));
        }
    };

    const handleDeleteSelected = () => {
        setDeleteDialog({
            open: true,
            isMultiple: true,
        });
    };

    const handleDeleteVehicle = async (
        vehicleId: string,
        vehicleName: string
    ) => {
        setDeleteDialog({
            open: true,
            vehicleId,
            vehicleName,
            isMultiple: false,
        });
    };

    const confirmDeleteVehicle = async () => {
        const { vehicleId, isMultiple, vehicleName } = deleteDialog;
        
        let idsToDelete: string[] = [];

        if (isMultiple) {
            idsToDelete = [...selectedVehicles];
        } else if (vehicleId) {
            idsToDelete = [vehicleId];
        }

        if (idsToDelete.length === 0) {
            setDeleteDialog((prev) => ({ ...prev, open: false }));
            return;
        }

        try {
            if (vehicleId) setDeletingVehicleId(vehicleId);
            setError("");

            // 1. Verificar pólizas activas o pendientes
            const { data: activePolicies, error: policiesError } = await supabase
                .from("policies")
                .select("vehicle_id")
                .in("vehicle_id", idsToDelete)
                .in("status", ["active", "pending"]);

            if (policiesError) {
                console.error("Error al verificar pólizas:", policiesError);
                throw new Error(`Error al verificar pólizas: ${policiesError.message}`);
            }

            // Identificar vehículos con pólizas activas/pendientes
            const vehicleIdsWithPolicies = new Set(activePolicies?.map(p => p.vehicle_id) || []);
            const idsSafeToDelete = idsToDelete.filter(id => !vehicleIdsWithPolicies.has(id));
            const omittedCount = idsToDelete.length - idsSafeToDelete.length;

            // Caso A: Ningún vehículo se puede eliminar (todos tienen pólizas activas/pending)
            if (idsSafeToDelete.length === 0) {
                const isSingle = idsToDelete.length === 1;
                toast({
                    title: "No se pueden eliminar los vehículos seleccionados",
                    description: isSingle
                        ? "Este vehículo tiene una póliza activa o pendiente. Para eliminarlo, primero debes coordinar con tu agente para cancelar o dejar sin efecto la póliza correspondiente."
                        : "Todos los vehículos seleccionados tienen pólizas activas o pendientes. Para eliminarlos, primero debes coordinar con tu agente para cancelar o dejar sin efecto las pólizas correspondientes.",
                    variant: "destructive",
                });
                setDeleteDialog((prev) => ({ ...prev, open: false }));
                setDeletingVehicleId(null);
                return;
            }

            // 2. Eliminar vehículos seguros
            const { error: deleteError } = await supabase
                .from("vehicles")
                .delete()
                .in("id", idsSafeToDelete);

            if (deleteError) {
                console.error("Error eliminando vehículo(s):", deleteError);
                toast({
                    title: "Error al eliminar vehículos",
                    description: "Ocurrió un error al eliminar los vehículos seleccionados. Intenta nuevamente.",
                    variant: "destructive",
                });
                setDeleteDialog((prev) => ({ ...prev, open: false }));
                setDeletingVehicleId(null);
                return;
            }

            // 3. Actualizar UI (Estado local)
            setVehicles((prevVehicles) =>
                prevVehicles.filter((vehicle) => !idsSafeToDelete.includes(vehicle.id))
            );

            // Caso B: Eliminación parcial
            if (omittedCount > 0) {
                toast({
                    title: "Vehículos eliminados parcialmente",
                    description: `Se eliminaron ${idsSafeToDelete.length} vehículo(s). ${omittedCount} vehículo(s) no se pudieron eliminar porque tienen pólizas activas o pendientes. Para eliminarlos, primero debes coordinar con tu agente para cancelar o dejar sin efecto la póliza.`,
                    variant: "default",
                });
            } 
            // Caso C: Eliminación completa (ÉXITO)
            else {
                // Cerrar modal de confirmación
                setDeleteDialog((prev) => ({ ...prev, open: false }));
                
                // Mostrar modal de éxito
                if (isMultiple) {
                    setSuccessDialog({
                        open: true,
                        title: "Vehículos eliminados",
                        description: `Se eliminaron ${idsSafeToDelete.length} vehículo(s) exitosamente de tu lista.`,
                    });
                } else {
                    setSuccessDialog({
                        open: true,
                        title: "Vehículo eliminado",
                        description: "El vehículo se eliminó correctamente de tu lista de vehículos.",
                    });
                }
            }

            // Limpieza final
            setSelectedVehicles([]);
            setDeletingVehicleId(null);
            // Asegurar cierre si no se hizo antes (aunque ya se hace en los ifs)
            if (omittedCount > 0) {
                setDeleteDialog((prev) => ({ ...prev, open: false }));
            }

        } catch (error: any) {
            console.error("Error inesperado en confirmDeleteVehicle:", error);
            // Case D: Error inesperado
            toast({
                title: "Error al eliminar vehículos",
                description: "Ocurrió un error inesperado. Intenta nuevamente.",
                variant: "destructive",
            });
            setDeletingVehicleId(null);
            setDeleteDialog((prev) => ({ ...prev, open: false }));
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

                {vehicles.length > 0 && (
                    <div className="flex items-center justify-between mb-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={
                                    vehicles.length > 0 &&
                                    selectedVehicles.length === vehicles.length
                                }
                                onCheckedChange={toggleAllVehicles}
                                id="select-all"
                            />
                            <label
                                htmlFor="select-all"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Seleccionar todos ({selectedVehicles.length})
                            </label>
                        </div>
                        {selectedVehicles.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteSelected}
                                className="animate-in fade-in zoom-in duration-200"
                            >
                                <Trash className="h-4 w-4 mr-2" />
                                Eliminar seleccionados ({selectedVehicles.length})
                            </Button>
                        )}
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
                                className={`hover:shadow-lg transition-shadow relative ${
                                    selectedVehicles.includes(vehicle.id)
                                        ? "border-primary ring-1 ring-primary"
                                        : ""
                                }`}
                            >
                                <div className="absolute top-4 left-4 z-10">
                                    <Checkbox
                                        checked={selectedVehicles.includes(vehicle.id)}
                                        onCheckedChange={() =>
                                            toggleVehicleSelection(vehicle.id)
                                        }
                                    />
                                </div>
                                <CardHeader>
                                    <div className="flex items-center justify-between pl-8">
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
                                                                    className="text-xs dark:border-gray-600 dark:text-gray-300"
                                                                >
                                                                    {feature}
                                                                </Badge>
                                                            )
                                                        )}
                                                    {vehicle.safety_features
                                                        .length > 3 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs dark:border-gray-600 dark:text-gray-300"
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
                                                className="flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
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
                                                className="flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
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
                    <>
                        <span>
                            {deleteDialog.isMultiple ? (
                                <>
                                    ¿Estás seguro de que deseas eliminar{" "}
                                    <span className="font-semibold">
                                        {selectedVehicles.length} vehículos
                                    </span>
                                    ?
                                </>
                            ) : (
                                <>
                                    ¿Estás seguro de que deseas eliminar el vehículo{" "}
                                    <span className="font-semibold">
                                        {deleteDialog.vehicleName}
                                    </span>
                                    ?
                                </>
                            )}
                        </span>
                        <br />
                        <br />
                        <span className="text-sm text-muted-foreground">
                            Esta acción no se puede deshacer y se eliminará
                            permanentemente de tu cuenta.
                        </span>
                    </>
                }
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                onConfirm={confirmDeleteVehicle}
                variant="destructive"
                icon={<AlertTriangle className="h-5 w-5" />}
            />

            {/* Modal de Éxito */}
            <ConfirmDialog
                open={successDialog.open}
                onOpenChange={(open) =>
                    setSuccessDialog((prev) => ({ ...prev, open }))
                }
                title={successDialog.title}
                description={successDialog.description}
                confirmText="Entendido"
                onConfirm={() => setSuccessDialog((prev) => ({ ...prev, open: false }))}
                variant="default"
                showCancel={false}
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            />
        </ProtectedRoute>
    );
}
