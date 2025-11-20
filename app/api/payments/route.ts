import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    console.log("💳 POST /api/payments - Processing payment");

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        console.log("❌ Authentication failed");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { 
            policy_id, 
            payment_method_id, 
            amount, 
            description,
            payment_type = "premium" 
        } = body;

        console.log("📋 Payment request:", { policy_id, payment_method_id, amount, description });

        if (!policy_id || !payment_method_id || !amount) {
            return NextResponse.json(
                { error: "Faltan campos requeridos" },
                { status: 400 }
            );
        }

        // Obtener el customer_id del usuario actual
        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (customerError || !customer) {
            console.log("❌ Customer not found for user:", user.id);
            return NextResponse.json(
                { error: "Cliente no encontrado" },
                { status: 404 }
            );
        }

        console.log("👤 Customer ID:", customer.id);

        // Verificar que la póliza pertenece al cliente
        console.log("🔍 Looking for policy:", policy_id, "for customer:", customer.id);
        
        const { data: policy, error: policyError } = await supabase
            .from("policies")
            .select("*")
            .eq("id", policy_id)
            .eq("customer_id", customer.id)
            .single();

        console.log("📋 Policy query result:", { policy: policy?.id, policyError });

        if (policyError || !policy) {
            return NextResponse.json(
                { error: `Póliza no encontrada: ${policyError?.message || 'No existe'}` },
                { status: 404 }
            );
        }

        // Verificar que el método de pago pertenece al cliente
        console.log("🔍 Looking for payment method:", payment_method_id, "for customer:", customer.id);
        
        const { data: paymentMethod, error: methodError } = await supabase
            .from("payment_methods")
            .select("*")
            .eq("id", payment_method_id)
            .eq("customer_id", customer.id)
            .single();

        console.log("💳 Payment method query result:", { method: paymentMethod?.id, methodError });

        if (methodError || !paymentMethod) {
            return NextResponse.json(
                { error: `Método de pago no encontrado: ${methodError?.message || 'No existe'}` },
                { status: 404 }
            );
        }

        // Mapear tipo de método de pago a valores válidos del constraint
        let paymentMethodName = 'Tarjeta de crédito'; // Default
        if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
            paymentMethodName = 'Tarjeta de crédito';
        } else if (paymentMethod.type === 'bank_account') {
            paymentMethodName = 'Transferencia bancaria';
        } else if (paymentMethod.type === 'digital_wallet') {
            paymentMethodName = 'PayPal';
        }

        // Crear el registro de pago (usando las columnas del schema)
        const paymentData = {
            policy_id,
            customer_id: customer.id,
            payment_type: payment_type === 'monthly_premium' ? 'premium' : payment_type,
            amount: parseFloat(amount),
            payment_method: paymentMethodName,
            payment_status: "completed",
            transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            reference_number: `REF-${policy.policy_number}-${Date.now()}`,
            payment_date: new Date().toISOString(),
        };

        console.log("💾 Creating payment record:", paymentData);

        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .insert(paymentData)
            .select()
            .single();

        if (paymentError) {
            console.error("❌ Payment creation error:", paymentError);
            return NextResponse.json(
                { error: `Error al procesar el pago: ${paymentError.message}` },
                { status: 500 }
            );
        }

        // Si la póliza estaba pendiente de pago (draft, approved o pending_payment), activarla
        if (policy.status === "draft" || policy.status === "approved" || policy.status === "pending_payment") {
            console.log("🔄 Activating policy after payment...");
            
            const { error: activationError } = await supabase
                .from("policies")
                .update({ 
                    status: "active",
                    updated_at: new Date().toISOString()
                })
                .eq("id", policy_id);

            if (activationError) {
                console.error("❌ Policy activation error:", activationError);
                // El pago ya se procesó, no fallar por esto
            } else {
                console.log("✅ Policy activated successfully");
                
                // Si es una renovación (contiene RENEW- en el número), expirar la póliza anterior
                if (policy.policy_number && policy.policy_number.includes('RENEW-')) {
                    console.log("🔄 Processing renewal - looking for old policy to expire...");
                    
                    // Extraer el número de póliza original del número de renovación
                    // Formato: RENEW-{timestamp}-{random}-{original_policy_number}
                    const renewParts = policy.policy_number.split('-');
                    if (renewParts.length >= 4) {
                        const originalPolicyNumber = renewParts.slice(3).join('-');
                        console.log("🔍 Looking for original policy:", originalPolicyNumber);
                        
                        const { error: expireError } = await supabase
                            .from("policies")
                            .update({ 
                                status: "expired",
                                updated_at: new Date().toISOString()
                            })
                            .eq("policy_number", originalPolicyNumber)
                            .eq("customer_id", customer.id)
                            .neq("id", policy_id); // No actualizar la nueva póliza
                        
                        if (expireError) {
                            console.error("❌ Error expiring old policy:", expireError);
                        } else {
                            console.log("✅ Old policy expired successfully");
                        }
                    }
                }
            }
        }

        console.log("✅ Payment processed successfully:", payment.id);

        return NextResponse.json({
            success: true,
            payment,
            message: "Pago procesado exitosamente"
        });

    } catch (error) {
        console.error("❌ Payment processing error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    console.log("📋 GET /api/payments - Getting payment history");

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        // Obtener el customer_id del usuario actual
        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (customerError || !customer) {
            return NextResponse.json(
                { error: "Cliente no encontrado" },
                { status: 404 }
            );
        }

        // Obtener historial de pagos del cliente
        const { data: payments, error: paymentsError } = await supabase
            .from("payments")
            .select(`
                *,
                policy:policies(
                    policy_number,
                    policy_type,
                    vehicle:vehicles(make, model, year)
                ),
                payment_method:payment_methods(
                    card_last_four,
                    card_type,
                    card_brand
                )
            `)
            .eq("policy.customer_id", customer.id)
            .order("payment_date", { ascending: false });

        if (paymentsError) {
            console.error("❌ Error fetching payments:", paymentsError);
            return NextResponse.json(
                { error: "Error al obtener historial de pagos" },
                { status: 500 }
            );
        }

        return NextResponse.json({ payments: payments || [] });

    } catch (error) {
        console.error("❌ Error in GET /api/payments:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}