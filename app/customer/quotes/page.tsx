"use client";

import { QuoteList } from "@/components/customer/quote-list";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

export default function CustomerQuotesPage() {
    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <FileText className="h-8 w-8" />
                            Mis Cotizaciones
                        </h1>
                        <p className="text-muted-foreground">
                            Revisa el estado de tus solicitudes de cotización
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/customer/quote">
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Cotización
                        </Link>
                    </Button>
                </div>

                <QuoteList />
            </div>
        </ProtectedRoute>
    );
}
