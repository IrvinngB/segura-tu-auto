"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

interface CancellationRequest {
    id: string;
    policy_id: string;
    customer_id: string;
    reason: string;
    comments: string;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    policy: {
        policy_number: string;
        status: string;
    };
    customer: {
        user: {
            first_name: string;
            last_name: string;
            email: string;
        };
    };
}

interface CancellationRequestsTableProps {
    onUpdate?: () => void;
}

export function CancellationRequestsTable({ onUpdate }: CancellationRequestsTableProps = {}) {
    const [requests, setRequests] = useState<CancellationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: "approve" | "reject" | null;
        request: CancellationRequest | null;
    }>({ open: false, type: null, request: null });
    const [rejectionReason, setRejectionReason] = useState("");
    const [applyPenalty, setApplyPenalty] = useState("no"); // "yes" | "no"

    // Policy View State
    const [viewPolicy, setViewPolicy] = useState<any | null>(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [loadingPolicy, setLoadingPolicy] = useState(false);

    const supabase = createClient();

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("policy_cancellation_requests")
                .select(`
          *,
          policy:policies(policy_number, status),
          customer:customers(
            user:users(first_name, last_name, email)
          )
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Error al cargar las solicitudes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchPolicyDetails = async (policyId: string) => {
        try {
            setLoadingPolicy(true);
            const { data, error } = await supabase
                .from('policies')
                .select(`
                    *,
                    customer:customers(
                        *,
                        user:users(*)
                    ),
                    vehicle:vehicles(*)
                `)
                .eq('id', policyId)
                .single();

            if (error) throw error;
            setViewPolicy(data);
            setShowPolicyModal(true);
        } catch (error) {
            console.error("Error fetching policy details:", error);
            toast.error("Error al cargar detalles de la póliza");
        } finally {
            setLoadingPolicy(false);
        }
    };

    const handleProcessRequest = async () => {
        const { type, request } = confirmDialog;
        if (!type || !request) return;

        try {
            setProcessingId(request.id);

            const updateData: any = {
                status: type === "approve" ? "approved" : "rejected",
            };

            // Append admin decision to comments for record keeping
            // In a real app, we'd have separate columns for admin_notes and penalty_applied
            let adminNote = "";
            if (type === "approve") {
                // No appending for approval to keep it clean as requested
                adminNote = "";
            } else {
                adminNote = rejectionReason ? `\n[Admin: Rechazado - ${rejectionReason}]` : "\n[Admin: Rechazado]";
            }

            updateData.comments = (request.comments || "") + adminNote;

            // 1. Update request status
            const { error: requestError } = await supabase
                .from("policy_cancellation_requests")
                .update(updateData)
                .eq("id", request.id);

            if (requestError) throw requestError;

            // 2. If approved, cancel the policy
            if (type === "approve") {
                const { error: policyError } = await supabase
                    .from("policies")
                    .update({ status: "cancelled" })
                    .eq("id", request.policy_id);

                if (policyError) throw policyError;
            }

            // 3. Create Communication for Customer
            const communicationData = {
                customer_id: request.customer_id,
                policy_id: request.policy_id,
                communication_type: 'email', // Default to email style
                direction: 'outbound',
                status: 'sent',
                subject: type === "approve" 
                    ? `Cancelación aprobada – Póliza ${request.policy?.policy_number}`
                    : `Cancelación rechazada – Póliza ${request.policy?.policy_number}`,
                content: type === "approve"
                    ? `Estimado cliente,

Le informamos que la solicitud de cancelación de su póliza ${request.policy?.policy_number} ha sido aprobada.
La cancelación será efectiva a partir del ${format(new Date(), 'dd/MM/yyyy', { locale: es })}.

Si tiene alguna duda, por favor contacte a su agente o a nuestro centro de atención.`
                    : `Estimado cliente,

Le informamos que la solicitud de cancelación de su póliza ${request.policy?.policy_number} ha sido rechazada.

Motivo: ${rejectionReason || 'No especificado'}

Si requiere más información, por favor contacte a su agente.`
            };

            const { error: commError } = await supabase
                .from('communications')
                .insert(communicationData);

            if (commError) {
                console.error("Error creating communication:", commError);
                // Don't block the flow, just log it
                toast.error("Solicitud procesada, pero falló el envío de la notificación al cliente");
            } else {
                toast.success("Notificación enviada al cliente");
            }

            toast.success(
                type === "approve"
                    ? "Solicitud aprobada correctamente"
                    : "Solicitud rechazada correctamente"
            );

            fetchRequests();
            onUpdate?.();
            setConfirmDialog({ open: false, type: null, request: null });
            setRejectionReason("");
            setApplyPenalty("no");
        } catch (error) {
            console.error("Error processing request:", error);
            toast.error("Error al procesar la solicitud");
        } finally {
            setProcessingId(null);
        }
    };

    const getReasonLabel = (reason: string) => {
        const reasons: Record<string, string> = {
            better_price: "Mejor precio",
            sold_vehicle: "Vendió vehículo",
            service_issues: "Problemas de servicio",
            financial: "Razones económicas",
            other: "Otro",
        };
        return reasons[reason] || reason;
    };

    const parseComments = (rawComments: string) => {
        if (!rawComments) return { customerComment: "", adminDecision: null };

        const adminRegex = /\[Admin:\s*(.+?)\]/i;
        const match = rawComments.match(adminRegex);

        let customerComment = rawComments;
        let adminDecision = null;

        if (match) {
            customerComment = rawComments.replace(adminRegex, "").trim();
            adminDecision = match[1].trim();

            // Clean up common admin codes to readable text
            if (adminDecision === "Aprobado SIN MULTA") adminDecision = "Aprobado sin multa";
            if (adminDecision === "Aprobado CON MULTA") adminDecision = "Aprobado con multa";
            if (adminDecision === "Rechazado") adminDecision = "Rechazado";
            // Handle rejection with reason
            if (adminDecision.startsWith("Rechazado - ")) {
                 adminDecision = `Rechazado (${adminDecision.replace("Rechazado - ", "")})`;
            }
        }

        return { customerComment, adminDecision };
    };

    const getStatusBadge = (status: string, policyStatus?: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
            case "approved":
                return (
                    <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobada</Badge>
                        {policyStatus === "cancelled" && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                                Póliza Cancelada
                            </Badge>
                        )}
                    </div>
                );
            case "rejected":
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return <div className="text-center py-8">Cargando solicitudes...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Póliza</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay solicitudes de cancelación
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        {format(new Date(req.created_at), "dd/MM/yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell className="font-medium">{req.policy?.policy_number}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{req.customer?.user?.first_name} {req.customer?.user?.last_name}</span>
                                            <span className="text-xs text-muted-foreground">{req.customer?.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span>{getReasonLabel(req.reason)}</span>
                                            {(() => {
                                                const { customerComment, adminDecision } = parseComments(req.comments);
                                                return (
                                                    <>
                                                        {customerComment && (
                                                            <span className="text-xs text-muted-foreground italic">"{customerComment}"</span>
                                                        )}
                                                        {req.status !== "pending" && adminDecision && (
                                                            <span className="text-xs text-muted-foreground mt-1">
                                                                Decisión del agente: <span className="italic">{adminDecision}</span>
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(req.status, req.policy?.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => fetchPolicyDetails(req.policy_id)}
                                                title="Ver Póliza"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {req.status === "pending" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                        onClick={() => setConfirmDialog({ open: true, type: "approve", request: req })}
                                                        title="Aprobar"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                        onClick={() => setConfirmDialog({ open: true, type: "reject", request: req })}
                                                        title="Rechazar"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Approval/Rejection Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={confirmDialog.type === "approve" ? "text-green-600" : "text-red-600"}>
                            {confirmDialog.type === "approve" ? "Aprobar Cancelación" : "Rechazar Solicitud"}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.type === "approve"
                                ? `¿Estás seguro de que deseas aprobar la cancelación de la póliza ${confirmDialog.request?.policy?.policy_number}?`
                                : `¿Estás seguro de que deseas rechazar esta solicitud? La póliza permanecerá activa.`}
                        </DialogDescription>
                    </DialogHeader>

                    {confirmDialog.type === "reject" && (
                        <div className="py-2">
                            <Textarea
                                placeholder="Motivo del rechazo (opcional)..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                            disabled={!!processingId}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmDialog.type === "approve" ? "default" : "destructive"}
                            className={confirmDialog.type === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={handleProcessRequest}
                            disabled={!!processingId}
                        >
                            {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {confirmDialog.type === "approve" ? "Confirmar Cancelación" : "Rechazar Solicitud"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Policy Details Modal */}
            <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Detalles de Póliza {viewPolicy?.policy_number}
                        </DialogTitle>
                        <DialogDescription>Información completa de la póliza</DialogDescription>
                    </DialogHeader>

                    {viewPolicy && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Estado Actual:</span>
                                <Badge variant="outline">{viewPolicy.status}</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="font-medium">Cliente:</span>
                                    <p className="text-muted-foreground">
                                        {viewPolicy.customer?.user?.first_name} {viewPolicy.customer?.user?.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{viewPolicy.customer?.user?.email}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Vehículo:</span>
                                    <p className="text-muted-foreground">
                                        {viewPolicy.vehicle?.year} {viewPolicy.vehicle?.make} {viewPolicy.vehicle?.model}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{viewPolicy.vehicle?.license_plate}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Vigencia:</span>
                                    <p className="text-muted-foreground">
                                        {format(new Date(viewPolicy.start_date), 'dd/MM/yyyy')} - {format(new Date(viewPolicy.end_date), 'dd/MM/yyyy')}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">Prima:</span>
                                    <p className="text-lg font-bold text-primary">
                                        ${viewPolicy.premium_amount?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
