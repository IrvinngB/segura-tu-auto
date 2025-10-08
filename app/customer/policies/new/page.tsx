"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Calculator, AlertCircle, CreditCard, CheckCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentMethods } from "@/components/customer/payment-methods";
import { PaymentModal } from "@/components/policies/payment-modal";
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple";

export default function CustomerNewPolicyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { customerData } = useCustomerDataSimple();
    const [currentStep, setCurrentStep] = useState(1);
    const [approvedQuote, setApprovedQuote] = useState<any>(null);
    const [hasPaymentMethods, setHasPaymentMethods] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [checkingPaymentMethods, setCheckingPaymentMethods] = useState(true);

    // Check if coming from an approved quote
    const quoteId = searchParams.get("quote");

    useEffect(() => {
        if (quoteId) {
            // Simulate fetching the approved quote
            setApprovedQuote({
                id: quoteId,
                quote_number: "COT-2025-001",
                premium_amount: 15000,
                policy_type: "basica",
                vehicle: {
                    year: 2020,
                    make: "Toyota",
                    model: "Corolla"
                }
            });
            setCurrentStep(2);
        }
        
        // Check payment methods
        checkPaymentMethodsAvailability();
    }, [quoteId]);

    const checkPaymentMethodsAvailability = async () => {
        if (!customerData) return;
        
        setCheckingPaymentMethods(true);
        try {
            // Simulate checking if customer has payment methods
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes, let's assume they have payment methods
            // In real implementation, this would check the database
            setHasPaymentMethods(true);
        } catch (error) {
            console.error("Error checking payment methods:", error);
            setHasPaymentMethods(false);
        } finally {
            setCheckingPaymentMethods(false);
        }
    };

    const handlePaymentMethodAdded = () => {
        setHasPaymentMethods(true);
        setCurrentStep(3);
    };

    const handleProceedToPayment = () => {
        if (!hasPaymentMethods) {
            setCurrentStep(2);
            return;
        }
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = (paymentId: string) => {
        setShowPaymentModal(false);
        // Simulate policy creation
        router.push("/customer/policies?success=true");
    };

    const handlePaymentError = (error: string) => {
        alert("Error en el pago: " + error);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader className="text-center">
                            <AlertCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                            <CardTitle className="text-2xl">
                                Proceso de Contratación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert>
                                <FileText className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Nuevo proceso simplificado:</strong> Primero crea una cotización, 
                                    espera la aprobación del agente y luego procede con el pago para activar tu póliza.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <h3 className="font-semibold">Pasos del proceso:</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="text-sm">1. Crear cotización con información del vehículo</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                                        <span className="text-sm">2. Esperar revisión y aprobación del agente</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                        <CreditCard className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm">3. Configurar método de pago y procesar prima</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                        <span className="text-sm">4. Póliza activada automáticamente</span>
                                    </div>
                                </div>
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
                        </CardContent>
                    </Card>
                );

            case 2:
                return (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Quote Information */}
                        {approvedQuote && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        Cotización Aprobada
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <span className="text-sm text-muted-foreground">Número</span>
                                            <p className="font-semibold">{approvedQuote.quote_number}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted-foreground">Prima Anual</span>
                                            <p className="font-semibold text-lg text-primary">
                                                ${approvedQuote.premium_amount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted-foreground">Plan</span>
                                            <p className="font-semibold capitalize">{approvedQuote.policy_type}</p>
                                        </div>
                                    </div>
                                    
                                    {approvedQuote.vehicle && (
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <span className="text-sm text-muted-foreground">Vehículo Asegurado</span>
                                            <p className="font-medium">
                                                {approvedQuote.vehicle.year} {approvedQuote.vehicle.make} {approvedQuote.vehicle.model}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Payment Method Check */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Verificación de Métodos de Pago
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {checkingPaymentMethods ? (
                                    <div className="text-center py-6">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                        <p>Verificando métodos de pago...</p>
                                    </div>
                                ) : hasPaymentMethods ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <span className="font-medium text-green-800">
                                                Tienes métodos de pago configurados
                                            </span>
                                        </div>
                                        <PaymentMethods showAddButton={false} allowEdit={false} />
                                        <div className="flex justify-between pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push("/customer/payment-methods")}
                                            >
                                                Gestionar Métodos
                                            </Button>
                                            <Button 
                                                onClick={handleProceedToPayment}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                Proceder al Pago
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Necesitas configurar un método de pago</strong> antes de 
                                                poder contratar la póliza. Esto te permitirá procesar la prima inicial 
                                                y activar tu cobertura.
                                            </AlertDescription>
                                        </Alert>
                                        
                                        <PaymentMethods 
                                            onMethodAdded={handlePaymentMethodAdded}
                                            showAddButton={true}
                                            allowEdit={true}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

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
                        <h1 className="text-3xl font-bold">Contratar Póliza</h1>
                        <p className="text-muted-foreground">
                            {currentStep === 1 && "Información del proceso de contratación"}
                            {currentStep === 2 && "Configuración de pago para tu nueva póliza"}
                        </p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex items-center justify-center space-x-8">
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                                1
                            </div>
                            <span className="ml-2 text-sm">Información</span>
                        </div>
                        <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                                2
                            </div>
                            <span className="ml-2 text-sm">Pago</span>
                        </div>
                        <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                                3
                            </div>
                            <span className="ml-2 text-sm">Confirmación</span>
                        </div>
                    </div>
                </div>

                {renderStep()}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && approvedQuote && (
                <PaymentModal
                    open={showPaymentModal}
                    onOpenChange={setShowPaymentModal}
                    amount={approvedQuote.premium_amount}
                    policyNumber={`POL-${approvedQuote.quote_number.split('-')[2]}`}
                    customerId={customerData?.id || ""}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                />
            )}
        </ProtectedRoute>
    );
}
