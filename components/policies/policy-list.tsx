"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { simpleUpdateExpiredPolicies } from "@/lib/simple-update-policies";
import type { Policy } from "@/lib/types/database";
import { Search, Eye, Edit, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PolicyListProps {
    customerId?: string;
    onViewPolicy?: (policy: Policy) => void;
    onEditPolicy?: (policy: Policy) => void;
}

export function PolicyList({
    customerId,
    onViewPolicy,
    onEditPolicy,
}: PolicyListProps) {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const supabase = createClient();

    useEffect(() => {
        fetchPolicies();
    }, [customerId]);

    useEffect(() => {
        filterPolicies();
    }, [policies, searchTerm, statusFilter, typeFilter]);

    const fetchPolicies = async () => {
        try {
            // First, force update any expired policies
            console.log("🔄 Actualizando pólizas vencidas en lista...");
            await simpleUpdateExpiredPolicies();

            let query = supabase
                .from("policies")
                .select(
                    `
          *,
          customer:customers(
            *,
            user:users(*)
          ),
          vehicle:vehicles(*),
          agent:users(*)
        `
                )
                .order("created_at", { ascending: false });

            if (customerId) {
                query = query.eq("customer_id", customerId);
            }

            const { data, error } = await query;

            if (error) throw error;
            if (data) {
                setPolicies(data);
                setFilteredPolicies(data);
            }
        } catch (error) {
            console.error("Error fetching policies:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterPolicies = () => {
        let filtered = policies;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (policy) =>
                    policy.policy_number
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    policy.customer?.user?.first_name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    policy.customer?.user?.last_name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    policy.customer?.user?.email
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    policy.vehicle?.make
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    policy.vehicle?.model
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (policy) => policy.status === statusFilter
            );
        }

        // Type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter(
                (policy) => policy.policy_type === typeFilter
            );
        }

        setFilteredPolicies(filtered);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { label: "Activa", classes: "status-badge status-active" },
            expired: { label: "Vencida", classes: "status-badge status-expired" },
            cancelled: { label: "Cancelada", classes: "status-badge status-cancelled" },
            suspended: { label: "Suspendida", classes: "status-badge status-suspended" },
            draft: { label: "Borrador", classes: "status-badge status-draft" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
            label: status,
            classes: "status-badge status-active",
        };
        return <span className={config.classes}>{config.label}</span>;
    };

    const getPolicyTypeLabel = (type: string) => {
        const types = {
            basica: "Básica",
            limitada: "Limitada",
            amplia: "Amplia",
            // Mantener compatibilidad con valores antiguos
            Básica: "Básica",
            Básico: "Básica",
            Limitada: "Limitada",
            Completo: "Limitada",
            Amplia: "Amplia",
            Premium: "Amplia",
            comprehensive: "Amplia",
            liability: "Básica",
            basic: "Básica",
        };
        return types[type as keyof typeof types] || type;
    };

    const isExpiringSoon = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil(
            (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        // Mostrar "vence pronto" si vence en 30 días o menos, O si ya venció (daysUntilExpiry <= 0)
        return daysUntilExpiry <= 30;
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">Cargando pólizas...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pólizas de Seguro
                </CardTitle>
                <CardDescription>
                    {customerId
                        ? "Pólizas del cliente"
                        : "Gestión de todas las pólizas"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por número de póliza, cliente, vehículo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Todos los estados
                            </SelectItem>
                            <SelectItem value="active">Activa</SelectItem>
                            <SelectItem value="expired">Vencida</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                            <SelectItem value="suspended">
                                Suspendida
                            </SelectItem>
                            <SelectItem value="draft">Borrador</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            <SelectItem value="basica">Básica</SelectItem>
                            <SelectItem value="limitada">Limitada</SelectItem>
                            <SelectItem value="amplia">Amplia</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Policies Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Número de Póliza</TableHead>
                                {!customerId && <TableHead>Cliente</TableHead>}
                                <TableHead>Vehículo</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                                <TableHead>Vigencia</TableHead>
                                <TableHead>Prima</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPolicies.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={customerId ? 7 : 8}
                                        className="text-center py-8"
                                    >
                                        No se encontraron pólizas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPolicies.map((policy) => (
                                    <TableRow key={policy.id}>
                                        <TableCell className="font-medium">
                                            {policy.policy_number}
                                        </TableCell>
                                        {!customerId && (
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {
                                                            policy.customer
                                                                ?.user
                                                                ?.first_name
                                                        }{" "}
                                                        {
                                                            policy.customer
                                                                ?.user
                                                                ?.last_name
                                                        }
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {
                                                            policy.customer
                                                                ?.user?.email
                                                        }
                                                    </div>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {policy.vehicle?.year}{" "}
                                                    {policy.vehicle?.make}{" "}
                                                    {policy.vehicle?.model}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {
                                                        policy.vehicle
                                                            ?.license_plate
                                                    }
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getPolicyTypeLabel(
                                                policy.policy_type
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col gap-2 items-center justify-center">
                                                {getStatusBadge(policy.status)}
                                                {isExpiringSoon(
                                                    policy.end_date
                                                ) &&
                                                    policy.status !==
                                                        "expired" && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs flex items-center justify-center px-3 py-1 min-w-[90px]"
                                                        >
                                                            Vence pronto
                                                        </Badge>
                                                    )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {format(
                                                        new Date(
                                                            policy.start_date
                                                        ),
                                                        "dd/MM/yyyy",
                                                        { locale: es }
                                                    )}{" "}
                                                    -{" "}
                                                    {format(
                                                        new Date(
                                                            policy.end_date
                                                        ),
                                                        "dd/MM/yyyy",
                                                        { locale: es }
                                                    )}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">
                                                    $
                                                    {policy.premium_amount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {policy.payment_frequency}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        onViewPolicy?.(policy)
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        onEditPolicy?.(policy)
                                                    }
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

                {/* Summary */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">
                                {
                                    filteredPolicies.filter(
                                        (p) => p.status === "active"
                                    ).length
                                }
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Activas
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-yellow-600">
                                {
                                    filteredPolicies.filter((p) =>
                                        isExpiringSoon(p.end_date)
                                    ).length
                                }
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Por vencer
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-red-600">
                                {
                                    filteredPolicies.filter(
                                        (p) => p.status === "expired"
                                    ).length
                                }
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Vencidas
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-primary">
                                $
                                {filteredPolicies
                                    .reduce(
                                        (sum, p) => sum + p.premium_amount,
                                        0
                                    )
                                    .toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Prima total
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}
