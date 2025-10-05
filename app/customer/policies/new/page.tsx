"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Calculator, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CustomerNewPolicyPage() {
    const router = useRouter();

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/customer/policies")}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Crear Póliza</h1>
                        <p className="text-muted-foreground">
                            Proceso de contratación de seguro
                        </p>
                    </div>
                </div>

                <Card className="max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <AlertCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                        <CardTitle className="text-2xl">
                            ¡Cambio en el Proceso!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Nuevo proceso de contratación:</strong>{" "}
                                Ahora debes crear una cotización primero. Un
                                agente revisará tu solicitud y, una vez
                                aprobada, se creará automáticamente tu póliza.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <h3 className="font-semibold">¿Cómo funciona?</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>
                                    Creas una cotización con la información de
                                    tu vehículo y preferencias
                                </li>
                                <li>Un agente experto revisa tu cotización</li>
                                <li>
                                    Recibes una notificación con la decisión
                                </li>
                                <li>
                                    Si es aprobada, tu póliza se crea
                                    automáticamente
                                </li>
                            </ol>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">
                                Beneficios del nuevo proceso:
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Revisión profesional de tu solicitud</li>
                                <li>
                                    Mejor ajuste de coberturas a tus necesidades
                                </li>
                                <li>Proceso más seguro y confiable</li>
                                <li>Atención personalizada</li>
                            </ul>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <Button
                                onClick={() => router.push("/customer/quote")}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                <Calculator className="h-4 w-4 mr-2" />
                                Crear Cotización
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/customer/quotes")}
                                className="flex-1"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Ver Mis Cotizaciones
                            </Button>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-sm text-muted-foreground">
                                ¿Ya tienes pólizas activas?{" "}
                                <Button
                                    variant="link"
                                    className="p-0 h-auto"
                                    onClick={() =>
                                        router.push("/customer/policies")
                                    }
                                >
                                    Ver mis pólizas
                                </Button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
