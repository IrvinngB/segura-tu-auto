import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    console.log("🔍 GET /api/quotes - Starting request");

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    console.log("🔐 Auth result:", { user: user?.id, authError });

    if (authError || !user) {
        console.log("❌ Unauthorized access");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("👤 Getting user profile for user:", user.id);

        // Get user role to determine what quotes to fetch
        const { data: userProfile, error: userProfileError } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        console.log("👤 User profile result:", {
            userProfile,
            userProfileError,
        });

        if (userProfileError) {
            console.log("❌ Error getting user profile:", userProfileError);
            return NextResponse.json(
                { error: "Error getting user profile" },
                { status: 500 }
            );
        }

        console.log("📋 Building quotes query for role:", userProfile?.role);

        let query = supabase.from("quotes").select(`
        *,
        customer:customers (
          *,
          user:users(*)
        ),
        vehicle:vehicles(*),
        agent:users(*)
      `);

        // If customer, only show their quotes
        if (userProfile?.role === "customer") {
            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (customer) {
                query = query.eq("customer_id", customer.id);
            }
        }

        console.log("🔍 Executing quotes query...");
        const { data: quotes, error } = await query.order("created_at", {
            ascending: false,
        });

        console.log("📋 Quotes query result:", {
            quotesCount: quotes?.length,
            error: error?.message,
            errorCode: error?.code,
            errorDetails: error?.details,
        });

        if (error) {
            console.log("❌ Database error:", error);
            return NextResponse.json(
                {
                    error: `Database error: ${error.message}`,
                    details: error.details,
                    code: error.code,
                },
                { status: 500 }
            );
        }

        console.log("✅ Quotes fetched successfully:", quotes?.length || 0);
        return NextResponse.json({ quotes });
    } catch (error) {
        console.error("💥 Unexpected error fetching quotes:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    console.log("🚀 POST /api/quotes - Creating new quote");

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    console.log("🔐 POST Auth result:", { user: user?.id, authError });

    if (authError || !user) {
        console.log("❌ POST Unauthorized access");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("📝 Parsing request body...");
        const body = await request.json();
        console.log("📋 Quote data received:", {
            customer_id: body.customer_id,
            vehicle_id: body.vehicle_id,
            policy_type: body.policy_type,
            premium_amount: body.premium_amount,
        });

        const {
            customer_id,
            vehicle_id,
            policy_type,
            start_date,
            end_date,
            premium_amount,
            payment_frequency,
            auto_renewal,
            selected_coverages,
            driver_data,
            vehicle_data,
            risk_assessment,
        } = body;

        // Validate required fields
        if (!customer_id || !vehicle_id || !policy_type || !premium_amount) {
            console.log("❌ Missing required fields");
            return NextResponse.json(
                {
                    error: "Missing required fields: customer_id, vehicle_id, policy_type, and premium_amount are required",
                },
                { status: 400 }
            );
        }

        // Validate data types and ranges
        if (typeof premium_amount !== "number" || premium_amount <= 0) {
            console.log("❌ Invalid premium amount");
            return NextResponse.json(
                { error: "Premium amount must be a positive number" },
                { status: 400 }
            );
        }

        // Check if vehicle exists and belongs to customer
        console.log("🚗 Validating vehicle ownership...");
        const { data: vehicle, error: vehicleError } = await supabase
            .from("vehicles")
            .select("id, customer_id")
            .eq("id", vehicle_id)
            .eq("customer_id", customer_id)
            .single();

        if (vehicleError || !vehicle) {
            console.log("❌ Vehicle validation failed:", vehicleError);
            return NextResponse.json(
                { error: "Vehicle not found or does not belong to customer" },
                { status: 400 }
            );
        }

        // Check if vehicle already has an active policy
        console.log("🔍 Checking for existing policies...");
        const { data: existingPolicies, error: checkError } = await supabase
            .from("policies")
            .select("id, status, end_date")
            .eq("vehicle_id", vehicle_id)
            .eq("customer_id", customer_id)
            .in("status", ["active", "pending"]);

        if (checkError) {
            console.error("Error checking existing policies:", checkError);
            return NextResponse.json(
                {
                    error: "Error validating vehicle policies",
                },
                { status: 500 }
            );
        }

        // Check if there's an active policy for this vehicle
        const hasActivePolicy = existingPolicies?.some((policy) => {
            if (policy.status === "active") {
                const endDate = new Date(policy.end_date);
                return endDate > new Date();
            }
            return policy.status === "pending";
        });

        if (hasActivePolicy) {
            console.log("❌ Vehicle already has active policy");
            return NextResponse.json(
                {
                    error: "This vehicle already has an active policy. Cannot create quotes for vehicles with existing coverage.",
                },
                { status: 409 }
            );
        }

        // Generate quote number
        const quote_number = `QTE-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`;
        console.log("🎫 Generated quote number:", quote_number);

        const quoteData = {
            quote_number,
            customer_id,
            vehicle_id,
            policy_type,
            status: "pending",
            start_date,
            end_date,
            premium_amount,
            payment_frequency,
            auto_renewal,
            selected_coverages,
            driver_data,
            vehicle_data,
            risk_assessment,
        };

        console.log("💾 Inserting quote into database...");
        // Create the quote
        const { data: quote, error } = await supabase
            .from("quotes")
            .insert(quoteData)
            .select()
            .single();

        console.log("💾 Database insert result:", {
            success: !!quote,
            error: error?.message,
            errorCode: error?.code,
            errorDetails: error?.details,
        });

        if (error) {
            console.log("❌ Database error creating quote:", error);
            return NextResponse.json(
                {
                    error: `Database error: ${error.message}`,
                    details: error.details,
                    code: error.code,
                },
                { status: 500 }
            );
        }

        console.log("✅ Quote created successfully:", quote.id);
        return NextResponse.json({ quote }, { status: 201 });
    } catch (error) {
        console.error("💥 Unexpected error creating quote:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
