"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { PaymentMethods } from "@/components/customer/payment-methods";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CustomerPaymentMethodsPage() {
    const router = useRouter();

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/customer/dashboard")}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Métodos de Pago</h1>
                        <p className="text-muted-foreground">
                            Gestiona tus métodos de pago para las primas de seguros
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <PaymentMethods />
                </div>
            </div>
        </ProtectedRoute>
    );
}