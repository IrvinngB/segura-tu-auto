"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPaymentsTable } from "@/components/admin/admin-payments-table";
import { AdminPaymentStats } from "@/components/admin/admin-payment-stats";
import { SimulatePaymentModal } from "@/components/admin/simulate-payment-modal";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, Plus, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface PaymentStats {
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
    totalOverdue: number;
    paymentsThisMonth: number;
    paymentsCount: {
        completed: number;
        pending: number;
        failed: number;
        overdue: number;
    };
}

export default function AdminPaymentsPage() {
    const [stats, setStats] = useState<PaymentStats>({
        totalPaid: 0,
        totalPending: 0,
        totalFailed: 0,
        totalOverdue: 0,
        paymentsThisMonth: 0,
        paymentsCount: {
            completed: 0,
            pending: 0,
            failed: 0,
            overdue: 0,
        },
    });
    const [loading, setLoading] = useState(true);
    const [showSimulateModal, setShowSimulateModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        fetchStats();
    }, [refreshTrigger]);

    const fetchStats = async () => {
        try {
            setLoading(true);

            const { data: payments, error } = await supabase
                .from("payments")
                .select("amount, payment_status, payment_date, due_date, created_at");

            if (error) throw error;

            if (payments) {
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const completed = payments.filter(p => p.payment_status === "completed");
                const pending = payments.filter(p => p.payment_status === "pending");
                const failed = payments.filter(p => p.payment_status === "failed");
                
                const overdue = payments.filter(p => {
                    if (p.payment_status === "pending" && p.due_date) {
                        return new Date(p.due_date) < now;
                    }
                    return false;
                });

                const thisMonth = payments.filter(p => {
                    if (p.payment_date) {
                        return new Date(p.payment_date) >= firstDayOfMonth;
                    }
                    return false;
                });

                setStats({
                    totalPaid: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
                    totalPending: pending.reduce((sum, p) => sum + (p.amount || 0), 0),
                    totalFailed: failed.reduce((sum, p) => sum + (p.amount || 0), 0),
                    totalOverdue: overdue.reduce((sum, p) => sum + (p.amount || 0), 0),
                    paymentsThisMonth: thisMonth.reduce((sum, p) => sum + (p.amount || 0), 0),
                    paymentsCount: {
                        completed: completed.length,
                        pending: pending.length,
                        failed: failed.length,
                        overdue: overdue.length,
                    },
                });
            }
        } catch (error) {
            console.error("Error fetching payment stats:", error);
            toast.error("Error al cargar estadísticas de pagos");
        } finally {
            setLoading(false);
        }
    };

    const handleSimulateSuccess = () => {
        setShowSimulateModal(false);
        setRefreshTrigger(prev => prev + 1);
        toast.success("Pago simulado exitosamente");
    };

    return (
        <ProtectedRoute allowedRoles={["admin", "agent"]}>
            <div className="container mx-auto py-8 px-4 space-y-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
                        <p className="text-muted-foreground">
                            Administra y simula pagos de pólizas
                        </p>
                    </div>
                    <Button onClick={() => setShowSimulateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Simular Pago
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Cargando estadísticas...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        ${stats.totalPaid.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.paymentsCount.completed} pagos completados
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-600">
                                        ${stats.totalPending.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.paymentsCount.pending} pagos pendientes
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">
                                        ${stats.totalOverdue.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.paymentsCount.overdue} pagos vencidos
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">
                                        ${stats.paymentsThisMonth.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Ingresos del mes actual
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <AdminPaymentStats stats={stats} />

                        <Card>
                            <CardHeader>
                                <CardTitle>Todos los Pagos</CardTitle>
                                <CardDescription>
                                    Gestiona pagos reales y simulados del sistema
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AdminPaymentsTable 
                                    refreshTrigger={refreshTrigger}
                                    onUpdate={() => setRefreshTrigger(prev => prev + 1)}
                                />
                            </CardContent>
                        </Card>
                    </>
                )}

                <SimulatePaymentModal
                    open={showSimulateModal}
                    onOpenChange={setShowSimulateModal}
                    onSuccess={handleSimulateSuccess}
                />
            </div>
        </ProtectedRoute>
    );
}
