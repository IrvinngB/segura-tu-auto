"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/navigation/sidebar"
import { TrendingUp, AlertTriangle, CheckCircle, Car, User, MapPin } from "lucide-react"

interface RiskAssessmentData {
  // Driver data
  age: number
  experience: number
  violations: number
  accidents: number

  // Vehicle data
  year: number
  value: number
  vehicleType: string
  securityFeatures: string[]

  // Location data
  zone: string
  usage: string
  annualKm: number
}

interface RiskResult {
  score: number
  level: "Bajo" | "Medio" | "Alto"
  premium: number
  factors: Array<{
    factor: string
    impact: number
    description: string
  }>
}

export default function RiskAssessment() {
  const [formData, setFormData] = useState<Partial<RiskAssessmentData>>({})
  const [result, setResult] = useState<RiskResult | null>(null)
  const [loading, setLoading] = useState(false)

  const calculateRisk = () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      const riskScore = calculateRiskScore(formData as RiskAssessmentData)
      setResult(riskScore)
      setLoading(false)
    }, 2000)
  }

  const calculateRiskScore = (data: RiskAssessmentData): RiskResult => {
    let score = 50 // Base score
    const factors = []

    // Age factor
    if (data.age < 25) {
      score += 20
      factors.push({
        factor: "Edad del conductor",
        impact: 20,
        description: "Conductor joven (mayor riesgo)",
      })
    } else if (data.age > 65) {
      score += 10
      factors.push({
        factor: "Edad del conductor",
        impact: 10,
        description: "Conductor mayor (riesgo moderado)",
      })
    } else {
      score -= 5
      factors.push({
        factor: "Edad del conductor",
        impact: -5,
        description: "Edad óptima (menor riesgo)",
      })
    }

    // Experience factor
    if (data.experience < 2) {
      score += 15
      factors.push({
        factor: "Experiencia de conducción",
        impact: 15,
        description: "Poca experiencia",
      })
    } else if (data.experience > 10) {
      score -= 10
      factors.push({
        factor: "Experiencia de conducción",
        impact: -10,
        description: "Mucha experiencia",
      })
    }

    // Violations and accidents
    score += data.violations * 8
    score += data.accidents * 12

    if (data.violations > 0) {
      factors.push({
        factor: "Infracciones de tráfico",
        impact: data.violations * 8,
        description: `${data.violations} infracciones registradas`,
      })
    }

    if (data.accidents > 0) {
      factors.push({
        factor: "Accidentes previos",
        impact: data.accidents * 12,
        description: `${data.accidents} accidentes registrados`,
      })
    }

    // Vehicle factors
    const vehicleAge = new Date().getFullYear() - data.year
    if (vehicleAge > 10) {
      score += 8
      factors.push({
        factor: "Antigüedad del vehículo",
        impact: 8,
        description: "Vehículo antiguo",
      })
    }

    // Zone factor
    if (data.zone === "urban-high") {
      score += 15
      factors.push({
        factor: "Zona de circulación",
        impact: 15,
        description: "Zona urbana de alto riesgo",
      })
    } else if (data.zone === "rural") {
      score -= 5
      factors.push({
        factor: "Zona de circulación",
        impact: -5,
        description: "Zona rural (menor riesgo)",
      })
    }

    // Usage factor
    if (data.usage === "commercial") {
      score += 20
      factors.push({
        factor: "Uso del vehículo",
        impact: 20,
        description: "Uso comercial",
      })
    }

    // Annual kilometers
    if (data.annualKm > 30000) {
      score += 10
      factors.push({
        factor: "Kilometraje anual",
        impact: 10,
        description: "Alto kilometraje anual",
      })
    }

    // Determine risk level
    let level: "Bajo" | "Medio" | "Alto"
    if (score <= 40) level = "Bajo"
    else if (score <= 70) level = "Medio"
    else level = "Alto"

    // Calculate premium (base 500, adjusted by risk)
    const basePremium = 500
    const premium = Math.round(basePremium * (1 + score / 100))

    return {
      score: Math.min(100, Math.max(0, score)),
      level,
      premium,
      factors,
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 lg:ml-64">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Evaluación de Riesgo</h1>
            <p className="text-muted-foreground">
              Motor propio de evaluación de riesgos para cálculo de primas personalizadas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assessment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Datos para Evaluación
                </CardTitle>
                <CardDescription>Complete la información para calcular el riesgo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Driver Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Información del Conductor
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age">Edad</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="25"
                        value={formData.age || ""}
                        onChange={(e) => setFormData({ ...formData, age: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Años de experiencia</Label>
                      <Input
                        id="experience"
                        type="number"
                        placeholder="5"
                        value={formData.experience || ""}
                        onChange={(e) => setFormData({ ...formData, experience: Number.parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="violations">Infracciones (últimos 3 años)</Label>
                      <Input
                        id="violations"
                        type="number"
                        placeholder="0"
                        value={formData.violations || ""}
                        onChange={(e) => setFormData({ ...formData, violations: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accidents">Accidentes (últimos 5 años)</Label>
                      <Input
                        id="accidents"
                        type="number"
                        placeholder="0"
                        value={formData.accidents || ""}
                        onChange={(e) => setFormData({ ...formData, accidents: Number.parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Car className="h-4 w-4" />
                    Información del Vehículo
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year">Año del vehículo</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="2020"
                        value={formData.year || ""}
                        onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="value">Valor del vehículo ($)</Label>
                      <Input
                        id="value"
                        type="number"
                        placeholder="25000"
                        value={formData.value || ""}
                        onChange={(e) => setFormData({ ...formData, value: Number.parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="vehicleType">Tipo de vehículo</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedán</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="hatchback">Hatchback</SelectItem>
                        <SelectItem value="pickup">Pickup</SelectItem>
                        <SelectItem value="sports">Deportivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location and Usage */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Ubicación y Uso
                  </div>

                  <div>
                    <Label htmlFor="zone">Zona de circulación</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, zone: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar zona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urban-low">Urbana - Bajo riesgo</SelectItem>
                        <SelectItem value="urban-medium">Urbana - Riesgo medio</SelectItem>
                        <SelectItem value="urban-high">Urbana - Alto riesgo</SelectItem>
                        <SelectItem value="suburban">Suburbana</SelectItem>
                        <SelectItem value="rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="usage">Uso del vehículo</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, usage: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar uso" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="work">Trabajo</SelectItem>
                          <SelectItem value="commercial">Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="annualKm">Km anuales</Label>
                      <Input
                        id="annualKm"
                        type="number"
                        placeholder="15000"
                        value={formData.annualKm || ""}
                        onChange={(e) => setFormData({ ...formData, annualKm: Number.parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={calculateRisk} disabled={loading} className="w-full">
                  {loading ? "Calculando..." : "Calcular Riesgo"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Resultado de la Evaluación
                </CardTitle>
                <CardDescription>Análisis de riesgo y prima calculada</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                    <Progress value={33} className="w-full" />
                    <p className="text-sm text-muted-foreground">Procesando datos...</p>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
                    {/* Risk Score */}
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{result.score}/100</div>
                      <Badge
                        variant={
                          result.level === "Bajo" ? "secondary" : result.level === "Medio" ? "default" : "destructive"
                        }
                        className="text-lg px-4 py-1"
                      >
                        Riesgo {result.level}
                      </Badge>
                    </div>

                    <Progress value={result.score} className="w-full" />

                    {/* Premium */}
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Prima Anual Calculada</p>
                      <p className="text-2xl font-bold">${result.premium.toLocaleString()}</p>
                    </div>

                    {/* Risk Factors */}
                    <div>
                      <h4 className="font-medium mb-3">Factores de Riesgo</h4>
                      <div className="space-y-2">
                        {result.factors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{factor.factor}</span>
                            <div className="flex items-center gap-2">
                              <span className={factor.impact > 0 ? "text-red-600" : "text-green-600"}>
                                {factor.impact > 0 ? "+" : ""}
                                {factor.impact}
                              </span>
                              {factor.impact > 0 ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full">Generar Cotización</Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Complete el formulario para ver los resultados de la evaluación
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
