import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    console.log("🔍 GET /api/test-db - Testing database connection");

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

    try {
        // Test basic connection
        console.log("🔌 Testing basic connection...");
        const { data: connectionTest, error: connectionError } = await supabase
            .from("users")
            .select("id")
            .limit(1);

        if (connectionError) {
            console.log("❌ Connection error:", connectionError);
            return NextResponse.json({
                success: false,
                error: "Connection failed",
                details: connectionError,
            });
        }

        // Test if quotes table exists
        console.log("📋 Testing quotes table...");
        const { data: quotesTest, error: quotesError } = await supabase
            .from("quotes")
            .select("id")
            .limit(1);

        const result = {
            success: true,
            connection: "✅ Connected",
            quotesTable: quotesError
                ? `❌ ${quotesError.message}`
                : "✅ Exists",
            environment: {
                supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            },
        };

        console.log("🔍 Database test result:", result);
        return NextResponse.json(result);
    } catch (error) {
        console.error("💥 Unexpected error:", error);
        return NextResponse.json({
            success: false,
            error: "Unexpected error",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
