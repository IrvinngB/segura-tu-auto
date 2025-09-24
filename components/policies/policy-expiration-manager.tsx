"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    updateExpiredPolicies,
    getExpiringPolicies,
    type PolicyExpirationResult,
    type ExpiringPolicy,
} from "@/lib/policy-expiration";
import {
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Calendar,
    Shield,
    Clock,
} from "lucide-react";

export function PolicyExpirationManager() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PolicyExpirationResult | null>(null);
    const [expiringPolicies, setExpiringPolicies] = useState<ExpiringPolicy[]>(
        []
    );
    const [showExpiring, setShowExpiring] = useState(false);

    const handleUpdateExpired = async () => {
        setLoading(true);
        try {
            const updateResult = await updateExpiredPolicies();
            setResult(updateResult);
        } catch (error) {
            console.error("Error updating expired policies:", error);
            setResult({
                updatedCount: 0,
                updatedPolicyNumbers: [],
                error: "Error inesperado al actualizar pólizas",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckExpiring = async () => {
        setLoading(true);
        try {
            const expiring = await getExpiringPolicies(30);
            setExpiringPolicies(expiring);
            setShowExpiring(true);
        } catch (error) {
            console.error("Error checking expiring policies:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Gestión de Pólizas Vencidas
                    </CardTitle>
                    <CardDescription>
                        Herramientas para actualizar el estado de las pólizas
                        vencidas y verificar pólizas que vencerán pronto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button
                            onClick={handleUpdateExpired}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${
                                    loading ? "animate-spin" : ""
                                }`}
                            />
                            Actualizar Pólizas Vencidas
                        </Button>

                        <Button
                            onClick={handleCheckExpiring}
                            disabled={loading}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Clock className="h-4 w-4" />
                            Verificar Próximas a Vencer
                        </Button>
                    </div>

                    {result && (
                        <Alert
                            className={
                                result.error
                                    ? "border-red-200 bg-red-50"
                                    : "border-green-200 bg-green-50"
                            }
                        >
                            <div className="flex items-center gap-2">
                                {result.error ? (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <AlertDescription
                                    className={
                                        result.error
                                            ? "text-red-800"
                                            : "text-green-800"
                                    }
                                >
                                    {result.error ? (
                                        result.error
                                    ) : (
                                        <>
                                            Se actualizaron{" "}
                                            {result.updatedCount} pólizas
                                            vencidas.
                                            {result.updatedPolicyNumbers
                                                .length > 0 && (
                                                <div className="mt-2">
                                                    <strong>
                                                        Pólizas actualizadas:
                                                    </strong>
                                                    <ul className="list-disc list-inside mt-1">
                                                        {result.updatedPolicyNumbers.map(
                                                            (policyNumber) => (
                                                                <li
                                                                    key={
                                                                        policyNumber
                                                                    }
                                                                >
                                                                    {
                                                                        policyNumber
                                                                    }
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </AlertDescription>
                            </div>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {showExpiring && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Pólizas que Vencen en los Próximos 30 Días
                        </CardTitle>
                        <CardDescription>
                            Lista de pólizas que requerirán atención pronto
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expiringPolicies.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay pólizas próximas a vencer en los próximos
                                30 días.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {expiringPolicies.map((policy) => (
                                    <div
                                        key={policy.policy_number}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {policy.policy_number}
                                                </span>
                                                <Badge
                                                    variant={
                                                        policy.days_until_expiry <=
                                                        7
                                                            ? "destructive"
                                                            : "outline"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {policy.days_until_expiry}{" "}
                                                    días restantes
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {policy.customer_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {policy.vehicle_info}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                Vence:{" "}
                                                {new Date(
                                                    policy.end_date
                                                ).toLocaleDateString("es-ES")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
