import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

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
    const { customer_data, vehicle_data, driving_history } = body

    // Calculate risk score based on multiple factors
    let riskScore = 50 // Base score

    // Age factor
    const age = new Date().getFullYear() - new Date(customer_data.date_of_birth).getFullYear()
    if (age < 25) riskScore += 15
    else if (age > 65) riskScore += 10
    else if (age >= 30 && age <= 50) riskScore -= 5

    // Driving experience
    if (customer_data.driving_experience_years < 2) riskScore += 20
    else if (customer_data.driving_experience_years > 10) riskScore -= 10

    // Vehicle age
    const vehicleAge = new Date().getFullYear() - vehicle_data.year
    if (vehicleAge > 10) riskScore += 5
    else if (vehicleAge < 3) riskScore -= 5

    // Vehicle value
    if (vehicle_data.estimated_value > 500000) riskScore += 10
    else if (vehicle_data.estimated_value < 100000) riskScore -= 5

    // Safety features
    if (vehicle_data.safety_features && vehicle_data.safety_features.length > 3) {
      riskScore -= 10
    }

    // Anti-theft devices
    if (vehicle_data.anti_theft_devices && vehicle_data.anti_theft_devices.length > 0) {
      riskScore -= 5
    }

    // Garage type
    if (vehicle_data.garage_type === "enclosed") riskScore -= 5
    else if (vehicle_data.garage_type === "street") riskScore += 10

    // Driving history
    if (driving_history.accidents > 0) riskScore += driving_history.accidents * 15
    if (driving_history.violations > 0) riskScore += driving_history.violations * 10
    if (driving_history.claims > 0) riskScore += driving_history.claims * 12

    // Ensure score is within bounds
    riskScore = Math.max(0, Math.min(100, riskScore))

    // Calculate premium based on risk score
    const basePremium = 2000 // Base annual premium in MXN
    const riskMultiplier = 1 + (riskScore - 50) / 100
    const calculatedPremium = Math.round(basePremium * riskMultiplier)

    const assessment = {
      risk_score: riskScore,
      calculated_premium: calculatedPremium,
      risk_factors: {
        age_factor: age < 25 || age > 65 ? "high" : "low",
        experience_factor: customer_data.driving_experience_years < 2 ? "high" : "low",
        vehicle_age_factor: vehicleAge > 10 ? "high" : "low",
        vehicle_value_factor: vehicle_data.estimated_value > 500000 ? "high" : "low",
        safety_factor: vehicle_data.safety_features?.length > 3 ? "low" : "medium",
        security_factor: vehicle_data.anti_theft_devices?.length > 0 ? "low" : "medium",
        parking_factor: vehicle_data.garage_type === "enclosed" ? "low" : "high",
        history_factor:
          driving_history.accidents + driving_history.violations + driving_history.claims > 2 ? "high" : "low",
      },
      recommendations: [],
    }

    // Add recommendations based on risk factors
    if (riskScore > 70) {
      assessment.recommendations.push("Considerar curso de manejo defensivo")
      assessment.recommendations.push("Instalar dispositivos de seguridad adicionales")
    }
    if (vehicle_data.garage_type === "street") {
      assessment.recommendations.push("Buscar estacionamiento seguro")
    }
    if (!vehicle_data.safety_features || vehicle_data.safety_features.length < 3) {
      assessment.recommendations.push("Actualizar características de seguridad del vehículo")
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
