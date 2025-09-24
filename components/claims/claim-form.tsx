"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Policy, Customer } from "@/lib/types/database";
import {
    FileText,
    Calendar,
    MapPin,
    AlertTriangle,
    Upload,
    X,
    CheckCircle,
    Users,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface ClaimFormProps {
    policyId?: string;
    customerId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ClaimForm({
    policyId,
    customerId,
    onSuccess,
    onCancel,
}: ClaimFormProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState(customerId || "");
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedPolicy, setSelectedPolicy] = useState(policyId || "");
    const [loadingPolicies, setLoadingPolicies] = useState(false);
    const [claimData, setClaimData] = useState({
        incidentDate: format(new Date(), "yyyy-MM-dd"),
        incidentTime: "12:00",
        claimType: "Colisión",
        incidentDescription: "",
        incidentLocation: "",
        policeReportNumber: "",
        estimatedDamageCost: "",
        thirdPartyInvolved: false,
        injuryInvolved: false,
        priority: "medium",
    });
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [countdown, setCountdown] = useState(0);
    const supabase = createClient();

    // Efecto para el temporizador del modal de éxito
    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
                if (countdown === 1) {
                    // Cuando llegue a 0, cerrar el modal y ejecutar onSuccess
                    setSuccess("");
                    if (onSuccess) {
                        onSuccess();
                    }
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [success, countdown, onSuccess]);

    useEffect(() => {
        // Si no hay customerId (caso de agentes), cargar lista de clientes
        if (!customerId) {
            fetchCustomers();
        } else {
            // Si hay customerId (caso de customer), usar ese ID
            setSelectedCustomer(customerId);
        }
    }, [customerId]);

    useEffect(() => {
        // Cargar pólizas cuando se selecciona un cliente
        if (selectedCustomer) {
            fetchPolicies();
        } else {
            setPolicies([]);
            setSelectedPolicy("");
        }
    }, [selectedCustomer]);

    const fetchCustomers = async () => {
        try {
            setLoadingCustomers(true);
            const { data, error } = await supabase
                .from("customers")
                .select(
                    `
                    *,
                    user:users(*)
                `
                )
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) setCustomers(data);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setError("Error cargando clientes");
        } finally {
            setLoadingCustomers(false);
        }
    };

    const fetchPolicies = async () => {
        try {
            setLoadingPolicies(true);
            let query = supabase
                .from("policies")
                .select(
                    `
          *,
          customer:customers(
            *,
            user:users(*)
          ),
          vehicle:vehicles(*)
        `
                )
                .eq("status", "active")
                .order("created_at", { ascending: false });

            // Usar selectedCustomer en lugar de customerId
            if (selectedCustomer) {
                query = query.eq("customer_id", selectedCustomer);
            }

            const { data, error } = await query;

            if (error) throw error;
            if (data) setPolicies(data);
        } catch (error) {
            console.error("Error fetching policies:", error);
            setError("Error cargando pólizas");
        } finally {
            setLoadingPolicies(false);
        }
    };

    const handleInputChange = (
        field: string,
        value: string | number | boolean
    ) => {
        setClaimData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter((file) => {
            const validTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "application/pdf",
            ];
            const maxSize = 10 * 1024 * 1024; // 10MB
            return validTypes.includes(file.type) && file.size <= maxSize;
        });

        if (validFiles.length !== files.length) {
            setError(
                "Algunos archivos no son válidos. Solo se permiten imágenes (JPG, PNG, GIF) y PDF hasta 10MB"
            );
        }

        setUploadedFiles((prev) => [...prev, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const generateClaimNumber = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, "0");
        return `CLM-${year}-${random}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            console.log("🔍 Starting claim submission:", {
                selectedCustomer,
                selectedPolicy,
            });

            if (!selectedCustomer) {
                throw new Error("Debe seleccionar un cliente");
            }

            if (!selectedPolicy) {
                throw new Error("Debe seleccionar una póliza");
            }

            const policy = policies.find((p) => p.id === selectedPolicy);
            if (!policy) {
                throw new Error("Póliza no encontrada");
            }

            console.log("📋 Policy found:", policy);

            const claimNumber = generateClaimNumber();
            const incidentDateTime = new Date(
                `${claimData.incidentDate}T${claimData.incidentTime}:00`
            );

            console.log("📝 Creating claim with data:", {
                claim_number: claimNumber,
                policy_id: selectedPolicy,
                customer_id: selectedCustomer,
                incident_date: incidentDateTime.toISOString(),
                claim_type: claimData.claimType,
                incident_description: claimData.incidentDescription,
            });

            // Create claim
            const { data: claim, error: claimError } = await supabase
                .from("claims")
                .insert({
                    claim_number: claimNumber,
                    policy_id: selectedPolicy,
                    customer_id: selectedCustomer,
                    incident_date: incidentDateTime.toISOString(),
                    claim_type: claimData.claimType,
                    status: "submitted",
                    incident_description: claimData.incidentDescription,
                    incident_location: claimData.incidentLocation || null,
                    estimated_damage_cost: claimData.estimatedDamageCost
                        ? Number.parseFloat(claimData.estimatedDamageCost)
                        : null,
                    priority: claimData.priority,
                })
                .select()
                .single();

            console.log("✅ Claim creation result:", { claim, claimError });

            if (claimError) throw claimError;

            // Upload files if any
            if (uploadedFiles.length > 0) {
                console.log("📁 Uploading files:", uploadedFiles.length);
                for (const file of uploadedFiles) {
                    const fileName = `${claim.id}/${Date.now()}-${file.name}`;
                    console.log("⬆️ Uploading file:", fileName);

                    const { data: uploadData, error: uploadError } =
                        await supabase.storage
                            .from("documents")
                            .upload(fileName, file);

                    if (uploadError) {
                        console.error("❌ Error uploading file:", uploadError);
                        // Continue with other files instead of stopping
                        continue;
                    }

                    console.log("✅ File uploaded:", uploadData);

                    // Save document record
                    const { error: docError } = await supabase
                        .from("documents")
                        .insert({
                            claim_id: claim.id,
                            customer_id: customerId,
                            document_type: file.type.startsWith("image/")
                                ? "photo"
                                : "other",
                            file_name: file.name,
                            file_path: uploadData.path,
                            file_size: file.size,
                            mime_type: file.type,
                        });

                    if (docError) {
                        console.error(
                            "❌ Error saving document record:",
                            docError
                        );
                    }
                }
            }

            setSuccess(`Reclamación ${claimNumber} creada exitosamente`);
            setCountdown(1); // Iniciar countdown de 1 segundo
        } catch (error) {
            console.error("💥 Error creating claim:", error);
            let errorMessage = "Error al crear la reclamación";

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (
                typeof error === "object" &&
                error !== null &&
                "message" in error
            ) {
                errorMessage = String(error.message);
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const claimTypes = [
        { value: "Colisión", label: "Colisión" },
        { value: "Robo", label: "Robo" },
        { value: "Vandalismo", label: "Vandalismo" },
        { value: "Incendio", label: "Incendio" },
        { value: "Daño por clima", label: "Inundación" },
        { value: "Daño por granizo", label: "Granizo" },
        { value: "Otros", label: "Cristales" },
        { value: "Otros", label: "Otro" },
    ];

    return (
        <>
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Nueva Reclamación
                    </CardTitle>
                    <CardDescription>
                        Complete la información del siniestro para procesar su
                        reclamación
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert>
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        {/* Customer Selection - Only show if no customerId (for agents) */}
                        {!customerId && (
                            <div className="space-y-2">
                                <Label htmlFor="customer">Cliente *</Label>
                                <Select
                                    value={selectedCustomer}
                                    onValueChange={(value) => {
                                        // Only process if it's not a special value
                                        if (value && !value.startsWith("__")) {
                                            setSelectedCustomer(value);
                                            setSelectedPolicy(""); // Reset policy selection when customer changes
                                        }
                                    }}
                                    disabled={loadingCustomers}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                loadingCustomers
                                                    ? "Cargando clientes..."
                                                    : "Seleccionar cliente"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingCustomers ? (
                                            <SelectItem
                                                value="__loading__"
                                                disabled
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>
                                                        Cargando clientes...
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ) : customers.length === 0 ? (
                                            <SelectItem
                                                value="__no_customers__"
                                                disabled
                                            >
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                    <span>
                                                        No hay clientes
                                                        disponibles
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ) : (
                                            customers.map((customer) => (
                                                <SelectItem
                                                    key={customer.id}
                                                    value={customer.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4" />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {
                                                                    customer
                                                                        .user
                                                                        ?.first_name
                                                                }{" "}
                                                                {
                                                                    customer
                                                                        .user
                                                                        ?.last_name
                                                                }
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {
                                                                    customer
                                                                        .user
                                                                        ?.email
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {selectedCustomer && (
                                    <p className="text-sm text-muted-foreground">
                                        Cliente seleccionado:{" "}
                                        {
                                            customers.find(
                                                (c) => c.id === selectedCustomer
                                            )?.user?.first_name
                                        }{" "}
                                        {
                                            customers.find(
                                                (c) => c.id === selectedCustomer
                                            )?.user?.last_name
                                        }
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Policy Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="policy">Póliza *</Label>
                            <Select
                                value={selectedPolicy}
                                onValueChange={(value) => {
                                    // Only process if it's not a special value
                                    if (value && !value.startsWith("__")) {
                                        setSelectedPolicy(value);
                                    }
                                }}
                                disabled={
                                    !!policyId ||
                                    !selectedCustomer ||
                                    loadingPolicies
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            !selectedCustomer
                                                ? "Primero seleccione un cliente"
                                                : loadingPolicies
                                                ? "Cargando pólizas..."
                                                : policies.length === 0
                                                ? "No hay pólizas activas para este cliente"
                                                : "Seleccionar póliza"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingPolicies ? (
                                        <SelectItem
                                            value="__loading_policies__"
                                            disabled
                                        >
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Cargando pólizas...</span>
                                            </div>
                                        </SelectItem>
                                    ) : policies.length === 0 ? (
                                        <SelectItem
                                            value="__no_policies__"
                                            disabled
                                        >
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                <span>
                                                    No hay pólizas activas para
                                                    este cliente
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ) : (
                                        policies.map((policy) => (
                                            <SelectItem
                                                key={policy.id}
                                                value={policy.id}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {policy.policy_number}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {policy.vehicle?.year}{" "}
                                                        {policy.vehicle?.make}{" "}
                                                        {policy.vehicle?.model}{" "}
                                                        -{" "}
                                                        {
                                                            policy.vehicle
                                                                ?.license_plate
                                                        }
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Incident Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="incidentDate">
                                    Fecha del Siniestro *
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="incidentDate"
                                        type="date"
                                        value={claimData.incidentDate}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "incidentDate",
                                                e.target.value
                                            )
                                        }
                                        className="pl-10"
                                        max={format(new Date(), "yyyy-MM-dd")}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="incidentTime">
                                    Hora del Siniestro
                                </Label>
                                <Input
                                    id="incidentTime"
                                    type="time"
                                    value={claimData.incidentTime}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "incidentTime",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="claimType">
                                    Tipo de Siniestro *
                                </Label>
                                <Select
                                    value={claimData.claimType}
                                    onValueChange={(value) =>
                                        handleInputChange("claimType", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {claimTypes.map((type) => (
                                            <SelectItem
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Prioridad</Label>
                                <Select
                                    value={claimData.priority}
                                    onValueChange={(value) =>
                                        handleInputChange("priority", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            Baja
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            Media
                                        </SelectItem>
                                        <SelectItem value="high">
                                            Alta
                                        </SelectItem>
                                        <SelectItem value="urgent">
                                            Urgente
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Location and Description */}
                        <div className="space-y-2">
                            <Label htmlFor="incidentLocation">
                                Ubicación del Siniestro
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="incidentLocation"
                                    placeholder="Calle, colonia, ciudad..."
                                    value={claimData.incidentLocation}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "incidentLocation",
                                            e.target.value
                                        )
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="incidentDescription">
                                Descripción del Siniestro *
                            </Label>
                            <Textarea
                                id="incidentDescription"
                                placeholder="Describa detalladamente lo que ocurrió..."
                                value={claimData.incidentDescription}
                                onChange={(e) =>
                                    handleInputChange(
                                        "incidentDescription",
                                        e.target.value
                                    )
                                }
                                rows={4}
                                required
                            />
                        </div>

                        {/* Additional Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="policeReportNumber">
                                    Número de Reporte Policial
                                </Label>
                                <Input
                                    id="policeReportNumber"
                                    placeholder="Si aplica"
                                    value={claimData.policeReportNumber}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "policeReportNumber",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estimatedDamageCost">
                                    Costo Estimado de Daños
                                </Label>
                                <Input
                                    id="estimatedDamageCost"
                                    type="number"
                                    placeholder="0.00"
                                    value={claimData.estimatedDamageCost}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "estimatedDamageCost",
                                            e.target.value
                                        )
                                    }
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="thirdPartyInvolved"
                                    checked={claimData.thirdPartyInvolved}
                                    onCheckedChange={(checked) =>
                                        handleInputChange(
                                            "thirdPartyInvolved",
                                            checked as boolean
                                        )
                                    }
                                />
                                <Label htmlFor="thirdPartyInvolved">
                                    Involucra terceros
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="injuryInvolved"
                                    checked={claimData.injuryInvolved}
                                    onCheckedChange={(checked) =>
                                        handleInputChange(
                                            "injuryInvolved",
                                            checked as boolean
                                        )
                                    }
                                />
                                <Label htmlFor="injuryInvolved">
                                    Hay lesiones personales
                                </Label>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-4">
                            <Label>Documentos y Fotografías</Label>
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                                <div className="text-center">
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <div className="mt-4">
                                        <Label
                                            htmlFor="file-upload"
                                            className="cursor-pointer"
                                        >
                                            <span className="mt-2 block text-sm font-medium text-primary hover:text-primary/80">
                                                Subir archivos
                                            </span>
                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                PNG, JPG, GIF, PDF hasta 10MB
                                                cada uno
                                            </span>
                                        </Label>
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Uploaded Files */}
                            {uploadedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Archivos seleccionados:</Label>
                                    <div className="space-y-2">
                                        {uploadedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-muted rounded"
                                            >
                                                <span className="text-sm truncate">
                                                    {file.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeFile(index)
                                                    }
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-6">
                            <Button
                                type="submit"
                                disabled={
                                    loading ||
                                    !selectedPolicy ||
                                    !claimData.incidentDescription
                                }
                                className="flex-1"
                            >
                                {loading
                                    ? "Creando reclamación..."
                                    : "Crear Reclamación"}
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

            {/* Modal de Éxito */}
            {success && (
                <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            ¡Éxito!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {success}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
