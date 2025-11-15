"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
    POLICY_PLANS,
    getPlanInfo,
    getPlanCoverages,
    calculateBasePrice,
} from "@/lib/policy-plans";
import type { Customer, Vehicle, CoverageType } from "@/lib/types/database";
import {
    CalendarIcon,
    Car,
    Shield,
    Calculator,
    CheckCircle,
    FileText,
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "@/components/ui/use-toast";
import { PaymentModal } from "./payment-modal-new";

interface PolicyFormProps {
    customerId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PolicyForm({
    customerId,
    onSuccess,
    onCancel,
}: PolicyFormProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState(customerId || "");
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [policyData, setPolicyData] = useState({
        policyType: "basica",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            "yyyy-MM-dd"
        ),
        paymentFrequency: "monthly",
        autoRenewal: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [contractData, setContractData] = useState<any>(null);
    const [isContractDataLoaded, setIsContractDataLoaded] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingPolicyData, setPendingPolicyData] = useState<any>(null);
    const [vehiclesWithPolicies, setVehiclesWithPolicies] = useState<Set<string>>(new Set());
    const [loadingVehiclePolicies, setLoadingVehiclePolicies] = useState(false);
    const supabase = createClient();

    // PDF Generation Function
    const generatePolicyPDF = async (policy: any, customerData: any, vehicleData: any) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            let yPosition = 30;

            // Helper function to add text with automatic line wrapping
            const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
                doc.setFontSize(fontSize);
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, x, y);
                return y + (lines.length * (fontSize * 0.4));
            };

            // Header with background color
            doc.setFillColor(0, 102, 204); // Blue background
            doc.rect(0, 0, pageWidth, 50, 'F');

            // Header text
            doc.setTextColor(255, 255, 255); // White text
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text("PÓLIZA DE SEGURO VEHICULAR", pageWidth / 2, 25, { align: "center" });

            doc.setFontSize(12);
            doc.text("ASEGURADORA PREMIUM", pageWidth / 2, 35, { align: "center" });
            doc.text("Seguros de calidad para tu tranquilidad", pageWidth / 2, 42, { align: "center" });

            yPosition = 60;
            doc.setTextColor(0, 0, 0); // Black text for content

            // Policy Number Box
            doc.setDrawColor(0, 102, 204); // Blue border
            doc.setFillColor(240, 248, 255); // Light blue background
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15, 'FD');
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`Número de Póliza: ${policy.policy_number}`, margin + 5, yPosition + 5);

            yPosition += 25;

            // Company Information Section
            doc.setDrawColor(0, 102, 204);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'FD');
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("INFORMACIÓN DE LA EMPRESA", margin + 5, yPosition + 2);
            yPosition += 10;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text("ASEGURADORA PREMIUM", margin + 10, yPosition + 2);
            yPosition += 5;
            doc.text("Dirección: Calle Principal #123, Ciudad de Panamá", margin + 10, yPosition + 2);
            yPosition += 5;
            doc.text("Teléfono: (507) 123-4567 | Email: contacto@aseguradorapremium.com", margin + 10, yPosition + 2);
            yPosition += 10;

            // Policy Information Section
            doc.setDrawColor(0, 102, 204);
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 40, 'FD');
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("INFORMACIÓN DE LA PÓLIZA", margin + 5, yPosition + 2);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            // Policy details table-like format with styling
            const policyInfo = [
                [`Fecha de Inicio:`, policy.start_date, '#0066CC'],
                [`Fecha de Vencimiento:`, policy.end_date, '#0066CC'],
                [`Tipo de Póliza:`, policy.policy_type.toUpperCase(), '#0066CC'],
                [`Prima Mensual:`, `$${policy.premium_amount.toLocaleString()}`, '#28A745'],
                [`Frecuencia de Pago:`, policy.payment_frequency, '#0066CC'],
                [`Renovación Automática:`, policy.auto_renewal ? 'Sí' : 'No', '#0066CC']
            ];

            policyInfo.forEach(([label, value, color]) => {
                // Draw background for each row
                doc.setFillColor(255, 255, 255);
                doc.rect(margin + 5, yPosition - 3, pageWidth - 2 * margin - 10, 8, 'F');

                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 102, 204);
                doc.text(label, margin + 10, yPosition + 3);
                doc.setFont("helvetica", "normal");
                if (color === '#28A745') {
                    doc.setTextColor(40, 167, 69);
                } else {
                    doc.setTextColor(0, 0, 0);
                }
                doc.text(value, margin + 80, yPosition + 3);
                yPosition += 8;
            });

            yPosition += 10;

            // Customer Information Section
            doc.setDrawColor(0, 102, 204);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 30, 'FD');
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("INFORMACIÓN DEL ASEGURADO", margin + 5, yPosition + 2);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            const customerInfo = [
                [`Nombre:`, `${customerData.user?.first_name || ''} ${customerData.user?.last_name || ''}`],
                [`Email:`, customerData.user?.email || ''],
                [`Teléfono:`, customerData.user?.phone || 'No especificado'],
                [`País:`, customerData.country || 'No especificado'],
                [`Dirección:`, customerData.address || 'No especificada'],
                [`Fecha de Nacimiento:`, customerData.date_of_birth ? format(new Date(customerData.date_of_birth), 'dd/MM/yyyy') : 'No especificada'],
                [`Género:`, customerData.gender || 'No especificado']
            ];

            customerInfo.forEach(([label, value]) => {
                doc.setFillColor(255, 255, 255);
                doc.rect(margin + 5, yPosition - 3, pageWidth - 2 * margin - 10, 8, 'F');
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 102, 204);
                doc.text(label, margin + 10, yPosition + 3);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
                doc.text(value, margin + 60, yPosition + 3);
                yPosition += 8;
            });

            yPosition += 10;

            // Vehicle Information Section
            doc.setDrawColor(0, 102, 204);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 30, 'FD');
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("INFORMACIÓN DEL VEHÍCULO", margin + 5, yPosition + 2);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            const vehicleInfo = [
                [`Marca:`, vehicleData.make],
                [`Modelo:`, vehicleData.model],
                [`Año:`, vehicleData.year.toString()],
                [`Placa:`, vehicleData.license_plate],
                [`VIN:`, vehicleData.vin || 'No especificado'],
                [`Color:`, vehicleData.color || 'No especificado'],
                [`Valor del Vehículo:`, vehicleData.value ? `$${vehicleData.value.toLocaleString()}` : 'No especificado']
            ];

            vehicleInfo.forEach(([label, value]) => {
                doc.setFillColor(255, 255, 255);
                doc.rect(margin + 5, yPosition - 3, pageWidth - 2 * margin - 10, 8, 'F');
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 102, 204);
                doc.text(label, margin + 10, yPosition + 3);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
                doc.text(value, margin + 70, yPosition + 3);
                yPosition += 8;
            });

            yPosition += 10;

            // Coverage Information Section
            doc.setDrawColor(0, 102, 204);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'FD');
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("COBERTURAS INCLUIDAS", margin + 5, yPosition + 2);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            const selectedPlan = POLICY_PLANS[policy.policy_type as keyof typeof POLICY_PLANS];
            if (selectedPlan) {
                selectedPlan.coverages
                    .filter(coverage => coverage.included)
                    .forEach(coverage => {
                        // Draw bullet point background
                        doc.setFillColor(220, 220, 220);
                        doc.circle(margin + 8, yPosition + 2, 2, 'F');
                        doc.setFont("helvetica", "bold");
                        doc.setTextColor(0, 102, 204);
                        doc.text(`• ${coverage.name}`, margin + 15, yPosition + 5);
                        yPosition += 8;
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(0, 0, 0);
                        yPosition = addWrappedText(
                            `  ${coverage.description}`,
                            margin + 15,
                            yPosition,
                            pageWidth - margin * 2 - 15,
                            9
                        );
                        if (coverage.maxAmount) {
                            doc.setFont("helvetica", "italic");
                            doc.text(`  Cobertura máxima: $${coverage.maxAmount.toLocaleString()}`, margin + 15, yPosition);
                            yPosition += 8;
                        }
                        if (coverage.percentage) {
                            doc.setFont("helvetica", "italic");
                            doc.text(`  Cobertura: ${coverage.percentage}%`, margin + 15, yPosition);
                            yPosition += 8;
                        }
                        yPosition += 5;
                    });
            }

            // Check if we need a new page for terms
            if (yPosition > pageHeight - 100) {
                doc.addPage();
                yPosition = 30;
            }

            yPosition += 10;

            // Terms and Conditions with styled header
            doc.setDrawColor(0, 102, 204);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15, 'FD');
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("TÉRMINOS Y CONDICIONES", margin + 5, yPosition + 2);
            yPosition += 10;

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");

            const terms = [
                "1. Esta póliza está sujeta a los términos y condiciones generales de la aseguradora.",
                "2. El asegurado debe notificar cualquier siniestro dentro de las 48 horas siguientes al evento.",
                "3. Las primas deben pagarse puntualmente según la frecuencia establecida.",
                "4. La cobertura se activará a partir de la fecha de inicio especificada en esta póliza.",
                "5. Para hacer efectiva la cobertura, el vehículo debe estar en buen estado mecánico.",
                "6. Se requiere inspección vehicular previa para ciertos tipos de cobertura.",
                "7. Esta póliza se rige por las leyes de la República de Panamá."
            ];

            terms.forEach(term => {
                yPosition = addWrappedText(term, margin + 5, yPosition, pageWidth - margin * 2 - 5, 9);
                yPosition += 3;
            });

            // Footer with styled line
            const footerY = pageHeight - 20;
            doc.setDrawColor(0, 102, 204);
            doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 100, 100);
            doc.text(`Documento generado el ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, margin, footerY);
            doc.text("Aseguradora Premium - Todos los derechos reservados", pageWidth / 2, footerY + 5, { align: "center" });

            // Save the PDF
            const fileName = `Poliza_${policy.policy_number}_${customerData.user?.last_name || 'Cliente'}.pdf`;
            doc.save(fileName);

            toast({
                title: "PDF Generado",
                description: `El documento ${fileName} ha sido descargado exitosamente con estilos mejorados.`,
            });

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                title: "Error",
                description: "No se pudo generar el PDF de la póliza.",
                variant: "destructive",
            });
        }
    };

    // Check for pre-filled data from quote contract
    useEffect(() => {
        // Use setTimeout to ensure this runs after component is fully mounted
        const timer = setTimeout(() => {
            const contractDataStr =
                sessionStorage.getItem("policyContractData");
            console.log("Checking for contract data...", contractDataStr);

            if (contractDataStr) {
                try {
                    const data = JSON.parse(contractDataStr);
                    console.log("Contract data received:", data);
                    setContractData(data);

                    // Set the selected vehicle if it exists
                    if (data.vehicleId) {
                        console.log("Setting vehicle ID:", data.vehicleId);
                        setSelectedVehicle(data.vehicleId);
                    }

                    // Set the policy type from the quote
                    if (data.planType) {
                        console.log(
                            "Setting policy type from contract:",
                            data.planType
                        );
                        setPolicyData((prev) => {
                            const newData = {
                                ...prev,
                                policyType: data.planType,
                            };
                            console.log(
                                "New policyData after contract:",
                                newData
                            );
                            return newData;
                        });
                    }

                    setIsContractDataLoaded(true);

                    // Clear the session storage after using it
                    sessionStorage.removeItem("policyContractData");
                } catch (error) {
                    console.error("Error parsing contract data:", error);
                }
            } else {
                setIsContractDataLoaded(true);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Debug useEffect to track policyData changes
    useEffect(() => {
        console.log("PolicyData updated:", policyData);
        console.log("Current policyType:", policyData.policyType);
    }, [policyData]);

    // Force re-render when contract data is loaded
    useEffect(() => {
        if (isContractDataLoaded && contractData?.planType) {
            console.log(
                "Forcing policyType update after contract load:",
                contractData.planType
            );
            setPolicyData((prev) => ({
                ...prev,
                policyType: contractData.planType,
            }));
        }
    }, [isContractDataLoaded, contractData]);

    // Efecto para el temporizador del modal de éxito
    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (success && countdown === 0) {
            // Cuando llegue a 0, cerrar el modal y ejecutar onSuccess
            setSuccess("");
            if (onSuccess) {
                onSuccess();
            }
        }
    }, [success, countdown, onSuccess]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            fetchCustomerVehicles(selectedCustomer);
        }
    }, [selectedCustomer]);

    const fetchInitialData = async () => {
        try {
            // Fetch customers
            const { data: customersData } = await supabase
                .from("customers")
                .select(
                    `
          *,
          user:users(*)
        `
                )
                .order("created_at", { ascending: false });

            if (customersData) setCustomers(customersData);
        } catch (error) {
            console.error("Error fetching initial data:", error);
            setError("Error cargando datos iniciales");
        }
    };

    const fetchCustomerVehicles = async (customerId: string) => {
        try {
            const { data } = await supabase
                .from("vehicles")
                .select("*")
                .eq("customer_id", customerId)
                .order("created_at", { ascending: false });

            if (data) {
                setVehicles(data);
                // Verificar cuáles vehículos ya tienen pólizas activas
                await checkVehicleActivePolicies(data);
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        }
    };

    const checkVehicleActivePolicies = async (vehicleList: Vehicle[]) => {
        if (vehicleList.length === 0) return;

        try {
            setLoadingVehiclePolicies(true);
            
            // Obtener todas las pólizas activas para estos vehículos
            const vehicleIds = vehicleList.map(v => v.id);
            const { data: activePolicies } = await supabase
                .from("policies")
                .select("vehicle_id")
                .in("vehicle_id", vehicleIds)
                .in("status", ["active", "suspended"]); // Considera activas y suspendidas como ocupadas

            if (activePolicies) {
                const vehiclesWithActivePolicies = new Set(
                    activePolicies.map(policy => policy.vehicle_id)
                );
                setVehiclesWithPolicies(vehiclesWithActivePolicies);
            }
        } catch (error) {
            console.error("Error checking vehicle policies:", error);
        } finally {
            setLoadingVehiclePolicies(false);
        }
    };

    // Calculate price based on selected plan
    const calculatePrice = () => {
        const selectedPlan =
            POLICY_PLANS[policyData.policyType as keyof typeof POLICY_PLANS];
        return selectedPlan?.basePrice || 0;
    };

    const generatePolicyNumber = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, "0");
        return `POL-${year}-${random}`;
    };

    const handleGeneratePreviewPDF = async () => {
        try {
            // Obtener datos del cliente y vehículo
            const { data: customerData } = await supabase
                .from("customers")
                .select(`
                    *,
                    user:users(*)
                `)
                .eq("id", selectedCustomer)
                .single();

            const { data: vehicleData } = await supabase
                .from("vehicles")
                .select("*")
                .eq("id", selectedVehicle)
                .single();

            if (customerData && vehicleData) {
                // Generar número de póliza para la vista previa
                const previewPolicyNumber = generatePolicyNumber();
                const mockPolicy = {
                    policy_number: previewPolicyNumber,
                    start_date: policyData.startDate,
                    end_date: policyData.endDate,
                    premium_amount: calculatePrice(),
                    payment_frequency: policyData.paymentFrequency,
                    policy_type: policyData.policyType,
                    auto_renewal: policyData.autoRenewal,
                };

                await generatePolicyPDF(mockPolicy, customerData, vehicleData);
            }
        } catch (error) {
            console.error("Error generando vista previa PDF:", error);
            toast({
                title: "Error",
                description: "No se pudo generar la vista previa del PDF.",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Validaciones adicionales
            if (!selectedCustomer) {
                setError("Debe seleccionar un cliente");
                return;
            }

            if (!selectedVehicle) {
                setError("Debe seleccionar un vehículo");
                return;
            }

            const monthlyPrice = calculatePrice();
            if (monthlyPrice <= 0) {
                setError("Error en el cálculo del precio");
                return;
            }

            console.log("Iniciando proceso de creación de póliza...");
            console.log("Datos de la póliza:", {
                customer_id: selectedCustomer,
                vehicle_id: selectedVehicle,
                policy_type: policyData.policyType,
                premium_amount: monthlyPrice,
                plan: POLICY_PLANS[
                    policyData.policyType as keyof typeof POLICY_PLANS
                ]?.name,
            });

            const policyNumber = generatePolicyNumber();
            console.log("Número de póliza generado:", policyNumber);

            // Preparar datos de la póliza para después del pago
            const policyDataToCreate = {
                policyNumber,
                selectedCustomer,
                selectedVehicle,
                policyData,
                monthlyPrice,
            };

            // Mostrar modal de pago
            setPendingPolicyData(policyDataToCreate);
            setShowPaymentModal(true);

        } catch (error) {
            console.error("Error preparing policy:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Error inesperado al preparar la póliza"
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async (paymentId: string) => {
        setShowPaymentModal(false);

        try {
            setLoading(true);

            if (!pendingPolicyData) {
                throw new Error("No hay datos de póliza pendientes");
            }

            const { policyNumber, selectedCustomer, selectedVehicle, policyData, monthlyPrice } = pendingPolicyData;

            console.log("Creando póliza después del pago exitoso...");

            // Create policy
            const { data: policy, error: policyError } = await supabase
                .from("policies")
                .insert({
                    policy_number: policyNumber,
                    customer_id: selectedCustomer,
                    vehicle_id: selectedVehicle,
                    policy_type: policyData.policyType,
                    status: "active",
                    start_date: policyData.startDate,
                    end_date: policyData.endDate,
                    premium_amount: monthlyPrice,
                    payment_frequency: policyData.paymentFrequency,
                    auto_renewal: policyData.autoRenewal,
                })
                .select()
                .single();

            if (policyError) {
                console.error("Error creando póliza:", policyError);
                throw new Error(
                    `Error al crear la póliza: ${policyError.message}`
                );
            }

            console.log("Póliza creada exitosamente:", policy);

            // Auto-create policy coverages based on selected plan
            const selectedPlan =
                POLICY_PLANS[
                    policyData.policyType as keyof typeof POLICY_PLANS
                ];
            if (selectedPlan) {
                // Get all coverage types to match with plan coverages
                const { data: allCoverageTypes } = await supabase
                    .from("coverage_types")
                    .select("*");

                if (allCoverageTypes) {
                    const coverageInserts = selectedPlan.coverages
                        .filter((planCoverage) => planCoverage.included)
                        .map((planCoverage) => {
                            const coverage = allCoverageTypes.find(
                                (ct) =>
                                    ct.name
                                        .toLowerCase()
                                        .includes(
                                            planCoverage.name.toLowerCase()
                                        ) ||
                                    planCoverage.name
                                        .toLowerCase()
                                        .includes(ct.name.toLowerCase())
                            );

                            if (coverage) {
                                return {
                                    policy_id: policy.id,
                                    coverage_type_id: coverage.id,
                                    coverage_limit:
                                        planCoverage.maxAmount ||
                                        coverage.max_coverage_amount,
                                    deductible: coverage.deductible || 0,
                                };
                            }
                            return null;
                        })
                        .filter(Boolean);

                    if (coverageInserts.length > 0) {
                        const { data: coverageData, error: coverageError } =
                            await supabase
                                .from("policy_coverages")
                                .insert(coverageInserts)
                                .select();

                        if (coverageError) {
                            console.error(
                                "Error creando coberturas:",
                                coverageError
                            );
                            // Don't throw here, policy was created successfully
                        } else {
                            console.log(
                                "Coberturas creadas exitosamente:",
                                coverageData
                            );
                        }
                    }
                }
            }

            setSuccess(
                `Póliza ${policyNumber} creada exitosamente con plan ${selectedPlan?.name}`
            );
            setCountdown(2); // Iniciar countdown de 2 segundos para mostrar el éxito

            // Generar PDF después de crear la póliza
            try {
                // Obtener datos del cliente y vehículo para el PDF
                const { data: customerData } = await supabase
                    .from("customers")
                    .select(`
                        *,
                        user:users(*)
                    `)
                    .eq("id", selectedCustomer)
                    .single();

                const { data: vehicleData } = await supabase
                    .from("vehicles")
                    .select("*")
                    .eq("id", selectedVehicle)
                    .single();

                if (customerData && vehicleData) {
                    // Generar PDF en segundo plano
                    setTimeout(() => {
                        generatePolicyPDF(policy, customerData, vehicleData);
                    }, 500);
                }
            } catch (pdfError) {
                console.error("Error preparando datos para PDF:", pdfError);
            }

            // Limpiar datos pendientes
            setPendingPolicyData(null);

        } catch (error) {
            console.error("Error creating policy after payment:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Error inesperado al crear la póliza después del pago"
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentError = (error: string) => {
        setShowPaymentModal(false);
        setPendingPolicyData(null);
        setError(error);
    };

    return (
        <>
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Nueva Póliza de Seguro
                    </CardTitle>
                    <CardDescription>
                        Complete la información para crear una nueva póliza de
                        seguro
                    </CardDescription>

                    {/* Contract from Quote Information */}
                    {contractData && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                <strong>Contratando desde cotización:</strong>{" "}
                                {contractData.planDetails?.name} - $
                                {contractData.calculatedPremium?.toLocaleString()}
                                /año para {contractData.vehicleData?.make}{" "}
                                {contractData.vehicleData?.model}{" "}
                                {contractData.vehicleData?.year}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Customer Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="customer">Cliente</Label>
                                <Select
                                    value={selectedCustomer}
                                    onValueChange={setSelectedCustomer}
                                    disabled={!!customerId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((customer) => (
                                            <SelectItem
                                                key={customer.id}
                                                value={customer.id}
                                            >
                                                {customer.user?.first_name}{" "}
                                                {customer.user?.last_name} -{" "}
                                                {customer.user?.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vehicle">Vehículo</Label>
                                {vehicles.length === 0 && selectedCustomer ? (
                                    <div className="space-y-4">
                                        <Alert>
                                            <Car className="h-4 w-4" />
                                            <AlertDescription>
                                                No hay vehículos registrados
                                                para este cliente.
                                                {customerId
                                                    ? " Debes registrar al menos un vehículo antes de crear una póliza."
                                                    : " Selecciona un cliente que tenga vehículos registrados o registra un vehículo primero."}
                                            </AlertDescription>
                                        </Alert>
                                        {customerId && (
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="w-full"
                                            >
                                                <a href="/customer/vehicles/new">
                                                    <Car className="h-4 w-4 mr-2" />
                                                    Registrar Vehículo
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <Select
                                        value={selectedVehicle}
                                        onValueChange={(value) => {
                                            if (vehiclesWithPolicies.has(value)) {
                                                setError("Este vehículo ya tiene una póliza activa. Un vehículo solo puede tener una póliza activa a la vez.");
                                                return;
                                            }
                                            setError(""); // Limpiar errores previos
                                            setSelectedVehicle(value);
                                        }}
                                        disabled={vehicles.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    vehicles.length === 0
                                                        ? "No hay vehículos disponibles"
                                                        : "Seleccionar vehículo"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.map((vehicle) => {
                                                const hasActivePolicy = vehiclesWithPolicies.has(vehicle.id);
                                                return (
                                                    <SelectItem
                                                        key={vehicle.id}
                                                        value={vehicle.id}
                                                        disabled={hasActivePolicy}
                                                        className={hasActivePolicy ? "opacity-50" : ""}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2">
                                                                <Car className="h-4 w-4" />
                                                                {vehicle.year}{" "}
                                                                {vehicle.make}{" "}
                                                                {vehicle.model} -{" "}
                                                                {vehicle.license_plate}
                                                            </div>
                                                            {hasActivePolicy && (
                                                                <Badge variant="destructive" className="ml-2">
                                                                    <Shield className="h-3 w-3 mr-1" />
                                                                    Asegurado
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Policy Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="policyType">
                                    Tipo de Póliza
                                </Label>
                                {isContractDataLoaded ? (
                                    <Select
                                        key={`policy-type-${policyData.policyType}-${isContractDataLoaded}`}
                                        value={policyData.policyType}
                                        onValueChange={(value) => {
                                            console.log(
                                                "Select onChange triggered with value:",
                                                value
                                            );
                                            setPolicyData((prev) => ({
                                                ...prev,
                                                policyType: value,
                                            }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione un tipo de póliza" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basica">
                                                Básica
                                            </SelectItem>
                                            <SelectItem value="limitada">
                                                Limitada
                                            </SelectItem>
                                            <SelectItem value="amplia">
                                                Amplia
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="h-10 bg-muted animate-pulse rounded-md"></div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentFrequency">
                                    Frecuencia de Pago
                                </Label>
                                <Select
                                    value={policyData.paymentFrequency}
                                    onValueChange={(value) =>
                                        setPolicyData((prev) => ({
                                            ...prev,
                                            paymentFrequency: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">
                                            Mensual
                                        </SelectItem>
                                        <SelectItem value="quarterly">
                                            Trimestral
                                        </SelectItem>
                                        <SelectItem value="biannual">
                                            Semestral
                                        </SelectItem>
                                        <SelectItem value="annual">
                                            Anual
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">
                                    Fecha de Inicio
                                </Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={policyData.startDate}
                                        onChange={(e) =>
                                            setPolicyData((prev) => ({
                                                ...prev,
                                                startDate: e.target.value,
                                            }))
                                        }
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">
                                    Fecha de Vencimiento
                                </Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={policyData.endDate}
                                        onChange={(e) =>
                                            setPolicyData((prev) => ({
                                                ...prev,
                                                endDate: e.target.value,
                                            }))
                                        }
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Plan Coverages Display */}
                        <div className="space-y-4">
                            <Label>
                                Coberturas del Plan {policyData.policyType}
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {POLICY_PLANS[
                                    policyData.policyType as keyof typeof POLICY_PLANS
                                ]?.coverages.map((coverage, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start space-x-3 p-4 border rounded-lg ${
                                            coverage.included
                                                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                                                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                                        }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                coverage.included
                                                    ? "bg-green-500 text-white"
                                                    : "bg-red-500 text-white"
                                            }`}
                                        >
                                            {coverage.included ? "✓" : "✗"}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-sm font-medium">
                                                {coverage.name}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {coverage.description}
                                            </p>
                                            {coverage.included &&
                                                coverage.maxAmount && (
                                                    <div className="text-xs text-green-600 dark:text-green-400">
                                                        Cobertura máxima: $
                                                        {coverage.maxAmount.toLocaleString()}
                                                    </div>
                                                )}
                                            {coverage.included &&
                                                coverage.percentage && (
                                                    <div className="text-xs text-green-600 dark:text-green-400">
                                                        Cobertura:{" "}
                                                        {coverage.percentage}%
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Price Display */}
                        <Card className="bg-muted/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-primary" />
                                        <span className="font-medium">
                                            Plan {policyData.policyType}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            ${calculatePrice().toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {policyData.paymentFrequency ===
                                                "monthly" && "por mes"}
                                            {policyData.paymentFrequency ===
                                                "quarterly" &&
                                                `${(
                                                    calculatePrice() * 3
                                                ).toLocaleString()} trimestral`}
                                            {policyData.paymentFrequency ===
                                                "biannual" &&
                                                `${(
                                                    calculatePrice() * 6
                                                ).toLocaleString()} semestral`}
                                            {policyData.paymentFrequency ===
                                                "annual" &&
                                                `${(
                                                    calculatePrice() * 12
                                                ).toLocaleString()} anual`}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Auto Renewal */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="autoRenewal"
                                checked={policyData.autoRenewal}
                                onCheckedChange={(checked) =>
                                    setPolicyData((prev) => ({
                                        ...prev,
                                        autoRenewal: checked as boolean,
                                    }))
                                }
                            />
                            <Label htmlFor="autoRenewal">
                                Renovación automática
                            </Label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-6">
                            <Button
                                type="submit"
                                disabled={
                                    loading ||
                                    !selectedCustomer ||
                                    !selectedVehicle ||
                                    calculatePrice() <= 0
                                }
                                className="flex-1"
                            >
                                {loading ? "Creando póliza..." : "Crear Póliza"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            {selectedCustomer && selectedVehicle && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleGeneratePreviewPDF}
                                    disabled={loading || calculatePrice() <= 0}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    Vista Previa PDF
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
            {success && (
                <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            ¡Éxito!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {success}
                        </p>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            <PaymentModal
                open={showPaymentModal}
                onOpenChange={setShowPaymentModal}
                amount={pendingPolicyData?.monthlyPrice || 0}
                policyNumber={pendingPolicyData?.policyNumber || ""}
                customerId={pendingPolicyData?.selectedCustomer || ""}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
            />
        </>
    );
}