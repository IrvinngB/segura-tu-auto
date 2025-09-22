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
import { useCustomerData } from "@/hooks/use-customer-data";
import type { CoverageType, Vehicle } from "@/lib/types/database";
import { Calculator, Car, Shield, DollarSign, Plus } from "lucide-react";

interface QuoteFormProps {
    onSuccess?: (quote: any) => void;
    onCancel?: () => void;
}

export function QuoteForm({ onSuccess, onCancel }: QuoteFormProps) {
    const { customerData, loading: customerLoading } = useCustomerData();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
    const [vehicleData, setVehicleData] = useState({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        estimatedValue: "",
        usageType: "personal",
        annualMileage: "15000",
    });
    const [driverData, setDriverData] = useState({
        age: "",
        drivingExperience: "",
        hasAccidents: false,
        hasClaims: false,
    });
    const [coverageTypes, setCoverageTypes] = useState<CoverageType[]>([]);
    const [selectedCoverages, setSelectedCoverages] = useState<string[]>([]);
    const [calculatedQuote, setCalculatedQuote] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const supabase = createClient();

    useEffect(() => {
        fetchCoverageTypes();
    }, []);

    useEffect(() => {
        if (customerData && !customerLoading) {
            fetchVehicles();

            // Calculate driver data from user profile
            const calculateDriverData = () => {
                const currentYear = new Date().getFullYear();
                let age = "";
                let drivingExperience = "";

                // Calculate age from birth_date
                if (customerData.birth_date) {
                    const birthYear = new Date(
                        customerData.birth_date
                    ).getFullYear();
                    age = (currentYear - birthYear).toString();
                }

                // Calculate driving experience from license_year
                if (customerData.license_year) {
                    drivingExperience = (
                        currentYear - customerData.license_year
                    ).toString();
                }

                setDriverData({
                    age,
                    drivingExperience,
                    hasAccidents: customerData.has_accidents || false,
                    hasClaims: customerData.has_claims || false,
                });
            };

            calculateDriverData();
        }
    }, [customerData, customerLoading]);

    useEffect(() => {
        calculateQuote();
    }, [vehicleData, driverData, selectedCoverages]);

    useEffect(() => {
        if (selectedVehicleId && vehicles.length > 0) {
            const selectedVehicle = vehicles.find(
                (v) => v.id === selectedVehicleId
            );
            if (selectedVehicle) {
                setVehicleData({
                    make: selectedVehicle.make,
                    model: selectedVehicle.model,
                    year: selectedVehicle.year,
                    estimatedValue:
                        selectedVehicle.estimated_value?.toString() || "",
                    usageType: selectedVehicle.usage_type || "personal",
                    annualMileage:
                        selectedVehicle.annual_mileage?.toString() || "15000",
                });
            }
        }
    }, [selectedVehicleId, vehicles]);

    const fetchVehicles = async () => {
        if (!customerData) return;

        try {
            console.log("Buscando vehículos del cliente:", customerData.id);
            const { data, error } = await supabase
                .from("vehicles")
                .select("*")
                .eq("customer_id", customerData.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching vehicles:", error);
                setError("Error al cargar los vehículos");
                return;
            }

            if (data) {
                console.log("Vehículos encontrados:", data.length);
                setVehicles(data);
                // Auto-select first vehicle if available
                if (data.length > 0) {
                    setSelectedVehicleId(data[0].id);
                }
            } else {
                console.log("No se encontraron vehículos");
                setVehicles([]);
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
            setError("Error inesperado al cargar los vehículos");
        }
    };

    const fetchCoverageTypes = async () => {
        try {
            console.log("Buscando tipos de cobertura...");
            const { data, error } = await supabase
                .from("coverage_types")
                .select("*")
                .order("name");

            if (error) {
                console.error("Error fetching coverage types:", error);
                setError("Error al cargar los tipos de cobertura");
                return;
            }

            if (data) {
                console.log("Tipos de cobertura encontrados:", data.length);
                setCoverageTypes(data);
                // Auto-select mandatory coverages
                const mandatoryCoverages = data
                    .filter((c) => c.is_mandatory)
                    .map((c) => c.id);
                setSelectedCoverages(mandatoryCoverages);
                console.log(
                    "Coberturas obligatorias seleccionadas:",
                    mandatoryCoverages
                );
            } else {
                console.log("No se encontraron tipos de cobertura");
                setError("No se encontraron tipos de cobertura disponibles");
            }
        } catch (error) {
            console.error("Error fetching coverage types:", error);
            setError("Error inesperado al cargar los tipos de cobertura");
        }
    };

    const calculateQuote = () => {
        if (selectedCoverages.length === 0) {
            setCalculatedQuote(0);
            return;
        }

        let totalPremium = 0;

        selectedCoverages.forEach((coverageId) => {
            const coverage = coverageTypes.find((c) => c.id === coverageId);
            if (!coverage) return;

            let coveragePremium = coverage.base_premium;

            // Age factor
            if (driverData.age) {
                const age = Number.parseInt(driverData.age);
                if (age < 25) coveragePremium *= 1.3;
                else if (age > 65) coveragePremium *= 1.1;
                else coveragePremium *= 0.9;
            }

            // Experience factor
            if (driverData.drivingExperience) {
                const experience = Number.parseInt(
                    driverData.drivingExperience
                );
                if (experience < 2) coveragePremium *= 1.2;
                else if (experience > 10) coveragePremium *= 0.85;
            }

            // Vehicle value factor
            if (vehicleData.estimatedValue) {
                const value = Number.parseFloat(vehicleData.estimatedValue);
                const valueMultiplier = Math.min(value / 200000, 2);
                coveragePremium *= valueMultiplier;
            }

            // Vehicle age factor
            const vehicleAge = new Date().getFullYear() - vehicleData.year;
            const ageMultiplier = Math.max(0.8, 1 - vehicleAge * 0.02);
            coveragePremium *= ageMultiplier;

            // Usage factor
            if (vehicleData.usageType === "commercial") coveragePremium *= 1.2;
            else if (vehicleData.usageType === "mixed") coveragePremium *= 1.1;

            // Annual mileage factor
            const mileage = Number.parseInt(vehicleData.annualMileage);
            if (mileage > 20000) coveragePremium *= 1.15;
            else if (mileage < 10000) coveragePremium *= 0.9;

            // Risk factors
            if (driverData.hasAccidents) coveragePremium *= 1.25;
            if (driverData.hasClaims) coveragePremium *= 1.2;

            totalPremium += coveragePremium;
        });

        setCalculatedQuote(Math.round(totalPremium * 100) / 100);
    };

    const handleVehicleChange = (field: string, value: string | number) => {
        setVehicleData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCoverageChange = (coverageId: string, checked: boolean) => {
        if (checked) {
            setSelectedCoverages((prev) => [...prev, coverageId]);
        } else {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const quoteData = {
                vehicle: vehicleData,
                driver: driverData,
                coverages: selectedCoverages,
                calculatedPremium: calculatedQuote,
                userId: customerData?.user_id,
                customerId: customerData?.id,
                createdAt: new Date().toISOString(),
            };

            setSuccess("Cotización calculada exitosamente");

            if (onSuccess) {
                onSuccess(quoteData);
            }
        } catch (error) {
            console.error("Error processing quote:", error);
            setError("Error al procesar la cotización");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Cotización de Seguro
                </CardTitle>
                <CardDescription>
                    Complete la información para obtener una cotización
                    personalizada
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

                    {/* Vehicle Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Car className="h-4 w-4" />
                                Información del Vehículo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Vehicle Selection - Only if vehicles exist */}
                            {vehicles.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicleSelect">
                                            Seleccionar Vehículo Registrado
                                        </Label>
                                        <Select
                                            value={selectedVehicleId}
                                            onValueChange={(value) =>
                                                setSelectedVehicleId(value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un vehículo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicles.map((vehicle) => (
                                                    <SelectItem
                                                        key={vehicle.id}
                                                        value={vehicle.id}
                                                    >
                                                        {vehicle.year}{" "}
                                                        {vehicle.make}{" "}
                                                        {vehicle.model} -{" "}
                                                        {vehicle.license_plate}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Vehicle Information Display - Read Only */}
                                    {selectedVehicleId && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="flex-1 h-px bg-border"></div>
                                                <span className="text-sm text-muted-foreground">
                                                    Información del Vehículo
                                                    Seleccionado
                                                </span>
                                                <div className="flex-1 h-px bg-border"></div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="make">
                                                        Marca
                                                    </Label>
                                                    <Input
                                                        id="make"
                                                        value={vehicleData.make}
                                                        readOnly
                                                        className="bg-muted/50 cursor-not-allowed"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="model">
                                                        Modelo
                                                    </Label>
                                                    <Input
                                                        id="model"
                                                        value={
                                                            vehicleData.model
                                                        }
                                                        readOnly
                                                        className="bg-muted/50 cursor-not-allowed"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="year">
                                                        Año
                                                    </Label>
                                                    <Input
                                                        id="year"
                                                        value={vehicleData.year.toString()}
                                                        readOnly
                                                        className="bg-muted/50 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="estimatedValue">
                                                        Valor Estimado
                                                    </Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="estimatedValue"
                                                            value={Number.parseFloat(
                                                                vehicleData.estimatedValue
                                                            ).toLocaleString()}
                                                            readOnly
                                                            className="pl-10 bg-muted/50 cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="usageType">
                                                        Uso del Vehículo
                                                    </Label>
                                                    <Input
                                                        id="usageType"
                                                        value={
                                                            vehicleData.usageType ===
                                                            "personal"
                                                                ? "Personal"
                                                                : vehicleData.usageType ===
                                                                  "commercial"
                                                                ? "Comercial"
                                                                : vehicleData.usageType ===
                                                                  "taxi"
                                                                ? "Taxi"
                                                                : vehicleData.usageType ===
                                                                  "delivery"
                                                                ? "Delivery"
                                                                : "Otro"
                                                        }
                                                        readOnly
                                                        className="bg-muted/50 cursor-not-allowed"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="annualMileage">
                                                        Kilometraje Anual
                                                    </Label>
                                                    <Input
                                                        id="annualMileage"
                                                        value={
                                                            Number.parseInt(
                                                                vehicleData.annualMileage
                                                            ).toLocaleString() +
                                                            " km"
                                                        }
                                                        readOnly
                                                        className="bg-muted/50 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    <strong>Nota:</strong> Para
                                                    editar la información del
                                                    vehículo, ve a la sección{" "}
                                                    <a
                                                        href="/customer/vehicles"
                                                        className="underline hover:text-blue-800 dark:hover:text-blue-200"
                                                    >
                                                        "Mis Vehículos"
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // No vehicles registered - Show message
                                <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">
                                        No tienes vehículos registrados
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Para obtener una cotización de seguro,
                                        primero debes registrar al menos un
                                        vehículo.
                                    </p>
                                    <Button asChild>
                                        <a href="/customer/vehicles">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Registrar Vehículo
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Coverage Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shield className="h-4 w-4" />
                                Coberturas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quote Result */}
                    {calculatedQuote > 0 && (
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary mb-2">
                                        ${calculatedQuote.toLocaleString()}
                                    </div>
                                    <div className="text-lg font-medium mb-4">
                                        Prima Anual Estimada
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="font-medium">
                                                Mensual
                                            </div>
                                            <div className="text-muted-foreground">
                                                $
                                                {(calculatedQuote / 12).toFixed(
                                                    2
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                Trimestral
                                            </div>
                                            <div className="text-muted-foreground">
                                                $
                                                {(calculatedQuote / 4).toFixed(
                                                    2
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                Semestral
                                            </div>
                                            <div className="text-muted-foreground">
                                                $
                                                {(calculatedQuote / 2).toFixed(
                                                    2
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    {vehicles.length > 0 ? (
                        <div className="flex gap-4 pt-6">
                            <Button
                                type="submit"
                                disabled={loading || !selectedVehicleId}
                                className="flex-1"
                            >
                                {loading
                                    ? "Procesando..."
                                    : "Obtener Cotización"}
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
                    ) : (
                        <div className="pt-6 text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                Registra un vehículo para poder obtener una
                                cotización
                            </p>
                            <Button asChild variant="default">
                                <a href="/customer/vehicles">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ir a Mis Vehículos
                                </a>
                            </Button>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
