"use client";

import { useState, useEffect } from "react";
import { PolicyList } from "@/components/policies/policy-list";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Plus, Car, AlertCircle } from "lucide-react";

export default function CustomerPoliciesPage() {
    const { userProfile } = useAuth();
    const [customerId, setCustomerId] = useState<string>("");
    const [vehicleCount, setVehicleCount] = useState<number>(0);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (userProfile) {
            fetchCustomerId();
        }
    }, [userProfile]);

    const fetchCustomerId = async () => {
        try {
            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", userProfile?.id)
                .single();

            if (customer) {
                setCustomerId(customer.id);
                // También obtener el conteo de vehículos
                fetchVehicleCount(customer.id);
            }
        } catch (error) {
            console.error("Error fetching customer ID:", error);
            setLoadingVehicles(false);
        }
    };

    const fetchVehicleCount = async (customerId: string) => {
        try {
            setLoadingVehicles(true);
            const { data, error } = await supabase
                .from("vehicles")
                .select("id")
                .eq("customer_id", customerId);

            if (error) {
                console.error("Error fetching vehicles:", error);
            } else {
                setVehicleCount(data?.length || 0);
            }
        } catch (error) {
            console.error("Error fetching vehicle count:", error);
        } finally {
            setLoadingVehicles(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Mis Pólizas</h1>
                        <p className="text-muted-foreground">
                            Administra tus pólizas de seguro
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {vehicleCount === 0 && !loadingVehicles ? (
                            <Button disabled variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Póliza
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link href="/customer/policies/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nueva Póliza
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link href="/customer/quote">
                                <Plus className="h-4 w-4 mr-2" />
                                Solicitar Cotización
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Alerta cuando no hay vehículos */}
                {vehicleCount === 0 && !loadingVehicles && (
                    <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-3">
                                <p>
                                    <strong>
                                        Registra un vehículo para crear pólizas:
                                    </strong>{" "}
                                    Para poder crear una nueva póliza de seguro,
                                    primero necesitas registrar al menos un
                                    vehículo en tu cuenta.
                                </p>
                                <Button asChild size="sm">
                                    <Link href="/customer/vehicles/new">
                                        <Car className="h-4 w-4 mr-2" />
                                        Registrar Vehículo
                                    </Link>
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {customerId && <PolicyList customerId={customerId} />}
            </div>
        </ProtectedRoute>
    );
}
