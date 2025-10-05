"use client";

import { AgentQuoteManagement } from "@/components/quotes/agent-quote-management";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { FileText, Users } from "lucide-react";

export default function QuoteManagementPage() {
    console.log("📄 QuoteManagementPage: Rendering page for agents");
    
    return (
        <ProtectedRoute allowedRoles={["admin", "agent"]}>
            <div className="container mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <FileText className="h-8 w-8" />
                        Gestión de Cotizaciones
                    </h1>
                    <p className="text-muted-foreground">
                        Revisa y aprueba las solicitudes de cotización de los
                        clientes
                    </p>
                </div>

                <AgentQuoteManagement />
            </div>
        </ProtectedRoute>
    );
}
