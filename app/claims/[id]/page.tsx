"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DamageAssessmentForm } from "@/components/claims/damage-assessment-form";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth/auth-provider";
import type {
    Claim,
    DamageAssessment,
    ClaimDocument,
} from "@/lib/types/database";
import {
    ArrowLeft,
    FileText,
    Camera,
    ClipboardCheck,
    Calendar,
    MapPin,
    DollarSign,
    User,
    Car,
    AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ClaimDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { userProfile } = useAuth();
    const [claim, setClaim] = useState<Claim | null>(null);
    const [assessments, setAssessments] = useState<DamageAssessment[]>([]);
    const [documents, setDocuments] = useState<ClaimDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (params.id) {
            fetchClaimDetails();
        }
    }, [params.id]);

    const fetchClaimDetails = async () => {
        try {
            // Fetch claim with related data
            const { data: claimData, error: claimError } = await supabase
                .from("claims")
                .select(
                    `
          *,
          policy:policies(
            *,
            vehicle:vehicles(*),
            customer:customers(
              *,
              user:users(*)
            )
          ),
          customer:customers(
            *,
            user:users(*)
          ),
          adjuster:users(*)
        `
                )
                .eq("id", params.id)
                .single();

            if (claimError) throw claimError;
            setClaim(claimData);

            // Fetch assessments
            const { data: assessmentData, error: assessmentError } =
                await supabase
                    .from("damage_assessments")
                    .select(
                        `
          *,
          adjuster:users(*)
        `
                    )
                    .eq("claim_id", params.id)
                    .order("created_at", { ascending: false });

            if (assessmentError) throw assessmentError;
            setAssessments(assessmentData || []);

            // Fetch documents
            const { data: documentData, error: documentError } = await supabase
                .from("claim_documents")
                .select("*")
                .eq("claim_id", params.id)
                .order("created_at", { ascending: false });

            if (documentError) throw documentError;
            setDocuments(documentData || []);
        } catch (error) {
            console.error("Error fetching claim details:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateClaimStatus = async (newStatus: string) => {
        try {
            const { error } = await supabase
                .from("claims")
                .update({ status: newStatus })
                .eq("id", params.id);

            if (error) throw error;

            // Refresh claim data
            fetchClaimDetails();
        } catch (error) {
            console.error("Error updating claim status:", error);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            submitted: {
                label: "Enviada",
                classes: "status-badge status-submitted",
            },
            under_review: {
                label: "En Revisión",
                classes: "status-badge status-under-review",
            },
            investigating: {
                label: "Investigando",
                classes: "status-badge status-investigating",
            },
            approved: {
                label: "Aprobada",
                classes: "status-badge status-approved",
            },
            denied: {
                label: "Denegada",
                classes: "status-badge status-denied",
            },
            closed: { label: "Cerrada", classes: "status-badge status-closed" },
            paid: { label: "Pagada", classes: "status-badge status-paid" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
            label: status,
            classes: "status-badge status-submitted",
        };
        return <span className={config.classes}>{config.label}</span>;
    };

    const getPriorityBadge = (priority: string) => {
        const priorityConfig = {
            low: { label: "Baja", classes: "priority-badge priority-low" },
            medium: {
                label: "Media",
                classes: "priority-badge priority-medium",
            },
            high: { label: "Alta", classes: "priority-badge priority-high" },
            urgent: {
                label: "Urgente",
                classes: "priority-badge priority-urgent",
            },
        };

        const config = priorityConfig[
            priority as keyof typeof priorityConfig
        ] || {
            label: priority,
            classes: "priority-badge priority-low",
        };
        return <span className={config.classes}>{config.label}</span>;
    };

    const getClaimTypeLabel = (type: string) => {
        const types = {
            collision: "Colisión",
            theft: "Robo",
            vandalism: "Vandalismo",
            fire: "Incendio",
            flood: "Inundación",
            hail: "Granizo",
            glass: "Cristales",
            other: "Otro",
        };
        return types[type as keyof typeof types] || type;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="flex-1 lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!claim) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="flex-1 lg:ml-64">
                    <div className="max-w-6xl mx-auto p-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold mb-4">
                                Reclamación no encontrada
                            </h1>
                            <Button onClick={() => router.push("/claims")}>
                                Volver a Reclamaciones
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <div className="flex-1 lg:ml-64">
                <div className="max-w-6xl mx-auto p-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/claims")}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold">
                                {claim.claim_number}
                            </h1>
                            <p className="text-muted-foreground">
                                {getClaimTypeLabel(claim.claim_type)} -{" "}
                                {format(
                                    new Date(claim.incident_date),
                                    "dd/MM/yyyy",
                                    { locale: es }
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                            {getStatusBadge(claim.status)}
                            {getPriorityBadge(claim.priority)}
                            {claim.injury_involved && (
                                <Badge variant="destructive">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Lesiones
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Status Actions */}
                    {userProfile?.role === "adjuster" && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Acciones de Estado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 flex-wrap">
                                    {claim.status === "submitted" && (
                                        <Button
                                            onClick={() =>
                                                updateClaimStatus(
                                                    "under_review"
                                                )
                                            }
                                        >
                                            Iniciar Revisión
                                        </Button>
                                    )}
                                    {claim.status === "under_review" && (
                                        <>
                                            <Button
                                                onClick={() =>
                                                    updateClaimStatus(
                                                        "investigating"
                                                    )
                                                }
                                            >
                                                Iniciar Investigación
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setShowAssessmentForm(true)
                                                }
                                            >
                                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                                Nueva Evaluación
                                            </Button>
                                        </>
                                    )}
                                    {claim.status === "investigating" && (
                                        <>
                                            <Button
                                                onClick={() =>
                                                    updateClaimStatus(
                                                        "approved"
                                                    )
                                                }
                                            >
                                                Aprobar Reclamación
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={() =>
                                                    updateClaimStatus("denied")
                                                }
                                            >
                                                Denegar Reclamación
                                            </Button>
                                        </>
                                    )}
                                    {claim.status === "approved" && (
                                        <Button
                                            onClick={() =>
                                                updateClaimStatus("paid")
                                            }
                                        >
                                            Marcar como Pagada
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Tabs defaultValue="details" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="details">Detalles</TabsTrigger>
                            <TabsTrigger value="assessments">
                                Evaluaciones ({assessments.length})
                            </TabsTrigger>
                            <TabsTrigger value="documents">
                                Documentos ({documents.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Claim Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Información de la Reclamación
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Número
                                                </label>
                                                <p className="font-mono">
                                                    {claim.claim_number}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Tipo
                                                </label>
                                                <p>
                                                    {getClaimTypeLabel(
                                                        claim.claim_type
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Fecha del Siniestro
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <p>
                                                        {format(
                                                            new Date(
                                                                claim.incident_date
                                                            ),
                                                            "dd/MM/yyyy HH:mm",
                                                            { locale: es }
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Fecha de Reporte
                                                </label>
                                                <p>
                                                    {format(
                                                        new Date(
                                                            claim.created_at
                                                        ),
                                                        "dd/MM/yyyy",
                                                        { locale: es }
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {claim.incident_location && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Ubicación
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <p>
                                                        {
                                                            claim.incident_location
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Descripción
                                            </label>
                                            <p className="text-sm bg-muted p-3 rounded-md">
                                                {claim.incident_description}
                                            </p>
                                        </div>

                                        {claim.police_report_number && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Reporte Policial
                                                </label>
                                                <p className="font-mono">
                                                    {claim.police_report_number}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Terceros Involucrados
                                                </label>
                                                <p>
                                                    {claim.third_party_involved
                                                        ? "Sí"
                                                        : "No"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Lesiones
                                                </label>
                                                <p>
                                                    {claim.injury_involved
                                                        ? "Sí"
                                                        : "No"}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Financial Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            Información Financiera
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {claim.estimated_damage_cost && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Daño Estimado
                                                </label>
                                                <p className="text-lg font-semibold">
                                                    $
                                                    {claim.estimated_damage_cost.toLocaleString()}
                                                </p>
                                            </div>
                                        )}

                                        {claim.approved_amount && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Monto Aprobado
                                                </label>
                                                <p className="text-lg font-semibold text-green-600">
                                                    $
                                                    {claim.approved_amount.toLocaleString()}
                                                </p>
                                            </div>
                                        )}

                                        {claim.paid_amount && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Monto Pagado
                                                </label>
                                                <p className="text-lg font-semibold text-blue-600">
                                                    $
                                                    {claim.paid_amount.toLocaleString()}
                                                </p>
                                            </div>
                                        )}

                                        {claim.deductible_amount && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Deducible
                                                </label>
                                                <p className="text-lg">
                                                    $
                                                    {claim.deductible_amount.toLocaleString()}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Porcentaje de Culpa
                                            </label>
                                            <p className="text-lg">
                                                {claim.fault_percentage}%
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Customer Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Información del Cliente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Nombre
                                            </label>
                                            <p>
                                                {
                                                    claim.customer?.user
                                                        ?.first_name
                                                }{" "}
                                                {
                                                    claim.customer?.user
                                                        ?.last_name
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Email
                                            </label>
                                            <p>{claim.customer?.user?.email}</p>
                                        </div>
                                        {claim.customer?.user?.phone && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Teléfono
                                                </label>
                                                <p>
                                                    {
                                                        claim.customer?.user
                                                            ?.phone
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Vehicle Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Car className="h-5 w-5" />
                                            Información del Vehículo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Vehículo
                                            </label>
                                            <p>
                                                {claim.policy?.vehicle?.year}{" "}
                                                {claim.policy?.vehicle?.make}{" "}
                                                {claim.policy?.vehicle?.model}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Placa
                                            </label>
                                            <p className="font-mono">
                                                {
                                                    claim.policy?.vehicle
                                                        ?.license_plate
                                                }
                                            </p>
                                        </div>
                                        {claim.policy?.vehicle?.vin && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    VIN
                                                </label>
                                                <p className="font-mono text-sm">
                                                    {claim.policy?.vehicle?.vin}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Póliza
                                            </label>
                                            <p className="font-mono">
                                                {claim.policy?.policy_number}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="assessments">
                            {showAssessmentForm ? (
                                <DamageAssessmentForm
                                    claim={claim}
                                    adjusterId={userProfile?.id || ""}
                                    onSuccess={() => {
                                        setShowAssessmentForm(false);
                                        fetchClaimDetails();
                                    }}
                                    onCancel={() =>
                                        setShowAssessmentForm(false)
                                    }
                                />
                            ) : (
                                <div className="space-y-6">
                                    {userProfile?.role === "adjuster" && (
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={() =>
                                                    setShowAssessmentForm(true)
                                                }
                                            >
                                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                                Nueva Evaluación
                                            </Button>
                                        </div>
                                    )}

                                    {assessments.length === 0 ? (
                                        <Card>
                                            <CardContent className="p-8 text-center">
                                                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                <p className="text-muted-foreground">
                                                    No hay evaluaciones de daños
                                                    registradas
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-4">
                                            {assessments.map((assessment) => (
                                                <Card key={assessment.id}>
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-lg">
                                                                    Evaluación -{" "}
                                                                    {format(
                                                                        new Date(
                                                                            assessment.assessment_date
                                                                        ),
                                                                        "dd/MM/yyyy",
                                                                        {
                                                                            locale: es,
                                                                        }
                                                                    )}
                                                                </CardTitle>
                                                                <CardDescription>
                                                                    Por:{" "}
                                                                    {
                                                                        assessment
                                                                            .adjuster
                                                                            ?.first_name
                                                                    }{" "}
                                                                    {
                                                                        assessment
                                                                            .adjuster
                                                                            ?.last_name
                                                                    }
                                                                    {assessment.is_final && (
                                                                        <Badge className="ml-2">
                                                                            Final
                                                                        </Badge>
                                                                    )}
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div>
                                                            <label className="text-sm font-medium text-muted-foreground">
                                                                Descripción de
                                                                Daños
                                                            </label>
                                                            <p className="text-sm bg-muted p-3 rounded-md">
                                                                {
                                                                    assessment.damage_description
                                                                }
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {assessment.repair_estimate && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-muted-foreground">
                                                                        Estimado
                                                                        Reparación
                                                                    </label>
                                                                    <p className="text-lg font-semibold">
                                                                        $
                                                                        {assessment.repair_estimate.toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {assessment.replacement_estimate && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-muted-foreground">
                                                                        Estimado
                                                                        Reemplazo
                                                                    </label>
                                                                    <p className="text-lg font-semibold">
                                                                        $
                                                                        {assessment.replacement_estimate.toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {assessment.recommended_action && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-muted-foreground">
                                                                        Acción
                                                                        Recomendada
                                                                    </label>
                                                                    <p className="capitalize">
                                                                        {assessment.recommended_action.replace(
                                                                            "_",
                                                                            " "
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {assessment.assessment_notes && (
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">
                                                                    Notas
                                                                </label>
                                                                <p className="text-sm">
                                                                    {
                                                                        assessment.assessment_notes
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}

                                                        {assessment.photos &&
                                                            assessment.photos
                                                                .length > 0 && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-muted-foreground">
                                                                        Fotografías
                                                                    </label>
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                                                        {assessment.photos.map(
                                                                            (
                                                                                photo,
                                                                                index
                                                                            ) => (
                                                                                <img
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    src={
                                                                                        photo ||
                                                                                        "/placeholder.svg"
                                                                                    }
                                                                                    alt={`Foto ${
                                                                                        index +
                                                                                        1
                                                                                    }`}
                                                                                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                                                                                    onClick={() =>
                                                                                        window.open(
                                                                                            photo,
                                                                                            "_blank"
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="documents">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Documentos de la Reclamación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {documents.length === 0 ? (
                                        <div className="text-center py-8">
                                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                            <p className="text-muted-foreground">
                                                No hay documentos adjuntos
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {documents.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center justify-between p-4 border rounded-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {doc.document_type ===
                                                        "photo" ? (
                                                            <Camera className="h-5 w-5 text-muted-foreground" />
                                                        ) : (
                                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                        <div>
                                                            <p className="font-medium">
                                                                {doc.file_name}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {doc.document_type ===
                                                                "photo"
                                                                    ? "Fotografía"
                                                                    : "Documento"}{" "}
                                                                •
                                                                {doc.file_size &&
                                                                    ` ${(
                                                                        doc.file_size /
                                                                        1024 /
                                                                        1024
                                                                    ).toFixed(
                                                                        2
                                                                    )} MB • `}
                                                                {format(
                                                                    new Date(
                                                                        doc.created_at
                                                                    ),
                                                                    "dd/MM/yyyy",
                                                                    {
                                                                        locale: es,
                                                                    }
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {doc.is_verified && (
                                                            <Badge variant="secondary">
                                                                Verificado
                                                            </Badge>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            Ver
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
