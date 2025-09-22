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
    const [coverageTypes, setCoverageTypes] = useState<CoverageType[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState(customerId || "");
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [selectedCoverages, setSelectedCoverages] = useState<string[]>([]);
    const [policyData, setPolicyData] = useState({
        policyType: "Amplia",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            "yyyy-MM-dd"
        ),
        paymentFrequency: "monthly",
        autoRenewal: true,
    });
    const [calculatedPremium, setCalculatedPremium] = useState(0);
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

    useEffect(() => {
        calculatePremium();
    }, [selectedCoverages, selectedVehicle, selectedCustomer]);

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

            // Fetch coverage types
            const { data: coverageData, error: coverageError } = await supabase
                .from("coverage_types")
                .select("*")
                .order("name");

            if (coverageError) {
                console.error("Error fetching coverage types:", coverageError);
                setError("Error al cargar los tipos de cobertura");
                return;
            }

            if (coverageData) {
                console.log("Coberturas cargadas:", coverageData.length);
                setCoverageTypes(coverageData);
                // Auto-select mandatory coverages
                const mandatoryCoverages = coverageData
                    .filter((c) => c.is_mandatory)
                    .map((c) => c.id);
                setSelectedCoverages(mandatoryCoverages);
                console.log(
                    "Coberturas obligatorias seleccionadas:",
                    mandatoryCoverages
                );
            } else {
                console.log("No se encontraron coberturas");
                setError("No se encontraron tipos de cobertura disponibles");
            }
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

    const calculatePremium = async () => {
        if (
            !selectedCustomer ||
            !selectedVehicle ||
            selectedCoverages.length === 0
        ) {
            setCalculatedPremium(0);
            return;
        }

        try {
            // Get customer risk score
            const { data: customer } = await supabase
                .from("customers")
                .select("risk_score")
                .eq("id", selectedCustomer)
                .single();

            // Get vehicle data
            const { data: vehicle } = await supabase
                .from("vehicles")
                .select("*")
                .eq("id", selectedVehicle)
                .single();

            // Get selected coverage types
            const { data: coverages } = await supabase
                .from("coverage_types")
                .select("*")
                .in("id", selectedCoverages);

            if (customer && vehicle && coverages) {
                let totalPremium = 0;

                coverages.forEach((coverage) => {
                    let coveragePremium = coverage.base_premium;

                    // Apply risk factor (risk_score: 0-100, where 50 is average)
                    const riskMultiplier = customer.risk_score / 50;
                    coveragePremium *= riskMultiplier;

                    // Apply vehicle value factor
                    if (vehicle.estimated_value) {
                        const valueMultiplier = Math.min(
                            vehicle.estimated_value / 200000,
                            2
                        ); // Cap at 2x
                        coveragePremium *= valueMultiplier;
                    }

                    // Apply vehicle age factor
                    const currentYear = new Date().getFullYear();
                    const vehicleAge = currentYear - vehicle.year;
                    const ageMultiplier = Math.max(0.8, 1 - vehicleAge * 0.02); // Newer cars get slight discount
                    coveragePremium *= ageMultiplier;

                    totalPremium += coveragePremium;
                });

                setCalculatedPremium(Math.round(totalPremium * 100) / 100);
            }
        } catch (error) {
            console.error("Error calculating premium:", error);
        }
    };

    const handleCoverageChange = (coverageId: string, checked: boolean) => {
        if (checked) {
            setSelectedCoverages((prev) => [...prev, coverageId]);
        } else {
            // Check if it's mandatory
            const coverage = coverageTypes.find((c) => c.id === coverageId);
            if (coverage?.is_mandatory) {
                setError("No puedes desmarcar coberturas obligatorias");
                return;
            }
            setSelectedCoverages((prev) =>
                prev.filter((id) => id !== coverageId)
            );
        }
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

            if (selectedCoverages.length === 0) {
                setError("Debe seleccionar al menos una cobertura");
                return;
            }

            if (calculatedPremium <= 0) {
                setError("La prima calculada debe ser mayor a 0");
                return;
            }

            console.log("Iniciando creación de póliza...");
            console.log("Datos de la póliza:", {
                customer_id: selectedCustomer,
                vehicle_id: selectedVehicle,
                policy_type: policyData.policyType,
                premium_amount: calculatedPremium,
                coverages: selectedCoverages.length,
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
                    premium_amount: calculatedPremium,
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

            // Create policy coverages
            const coverageInserts = selectedCoverages
                .map((coverageId) => {
                    const coverage = coverageTypes.find(
                        (c) => c.id === coverageId
                    );
                    if (!coverage) {
                        console.warn(`Cobertura no encontrada: ${coverageId}`);
                        return null;
                    }

                    return {
                        policy_id: policy.id,
                        coverage_type_id: coverageId,
                        coverage_limit: coverage.coverage_limit,
                        deductible: coverage.deductible,
                        premium: coverage.base_premium,
                    };
                })
                .filter(Boolean);

            console.log("Insertando coberturas:", coverageInserts);

            if (coverageInserts.length > 0) {
                const { data: coverageData, error: coverageError } =
                    await supabase
                        .from("policy_coverages")
                        .insert(coverageInserts)
                        .select();

                if (coverageError) {
                    console.error("Error creando coberturas:", coverageError);
                    throw new Error(
                        `Error al crear las coberturas: ${coverageError.message}`
                    );
                }

                console.log("Coberturas creadas exitosamente:", coverageData);
            }

            setSuccess(
                `Póliza ${policyNumber} creada exitosamente con ${coverageInserts.length} coberturas`
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
                                    <SelectItem value="Amplia">
                                        Cobertura Amplia
                                    </SelectItem>
                                    <SelectItem value="Básica">
                                        Responsabilidad Civil
                                    </SelectItem>
                                    <SelectItem value="Limitada">
                                        Cobertura Básica
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

                    {/* Coverage Selection */}
                    <div className="space-y-4">
                        <Label>Coberturas</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {coverageTypes.map((coverage) => (
                                <div
                                    key={coverage.id}
                                    className="flex items-start space-x-3 p-4 border rounded-lg"
                                >
                                    <Checkbox
                                        id={coverage.id}
                                        checked={selectedCoverages.includes(
                                            coverage.id
                                        )}
                                        onCheckedChange={(checked) =>
                                            handleCoverageChange(
                                                coverage.id,
                                                checked as boolean
                                            )
                                        }
                                        disabled={coverage.is_mandatory}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <Label
                                            htmlFor={coverage.id}
                                            className="text-sm font-medium"
                                        >
                                            {coverage.name}
                                            {coverage.is_mandatory && (
                                                <span className="text-xs text-destructive ml-1">
                                                    (Obligatoria)
                                                </span>
                                            )}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {coverage.description}
                                        </p>
                                        <div className="text-xs text-muted-foreground">
                                            Prima base: $
                                            {coverage.base_premium.toLocaleString()}
                                            {coverage.coverage_limit && (
                                                <span>
                                                    {" "}
                                                    | Límite: $
                                                    {coverage.coverage_limit.toLocaleString()}
                                                </span>
                                            )}
                                            {coverage.deductible && (
                                                <span>
                                                    {" "}
                                                    | Deducible: $
                                                    {coverage.deductible.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Premium Calculation */}
                    {calculatedPremium > 0 && (
                        <Card className="bg-muted/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-primary" />
                                        <span className="font-medium">
                                            Prima Calculada
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            $
                                            {calculatedPremium.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {policyData.paymentFrequency ===
                                                "monthly" &&
                                                `$${(
                                                    calculatedPremium / 12
                                                ).toFixed(2)} mensual`}
                                            {policyData.paymentFrequency ===
                                                "quarterly" &&
                                                `$${(
                                                    calculatedPremium / 4
                                                ).toFixed(2)} trimestral`}
                                            {policyData.paymentFrequency ===
                                                "biannual" &&
                                                `$${(
                                                    calculatedPremium / 2
                                                ).toFixed(2)} semestral`}
                                            {policyData.paymentFrequency ===
                                                "annual" && "anual"}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                                selectedCoverages.length === 0
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
