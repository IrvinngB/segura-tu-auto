"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import {
    POLICY_PLANS,
    getPlanInfo,
    getPlanCoverages,
    calculateBasePrice,
} from "@/lib/policy-plans";
import type { Customer, Vehicle, CoverageType } from "@/lib/types/database";
import { CalendarIcon, Car, Shield, Calculator } from "lucide-react";
import { format } from "date-fns";

interface PolicyFormProps {
    customerId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PolicyForm({
    customerId,
    onSuccess,
    onCancel,
}: PolicyFormProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState(customerId || "");
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [policyData, setPolicyData] = useState({
        policyType: "basica",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            "yyyy-MM-dd"
        ),
        paymentFrequency: "monthly",
        autoRenewal: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const supabase = createClient();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            fetchCustomerVehicles(selectedCustomer);
        }
    }, [selectedCustomer]);

    const fetchInitialData = async () => {
        try {
            // Fetch customers
            const { data: customersData } = await supabase
                .from("customers")
                .select(
                    `
          *,
          user:users(*)
        `
                )
                .order("created_at", { ascending: false });

            if (customersData) setCustomers(customersData);
        } catch (error) {
            console.error("Error fetching initial data:", error);
            setError("Error cargando datos iniciales");
        }
    };

    const fetchCustomerVehicles = async (customerId: string) => {
        try {
            const { data } = await supabase
                .from("vehicles")
                .select("*")
                .eq("customer_id", customerId)
                .order("created_at", { ascending: false });

            if (data) setVehicles(data);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        }
    };

    // Calculate price based on selected plan
    const calculatePrice = () => {
        const selectedPlan =
            POLICY_PLANS[policyData.policyType as keyof typeof POLICY_PLANS];
        return selectedPlan?.basePrice || 0;
    };

    const generatePolicyNumber = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, "0");
        return `POL-${year}-${random}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Validaciones adicionales
            if (!selectedCustomer) {
                setError("Debe seleccionar un cliente");
                return;
            }

            if (!selectedVehicle) {
                setError("Debe seleccionar un vehículo");
                return;
            }

            const monthlyPrice = calculatePrice();
            if (monthlyPrice <= 0) {
                setError("Error en el cálculo del precio");
                return;
            }

            console.log("Iniciando creación de póliza...");
            console.log("Datos de la póliza:", {
                customer_id: selectedCustomer,
                vehicle_id: selectedVehicle,
                policy_type: policyData.policyType,
                premium_amount: monthlyPrice,
                plan: POLICY_PLANS[
                    policyData.policyType as keyof typeof POLICY_PLANS
                ]?.name,
            });

            const policyNumber = generatePolicyNumber();
            console.log("Número de póliza generado:", policyNumber);

            // Create policy
            const { data: policy, error: policyError } = await supabase
                .from("policies")
                .insert({
                    policy_number: policyNumber,
                    customer_id: selectedCustomer,
                    vehicle_id: selectedVehicle,
                    policy_type: policyData.policyType,
                    status: "active",
                    start_date: policyData.startDate,
                    end_date: policyData.endDate,
                    premium_amount: monthlyPrice,
                    payment_frequency: policyData.paymentFrequency,
                    auto_renewal: policyData.autoRenewal,
                })
                .select()
                .single();

            if (policyError) {
                console.error("Error creando póliza:", policyError);
                throw new Error(
                    `Error al crear la póliza: ${policyError.message}`
                );
            }

            console.log("Póliza creada exitosamente:", policy);

            // Auto-create policy coverages based on selected plan
            const selectedPlan =
                POLICY_PLANS[
                    policyData.policyType as keyof typeof POLICY_PLANS
                ];
            if (selectedPlan) {
                // Get all coverage types to match with plan coverages
                const { data: allCoverageTypes } = await supabase
                    .from("coverage_types")
                    .select("*");

                if (allCoverageTypes) {
                    const coverageInserts = selectedPlan.coverages
                        .filter((planCoverage) => planCoverage.included)
                        .map((planCoverage) => {
                            const coverage = allCoverageTypes.find(
                                (ct) =>
                                    ct.name
                                        .toLowerCase()
                                        .includes(
                                            planCoverage.name.toLowerCase()
                                        ) ||
                                    planCoverage.name
                                        .toLowerCase()
                                        .includes(ct.name.toLowerCase())
                            );

                            if (coverage) {
                                return {
                                    policy_id: policy.id,
                                    coverage_type_id: coverage.id,
                                    coverage_limit:
                                        planCoverage.maxAmount ||
                                        coverage.max_coverage_amount,
                                    deductible: coverage.deductible || 0,
                                };
                            }
                            return null;
                        })
                        .filter(Boolean);

                    if (coverageInserts.length > 0) {
                        const { data: coverageData, error: coverageError } =
                            await supabase
                                .from("policy_coverages")
                                .insert(coverageInserts)
                                .select();

                        if (coverageError) {
                            console.error(
                                "Error creando coberturas:",
                                coverageError
                            );
                            // Don't throw here, policy was created successfully
                        } else {
                            console.log(
                                "Coberturas creadas exitosamente:",
                                coverageData
                            );
                        }
                    }
                }
            }

            setSuccess(
                `Póliza ${policyNumber} creada exitosamente con plan ${selectedPlan?.name}`
            );

            if (onSuccess) {
                setTimeout(() => onSuccess(), 1500);
            }
        } catch (error) {
            console.error("Error creating policy:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Error inesperado al crear la póliza"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Nueva Póliza de Seguro
                </CardTitle>
                <CardDescription>
                    Complete la información para crear una nueva póliza de
                    seguro
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {/* Customer Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="customer">Cliente</Label>
                            <Select
                                value={selectedCustomer}
                                onValueChange={setSelectedCustomer}
                                disabled={!!customerId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem
                                            key={customer.id}
                                            value={customer.id}
                                        >
                                            {customer.user?.first_name}{" "}
                                            {customer.user?.last_name} -{" "}
                                            {customer.user?.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicle">Vehículo</Label>
                            {vehicles.length === 0 && selectedCustomer ? (
                                <div className="space-y-4">
                                    <Alert>
                                        <Car className="h-4 w-4" />
                                        <AlertDescription>
                                            No hay vehículos registrados para
                                            este cliente.
                                            {customerId
                                                ? " Debes registrar al menos un vehículo antes de crear una póliza."
                                                : " Selecciona un cliente que tenga vehículos registrados o registra un vehículo primero."}
                                        </AlertDescription>
                                    </Alert>
                                    {customerId && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <a href="/customer/vehicles/new">
                                                <Car className="h-4 w-4 mr-2" />
                                                Registrar Vehículo
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <Select
                                    value={selectedVehicle}
                                    onValueChange={setSelectedVehicle}
                                    disabled={vehicles.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                vehicles.length === 0
                                                    ? "No hay vehículos disponibles"
                                                    : "Seleccionar vehículo"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map((vehicle) => (
                                            <SelectItem
                                                key={vehicle.id}
                                                value={vehicle.id}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Car className="h-4 w-4" />
                                                    {vehicle.year}{" "}
                                                    {vehicle.make}{" "}
                                                    {vehicle.model} -{" "}
                                                    {vehicle.license_plate}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {/* Policy Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="policyType">Tipo de Póliza</Label>
                            <Select
                                value={policyData.policyType}
                                onValueChange={(value) =>
                                    setPolicyData((prev) => ({
                                        ...prev,
                                        policyType: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basica">
                                        Básica
                                    </SelectItem>
                                    <SelectItem value="limitada">
                                        Limitada
                                    </SelectItem>
                                    <SelectItem value="amplia">
                                        Amplia
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentFrequency">
                                Frecuencia de Pago
                            </Label>
                            <Select
                                value={policyData.paymentFrequency}
                                onValueChange={(value) =>
                                    setPolicyData((prev) => ({
                                        ...prev,
                                        paymentFrequency: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">
                                        Mensual
                                    </SelectItem>
                                    <SelectItem value="quarterly">
                                        Trimestral
                                    </SelectItem>
                                    <SelectItem value="biannual">
                                        Semestral
                                    </SelectItem>
                                    <SelectItem value="annual">
                                        Anual
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Fecha de Inicio</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={policyData.startDate}
                                    onChange={(e) =>
                                        setPolicyData((prev) => ({
                                            ...prev,
                                            startDate: e.target.value,
                                        }))
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">
                                Fecha de Vencimiento
                            </Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={policyData.endDate}
                                    onChange={(e) =>
                                        setPolicyData((prev) => ({
                                            ...prev,
                                            endDate: e.target.value,
                                        }))
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Plan Coverages Display */}
                    <div className="space-y-4">
                        <Label>
                            Coberturas del Plan {policyData.policyType}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {POLICY_PLANS[
                                policyData.policyType as keyof typeof POLICY_PLANS
                            ]?.coverages.map((coverage, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start space-x-3 p-4 border rounded-lg ${
                                        coverage.included
                                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                                            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                            coverage.included
                                                ? "bg-green-500 text-white"
                                                : "bg-red-500 text-white"
                                        }`}
                                    >
                                        {coverage.included ? "✓" : "✗"}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-sm font-medium">
                                            {coverage.name}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {coverage.description}
                                        </p>
                                        {coverage.included &&
                                            coverage.maxAmount && (
                                                <div className="text-xs text-green-600 dark:text-green-400">
                                                    Cobertura máxima: $
                                                    {coverage.maxAmount.toLocaleString()}
                                                </div>
                                            )}
                                        {coverage.included &&
                                            coverage.percentage && (
                                                <div className="text-xs text-green-600 dark:text-green-400">
                                                    Cobertura:{" "}
                                                    {coverage.percentage}%
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price Display */}
                    <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-primary" />
                                    <span className="font-medium">
                                        Plan {policyData.policyType}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">
                                        ${calculatePrice().toLocaleString()}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {policyData.paymentFrequency ===
                                            "monthly" && "por mes"}
                                        {policyData.paymentFrequency ===
                                            "quarterly" &&
                                            `$${(
                                                calculatePrice() * 3
                                            ).toLocaleString()} trimestral`}
                                        {policyData.paymentFrequency ===
                                            "biannual" &&
                                            `$${(
                                                calculatePrice() * 6
                                            ).toLocaleString()} semestral`}
                                        {policyData.paymentFrequency ===
                                            "annual" &&
                                            `$${(
                                                calculatePrice() * 12
                                            ).toLocaleString()} anual`}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Auto Renewal */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="autoRenewal"
                            checked={policyData.autoRenewal}
                            onCheckedChange={(checked) =>
                                setPolicyData((prev) => ({
                                    ...prev,
                                    autoRenewal: checked as boolean,
                                }))
                            }
                        />
                        <Label htmlFor="autoRenewal">
                            Renovación automática
                        </Label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6">
                        <Button
                            type="submit"
                            disabled={
                                loading ||
                                !selectedCustomer ||
                                !selectedVehicle ||
                                calculatePrice() <= 0
                            }
                            className="flex-1"
                        >
                            {loading ? "Creando póliza..." : "Crear Póliza"}
                        </Button>
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
