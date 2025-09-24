"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    forceUpdateExpiredPolicies,
    checkPolicyStatuses,
} from "@/lib/force-update-policies";
import {
    simpleUpdateExpiredPolicies,
    debugPolicyStatuses,
} from "@/lib/simple-update-policies";
import { RefreshCw, Eye, AlertTriangle } from "lucide-react";

export default function TestPolicies() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [policies, setPolicies] = useState<any[]>([]);

    const handleForceUpdate = async () => {
        setLoading(true);
        try {
            // Primero mostrar el debug
            console.log("🔍 Mostrando estado actual...");
            await debugPolicyStatuses();

            // Luego actualizar
            const updateResult = await simpleUpdateExpiredPolicies();
            setResult(updateResult);
            console.log("🔄 Resultado de actualización:", updateResult);
        } catch (error) {
            console.error("❌ Error:", error);
            setResult({ success: false, error: error });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckPolicies = async () => {
        setLoading(true);
        try {
            const policiesData = await checkPolicyStatuses();
            setPolicies(policiesData);
            console.log("📊 Estados de pólizas:", policiesData);
        } catch (error) {
            console.error("❌ Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">
                        🔧 Test de Pólizas Vencidas
                    </h1>
                    <p className="text-muted-foreground">
                        Página de prueba para actualizar pólizas vencidas
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Acciones de Prueba</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4 flex-wrap">
                            <Button
                                onClick={async () => {
                                    console.log(
                                        "🔍 Mostrando debug completo..."
                                    );
                                    await debugPolicyStatuses();
                                    alert(
                                        "Revisa la consola del navegador (F12) para ver el debug completo"
                                    );
                                }}
                                disabled={loading}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                🔍 Debug Consola
                            </Button>

                            <Button
                                onClick={handleForceUpdate}
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
                                onClick={handleCheckPolicies}
                                disabled={loading}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                Verificar Estado Completo
                            </Button>
                        </div>

                        {result && (
                            <Alert
                                className={
                                    result.success
                                        ? "border-green-200 bg-green-50"
                                        : "border-red-200 bg-red-50"
                                }
                            >
                                <AlertTriangle
                                    className={`h-4 w-4 ${
                                        result.success
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                />
                                <AlertDescription
                                    className={
                                        result.success
                                            ? "text-green-800"
                                            : "text-red-800"
                                    }
                                >
                                    <strong>Resultado de Actualización:</strong>
                                    <br />
                                    {result.message || result.error}
                                    {result.updatedPolicies &&
                                        result.updatedPolicies.length > 0 && (
                                            <div className="mt-2">
                                                <strong>
                                                    Pólizas actualizadas:
                                                </strong>
                                                <ul className="list-disc list-inside mt-1">
                                                    {result.updatedPolicies.map(
                                                        (policy: any) => (
                                                            <li
                                                                key={
                                                                    policy.policy_number
                                                                }
                                                            >
                                                                {
                                                                    policy.policy_number
                                                                }{" "}
                                                                -{" "}
                                                                {policy.status}{" "}
                                                                (Vencía:{" "}
                                                                {
                                                                    policy.end_date
                                                                }
                                                                )
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {policies.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Todas las Pólizas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">
                                                Número de Póliza
                                            </th>
                                            <th className="text-left p-2">
                                                Estado Actual
                                            </th>
                                            <th className="text-left p-2">
                                                Fecha de Vencimiento
                                            </th>
                                            <th className="text-left p-2">
                                                ¿Debería estar vencida?
                                            </th>
                                            <th className="text-left p-2">
                                                Días desde vencimiento
                                            </th>
                                            <th className="text-left p-2">
                                                ¿Estado correcto?
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {policies.map((policy: any) => (
                                            <tr
                                                key={policy.policy_number}
                                                className="border-b"
                                            >
                                                <td className="p-2 font-medium">
                                                    {policy.policy_number}
                                                </td>
                                                <td className="p-2">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs ${
                                                            policy.status ===
                                                            "active"
                                                                ? "bg-green-100 text-green-800"
                                                                : policy.status ===
                                                                  "expired"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                    >
                                                        {policy.status}
                                                    </span>
                                                </td>
                                                <td className="p-2">
                                                    {policy.end_date}
                                                </td>
                                                <td className="p-2">
                                                    <span
                                                        className={
                                                            policy.shouldBeExpired
                                                                ? "text-red-600"
                                                                : "text-green-600"
                                                        }
                                                    >
                                                        {policy.shouldBeExpired
                                                            ? "SÍ"
                                                            : "NO"}
                                                    </span>
                                                </td>
                                                <td className="p-2">
                                                    {policy.daysFromExpiry > 0
                                                        ? `${policy.daysFromExpiry} días restantes`
                                                        : `${Math.abs(
                                                              policy.daysFromExpiry
                                                          )} días vencida`}
                                                </td>
                                                <td className="p-2">
                                                    <span
                                                        className={
                                                            policy.isCorrectStatus
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
                                                        {policy.isCorrectStatus
                                                            ? "✅ Correcto"
                                                            : "❌ Incorrecto"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Instrucciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p>
                                <strong>1. Verificar Estado:</strong> Haz clic
                                en "Verificar Estado" para ver todas las pólizas
                            </p>
                            <p>
                                <strong>2. Actualizar Vencidas:</strong> Haz
                                clic en "Forzar Actualización" para corregir los
                                estados
                            </p>
                            <p>
                                <strong>3. Verificar Resultados:</strong> Vuelve
                                a verificar el estado después de actualizar
                            </p>
                            <p className="text-red-600">
                                <strong>Nota:</strong> Esta es una página de
                                prueba temporal
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
