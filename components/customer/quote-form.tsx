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
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { NotificationModal } from "@/components/ui/notification-modal";
import { createClient } from "@/lib/supabase/client";
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple";
import { POLICY_PLANS } from "@/lib/policy-plans";
import type { Vehicle } from "@/lib/types/database";
import jsPDF from "jspdf";
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
    Download,
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
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [hasActivePolicyForVehicle, setHasActivePolicyForVehicle] =
        useState(false);
    const [checkingPolicies, setCheckingPolicies] = useState(false);
    const [notificationModal, setNotificationModal] = useState<{
        open: boolean;
        type: "success" | "error" | "warning" | "info";
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        open: false,
        type: "info",
        title: "",
        message: "",
    });
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [vehiclesWithPolicies, setVehiclesWithPolicies] = useState<
        Set<string>
    >(new Set());
    const [loadingVehiclePolicies, setLoadingVehiclePolicies] = useState(false);
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
                // Check for active policies when vehicle is selected
                checkActivePolicyForVehicle(selectedVehicleId);
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
                // Verificar cuáles vehículos ya tienen pólizas activas
                await checkVehicleActivePolicies(data);

                // Auto-select first available vehicle (without active policy)
                if (data.length > 0) {
                    // Primero intentar con vehículos sin póliza activa
                    const availableVehicle = data.find(
                        (vehicle) => !vehiclesWithPolicies.has(vehicle.id)
                    );
                    if (availableVehicle) {
                        setSelectedVehicleId(availableVehicle.id);
                    } else {
                        // Si todos tienen póliza, seleccionar el primero pero mostrar advertencia
                        setSelectedVehicleId(data[0].id);
                    }
                }
            } else {
                console.log("No se encontraron vehículos");
                setVehicles([]);
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        }
    };

    const checkVehicleActivePolicies = async (vehicleList: Vehicle[]) => {
        if (vehicleList.length === 0) return;

        try {
            setLoadingVehiclePolicies(true);

            // Obtener todas las pólizas activas para estos vehículos
            const vehicleIds = vehicleList.map((v) => v.id);
            const { data: activePolicies } = await supabase
                .from("policies")
                .select("vehicle_id")
                .in("vehicle_id", vehicleIds)
                .in("status", ["active", "suspended"]); // Considera activas y suspendidas como ocupadas

            // También verificar cotizaciones pendientes
            const { data: pendingQuotes } = await supabase
                .from("quotes")
                .select("vehicle_id")
                .in("vehicle_id", vehicleIds)
                .in("status", ["pending", "approved"]);

            const vehiclesWithActivePolicies = new Set<string>();

            if (activePolicies) {
                activePolicies.forEach((policy) =>
                    vehiclesWithActivePolicies.add(policy.vehicle_id)
                );
            }

            if (pendingQuotes) {
                pendingQuotes.forEach((quote) =>
                    vehiclesWithActivePolicies.add(quote.vehicle_id)
                );
            }

            setVehiclesWithPolicies(vehiclesWithActivePolicies);
        } catch (error) {
            console.error("Error checking vehicle policies:", error);
        } finally {
            setLoadingVehiclePolicies(false);
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

    // Función para verificar si hay pólizas activas para el vehículo seleccionado
    const checkActivePolicyForVehicle = async (vehicleId: string) => {
        if (!vehicleId || !customerData) return;

        setCheckingPolicies(true);
        try {
            // Usar el estado centralizado de vehículos con pólizas
            const hasActivePolicy = vehiclesWithPolicies.has(vehicleId);
            setHasActivePolicyForVehicle(hasActivePolicy);
        } catch (error) {
            console.error("Error checking policies:", error);
        } finally {
            setCheckingPolicies(false);
        }
    };

    // Función para validar datos de la cotización
    const validateQuoteData = (): string[] => {
        const errors: string[] = [];

        // Validar que hay un vehículo seleccionado
        if (!selectedVehicleId) {
            errors.push("Debe seleccionar un vehículo");
        }

        // Validar datos del vehículo
        if (!vehicleData.make?.trim()) {
            errors.push("La marca del vehículo es requerida");
        }

        if (!vehicleData.model?.trim()) {
            errors.push("El modelo del vehículo es requerido");
        }

        if (
            !vehicleData.year ||
            vehicleData.year < 1990 ||
            vehicleData.year > new Date().getFullYear() + 1
        ) {
            errors.push(
                "El año del vehículo debe estar entre 1990 y " +
                    (new Date().getFullYear() + 1)
            );
        }

        if (
            !vehicleData.estimatedValue ||
            parseFloat(vehicleData.estimatedValue) <= 0
        ) {
            errors.push("El valor estimado debe ser mayor a 0");
        }

        // Validar datos del conductor
        const age = parseInt(driverData.age);
        if (!age || age < 18 || age > 100) {
            errors.push("La edad del conductor debe estar entre 18 y 100 años");
        }

        const experience = parseInt(driverData.drivingExperience);
        // Validación temporalmente deshabilitada - se implementará en el registro
        // if (experience < 0 || experience > age - 16) {
        //     errors.push(
        //         "La experiencia de manejo no puede ser negativa o mayor a la edad menos 16 años"
        //     );
        // }

        // Validar que se haya seleccionado un plan
        if (!selectedPlan) {
            errors.push("Debe seleccionar un plan de cobertura");
        }

        // Validar que no haya pólizas activas o cotizaciones pendientes para este vehículo
        if (hasActivePolicyForVehicle) {
            errors.push(
                "Este vehículo ya tiene una póliza activa o una cotización pendiente. No se pueden crear múltiples cotizaciones para el mismo vehículo."
            );
        }

        return errors;
    };

    const generateQuotePDF = (quoteData: any) => {
        const doc = new jsPDF();
        const currentDate = new Date().toLocaleDateString("es-ES");
        const selectedPlanDetails =
            POLICY_PLANS[selectedPlan as keyof typeof POLICY_PLANS];

        // Header
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("CONSTANCIA DE COTIZACIÓN", 105, 25, { align: "center" });

        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text("SeguraTuAuto", 105, 35, { align: "center" });

        // Quote number and date
        doc.setFontSize(10);
        doc.text(
            `Cotización No: ${quoteData.id || "COT-" + Date.now()}`,
            20,
            50
        );
        doc.text(`Fecha: ${currentDate}`, 150, 50);

        // Customer Information
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("INFORMACIÓN DEL CLIENTE", 20, 65);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(
            `Nombre: ${customerData?.first_name} ${customerData?.last_name}`,
            20,
            75
        );
        doc.text(`Email: ${customerData?.email}`, 20, 85);
        doc.text(
            `Teléfono: ${(customerData as any)?.phone || "No especificado"}`,
            20,
            95
        );
        doc.text(
            `País: ${(customerData as any)?.country || "No especificado"}`,
            20,
            105
        );

        // Vehicle Information
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("INFORMACIÓN DEL VEHÍCULO", 20, 120);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Marca: ${vehicleData.make}`, 20, 130);
        doc.text(`Modelo: ${vehicleData.model}`, 20, 140);
        doc.text(`Año: ${vehicleData.year}`, 20, 150);
        doc.text(
            `Valor Estimado: $${Number.parseFloat(
                vehicleData.estimatedValue
            ).toLocaleString()}`,
            20,
            160
        );
        doc.text(
            `Uso: ${
                vehicleData.usageType === "personal"
                    ? "Personal"
                    : vehicleData.usageType === "commercial"
                    ? "Comercial"
                    : vehicleData.usageType
            }`,
            20,
            170
        );
        doc.text(
            `Kilometraje Anual: ${Number.parseInt(
                vehicleData.annualMileage
            ).toLocaleString()} km`,
            20,
            180
        );

        // Plan Information
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("PLAN SELECCIONADO", 20, 195);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Plan: ${selectedPlanDetails?.name}`, 20, 205);
        doc.text(
            `Prima Mensual Base: $${selectedPlanDetails?.basePrice.toLocaleString()}`,
            20,
            215
        );

        // Coverage Details
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("COBERTURAS INCLUIDAS:", 20, 230);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        let yPos = 240;
        selectedPlanDetails?.coverages
            .filter((c) => c.included)
            .forEach((coverage, index) => {
                doc.text(`• ${coverage.name}`, 25, yPos);
                if (coverage.maxAmount) {
                    doc.text(
                        `  Hasta: $${coverage.maxAmount.toLocaleString()}`,
                        35,
                        yPos + 8
                    );
                    yPos += 16;
                } else {
                    yPos += 10;
                }
            });

        // Quote Summary
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMEN DE COTIZACIÓN", 20, yPos);

        yPos += 15;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(
            `Prima Anual Total: $${calculatedQuote.toLocaleString()}`,
            20,
            yPos
        );

        yPos += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Prima Mensual: $${Math.round(calculatedQuote / 12).toLocaleString()}`,
            20,
            yPos
        );
        doc.text(
            `Prima Trimestral: $${Math.round((calculatedQuote / 12) * 3).toLocaleString()}`,
            20,
            yPos + 10
        );
        doc.text(
            `Prima Semestral: $${Math.round((calculatedQuote / 12) * 6).toLocaleString()}`,
            20,
            yPos + 20
        );

        // Footer
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
            "Esta cotización tiene una validez de 30 días a partir de la fecha de emisión.",
            20,
            280
        );
        doc.text(
            "Los precios están sujetos a evaluación final y aprobación por parte de nuestros agentes.",
            20,
            288
        );
        doc.text(`Generado el ${currentDate} - SeguraTuAuto`, 105, 295, {
            align: "center",
        });

        // Save the PDF
        const fileName = `Cotización_${customerData?.first_name}_${
            customerData?.last_name
        }_${currentDate.replace(/\//g, "-")}.pdf`;
        doc.save(fileName);
    };

    const handleShowConfirmModal = () => {
        // Validar datos antes de mostrar el modal
        const errors = validateQuoteData();

        if (errors.length > 0) {
            setValidationErrors(errors);

            // Mostrar errores en modal personalizado
            const errorMessage =
                "Por favor corrija los siguientes errores:\n\n" +
                errors.map((error) => "• " + error).join("\n");

            setNotificationModal({
                open: true,
                type: "error",
                title: "Errores de validación",
                message: errorMessage,
            });
            return;
        }

        // Limpiar errores y mostrar modal
        setValidationErrors([]);
        setShowConfirmModal(true);
    };

    const handleCancelModal = () => {
        setShowConfirmModal(false);
    };

    const handleContractPolicy = async () => {
        setShowConfirmModal(false);
        setIsProcessing(true);

        // Validación final antes de procesar
        const errors = validateQuoteData();
        if (errors.length > 0) {
            setNotificationModal({
                open: true,
                type: "error",
                title: "Error de validación",
                message: errors[0],
            });
            setIsProcessing(false);
            return;
        }

        if (!selectedVehicleId || !customerData) {
            setNotificationModal({
                open: true,
                type: "error",
                title: "Datos insuficientes",
                message:
                    "No se pueden crear la cotización con los datos actuales",
            });
            setIsProcessing(false);
            return;
        }

        try {
            const selectedPlanDetails =
                POLICY_PLANS[selectedPlan as keyof typeof POLICY_PLANS];

            if (!selectedPlanDetails) {
                console.error(
                    "Selected plan not found in POLICY_PLANS:",
                    selectedPlan
                );
                setIsProcessing(false);
                return;
            }

            // Prepare quote data
            const currentDate = new Date();
            const endDate = new Date(
                currentDate.getFullYear() + 1,
                currentDate.getMonth(),
                currentDate.getDate()
            );

            const quoteData = {
                customer_id: customerData.id,
                vehicle_id: selectedVehicleId,
                policy_type: selectedPlan,
                start_date: currentDate.toISOString().split("T")[0],
                end_date: endDate.toISOString().split("T")[0],
                premium_amount: calculatedQuote,
                payment_frequency: "monthly",
                auto_renewal: true,
                selected_coverages: selectedPlanDetails.coverages.map(
                    (coverage) => ({
                        name: coverage.name,
                        description: coverage.description,
                        included: coverage.included,
                        maxAmount: coverage.maxAmount,
                        percentage: coverage.percentage,
                    })
                ),
                driver_data: driverData,
                vehicle_data: vehicleData,
                risk_assessment: {
                    age: driverData.age,
                    experience: driverData.drivingExperience,
                    vehicleAge: new Date().getFullYear() - vehicleData.year,
                    hasAccidents: driverData.hasAccidents,
                    hasClaims: driverData.hasClaims,
                    calculatedScore: 75, // Base score, can be enhanced later
                },
            };

            console.log("Creating quote with data:", quoteData);

            // Create quote via API
            const response = await fetch("/api/quotes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Incluir cookies de autenticación
                body: JSON.stringify(quoteData),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Determinar el tipo de error
                let userMessage = "";
                if (response.status === 400) {
                    userMessage =
                        "Datos de cotización incompletos o inválidos. Por favor verifica la información.";
                } else if (response.status === 401) {
                    userMessage =
                        "Sesión expirada. Por favor inicia sesión nuevamente.";
                } else if (response.status === 409) {
                    userMessage =
                        "Ya existe una póliza activa para este vehículo.";
                } else if (response.status >= 500) {
                    userMessage =
                        "Error del servidor. Por favor intenta nuevamente en unos momentos.";
                } else {
                    userMessage =
                        errorData.error ||
                        "Error desconocido al crear la cotización.";
                }

                throw new Error(userMessage);
            }

            const { quote } = await response.json();
            console.log("Quote created successfully:", quote);

            // Generate PDF after successful quote creation
            generateQuotePDF(quote);

            // Show success modal/message
            const successMessage =
                "¡Cotización creada exitosamente! 🎉\n\n" +
                `• Número de cotización: ${
                    quote.quote_number || "COT-" + Date.now()
                }\n` +
                `• Prima anual: $${calculatedQuote.toLocaleString()}\n` +
                `• Plan: ${
                    POLICY_PLANS[selectedPlan as keyof typeof POLICY_PLANS]
                        ?.name
                }\n\n` +
                "✅ Se ha descargado el PDF de constancia\n" +
                "⏳ Un agente revisará tu solicitud pronto\n" +
                "📧 Recibirás una notificación por correo";

            if (onSuccess) {
                onSuccess({
                    ...quote,
                    calculatedPremium: calculatedQuote,
                    vehicle: vehicleData,
                    message: successMessage,
                });
            } else {
                // Show success modal
                setNotificationModal({
                    open: true,
                    type: "success",
                    title: "¡Cotización creada exitosamente! 🎉",
                    message: successMessage,
                    onConfirm: () => {
                        router.push("/customer/quotes?success=true");
                    },
                });
            }
        } catch (error) {
            console.error("Error creating quote:", error);

            // Show user-friendly error message
            let errorMessage = "";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === "string") {
                errorMessage = error;
            } else {
                errorMessage = "Error desconocido al procesar la cotización";
            }

            // Show error modal
            const fullErrorMessage =
                errorMessage +
                "\n\n" +
                "💡 Sugerencias:\n" +
                "• Verifica que todos los campos estén completos\n" +
                "• Asegúrate de tener conexión a internet\n" +
                "• Si el problema persiste, contacta soporte";

            setNotificationModal({
                open: true,
                type: "error",
                title: "Error al crear la cotización",
                message: fullErrorMessage,
            });
        } finally {
            setIsProcessing(false);
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
                                            onValueChange={(value) => {
                                                if (
                                                    vehiclesWithPolicies.has(
                                                        value
                                                    )
                                                ) {
                                                    setNotificationModal({
                                                        open: true,
                                                        type: "warning",
                                                        title: "Vehículo Ya Asegurado",
                                                        message:
                                                            "Este vehículo ya tiene una póliza activa. Un vehículo solo puede tener una póliza activa a la vez. Puedes cotizar para otros vehículos disponibles.",
                                                    });
                                                    return;
                                                }
                                                setSelectedVehicleId(value);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un vehículo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicles.map((vehicle) => {
                                                    const hasActivePolicy =
                                                        vehiclesWithPolicies.has(
                                                            vehicle.id
                                                        );
                                                    return (
                                                        <SelectItem
                                                            key={vehicle.id}
                                                            value={vehicle.id}
                                                            disabled={
                                                                hasActivePolicy
                                                            }
                                                            className={
                                                                hasActivePolicy
                                                                    ? "opacity-50"
                                                                    : ""
                                                            }
                                                        >
                                                            <div className="flex items-center justify-between w-full">
                                                                <div className="flex items-center gap-2">
                                                                    <Car className="h-4 w-4" />
                                                                    {
                                                                        vehicle.year
                                                                    }{" "}
                                                                    {
                                                                        vehicle.make
                                                                    }{" "}
                                                                    {
                                                                        vehicle.model
                                                                    }{" "}
                                                                    -{" "}
                                                                    {
                                                                        vehicle.license_plate
                                                                    }
                                                                </div>
                                                                {hasActivePolicy && (
                                                                    <Badge
                                                                        variant="destructive"
                                                                        className="ml-2"
                                                                    >
                                                                        <Shield className="h-3 w-3 mr-1" />
                                                                        Asegurado
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
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

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <X className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                                            Errores de validación
                                        </h3>
                                        <ul className="space-y-1">
                                            {validationErrors.map(
                                                (error, index) => (
                                                    <li
                                                        key={index}
                                                        className="text-sm text-red-700 dark:text-red-300"
                                                    >
                                                        • {error}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Active Policy Warning */}
                    {hasActivePolicyForVehicle && selectedVehicleId && (
                        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                            Vehículo ya asegurado
                                        </h3>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            Este vehículo ya tiene una póliza
                                            activa. No puedes crear una nueva
                                            cotización para un vehículo que ya
                                            está asegurado. Si deseas cambiar tu
                                            cobertura, contacta a nuestro equipo
                                            de soporte.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quote Result */}
                    {calculatedQuote > 0 &&
                        !hasActivePolicyForVehicle &&
                        validationErrors.length === 0 && (
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <div className="text-sm text-muted-foreground mb-1">
                                                Plan {POLICY_PLANS[selectedPlan as keyof typeof POLICY_PLANS]?.name} - Base: $
                                                {POLICY_PLANS[selectedPlan as keyof typeof POLICY_PLANS]?.basePrice}/mes
                                            </div>
                                            <div className="text-lg font-semibold text-primary mb-1">
                                                Prima Mensual Ajustada: ${Math.round(calculatedQuote / 12).toLocaleString()}
                                            </div>
                                        </div>
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
                                                    {Math.round(calculatedQuote / 12).toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    Trimestral
                                                </div>
                                                <div className="text-muted-foreground">
                                                    $
                                                    {Math.round((calculatedQuote / 12) * 3).toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    Semestral
                                                </div>
                                                <div className="text-muted-foreground">
                                                    $
                                                    {Math.round((calculatedQuote / 12) * 6).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-blue-700">
                                                <strong>Nota:</strong> El precio final puede variar del precio base del plan debido a factores como edad del conductor, experiencia, historial de accidentes y características del vehículo.
                                            </p>
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
                                    className={`w-full font-semibold py-3 ${
                                        hasActivePolicyForVehicle ||
                                        validationErrors.length > 0 ||
                                        checkingPolicies
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    } text-white`}
                                    onClick={handleShowConfirmModal}
                                    disabled={
                                        isProcessing ||
                                        hasActivePolicyForVehicle ||
                                        validationErrors.length > 0 ||
                                        checkingPolicies
                                    }
                                >
                                    {checkingPolicies ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Verificando pólizas...
                                        </>
                                    ) : hasActivePolicyForVehicle ? (
                                        <>
                                            <Shield className="h-5 w-5 mr-2" />
                                            Vehículo ya asegurado
                                        </>
                                    ) : validationErrors.length > 0 ? (
                                        <>
                                            <X className="h-5 w-5 mr-2" />
                                            Corregir errores primero
                                        </>
                                    ) : isProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="h-5 w-5 mr-2" />
                                            <Download className="h-4 w-4 mr-1" />
                                            {`Solicitar Cotización + PDF - $${calculatedQuote.toLocaleString()}/año`}
                                        </>
                                    )}
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

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={showConfirmModal}
                title="Confirmar Solicitud de Cotización"
                message={`¿Estás seguro de que deseas solicitar esta cotización por $${calculatedQuote.toLocaleString()}/año con el plan ${
                    POLICY_PLANS[selectedPlan as keyof typeof POLICY_PLANS]
                        ?.name
                }? Se generará automáticamente un PDF como constancia.`}
                confirmText="Sí, solicitar y generar PDF"
                cancelText="Cancelar"
                onConfirm={handleContractPolicy}
                onCancel={handleCancelModal}
                isLoading={isProcessing}
            />

            {/* Notification Modal */}
            <NotificationModal
                open={notificationModal.open}
                onOpenChange={(open) =>
                    setNotificationModal((prev) => ({ ...prev, open }))
                }
                type={notificationModal.type}
                title={notificationModal.title}
                message={notificationModal.message}
                onConfirm={notificationModal.onConfirm}
            />
        </Card>
    );
}
