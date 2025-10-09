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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { Car, Calendar, DollarSign, Gauge } from "lucide-react";
import type { Vehicle } from "@/lib/types/database";

interface EditVehicleFormProps {
    vehicle: Vehicle;
    customerId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EditVehicleForm({
    vehicle,
    customerId,
    onSuccess,
    onCancel,
}: EditVehicleFormProps) {
    const [vehicleData, setVehicleData] = useState({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        vin: "",
        licensePlate: "",
        color: "",
        engineSize: "",
        fuelType: "", // ← CAMBIADO DE "Gasolina" A ""
        transmission: "", // ← CAMBIADO DE "Manual" A ""
        vehicleType: "", // ← CAMBIADO DE "Sedán" A ""
        usageType: "", // ← CAMBIADO DE "personal" A ""
        estimatedValue: "",
        mileage: "",
        garageType: "", // ← CAMBIADO DE "street" A ""
        annualMileage: "",
    });
    const [safetyFeatures, setSafetyFeatures] = useState<string[]>([]);
    const [antiTheftDevices, setAntiTheftDevices] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const supabase = createClient();

    // Función para normalizar valores de la BD con los del Select
    const normalizeSelectValue = (
        fieldName: string,
        value: string | null | undefined
    ) => {
        if (!value) return "";

        // Mapeo de valores para asegurar coincidencia exacta
        const valueMap: { [key: string]: { [key: string]: string } } = {
            fuelType: {
                Gasolina: "Gasolina",
                Diesel: "Diesel",
                Diésel: "Diesel",
                Híbrido: "Híbrido",
                Hibrido: "Híbrido",
                Eléctrico: "Eléctrico",
                Electrico: "Eléctrico",
                GLP: "GLP",
            },
            transmission: {
                Manual: "Manual",
                Automatico: "Automatico",
                Automático: "Automatico",
                Automática: "Automatico",
                Automatic: "Automatico",
                CVT: "CVT",
            },
            vehicleType: {
                Sedán: "Sedán",
                Sedan: "Sedán",
                Hatchback: "Hatchback",
                SUV: "SUV",
                Pickup: "Pickup",
                Coupé: "Coupé",
                Coupe: "Coupé",
                Convertible: "Convertible",
                Wagon: "Wagon",
                "Station Wagon": "Wagon",
            },
            usageType: {
                personal: "personal",
                commercial: "commercial",
                taxi: "taxi",
                delivery: "delivery",
                other: "other",
            },
            garageType: {
                enclosed: "enclosed",
                covered: "covered",
                street: "street",
            },
        };

        const mappedValue = valueMap[fieldName]?.[value] || value;
        console.log(
            `🔄 Normalizando ${fieldName}: "${value}" → "${mappedValue}"`
        );

        // Log adicional para debug específico
        if (fieldName === "transmission") {
            console.log("🔧 Debug transmission:");
            console.log("  - Valor original:", `"${value}"`);
            console.log("  - Valor mapeado:", `"${mappedValue}"`);
            console.log(
                "  - Mapeo disponible:",
                Object.keys(valueMap.transmission)
            );
        }

        return mappedValue;
    };

    // Llenar el formulario con los datos del vehículo existente
    useEffect(() => {
        console.log("🔄 useEffect ejecutándose. vehicle:", !!vehicle);

        if (vehicle) {
            console.log("🚗 Datos RAW del vehículo desde BD:", vehicle);

            // Log específico de los valores que vienen de la BD
            console.log("📊 VALORES RAW DE LA BD:");
            console.log("  fuel_type (BD):", `"${vehicle.fuel_type}"`);
            console.log("  transmission (BD):", `"${vehicle.transmission}"`);
            console.log("  vehicle_type (BD):", `"${vehicle.vehicle_type}"`);
            console.log("  usage_type (BD):", `"${vehicle.usage_type}"`);
            console.log("  garage_type (BD):", `"${vehicle.garage_type}"`);

            // Valores exactos que esperan los SelectItem
            console.log("🎯 VALORES ESPERADOS POR LOS SELECTITEM:");
            console.log(
                "  fuelType SelectItems: ['Gasolina', 'Diesel', 'Híbrido', 'Eléctrico', 'GLP']"
            );
            console.log(
                "  transmission SelectItems: ['Manual', 'Automatico', 'CVT']"
            );
            console.log(
                "  vehicleType SelectItems: ['Sedán', 'Hatchback', 'SUV', 'Pickup', 'Coupé', 'Convertible', 'Wagon']"
            );
            console.log(
                "  usageType SelectItems: ['personal', 'commercial', 'taxi', 'delivery', 'other']"
            );
            console.log(
                "  garageType SelectItems: ['enclosed', 'covered', 'street']"
            );
            console.log("🔧 fuel_type desde BD:", `"${vehicle.fuel_type}"`);
            console.log(
                "⚙️ transmission desde BD:",
                `"${vehicle.transmission}"`
            );
            console.log(
                "🚙 vehicle_type desde BD:",
                `"${vehicle.vehicle_type}"`
            );
            console.log("🎯 usage_type desde BD:", `"${vehicle.usage_type}"`);
            console.log("🏠 garage_type desde BD:", `"${vehicle.garage_type}"`);

            // Mapeo de valores de BD a valores de SelectItem
            const mapBdToSelectValue = (
                bdValue: string | undefined,
                field: string
            ): string => {
                console.log(`🗺️ Mapeando ${field}: "${bdValue}"`);

                if (!bdValue) return "";

                // Mapeos específicos según el campo
                const mappings: { [key: string]: { [key: string]: string } } = {
                    fuel_type: {
                        gasoline: "Gasolina",
                        gasolina: "Gasolina",
                        diesel: "Diesel",
                        hybrid: "Híbrido",
                        hibrido: "Híbrido",
                        electric: "Eléctrico",
                        electrico: "Eléctrico",
                        glp: "GLP",
                    },
                    transmission: {
                        manual: "Manual",
                        automatic: "Automatico",
                        automatico: "Automatico",
                        cvt: "CVT",
                    },
                    vehicle_type: {
                        sedan: "Sedán",
                        hatchback: "Hatchback",
                        suv: "SUV",
                        pickup: "Pickup",
                        coupe: "Coupé",
                        convertible: "Convertible",
                        wagon: "Wagon",
                    },
                    usage_type: {
                        personal: "personal",
                        commercial: "commercial",
                        taxi: "taxi",
                        delivery: "delivery",
                        other: "other",
                    },
                    garage_type: {
                        enclosed: "enclosed",
                        covered: "covered",
                        street: "street",
                        garage: "enclosed",
                        cubierto: "covered",
                        calle: "street",
                    },
                };

                const fieldMappings = mappings[field];
                if (fieldMappings) {
                    const normalizedBdValue = bdValue.toLowerCase().trim();
                    const mappedValue =
                        fieldMappings[normalizedBdValue] || bdValue;
                    console.log(`   "${bdValue}" → "${mappedValue}"`);
                    return mappedValue;
                }

                return bdValue;
            };

            const newVehicleData = {
                make: vehicle.make || "",
                model: vehicle.model || "",
                year: vehicle.year || new Date().getFullYear(),
                vin: vehicle.vin || "",
                licensePlate: vehicle.license_plate || "",
                color: vehicle.color || "",
                engineSize: vehicle.engine_size || "",
                fuelType: mapBdToSelectValue(vehicle.fuel_type, "fuel_type"),
                transmission: mapBdToSelectValue(
                    vehicle.transmission,
                    "transmission"
                ),
                vehicleType: mapBdToSelectValue(
                    vehicle.vehicle_type,
                    "vehicle_type"
                ),
                usageType: mapBdToSelectValue(vehicle.usage_type, "usage_type"),
                estimatedValue: vehicle.estimated_value?.toString() || "",
                mileage: vehicle.mileage?.toString() || "",
                garageType: mapBdToSelectValue(
                    vehicle.garage_type,
                    "garage_type"
                ),
                annualMileage: vehicle.annual_mileage?.toString() || "",
            };

            console.log(
                "📝 Datos que se van a establecer en el estado:",
                newVehicleData
            );
            console.log("🎯 Valores finales para Select:");
            console.log("  - fuelType:", `"${newVehicleData.fuelType}"`);
            console.log(
                "  - transmission:",
                `"${newVehicleData.transmission}"`
            );
            console.log("  - vehicleType:", `"${newVehicleData.vehicleType}"`);
            console.log("  - usageType:", `"${newVehicleData.usageType}"`);
            console.log("  - garageType:", `"${newVehicleData.garageType}"`);

            // Verificar si los valores coinciden con las opciones del Select
            const validValues = {
                transmission: ["Manual", "Automatico", "CVT"],
                vehicleType: [
                    "Sedán",
                    "Hatchback",
                    "SUV",
                    "Pickup",
                    "Coupé",
                    "Convertible",
                    "Wagon",
                ],
                fuelType: ["Gasolina", "Diesel", "Híbrido", "Eléctrico", "GLP"],
                usageType: [
                    "personal",
                    "commercial",
                    "taxi",
                    "delivery",
                    "other",
                ],
                garageType: ["enclosed", "covered", "street"],
            };

            Object.entries(validValues).forEach(([field, validOptions]) => {
                const currentValue =
                    newVehicleData[field as keyof typeof newVehicleData];
                const isValid = validOptions.includes(currentValue as string);
                console.log(
                    `✅ ${field}: "${currentValue}" ${
                        isValid ? "✓ VÁLIDO" : "❌ NO VÁLIDO"
                    }`
                );
                if (!isValid) {
                    console.log(`   Opciones válidas:`, validOptions);
                }
            });

            setVehicleData(newVehicleData);
            setSafetyFeatures(vehicle.safety_features || []);
            setAntiTheftDevices(vehicle.anti_theft_devices || []);
            setIsDataLoaded(true);

            // Log del estado después de establecerlo
            setTimeout(() => {
                console.log(
                    "📝 Estado vehicleData después de cargar:",
                    newVehicleData
                );

                // Log adicional para verificar el estado actual
                console.log("🔍 VERIFICACIÓN DEL ESTADO ACTUAL:");
                console.log(
                    "  vehicleData.fuelType:",
                    `"${vehicleData.fuelType}"`
                );
                console.log(
                    "  vehicleData.transmission:",
                    `"${vehicleData.transmission}"`
                );
                console.log(
                    "  vehicleData.vehicleType:",
                    `"${vehicleData.vehicleType}"`
                );
                console.log(
                    "  vehicleData.usageType:",
                    `"${vehicleData.usageType}"`
                );
                console.log(
                    "  vehicleData.garageType:",
                    `"${vehicleData.garageType}"`
                );

                // Verificar coincidencias exactas con SelectItem values
                const validValues = {
                    fuelType: [
                        "Gasolina",
                        "Diesel",
                        "Híbrido",
                        "Eléctrico",
                        "GLP",
                    ],
                    transmission: ["Manual", "Automatico", "CVT"],
                    vehicleType: [
                        "Sedán",
                        "Hatchback",
                        "SUV",
                        "Pickup",
                        "Coupé",
                        "Convertible",
                        "Wagon",
                    ],
                    usageType: [
                        "personal",
                        "commercial",
                        "taxi",
                        "delivery",
                        "other",
                    ],
                    garageType: ["enclosed", "covered", "street"],
                };

                Object.entries(validValues).forEach(([field, validOptions]) => {
                    const currentValue =
                        newVehicleData[field as keyof typeof newVehicleData];
                    const isValid = validOptions.includes(
                        currentValue as string
                    );
                    console.log(
                        `🔍 ${field}: "${currentValue}" ${
                            isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO"
                        }`
                    );
                    if (!isValid) {
                        console.log(
                            `   Opciones válidas: [${validOptions
                                .map((v) => `"${v}"`)
                                .join(", ")}]`
                        );
                    }
                });
            }, 100);
        } else {
            console.log("❌ useEffect ejecutado pero no hay vehículo");
        }
    }, [vehicle]);

    const handleInputChange = (field: string, value: string | number) => {
        console.log(`📝 Editando campo ${field} a:`, value);
        setVehicleData((prev) => {
            const newData = { ...prev, [field]: value };
            console.log(`📋 Nuevo estado después de cambio:`, newData);
            return newData;
        });
    };

    // Función para validar si todos los campos obligatorios están llenos
    const isFormValid = () => {
        const requiredFields = [
            vehicleData.make.trim(),
            vehicleData.model.trim(),
            vehicleData.year,
            vehicleData.vin.trim(),
            vehicleData.licensePlate.trim(),
            vehicleData.color.trim(),
            vehicleData.engineSize.trim(),
            vehicleData.estimatedValue.trim(),
            vehicleData.mileage.trim(),
            vehicleData.annualMileage.trim(),
        ];

        // Verificar que todos los campos requeridos tengan valor
        const allFieldsFilled = requiredFields.every((field) => {
            if (typeof field === "number") {
                return field > 0;
            }
            return field && field.length > 0;
        });

        // Verificar que el año sea válido
        const validYear =
            vehicleData.year >= 1990 &&
            vehicleData.year <= new Date().getFullYear() + 1;

        return allFieldsFilled && validYear;
    };

    const handleFeatureToggle = (
        feature: string,
        type: "safety" | "antitheft"
    ) => {
        if (type === "safety") {
            setSafetyFeatures((prev) =>
                prev.includes(feature)
                    ? prev.filter((f) => f !== feature)
                    : [...prev, feature]
            );
        } else {
            setAntiTheftDevices((prev) =>
                prev.includes(feature)
                    ? prev.filter((f) => f !== feature)
                    : [...prev, feature]
            );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Validaciones básicas del lado cliente
            if (!vehicleData.make || !vehicleData.model) {
                setError("Los campos Marca y Modelo son obligatorios");
                setLoading(false);
                return;
            }

            if (
                vehicleData.year < 1990 ||
                vehicleData.year > new Date().getFullYear() + 1
            ) {
                setError(
                    "El año del vehículo debe estar entre 1990 y " +
                        (new Date().getFullYear() + 1)
                );
                setLoading(false);
                return;
            }

            // Preparar datos para actualización
            const vehiclePayload = {
                make: vehicleData.make.trim(),
                model: vehicleData.model.trim(),
                year: vehicleData.year,
                vin: vehicleData.vin ? vehicleData.vin.trim() : null,
                license_plate: vehicleData.licensePlate
                    ? vehicleData.licensePlate.trim()
                    : null,
                color: vehicleData.color ? vehicleData.color.trim() : null,
                engine_size: vehicleData.engineSize
                    ? vehicleData.engineSize.trim()
                    : null,
                fuel_type: vehicleData.fuelType,
                transmission: vehicleData.transmission,
                vehicle_type: vehicleData.vehicleType,
                usage_type: vehicleData.usageType,
                estimated_value: vehicleData.estimatedValue
                    ? Number.parseFloat(vehicleData.estimatedValue)
                    : null,
                mileage: vehicleData.mileage
                    ? Number.parseInt(vehicleData.mileage)
                    : null,
                garage_type: vehicleData.garageType,
                annual_mileage: vehicleData.annualMileage
                    ? Number.parseInt(vehicleData.annualMileage)
                    : null,
                safety_features: safetyFeatures,
                anti_theft_devices: antiTheftDevices,
                updated_at: new Date().toISOString(),
            };

            console.log(
                "Datos actuales del formulario de edición:",
                vehicleData
            );
            console.log("Actualizando vehículo:", vehiclePayload);

            // Actualizar en la base de datos
            const { data, error } = await supabase
                .from("vehicles")
                .update(vehiclePayload)
                .eq("id", vehicle.id)
                .eq("customer_id", customerId) // Verificación de seguridad adicional
                .select()
                .single();

            if (error) {
                console.error("Error de Supabase:", error);

                // Manejo específico de errores
                if (error.code === "23505") {
                    // Unique constraint violation
                    if (error.message.includes("vin")) {
                        setError(
                            "El VIN ingresado ya está registrado por otro vehículo"
                        );
                    } else if (error.message.includes("license_plate")) {
                        setError(
                            "Las placas ingresadas ya están registradas por otro vehículo"
                        );
                    } else {
                        setError(
                            "Ya existe otro vehículo con esos datos en el sistema"
                        );
                    }
                } else if (error.code === "23514") {
                    // Check constraint violation
                    setError(
                        "Uno de los valores ingresados no es válido. Verifique los campos de selección."
                    );
                } else if (error.code === "23503") {
                    // Foreign key violation
                    setError(
                        "Error de vinculación con el cliente. Por favor, intente nuevamente."
                    );
                } else {
                    setError(
                        `Error al actualizar el vehículo: ${error.message}`
                    );
                }
                return;
            }

            console.log("Vehículo actualizado exitosamente:", data);
            setSuccess("¡Vehículo actualizado exitosamente!");

            if (onSuccess) {
                setTimeout(() => onSuccess(), 1500);
            }
        } catch (error) {
            console.error("Error inesperado:", error);
            setError(
                "Error inesperado al actualizar el vehículo. Por favor, intente nuevamente."
            );
        } finally {
            setLoading(false);
        }
    };

    const safetyFeatureOptions = [
        "ABS",
        "Airbags frontales",
        "Airbags laterales",
        "Control de estabilidad",
        "Frenos de emergencia",
        "Cámara de reversa",
        "Sensores de estacionamiento",
        "Control de crucero adaptativo",
        "Alerta de punto ciego",
        "Asistente de carril",
    ];

    const antiTheftOptions = [
        "Alarma",
        "Inmovilizador",
        "GPS tracker",
        "Bloqueo de volante",
        "Bloqueo de pedales",
        "Vidrios polarizados",
        "Sistema de rastreo",
        "Cerradura de seguridad",
        "Grabado de cristales",
    ];

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Editar Vehículo
                </CardTitle>
                <CardDescription>
                    Modifica la información del vehículo {vehicle.year}{" "}
                    {vehicle.make} {vehicle.model}
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
                    {/* Indicador de campos requeridos */}
                    {!isFormValid() && (
                        <Alert>
                            <AlertDescription>
                                Por favor, rellene todos los campos requeridos
                                marcados con asterisco (*) para continuar.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Basic Vehicle Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="make">Marca *</Label>
                            <Input
                                id="make"
                                placeholder="Toyota, Honda, Ford..."
                                value={vehicleData.make}
                                onChange={(e) =>
                                    handleInputChange("make", e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="model">Modelo *</Label>
                            <Input
                                id="model"
                                placeholder="Corolla, Civic, Focus..."
                                value={vehicleData.model}
                                onChange={(e) =>
                                    handleInputChange("model", e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="year">Año *</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="year"
                                    type="number"
                                    min="1990"
                                    max={new Date().getFullYear() + 1}
                                    value={vehicleData.year}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "year",
                                            Number.parseInt(e.target.value)
                                        )
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="vin">VIN *</Label>
                            <Input
                                id="vin"
                                placeholder="Número de identificación vehicular"
                                value={vehicleData.vin}
                                onChange={(e) =>
                                    handleInputChange("vin", e.target.value)
                                }
                                maxLength={17}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                17 caracteres alfanuméricos
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="licensePlate">Placas *</Label>
                            <Input
                                id="licensePlate"
                                placeholder="ABC-123"
                                value={vehicleData.licensePlate}
                                onChange={(e) =>
                                    handleInputChange(
                                        "licensePlate",
                                        e.target.value
                                    )
                                }
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Placas del vehículo
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="color">Color *</Label>
                            <Input
                                id="color"
                                placeholder="Blanco, Negro, Rojo..."
                                value={vehicleData.color}
                                onChange={(e) =>
                                    handleInputChange("color", e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="engineSize">
                                Tamaño del Motor *
                            </Label>
                            <Input
                                id="engineSize"
                                placeholder="1.6L, 2.0L, V6..."
                                value={vehicleData.engineSize}
                                onChange={(e) =>
                                    handleInputChange(
                                        "engineSize",
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fuelType">
                                Tipo de Combustible
                            </Label>
                            {isDataLoaded ? (
                                <Select
                                    key={`fuelType-${vehicleData.fuelType}`}
                                    value={vehicleData.fuelType || ""}
                                    onValueChange={(value) => {
                                        console.log(
                                            "⛽ Cambiando fuelType a:",
                                            value
                                        );
                                        handleInputChange("fuelType", value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona combustible" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        className="z-50 min-w-[var(--radix-select-trigger-width)] max-w-none"
                                        position="popper"
                                        side="bottom"
                                        align="start"
                                    >
                                        <SelectItem value="Gasolina">
                                            Gasolina
                                        </SelectItem>
                                        <SelectItem value="Diesel">
                                            Diésel
                                        </SelectItem>
                                        <SelectItem value="Híbrido">
                                            Híbrido
                                        </SelectItem>
                                        <SelectItem value="Eléctrico">
                                            Eléctrico
                                        </SelectItem>
                                        <SelectItem value="GLP">GLP</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                            )}
                        </div>
                    </div>

                    {/* Vehicle Type and Usage */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="transmission">Transmisión</Label>
                            {isDataLoaded ? (
                                <Select
                                    key={`transmission-${vehicleData.transmission}`}
                                    value={vehicleData.transmission || ""}
                                    onValueChange={(value) => {
                                        console.log(
                                            "🔧 Cambiando transmission a:",
                                            value
                                        );
                                        handleInputChange(
                                            "transmission",
                                            value
                                        );
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona transmisión" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        className="z-50 min-w-[var(--radix-select-trigger-width)] max-w-none"
                                        position="popper"
                                        side="bottom"
                                        align="start"
                                    >
                                        <SelectItem value="Manual">
                                            Manual
                                        </SelectItem>
                                        <SelectItem value="Automatico">
                                            Automática
                                        </SelectItem>
                                        <SelectItem value="CVT">CVT</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicleType">
                                Tipo de Vehículo
                            </Label>
                            {isDataLoaded ? (
                                <Select
                                    key={`vehicleType-${vehicleData.vehicleType}`}
                                    value={vehicleData.vehicleType || ""}
                                    onValueChange={(value) => {
                                        console.log(
                                            "🚙 Cambiando vehicleType a:",
                                            value
                                        );
                                        handleInputChange("vehicleType", value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona tipo de vehículo" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        className="z-50 min-w-[var(--radix-select-trigger-width)] max-w-none"
                                        position="popper"
                                        side="bottom"
                                        align="start"
                                    >
                                        <SelectItem value="Sedán">
                                            Sedán
                                        </SelectItem>
                                        <SelectItem value="Hatchback">
                                            Hatchback
                                        </SelectItem>
                                        <SelectItem value="SUV">SUV</SelectItem>
                                        <SelectItem value="Pickup">
                                            Pickup
                                        </SelectItem>
                                        <SelectItem value="Coupé">
                                            Coupé
                                        </SelectItem>
                                        <SelectItem value="Convertible">
                                            Convertible
                                        </SelectItem>
                                        <SelectItem value="Wagon">
                                            Station Wagon
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="usageType">Uso del Vehículo</Label>
                            {isDataLoaded ? (
                                <Select
                                    key={`usageType-${vehicleData.usageType}`}
                                    value={vehicleData.usageType || ""}
                                    onValueChange={(value) => {
                                        console.log(
                                            "🎯 Cambiando usageType a:",
                                            value
                                        );
                                        handleInputChange("usageType", value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona uso del vehículo" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        className="z-50 min-w-[var(--radix-select-trigger-width)] max-w-none"
                                        position="popper"
                                        side="bottom"
                                        align="start"
                                    >
                                        <SelectItem value="personal">
                                            Personal
                                        </SelectItem>
                                        <SelectItem value="commercial">
                                            Comercial
                                        </SelectItem>
                                        <SelectItem value="taxi">
                                            Taxi
                                        </SelectItem>
                                        <SelectItem value="delivery">
                                            Delivery
                                        </SelectItem>
                                        <SelectItem value="other">
                                            Otro
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                            )}
                        </div>
                    </div>

                    {/* Financial and Usage Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="estimatedValue">
                                Valor Estimado *
                            </Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="estimatedValue"
                                    type="number"
                                    placeholder="200000"
                                    value={vehicleData.estimatedValue}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "estimatedValue",
                                            e.target.value
                                        )
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Valor aproximado en moneda local
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mileage">
                                Kilometraje Actual *
                            </Label>
                            <div className="relative">
                                <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="mileage"
                                    type="number"
                                    placeholder="50000"
                                    value={vehicleData.mileage}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "mileage",
                                            e.target.value
                                        )
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="annualMileage">
                                Kilometraje Anual *
                            </Label>
                            <div className="relative">
                                <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="annualMileage"
                                    type="number"
                                    placeholder="15000"
                                    value={vehicleData.annualMileage}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "annualMileage",
                                            e.target.value
                                        )
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Garage Type */}
                    <div className="space-y-2">
                        <Label htmlFor="garageType">
                            Tipo de Estacionamiento
                        </Label>
                        {isDataLoaded ? (
                            <Select
                                key={`garageType-${vehicleData.garageType}`}
                                value={vehicleData.garageType || ""}
                                onValueChange={(value) => {
                                    console.log(
                                        "🏠 Cambiando garageType a:",
                                        value
                                    );
                                    handleInputChange("garageType", value);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo de estacionamiento" />
                                </SelectTrigger>
                                <SelectContent 
                                    className="z-50 min-w-[var(--radix-select-trigger-width)] max-w-none"
                                    position="popper"
                                    side="bottom"
                                    align="start"
                                >
                                    <SelectItem value="enclosed">
                                        Garage cerrado
                                    </SelectItem>
                                    <SelectItem value="covered">
                                        Cochera techada
                                    </SelectItem>
                                    <SelectItem value="street">
                                        Calle
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                        )}
                    </div>

                    {/* Safety Features */}
                    <div className="space-y-4">
                        <Label>Características de Seguridad</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {safetyFeatureOptions.map((feature) => (
                                <label
                                    key={feature}
                                    className="flex items-center space-x-2 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={safetyFeatures.includes(
                                            feature
                                        )}
                                        onChange={() =>
                                            handleFeatureToggle(
                                                feature,
                                                "safety"
                                            )
                                        }
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">{feature}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Anti-theft Devices */}
                    <div className="space-y-4">
                        <Label>Dispositivos Antirrobo</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {antiTheftOptions.map((device) => (
                                <label
                                    key={device}
                                    className="flex items-center space-x-2 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={antiTheftDevices.includes(
                                            device
                                        )}
                                        onChange={() =>
                                            handleFeatureToggle(
                                                device,
                                                "antitheft"
                                            )
                                        }
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">{device}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6">
                        <Button
                            type="submit"
                            disabled={loading || !isFormValid()}
                            className="flex-1"
                        >
                            {loading
                                ? "Actualizando vehículo..."
                                : "Actualizar Vehículo"}
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
