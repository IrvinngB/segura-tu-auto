"use client";

import type React from "react";

import { useState } from "react";
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

interface VehicleFormProps {
    customerId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function VehicleForm({
    customerId,
    onSuccess,
    onCancel,
}: VehicleFormProps) {
    const [vehicleData, setVehicleData] = useState({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        vin: "",
        licensePlate: "",
        color: "",
        engineSize: "",
        fuelType: "Gasolina",
        transmission: "Manual",
        vehicleType: "Sedán",
        usageType: "personal",
        estimatedValue: "",
        mileage: "",
        garageType: "street",
        annualMileage: "",
    });
    const [safetyFeatures, setSafetyFeatures] = useState<string[]>([]);
    const [antiTheftDevices, setAntiTheftDevices] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const supabase = createClient();

    const handleInputChange = (field: string, value: string | number) => {
        console.log(`Cambiando campo ${field} a:`, value);
        setVehicleData((prev) => ({ ...prev, [field]: value }));
    };

    // Función para validar si todos los campos obligatorios están llenos
    const isFormValid = () => {
        // Validar campos de texto obligatorios
        const textFieldsValid =
            vehicleData.make.trim() !== "" &&
            vehicleData.model.trim() !== "" &&
            vehicleData.vin.trim() !== "" &&
            vehicleData.licensePlate.trim() !== "" &&
            vehicleData.color.trim() !== "" &&
            vehicleData.engineSize.trim() !== "";

        // Validar campos numéricos obligatorios
        const numericFieldsValid =
            vehicleData.estimatedValue.trim() !== "" &&
            !isNaN(Number(vehicleData.estimatedValue)) &&
            Number(vehicleData.estimatedValue) > 0 &&
            vehicleData.mileage.trim() !== "" &&
            !isNaN(Number(vehicleData.mileage)) &&
            Number(vehicleData.mileage) >= 0 &&
            vehicleData.annualMileage.trim() !== "" &&
            !isNaN(Number(vehicleData.annualMileage)) &&
            Number(vehicleData.annualMileage) >= 0;

        // Verificar que el año sea válido
        const validYear =
            vehicleData.year >= 1990 &&
            vehicleData.year <= new Date().getFullYear() + 1;

        const isValid = textFieldsValid && numericFieldsValid && validYear;

        // Debug detallado para ver qué está fallando
        console.log("=== VALIDACIÓN DETALLADA ===");
        console.log("Campos de texto:", {
            make: `"${vehicleData.make}" - ${vehicleData.make.trim() !== ""}`,
            model: `"${vehicleData.model}" - ${vehicleData.model.trim() !== ""}`,
            vin: `"${vehicleData.vin}" - ${vehicleData.vin.trim() !== ""}`,
            licensePlate: `"${vehicleData.licensePlate}" - ${vehicleData.licensePlate.trim() !== ""}`,
            color: `"${vehicleData.color}" - ${vehicleData.color.trim() !== ""}`,
            engineSize: `"${vehicleData.engineSize}" - ${vehicleData.engineSize.trim() !== ""}`,
            textFieldsValid
        });
        
        console.log("Campos numéricos:", {
            estimatedValue: `"${vehicleData.estimatedValue}" - ${vehicleData.estimatedValue.trim() !== "" && !isNaN(Number(vehicleData.estimatedValue)) && Number(vehicleData.estimatedValue) > 0}`,
            mileage: `"${vehicleData.mileage}" - ${vehicleData.mileage.trim() !== "" && !isNaN(Number(vehicleData.mileage)) && Number(vehicleData.mileage) >= 0}`,
            annualMileage: `"${vehicleData.annualMileage}" - ${vehicleData.annualMileage.trim() !== "" && !isNaN(Number(vehicleData.annualMileage)) && Number(vehicleData.annualMileage) >= 0}`,
            numericFieldsValid
        });
        
        console.log("Año:", {
            year: vehicleData.year,
            validYear,
            range: `${1990} - ${new Date().getFullYear() + 1}`
        });
        
        console.log("RESULTADO FINAL:", { isValid });
        console.log("=========================");

        return isValid;
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

            // Preparar datos para inserción
            const vehiclePayload = {
                customer_id: customerId,
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
            };

            console.log("Datos actuales del formulario:", vehicleData);
            console.log("Registrando vehículo:", vehiclePayload);

            const { data, error } = await supabase
                .from("vehicles")
                .insert(vehiclePayload)
                .select()
                .single();

            if (error) {
                console.error("Error de Supabase:", error);

                // Manejo específico de errores
                if (error.code === "23505") {
                    // Unique constraint violation
                    if (error.message.includes("vin")) {
                        setError(
                            "El VIN ingresado ya está registrado en el sistema"
                        );
                    } else if (error.message.includes("license_plate")) {
                        setError(
                            "Las placas ingresadas ya están registradas en el sistema"
                        );
                    } else {
                        setError(
                            "Ya existe un vehículo con esos datos en el sistema"
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
                        `Error al registrar el vehículo: ${error.message}`
                    );
                }
                return;
            }

            console.log("Vehículo registrado exitosamente:", data);
            setSuccess("¡Vehículo registrado exitosamente!");

            if (onSuccess) {
                setTimeout(() => onSuccess(), 1500);
            }
        } catch (error) {
            console.error("Error inesperado:", error);
            setError(
                "Error inesperado al registrar el vehículo. Por favor, intente nuevamente."
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
                    Registrar Vehículo
                </CardTitle>
                <CardDescription>
                    Complete la información del vehículo para el seguro
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
                                Por favor, ingrese todos los datos obligatorios
                                que están marcados con asterisco (*).
                            </AlertDescription>
                        </Alert>
                    )}{" "}
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
                            <Select
                                value={vehicleData.fuelType}
                                onValueChange={(value) =>
                                    handleInputChange("fuelType", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                        </div>
                    </div>
                    {/* Vehicle Type and Usage */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="transmission">Transmisión</Label>
                            <Select
                                value={vehicleData.transmission}
                                onValueChange={(value) =>
                                    handleInputChange("transmission", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manual">
                                        Manual
                                    </SelectItem>
                                    <SelectItem value="Automatico">
                                        Automática
                                    </SelectItem>
                                    <SelectItem value="CVT">CVT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicleType">
                                Tipo de Vehículo
                            </Label>
                            <Select
                                value={vehicleData.vehicleType}
                                onValueChange={(value) =>
                                    handleInputChange("vehicleType", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sedán">Sedán</SelectItem>
                                    <SelectItem value="Hatchback">
                                        Hatchback
                                    </SelectItem>
                                    <SelectItem value="SUV">SUV</SelectItem>
                                    <SelectItem value="Pickup">
                                        Pickup
                                    </SelectItem>
                                    <SelectItem value="Coupé">Coupé</SelectItem>
                                    <SelectItem value="Convertible">
                                        Convertible
                                    </SelectItem>
                                    <SelectItem value="Wagon">
                                        Station Wagon
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="usageType">Uso del Vehículo</Label>
                            <Select
                                value={vehicleData.usageType}
                                onValueChange={(value) =>
                                    handleInputChange("usageType", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="personal">
                                        Personal
                                    </SelectItem>
                                    <SelectItem value="commercial">
                                        Comercial
                                    </SelectItem>
                                    <SelectItem value="taxi">Taxi</SelectItem>
                                    <SelectItem value="delivery">
                                        Delivery
                                    </SelectItem>
                                    <SelectItem value="other">Otro</SelectItem>
                                </SelectContent>
                            </Select>
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
                        <Select
                            value={vehicleData.garageType}
                            onValueChange={(value) =>
                                handleInputChange("garageType", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="enclosed">
                                    Garage cerrado
                                </SelectItem>
                                <SelectItem value="covered">
                                    Cochera techada
                                </SelectItem>
                                <SelectItem value="street">Calle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Safety Features */}
                    <div className="space-y-4">
                        <Label>Características de Seguridad</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {safetyFeatureOptions.map((feature) => (
                                <label
                                    key={feature}
                                    className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-md transition-colors"
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
                                        className="w-4 h-4 rounded border-2 border-gray-400 text-blue-600 bg-white shadow-md hover:shadow-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:bg-gray-700 dark:border-gray-500 dark:checked:bg-blue-600 dark:checked:border-blue-600 dark:shadow-xl dark:hover:shadow-2xl dark:focus:ring-blue-400"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        {feature}
                                    </span>
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
                                    className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-md transition-colors"
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
                                        className="w-4 h-4 rounded border-2 border-gray-400 text-blue-600 bg-white shadow-md hover:shadow-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:bg-gray-700 dark:border-gray-500 dark:checked:bg-blue-600 dark:checked:border-blue-600 dark:shadow-xl dark:hover:shadow-2xl dark:focus:ring-blue-400"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        {device}
                                    </span>
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
                                ? "Registrando vehículo..."
                                : "Registrar Vehículo"}
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
