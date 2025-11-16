import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: claims, error } = await supabase
      .from("claims")
      .select(`
        *,
        policies (
          policy_number,
          customers (
            first_name,
            last_name,
            users (email)
          ),
          vehicles (
            make,
            model,
            year,
            license_plate
          )
        ),
        damage_assessments (
          id,
          damage_description,
          repair_estimate,
          assessment_date
        ),
        adjuster:users!claims_adjuster_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        agent:users!claims_agent_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ claims })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      policy_id,
      customer_id,
      incident_date,
      claim_type,
      incident_description,
      incident_location,
      estimated_damage_cost,
      priority = "medium",
    } = body

    // Validate required fields
    if (!policy_id) {
      return NextResponse.json({ error: "Policy ID is required" }, { status: 400 })
    }

    if (!customer_id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    if (!incident_date) {
      return NextResponse.json({ error: "Incident date is required" }, { status: 400 })
    }

    if (!claim_type) {
      return NextResponse.json({ error: "Claim type is required" }, { status: 400 })
    }

    if (!incident_description || incident_description.trim().length === 0) {
      return NextResponse.json({ error: "Incident description is required" }, { status: 400 })
    }

    // Verify that the policy exists and is active
    const { data: policy, error: policyError } = await supabase
      .from("policies")
      .select("id, status, customer_id")
      .eq("id", policy_id)
      .eq("status", "active")
      .single()

    if (policyError || !policy) {
      return NextResponse.json({ 
        error: "Policy not found or not active" 
      }, { status: 404 })
    }

    // Verify that the customer owns the policy
    if (policy.customer_id !== customer_id) {
      return NextResponse.json({ 
        error: "Policy does not belong to the specified customer" 
      }, { status: 403 })
    }

    // Generate unique claim number
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9).toUpperCase()
    const claim_number = `CLM-${timestamp}-${random}`

    // Create the claim
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .insert({
        claim_number,
        policy_id,
        customer_id,
        incident_date,
        claim_type,
        incident_description,
        incident_location,
        estimated_damage_cost: estimated_damage_cost ? parseFloat(estimated_damage_cost) : null,
        status: "submitted",
        priority,
      })
      .select(`
        *,
        policies (
          policy_number,
          customers (
            first_name,
            last_name,
            users (email)
          ),
          vehicles (
            make,
            model,
            year,
            license_plate
          )
        )
      `)
      .single()

    if (claimError) {
      console.error("Error creating claim:", claimError)
      return NextResponse.json({ 
        error: "Failed to create claim: " + claimError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ claim }, { status: 201 })
  } catch (error) {
    console.error("Error in claims POST:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
