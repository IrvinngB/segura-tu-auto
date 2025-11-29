"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    Trash2,
    AlertCircle,
    CheckSquare,
    Square,
    Info,
    CheckCircle,
    XCircle
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
import { CommunicationsPageEffect } from "@/components/communications/communications-page-effect";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmationModal } from "@/components/communications/delete-confirmation-modal";

interface Communication {
    id: string;
    communication_type: string;
    direction: string;
    subject: string;
    content: string;
    status: string;
    created_at: string;
    claim_id?: string;
    agent: {
        first_name: string;
        last_name: string;
        email: string;
    };
    policy: {
        policy_number: string;
    };
    metadata?: any;
}

export default function CustomerCommunicationsPage() {
    const router = useRouter();
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
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const [newCommunication, setNewCommunication] = useState({
        type: "email",
        direction: "outbound",
        subject: "",
        content: "",
    });
    
    // Estados para el modal de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
          claim_id,
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
            case "quote_approved":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "quote_rejected":
                return <XCircle className="h-4 w-4 text-red-600" />;
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
        // Simplificado: Solo "Leído" o "No Leído"
        const isRead = status.toLowerCase() === 'read';
        
        return (
            <Badge
                variant="default"
                className={`${isRead 
                    ? "bg-green-100 text-green-800" 
                    : "bg-orange-100 text-orange-800"
                }`}
            >
                {isRead ? "Leído" : "No Leído"}
            </Badge>
        );
    };

    const filteredCommunications = communications.filter((communication) => {
        const typeMatch = !filterType || communication.communication_type === filterType;
        const directionMatch = !filterDirection || communication.direction === filterDirection;
        
        // Lógica simplificada para estados
        let statusMatch = true;
        if (filterStatus) {
            if (filterStatus === 'read') {
                statusMatch = communication.status.toLowerCase() === 'read';
            } else if (filterStatus === 'unread') {
                statusMatch = communication.status.toLowerCase() !== 'read';
            }
        }
        
        return typeMatch && directionMatch && statusMatch;
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

    // Gestión de selección y eliminación
    const toggleSelection = (id: string) => {
        setSelectedMessageIds(prev => 
            prev.includes(id) 
                ? prev.filter(msgId => msgId !== id)
                : [...prev, id]
        );
    };

    const handleDelete = (idsToDelete: string[]) => {
        setItemsToDelete(idsToDelete);
        setIsDeletingAll(false);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteAll = () => {
        setIsDeletingAll(true);
        setItemsToDelete([]);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!customerData) return;
        
        setIsDeleting(true);
        try {
            let error;
            
            if (isDeletingAll) {
                const { error: deleteError } = await supabase
                    .from('communications')
                    .delete()
                    .eq('customer_id', customerData.id);
                error = deleteError;
            } else {
                const { error: deleteError } = await supabase
                    .from('communications')
                    .delete()
                    .in('id', itemsToDelete)
                    .eq('customer_id', customerData.id);
                error = deleteError;
            }

            if (error) throw error;

            // Actualizar estado local
            if (isDeletingAll) {
                setCommunications([]);
                setSelectedMessageIds([]);
            } else {
                setCommunications(prev => prev.filter(c => !itemsToDelete.includes(c.id)));
                setSelectedMessageIds(prev => prev.filter(id => !itemsToDelete.includes(id)));
            }
            
            setIsDeleteModalOpen(false);
            
        } catch (error) {
            console.error("Error deleting communications:", error);
            alert("Error al eliminar los mensajes");
        } finally {
            setIsDeleting(false);
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
            <CommunicationsPageEffect />
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
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

                {/* Nota Informativa */}
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-semibold">Nota Importante</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Puedes hacer clic en los mensajes de "Documento rechazado" o "Docs requeridos" para ir directamente a la reclamación en la pestaña "Documentos y evidencia" y gestionar tus documentos.
                    </AlertDescription>
                </Alert>

                {/* Barra de Acciones y Filtros */}
                <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(selectedMessageIds)}
                            disabled={selectedMessageIds.length === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar seleccionados ({selectedMessageIds.length})
                        </Button>
                        
                        {communications.length > 0 && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={handleDeleteAll}
                            >
                                Eliminar todos
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <select
                            className="border border-border rounded-md p-2 text-sm"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">Todos los Tipos</option>
                            <option value="email">Email</option>
                            <option value="phone">Teléfono</option>
                            <option value="sms">SMS</option>
                        </select>
                        <select
                            className="border border-border rounded-md p-2 text-sm"
                            value={filterDirection}
                            onChange={(e) => setFilterDirection(e.target.value)}
                        >
                            <option value="">Todas las Direcciones</option>
                            <option value="inbound">Recibido</option>
                            <option value="outbound">Enviado</option>
                        </select>
                        <select
                            className="border border-border rounded-md p-2 text-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Todos los Estados</option>
                            <option value="read">Leído</option>
                            <option value="unread">No Leído</option>
                        </select>
                    </div>
                </div>

                {/* Lista de comunicaciones */}
                <div className="space-y-4">
                    {filteredCommunications.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                            <h3 className="text-lg font-medium text-foreground">No tienes comunicaciones</h3>
                            <p className="text-muted-foreground">No hay mensajes para mostrar en este momento.</p>
                        </div>
                    ) : (
                        filteredCommunications.map((communication) => {
                            const isRejectedDoc = communication.subject.includes('Documento rechazado') || communication.content.includes('rechazado');
                            const isDocsRequired = communication.subject.includes('Docs requeridos');
                            const isQuoteUpdate = communication.communication_type === 'quote_approved' || communication.communication_type === 'quote_rejected';
                            const isClickable = isRejectedDoc || isDocsRequired || isQuoteUpdate;
                            
                            return (
                                <Card
                                    key={communication.id}
                                    className={`transition-all duration-150 group relative ${
                                        isRejectedDoc || communication.communication_type === 'quote_rejected'
                                        ? 'border-l-4 border-l-red-500' 
                                        : communication.communication_type === 'quote_approved'
                                        ? 'border-l-4 border-l-green-500'
                                        : ''
                                    } ${
                                        isClickable 
                                        ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' 
                                        : 'hover:shadow-md'
                                    } ${selectedMessageIds.includes(communication.id) ? 'bg-muted/30 border-primary/50' : ''}`}
                                    onClick={() => {
                                        if (isClickable) {
                                            let targetClaimId = communication.claim_id;
                                            
                                            if (!targetClaimId) {
                                                const match = communication.subject.match(/CLM-\d+-\d+/);
                                                if (match) {
                                                    console.log("Intento de extracción de ID:", match[0]);
                                                }
                                            }

                                            if (targetClaimId) {
                                                router.push(`/customer/claims/${targetClaimId}?tab=documents`);
                                            } else if (isQuoteUpdate) {
                                                const quoteId = communication.metadata?.quoteId;
                                                if (quoteId) {
                                                    router.push(`/customer/quote?quoteId=${quoteId}`);
                                                } else {
                                                    router.push('/customer/quote');
                                                }
                                            } else {
                                                const match = communication.subject.match(/(CLM-\d+-\d+)/);
                                                if (match) {
                                                    console.log("Redirigiendo usando claim number del asunto:", match[1]);
                                                }
                                                console.log("No se encontró ID de reclamación explícito para redirigir");
                                            }
                                        }
                                    }}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                        checked={selectedMessageIds.includes(communication.id)}
                                                        onChange={() => {}} // Controlled by onClick
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSelection(communication.id);
                                                        }}
                                                    />
                                                    {communication.communication_type === 'email' ? (
                                                        <Mail className="w-5 h-5 text-white/80" />
                                                    ) : (
                                                        getCommunicationIcon(communication.communication_type)
                                                    )}
                                                    <h2 className="font-semibold text-lg">
                                                        {communication.subject}
                                                    </h2>
                                                </div>
                                                <CardDescription className="flex items-center gap-2 mt-1 pl-6">
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
                                            <div className="flex items-center gap-2">
                                                {getDirectionBadge(
                                                    communication.direction
                                                )}
                                                {getStatusBadge(communication.status)}
                                                
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive ml-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete([communication.id]);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {communication.content}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
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

                {/* Modal de confirmación de eliminación */}
                <DeleteConfirmationModal 
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    count={itemsToDelete.length}
                    isDeletingAll={isDeletingAll}
                    isLoading={isDeleting}
                />
            </div>
        </ProtectedRoute>
    );
}
