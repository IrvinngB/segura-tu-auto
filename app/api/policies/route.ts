import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: policies, error } = await supabase
      .from("policies")
      .select(`
        *,
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
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ policies })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { customer_id, vehicle_id, policy_type, start_date, end_date, premium_amount, coverages } = body

    // Generate policy number
    const policy_number = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const { data: policy, error } = await supabase
      .from("policies")
      .insert({
        policy_number,
        customer_id,
        vehicle_id,
        agent_id: user.id,
        policy_type,
        start_date,
        end_date,
        premium_amount,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Insert coverages if provided
    if (coverages && coverages.length > 0) {
      const coverageData = coverages.map((coverage: any) => ({
        policy_id: policy.id,
        coverage_type_id: coverage.coverage_type_id,
        coverage_limit: coverage.coverage_limit,
        deductible: coverage.deductible,
        premium: coverage.premium,
      }))

      await supabase.from("policy_coverages").insert(coverageData)
    }

    return NextResponse.json({ policy }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
