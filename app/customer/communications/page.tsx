"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple";
import { createClient } from "@/lib/supabase/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Mail,
    Phone,
    Calendar,
    User,
    FileText,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Communication {
    id: string;
    communication_type: string;
    direction: string;
    subject: string;
    content: string;
    status: string;
    created_at: string;
    agent: {
        first_name: string;
        last_name: string;
        email: string;
    };
    policy: {
        policy_number: string;
    };
}

export default function CustomerCommunicationsPage() {
    const {
        customerData,
        loading: customerLoading,
        error: customerError,
    } = useCustomerDataSimple();
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterDirection, setFilterDirection] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCommunication, setNewCommunication] = useState({
        type: "email",
        direction: "outbound",
        subject: "",
        content: "",
    });
    const supabase = createClient();

    useEffect(() => {
        if (customerData && !customerLoading) {
            fetchCommunications();
        }
    }, [customerData, customerLoading]);

    const fetchCommunications = async () => {
        if (!customerData) return;

        try {
            setLoading(true);
            setError("");

            console.log(
                "Buscando comunicaciones para cliente:",
                customerData.id
            );

            // Obtener comunicaciones del cliente
            const { data: communicationsData, error: communicationsError } =
                await supabase
                    .from("communications")
                    .select(
                        `
          *,
          agent:users!communications_agent_id_fkey(
            first_name,
            last_name,
            email
          ),
          policy:policies(
            policy_number
          )
        `
                    )
                    .eq("customer_id", customerData.id)
                    .order("created_at", { ascending: false });

            if (communicationsError) {
                console.error(
                    "Error obteniendo comunicaciones:",
                    communicationsError
                );
                setError(
                    `Error al cargar las comunicaciones: ${communicationsError.message}`
                );
            } else {
                console.log(
                    "Comunicaciones encontradas:",
                    communicationsData?.length || 0
                );
                setCommunications(communicationsData || []);
            }
        } catch (error) {
            console.error("Error inesperado:", error);
            setError("Error inesperado al cargar las comunicaciones");
        } finally {
            setLoading(false);
        }
    };

    const getCommunicationIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "email":
                return <Mail className="h-4 w-4" />;
            case "phone":
                return <Phone className="h-4 w-4" />;
            case "sms":
                return <MessageSquare className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getDirectionBadge = (direction: string) => {
        switch (direction.toLowerCase()) {
            case "inbound":
                return (
                    <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                    >
                        Recibido
                    </Badge>
                );
            case "outbound":
                return (
                    <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800"
                    >
                        Enviado
                    </Badge>
                );
            default:
                return <Badge variant="outline">{direction}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "sent":
                return (
                    <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                    >
                        Enviado
                    </Badge>
                );
            case "delivered":
                return (
                    <Badge
                        variant="default"
                        className="bg-blue-100 text-blue-800"
                    >
                        Entregado
                    </Badge>
                );
            case "read":
                return (
                    <Badge
                        variant="default"
                        className="bg-purple-100 text-purple-800"
                    >
                        Leído
                    </Badge>
                );
            case "failed":
                return <Badge variant="destructive">Fallido</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredCommunications = communications.filter((communication) => {
        return (
            (!filterType || communication.communication_type === filterType) &&
            (!filterDirection || communication.direction === filterDirection) &&
            (!filterStatus || communication.status === filterStatus)
        );
    });

    const handleCreateCommunication = async () => {
        if (!customerData) {
            setError("No se pudo identificar al cliente.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("communications")
                .insert([
                    {
                        communication_type: newCommunication.type,
                        direction: newCommunication.direction,
                        subject: newCommunication.subject,
                        content: newCommunication.content,
                        customer_id: customerData.id,
                    },
                ]);

            if (error) {
                console.error("Error creating communication:", error);
                setError("Error al crear la comunicación.");
            } else if (data) {
                setCommunications([data[0], ...communications]);
                setIsModalOpen(false);
                setNewCommunication({
                    type: "email",
                    direction: "outbound",
                    subject: "",
                    content: "",
                });
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setError("Error inesperado al crear la comunicación.");
        }
    };

    if (customerLoading || loading) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="container mx-auto py-8 px-4">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">
                                {customerLoading
                                    ? "Cargando perfil..."
                                    : "Cargando comunicaciones..."}
                            </p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (customerError) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="container mx-auto py-8 px-4">
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-destructive">{customerError}</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold text-primary">
                            Comunicaciones
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tus mensajes y notificaciones de
                            SeguraTuAuto.
                        </p>
                    </div>
                    <Button
                        variant="default"
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Nueva Comunicación
                    </Button>
                </div>

                {/* Filtros */}
                <div className="mb-6 flex gap-4">
                    <select
                        className="border border-border rounded-md p-2"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">Todos los Tipos</option>
                        <option value="email">Email</option>
                        <option value="phone">Teléfono</option>
                        <option value="sms">SMS</option>
                    </select>
                    <select
                        className="border border-border rounded-md p-2"
                        value={filterDirection}
                        onChange={(e) => setFilterDirection(e.target.value)}
                    >
                        <option value="">Todas las Direcciones</option>
                        <option value="inbound">Recibido</option>
                        <option value="outbound">Enviado</option>
                    </select>
                    <select
                        className="border border-border rounded-md p-2"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="sent">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="read">Leído</option>
                        <option value="failed">Fallido</option>
                    </select>
                </div>

                {/* Lista de comunicaciones */}
                <div className="space-y-4">
                    {filteredCommunications.map((communication) => (
                        <Card
                            key={communication.id}
                            className="hover:shadow-lg transition-shadow"
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {getCommunicationIcon(
                                            communication.communication_type
                                        )}
                                        <div>
                                            <CardTitle className="text-lg font-semibold">
                                                {communication.subject}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Calendar className="h-4 w-4" />
                                                {format(
                                                    new Date(
                                                        communication.created_at
                                                    ),
                                                    "dd/MM/yyyy HH:mm",
                                                    { locale: es }
                                                )}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {getDirectionBadge(
                                            communication.direction
                                        )}
                                        {getStatusBadge(communication.status)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {communication.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Modal para nueva comunicación */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nueva Comunicación</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <select
                                className="border border-border rounded-md p-2 w-full"
                                value={newCommunication.type}
                                onChange={(e) =>
                                    setNewCommunication({
                                        ...newCommunication,
                                        type: e.target.value,
                                    })
                                }
                            >
                                <option value="email">Email</option>
                                <option value="phone">Teléfono</option>
                                <option value="sms">SMS</option>
                            </select>
                            <select
                                className="border border-border rounded-md p-2 w-full"
                                value={newCommunication.direction}
                                onChange={(e) =>
                                    setNewCommunication({
                                        ...newCommunication,
                                        direction: e.target.value,
                                    })
                                }
                            >
                                <option value="inbound">Recibido</option>
                                <option value="outbound">Enviado</option>
                            </select>
                            <Input
                                placeholder="Asunto"
                                value={newCommunication.subject}
                                onChange={(e) =>
                                    setNewCommunication({
                                        ...newCommunication,
                                        subject: e.target.value,
                                    })
                                }
                            />
                            <Textarea
                                placeholder="Contenido"
                                value={newCommunication.content}
                                onChange={(e) =>
                                    setNewCommunication({
                                        ...newCommunication,
                                        content: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="default"
                                onClick={handleCreateCommunication}
                            >
                                Crear
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
