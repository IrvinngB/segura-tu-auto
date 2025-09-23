"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple";
import { POLICY_PLANS } from "@/lib/policy-plans";
import type { Vehicle } from "@/lib/types/database";
import {
    Calculator,
    Car,
    Shield,
    DollarSign,
    Plus,
    Check,
    X,
    Star,
    Crown,
} from "lucide-react";

interface QuoteFormProps {
    onSuccess?: (quote: any) => void;
    onCancel?: () => void;
}

export function QuoteForm({ onSuccess, onCancel }: QuoteFormProps) {
    const { customerData, loading: customerLoading } = useCustomerDataSimple();
    const router = useRouter();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
    const [selectedPlan, setSelectedPlan] = useState<string>("basica"); // Plan por defecto básico
    const [vehicleData, setVehicleData] = useState({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        estimatedValue: "",
        usageType: "personal",
        annualMileage: "15000",
    });
    const [driverData, setDriverData] = useState({
        age: "30", // Valor por defecto
        drivingExperience: "5", // Valor por defecto
        hasAccidents: false,
        hasClaims: false,
    });
    const [calculatedQuote, setCalculatedQuote] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        if (customerData && !customerLoading) {
            fetchVehicles();

            // Calculate driver data from user profile
            const calculateDriverData = () => {
                const currentYear = new Date().getFullYear();
                let age = "30"; // Default value
                let drivingExperience = "5"; // Default value

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

                // Ensure we always have valid values
                if (!age || age === "NaN" || parseInt(age) < 18) {
                    age = "30";
                }
                if (
                    !drivingExperience ||
                    drivingExperience === "NaN" ||
                    parseInt(drivingExperience) < 0
                ) {
                    drivingExperience = "5";
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
    }, [vehicleData, driverData, selectedPlan]);

    useEffect(() => {
        if (selectedVehicleId && vehicles.length > 0) {
            const selectedVehicle = vehicles.find(
                (v) => v.id === selectedVehicleId
            );
            if (selectedVehicle) {
                setVehicleData({
                    make: selectedVehicle.make,
                    model: selectedVehicle.model,
                    year: selectedVehicle.year || new Date().getFullYear(),
                    estimatedValue:
                        selectedVehicle.estimated_value?.toString() || "200000",
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
        }
    };

    const calculateQuote = () => {
        if (!vehicleData?.year || !driverData?.age || !selectedPlan) {
            setCalculatedQuote(0);
            return;
        }

        try {
            const plan =
                POLICY_PLANS[selectedPlan as keyof typeof POLICY_PLANS];
            if (!plan) {
                setCalculatedQuote(0);
                return;
            }

            let basePrice = plan.basePrice;

            // Age-based adjustments
            const age = parseInt(driverData.age);
            if (age < 25) basePrice *= 1.25;
            else if (age > 65) basePrice *= 1.15;

            // Experience adjustments
            const experience = parseInt(driverData.drivingExperience || "0");
            if (experience < 2) basePrice *= 1.2;

            // Vehicle age adjustments
            const vehicleAge = new Date().getFullYear() - vehicleData.year;
            if (vehicleAge < 2) basePrice *= 1.1;
            else if (vehicleAge > 10) basePrice *= 0.9;

            // Accident and claims history
            if (driverData.hasAccidents) basePrice *= 1.15;
            if (driverData.hasClaims) basePrice *= 1.2;

            // Calculate annual price (basePrice is monthly)
            const finalPrice = Math.round(basePrice * 12);
            setCalculatedQuote(finalPrice);
        } catch (error) {
            console.error("Error calculating quote:", error);
            setCalculatedQuote(0);
        }
    };

    const handleVehicleChange = (field: string, value: string | number) => {
        setVehicleData((prev) => ({ ...prev, [field]: value }));
    };

    const handleContractPolicy = () => {
        // Prepare the data to pass to the policy creation form
        const policyData = {
            vehicleId: selectedVehicleId,
            vehicleData: vehicleData,
            planType: selectedPlan,
            driverData: driverData,
            calculatedPremium: calculatedQuote,
            planDetails:
                POLICY_PLANS[selectedPlan as keyof typeof POLICY_PLANS],
        };

        // Store the data in sessionStorage so it can be accessed by the policy form
        sessionStorage.setItem(
            "policyContractData",
            JSON.stringify(policyData)
        );

        // Navigate to the policy creation page using Next.js router
        router.push("/customer/policies/new");
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
                <div className="space-y-6">
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

                    {/* Plan Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shield className="h-4 w-4" />
                                Planes de Cobertura
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Selecciona el plan que mejor se adapte a tus
                                necesidades
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(POLICY_PLANS).map(
                                    ([key, plan]) => (
                                        <div
                                            key={key}
                                            className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                                                selectedPlan === key
                                                    ? "border-primary bg-primary/5"
                                                    : "border-muted hover:border-primary/50"
                                            }`}
                                            onClick={() => setSelectedPlan(key)}
                                        >
                                            <div className="flex flex-col space-y-4">
                                                <div className="text-center">
                                                    <h3 className="text-lg font-semibold capitalize">
                                                        Plan {plan.name}
                                                    </h3>
                                                    <div className="mt-2 text-3xl font-bold text-primary">
                                                        $
                                                        {plan.basePrice.toLocaleString()}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        por mes
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-sm">
                                                        Incluye:
                                                    </h4>
                                                    <ul className="space-y-1">
                                                        {plan.coverages
                                                            .filter(
                                                                (c) =>
                                                                    c.included
                                                            )
                                                            .map(
                                                                (
                                                                    coverage,
                                                                    index
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="flex items-center text-xs"
                                                                    >
                                                                        <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                                                        {
                                                                            coverage.name
                                                                        }
                                                                    </li>
                                                                )
                                                            )}
                                                    </ul>

                                                    {plan.coverages.some(
                                                        (c) => !c.included
                                                    ) && (
                                                        <>
                                                            <h4 className="font-medium text-sm text-muted-foreground">
                                                                No incluye:
                                                            </h4>
                                                            <ul className="space-y-1">
                                                                {plan.coverages
                                                                    .filter(
                                                                        (c) =>
                                                                            !c.included
                                                                    )
                                                                    .map(
                                                                        (
                                                                            coverage,
                                                                            index
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="flex items-center text-xs text-muted-foreground"
                                                                            >
                                                                                <X className="h-3 w-3 text-red-500 mr-2 flex-shrink-0" />
                                                                                {
                                                                                    coverage.name
                                                                                }
                                                                            </li>
                                                                        )
                                                                    )}
                                                            </ul>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedPlan === key && (
                                                <div className="absolute -top-2 -right-2 rounded-full bg-primary p-1">
                                                    <Check className="h-4 w-4 text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
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
                        <div className="space-y-4 pt-6">
                            {/* Contract Policy Button - shown when quote is calculated */}
                            {calculatedQuote > 0 && (
                                <Button
                                    type="button"
                                    variant="default"
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                                    onClick={handleContractPolicy}
                                >
                                    <Shield className="h-5 w-5 mr-2" />
                                    Contratar Esta Póliza - $
                                    {calculatedQuote.toLocaleString()}/año
                                </Button>
                            )}

                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    className="w-full"
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
                </div>
            </CardContent>
        </Card>
    );
}
