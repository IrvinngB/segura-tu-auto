"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, Edit, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { PaymentDetailsModal } from "./payment-details-modal";
import { EditPaymentStatusModal } from "./edit-payment-status-modal";

interface Payment {
    id: string;
    amount: number;
    payment_type: string;
    payment_method: string | null;
    payment_status: string;
    payment_date: string | null;
    due_date: string | null;
    reference_number: string | null;
    description: string;
    policy_id: string | null;
    customer_id: string;
    created_at: string;
    policy?: {
        policy_number: string;
        status: string;
    };
    customer?: {
        user: {
            first_name: string;
            last_name: string;
            email: string;
        };
    };
}

interface AdminPaymentsTableProps {
    refreshTrigger?: number;
    onUpdate?: () => void;
}

export function AdminPaymentsTable({ refreshTrigger, onUpdate }: AdminPaymentsTableProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchPayments();
    }, [refreshTrigger]);

    useEffect(() => {
        filterPayments();
    }, [payments, searchTerm, statusFilter, typeFilter]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("payments")
                .select(`
                    *,
                    policy:policies(policy_number, status),
                    customer:customers(
                        user:users(first_name, last_name, email)
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error("Error al cargar los pagos");
        } finally {
            setLoading(false);
        }
    };

    const filterPayments = () => {
        let filtered = payments;

        if (searchTerm) {
            filtered = filtered.filter(
                payment =>
                    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payment.policy?.policy_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payment.customer?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payment.customer?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payment.customer?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            if (statusFilter === "overdue") {
                filtered = filtered.filter(p => {
                    if (p.payment_status === "pending" && p.due_date) {
                        return new Date(p.due_date) < new Date();
                    }
                    return false;
                });
            } else {
                filtered = filtered.filter(payment => payment.payment_status === statusFilter);
            }
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(payment => payment.payment_type === typeFilter);
        }

        setFilteredPayments(filtered);
    };

    const getStatusBadge = (status: string, dueDate: string | null) => {
        if (status === "pending" && dueDate && new Date(dueDate) < new Date()) {
            return <Badge variant="destructive">Vencido</Badge>;
        }

        switch (status) {
            case "completed":
                return <Badge className="bg-green-600 hover:bg-green-700">Pagado</Badge>;
            case "pending":
                return <Badge className="bg-yellow-600 hover:bg-yellow-700">Pendiente</Badge>;
            case "failed":
                return <Badge variant="destructive">Fallido</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            premium: "Prima",
            claim: "Reclamación",
            refund: "Reembolso",
            fee: "Comisión",
        };
        return types[type] || type;
    };

    const handleViewDetails = (payment: Payment) => {
        setSelectedPayment(payment);
        setShowDetailsModal(true);
    };

    const handleEditStatus = (payment: Payment) => {
        setSelectedPayment(payment);
        setShowEditModal(true);
    };

    const handleUpdateSuccess = () => {
        setShowEditModal(false);
        setSelectedPayment(null);
        fetchPayments();
        onUpdate?.();
    };

    const exportToCSV = () => {
        const headers = ["Fecha", "Referencia", "Cliente", "Póliza", "Tipo", "Monto", "Estado"];
        const rows = filteredPayments.map(p => [
            p.created_at ? format(new Date(p.created_at), "dd/MM/yyyy") : "",
            p.reference_number || "",
            `${p.customer?.user?.first_name} ${p.customer?.user?.last_name}`,
            p.policy?.policy_number || "",
            getPaymentTypeLabel(p.payment_type),
            p.amount.toString(),
            p.payment_status,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pagos_${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div className="text-center py-8">Cargando pagos...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por referencia, póliza, cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="completed">Pagado</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="failed">Fallido</SelectItem>
                        <SelectItem value="overdue">Vencido</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="premium">Prima</SelectItem>
                        <SelectItem value="claim">Reclamación</SelectItem>
                        <SelectItem value="refund">Reembolso</SelectItem>
                        <SelectItem value="fee">Comisión</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Referencia</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Póliza</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPayments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No se encontraron pagos
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPayments.map(payment => (
                                <TableRow key={payment.id}>
                                    <TableCell>
                                        {payment.created_at
                                            ? format(new Date(payment.created_at), "dd/MM/yyyy", { locale: es })
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {payment.reference_number || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {payment.customer?.user?.first_name} {payment.customer?.user?.last_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {payment.customer?.user?.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{payment.policy?.policy_number || "-"}</TableCell>
                                    <TableCell>{getPaymentTypeLabel(payment.payment_type)}</TableCell>
                                    <TableCell className="font-bold">
                                        ${payment.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(payment.payment_status, payment.due_date)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(payment)}
                                                title="Ver detalles"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditStatus(payment)}
                                                title="Editar estado"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Mostrando {filteredPayments.length} de {payments.length} pagos
                </span>
                <span>
                    Total: ${filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </span>
            </div>

            {selectedPayment && (
                <>
                    <PaymentDetailsModal
                        payment={selectedPayment}
                        open={showDetailsModal}
                        onOpenChange={setShowDetailsModal}
                    />
                    <EditPaymentStatusModal
                        payment={selectedPayment}
                        open={showEditModal}
                        onOpenChange={setShowEditModal}
                        onSuccess={handleUpdateSuccess}
                    />
                </>
            )}
        </div>
    );
}
