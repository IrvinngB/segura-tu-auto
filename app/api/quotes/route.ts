import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    console.log("🔍 GET /api/quotes - Starting request");

    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

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

    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

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
                { error: "Missing required fields" },
                { status: 400 }
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
