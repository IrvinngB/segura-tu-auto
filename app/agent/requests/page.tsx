"use client";

import { useState, useEffect } from "react";
import { CancellationRequestsTable } from "@/components/policies/cancellation-requests-table";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileX, Clock, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AgentRequestsPage() {
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    const supabase = createClient();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from("policy_cancellation_requests")
                .select("status");

            if (error) throw error;

            const pending = data?.filter(r => r.status === "pending").length || 0;
            const approved = data?.filter(r => r.status === "approved").length || 0;
            const rejected = data?.filter(r => r.status === "rejected").length || 0;

            setStats({ pending, approved, rejected });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["agent", "admin"]}>
            <div className="container mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <FileX className="h-8 w-8 text-destructive" />
                        Solicitudes de Cancelación
                    </h1>
                    <p className="text-muted-foreground">
                        Gestiona las solicitudes de cancelación de pólizas de los clientes.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Aprobadas</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Rechazadas</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Todas las Solicitudes</CardTitle>
                        <CardDescription>
                            Revisa y procesa las solicitudes de cancelación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CancellationRequestsTable onUpdate={fetchStats} />
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
