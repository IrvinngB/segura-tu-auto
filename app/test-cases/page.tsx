"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, TestTube } from "lucide-react";

interface TestCase {
    id: string;
    title: string;
    description: string;
    category: "validation" | "success" | "error" | "ui";
    status: "pending" | "passed" | "failed";
    result?: string;
}

export default function TestCasesPage() {
    const [testCases, setTestCases] = useState<TestCase[]>([
        {
            id: "quote-valid-data",
            title: "Solicitud de cotización con datos válidos",
            description: "Crear cotización con todos los campos completos y vehículo registrado",
            category: "validation",
            status: "pending"
        },
        {
            id: "quote-incomplete-data",
            title: "Solicitud de cotización con datos incompletos",
            description: "Intentar crear cotización sin vehículo seleccionado o datos faltantes",
            category: "validation",
            status: "pending"
        },
        {
            id: "quote-visualization",
            title: "Visualización de cotización generada",
            description: "Ver cotización creada en la lista de cotizaciones del cliente",
            category: "ui",
            status: "pending"
        },
        {
            id: "plan-selection",
            title: "Selección de plan de póliza",
            description: "Seleccionar diferentes planes (básico, completo, premium) y ver cambios en precio",
            category: "ui",
            status: "pending"
        },
        {
            id: "policy-confirmation",
            title: "Confirmación de contratación de póliza",
            description: "Proceso de confirmación al solicitar cotización",
            category: "ui",
            status: "pending"
        },
        {
            id: "payment-valid",
            title: "Contratación con método de pago válido",
            description: "Crear póliza con método de pago configurado correctamente",
            category: "success",
            status: "pending"
        },
        {
            id: "payment-invalid",
            title: "Contratación con método de pago inválido",
            description: "Intentar crear póliza sin método de pago o con datos inválidos",
            category: "error",
            status: "pending"
        },
        {
            id: "success-message",
            title: "Recepción de mensaje/modal de éxito tras contratar",
            description: "Mostrar modal de confirmación después de crear cotización exitosamente",
            category: "success",
            status: "pending"
        },
        {
            id: "error-message",
            title: "Recepción de mensaje/modal de error si falla la contratación",
            description: "Mostrar modal de error cuando falla la creación de cotización",
            category: "error",
            status: "pending"
        },
        {
            id: "policy-visualization",
            title: "Visualización de póliza contratada en el panel de usuario",
            description: "Ver pólizas activas en el dashboard del cliente",
            category: "ui",
            status: "pending"
        },
        {
            id: "no-vehicle-restriction",
            title: "Restricción de contratación si el usuario no tiene vehículo registrado",
            description: "Prevenir creación de cotización si no hay vehículos registrados",
            category: "validation",
            status: "pending"
        },
        {
            id: "duplicate-policy-restriction",
            title: "Restricción de contratación si el usuario tiene póliza activa para el mismo vehículo",
            description: "Prevenir múltiples pólizas para el mismo vehículo",
            category: "validation",
            status: "pending"
        }
    ]);

    const updateTestStatus = (id: string, status: TestCase["status"], result?: string) => {
        setTestCases(prev => prev.map(test => 
            test.id === id ? { ...test, status, result } : test
        ));
    };

    const runAllTests = async () => {
        // Simulate running tests
        for (const test of testCases) {
            updateTestStatus(test.id, "pending");
            
            // Simulate test execution time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate test results (randomly pass/fail for demo)
            const shouldPass = Math.random() > 0.3; // 70% pass rate
            updateTestStatus(
                test.id, 
                shouldPass ? "passed" : "failed",
                shouldPass ? "Test passed successfully" : "Test failed - check implementation"
            );
        }
    };

    const getCategoryColor = (category: TestCase["category"]) => {
        switch (category) {
            case "validation": return "bg-blue-100 text-blue-800";
            case "success": return "bg-green-100 text-green-800";
            case "error": return "bg-red-100 text-red-800";
            case "ui": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: TestCase["status"]) => {
        switch (status) {
            case "passed": return <CheckCircle className="h-5 w-5 text-green-600" />;
            case "failed": return <XCircle className="h-5 w-5 text-red-600" />;
            case "pending": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            default: return <TestTube className="h-5 w-5 text-gray-600" />;
        }
    };

    const stats = {
        total: testCases.length,
        passed: testCases.filter(t => t.status === "passed").length,
        failed: testCases.filter(t => t.status === "failed").length,
        pending: testCases.filter(t => t.status === "pending").length,
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Casos de Prueba - SeguraTuAuto</h1>
                <p className="text-muted-foreground mb-6">
                    Verificación de funcionalidades del sistema de cotizaciones y pólizas
                </p>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-sm text-muted-foreground">Total Tests</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                            <p className="text-sm text-muted-foreground">Passed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                            <p className="text-sm text-muted-foreground">Failed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <p className="text-sm text-muted-foreground">Pending</p>
                        </CardContent>
                    </Card>
                </div>

                <Button onClick={runAllTests} className="mb-6">
                    <TestTube className="h-4 w-4 mr-2" />
                    Ejecutar Todas las Pruebas
                </Button>
            </div>

            {/* Test Cases */}
            <div className="space-y-4">
                {testCases.map((testCase) => (
                    <Card key={testCase.id} className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getStatusIcon(testCase.status)}
                                        <CardTitle className="text-lg">{testCase.title}</CardTitle>
                                        <Badge className={getCategoryColor(testCase.category)}>
                                            {testCase.category}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {testCase.description}
                                    </CardDescription>
                                </div>
                                <Badge 
                                    variant={
                                        testCase.status === "passed" ? "default" : 
                                        testCase.status === "failed" ? "destructive" : 
                                        "secondary"
                                    }
                                >
                                    {testCase.status.toUpperCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                        {testCase.result && (
                            <CardContent className="pt-0">
                                <p className={`text-sm ${
                                    testCase.status === "passed" ? "text-green-700" : "text-red-700"
                                }`}>
                                    {testCase.result}
                                </p>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>

            {/* Manual Testing Instructions */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Instrucciones para Pruebas Manuales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">1. Datos válidos:</h4>
                        <p className="text-sm text-muted-foreground">
                            Registra un vehículo, ve a cotizaciones, completa todos los campos y solicita la cotización.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">2. Datos incompletos:</h4>
                        <p className="text-sm text-muted-foreground">
                            Intenta crear una cotización sin vehículo registrado o sin completar campos requeridos.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">3. Póliza duplicada:</h4>
                        <p className="text-sm text-muted-foreground">
                            Crea una póliza para un vehículo e intenta crear otra para el mismo vehículo.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">4. Métodos de pago:</h4>
                        <p className="text-sm text-muted-foreground">
                            Prueba el flujo completo: configura métodos de pago, crea cotización y procesa el pago.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}