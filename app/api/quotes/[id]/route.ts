import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Check if user is agent or admin
        const { data: userProfile } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!userProfile || !["admin", "agent"].includes(userProfile.role)) {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { action, notes, rejected_reason } = body;

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        // Get the quote to check if it exists and is pending
        const { data: existingQuote, error: fetchError } = await supabase
            .from("quotes")
            .select("*")
            .eq("id", params.id)
            .single();

        if (fetchError || !existingQuote) {
            return NextResponse.json(
                { error: "Quote not found" },
                { status: 404 }
            );
        }

        if (existingQuote.status !== "pending") {
            return NextResponse.json(
                { error: "Quote is not pending" },
                { status: 400 }
            );
        }

        if (action === "approve") {
            // If approving, create a policy from the quote
            const policyNumber = `POL-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)
                .toUpperCase()}`;

            // Create policy
            const { data: policy, error: policyError } = await supabase
                .from("policies")
                .insert({
                    policy_number: policyNumber,
                    customer_id: existingQuote.customer_id,
                    vehicle_id: existingQuote.vehicle_id,
                    agent_id: user.id,
                    policy_type: existingQuote.policy_type,
                    status: "active",
                    start_date: existingQuote.start_date,
                    end_date: existingQuote.end_date,
                    premium_amount: existingQuote.premium_amount,
                    payment_frequency: existingQuote.payment_frequency,
                    auto_renewal: existingQuote.auto_renewal,
                    risk_assessment: existingQuote.risk_assessment,
                    discount_applied: 0,
                })
                .select()
                .single();

            if (policyError) {
                return NextResponse.json(
                    { error: policyError.message },
                    { status: 500 }
                );
            }

            // Create policy coverages if selected_coverages exist
            if (
                existingQuote.selected_coverages &&
                existingQuote.selected_coverages.length > 0
            ) {
                const coveragesToInsert = existingQuote.selected_coverages.map(
                    (coverage: any) => ({
                        policy_id: policy.id,
                        coverage_type_id: coverage.coverage_type_id,
                        coverage_limit: coverage.coverage_limit,
                        deductible: coverage.deductible,
                        premium: coverage.premium,
                    })
                );

                const { error: coverageError } = await supabase
                    .from("policy_coverages")
                    .insert(coveragesToInsert);

                if (coverageError) {
                    console.error(
                        "Error creating policy coverages:",
                        coverageError
                    );
                    // Don't fail the whole operation for coverage errors
                }
            }

            // Update quote status to approved and converted
            const { data: updatedQuote, error: updateError } = await supabase
                .from("quotes")
                .update({
                    status: "converted",
                    agent_id: user.id,
                    agent_notes: notes,
                    reviewed_at: new Date().toISOString(),
                })
                .eq("id", params.id)
                .select()
                .single();

            if (updateError) {
                return NextResponse.json(
                    { error: updateError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                quote: updatedQuote,
                policy,
                message: "Quote approved and policy created successfully",
            });
        } else {
            // Reject the quote
            const { data: updatedQuote, error: updateError } = await supabase
                .from("quotes")
                .update({
                    status: "rejected",
                    agent_id: user.id,
                    agent_notes: notes,
                    rejected_reason,
                    reviewed_at: new Date().toISOString(),
                })
                .eq("id", params.id)
                .select()
                .single();

            if (updateError) {
                return NextResponse.json(
                    { error: updateError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                quote: updatedQuote,
                message: "Quote rejected successfully",
            });
        }
    } catch (error) {
        console.error("Error processing quote:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
