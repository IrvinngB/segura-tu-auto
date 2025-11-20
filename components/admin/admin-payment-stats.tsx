"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";

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

interface AdminPaymentStatsProps {
    stats: PaymentStats;
}

export function AdminPaymentStats({ stats }: AdminPaymentStatsProps) {
    const totalPayments = stats.paymentsCount.completed + stats.paymentsCount.pending + stats.paymentsCount.failed;
    const successRate = totalPayments > 0 ? ((stats.paymentsCount.completed / totalPayments) * 100).toFixed(1) : 0;
    const pendingRate = totalPayments > 0 ? ((stats.paymentsCount.pending / totalPayments) * 100).toFixed(1) : 0;
    const failedRate = totalPayments > 0 ? ((stats.paymentsCount.failed / totalPayments) * 100).toFixed(1) : 0;

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Resumen de Transacciones
                    </CardTitle>
                    <CardDescription>
                        Distribución de pagos por estado
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pagos Completados</span>
                            <span className="font-medium">{stats.paymentsCount.completed} ({successRate}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${successRate}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pagos Pendientes</span>
                            <span className="font-medium">{stats.paymentsCount.pending} ({pendingRate}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-yellow-600 h-2 rounded-full transition-all"
                                style={{ width: `${pendingRate}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pagos Fallidos</span>
                            <span className="font-medium">{stats.paymentsCount.failed} ({failedRate}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-red-600 h-2 rounded-full transition-all"
                                style={{ width: `${failedRate}%` }}
                            />
                        </div>
                    </div>

                    {stats.paymentsCount.overdue > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-destructive font-medium">Pagos Vencidos</span>
                                <span className="font-bold text-destructive">{stats.paymentsCount.overdue}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Análisis Financiero
                    </CardTitle>
                    <CardDescription>
                        Montos totales por estado
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Ingresos Completados</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                            ${stats.totalPaid.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium">Pendientes de Cobro</span>
                        </div>
                        <span className="text-lg font-bold text-yellow-600">
                            ${stats.totalPending.toLocaleString()}
                        </span>
                    </div>

                    {stats.totalOverdue > 0 && (
                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium">Vencidos</span>
                            </div>
                            <span className="text-lg font-bold text-red-600">
                                ${stats.totalOverdue.toLocaleString()}
                            </span>
                        </div>
                    )}

                    <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total en Sistema</span>
                            <span className="text-xl font-bold">
                                ${(stats.totalPaid + stats.totalPending + stats.totalFailed).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
