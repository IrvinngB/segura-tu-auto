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
    } = body

    // Generate claim number
    const claim_number = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const { data: claim, error } = await supabase
      .from("claims")
      .insert({
        claim_number,
        policy_id,
        customer_id,
        incident_date,
        claim_type,
        incident_description,
        incident_location,
        estimated_damage_cost,
        status: "submitted",
        priority: "medium",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ claim }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
