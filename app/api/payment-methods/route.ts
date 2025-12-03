import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get customer_id from user
        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (customerError || !customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Get payment methods for this customer
        const { data: paymentMethods, error: methodsError } = await supabase
            .from("payment_methods")
            .select("*")
            .eq("customer_id", customer.id)
            .eq("is_active", true)
            .order("is_primary", { ascending: false })
            .order("created_at", { ascending: false });

        if (methodsError) {
            return NextResponse.json(
                { error: methodsError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ paymentMethods: paymentMethods || [] });
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            type,
            name,
            last_four,
            expiry_date,
            is_primary,
        } = body;

        // Get customer_id from user
        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (customerError || !customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // If this is set as primary, remove primary flag from other methods
        if (is_primary) {
            await supabase
                .from("payment_methods")
                .update({ is_primary: false })
                .eq("customer_id", customer.id);
        }

        // Insert new payment method
        const { data: newMethod, error: insertError } = await supabase
            .from("payment_methods")
            .insert({
                customer_id: customer.id,
                type,
                name,
                last_four,
                expiry_date,
                is_primary: is_primary || false,
                is_active: true,
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ paymentMethod: newMethod });
    } catch (error) {
        console.error("Error creating payment method:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
