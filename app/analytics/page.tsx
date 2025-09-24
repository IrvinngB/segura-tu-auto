"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@supabase/ssr"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, Users, FileText, DollarSign, AlertTriangle, Target, Activity } from "lucide-react"

interface AnalyticsData {
  totalPolicies: number
  activePolicies: number
  totalClaims: number
  pendingClaims: number
  totalCustomers: number
  totalRevenue: number
  averageClaimAmount: number
  claimApprovalRate: number
}

interface ChartData {
  name: string
  value: number
  amount?: number
  count?: number
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalPolicies: 0,
    activePolicies: 0,
    totalClaims: 0,
    pendingClaims: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    averageClaimAmount: 0,
    claimApprovalRate: 0,
  })
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(true)

  // Chart data
  const [claimsByType, setClaimsByType] = useState<ChartData[]>([])
  const [claimsByStatus, setClaimsByStatus] = useState<ChartData[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<ChartData[]>([])
  const [riskDistribution, setRiskDistribution] = useState<ChartData[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()

      switch (timeRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(endDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(endDate.getDate() - 90)
          break
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Fetch basic analytics
      const [policiesResult, claimsResult, customersResult, revenueResult] = await Promise.all([
        supabase.from("policies").select("*", { count: "exact" }),
        supabase.from("claims").select("*", { count: "exact" }),
        supabase.from("customers").select("*", { count: "exact" }),
        supabase.from("policies").select("premium_amount"),
      ])

      // Calculate analytics
      const totalPolicies = policiesResult.count || 0
      const activePolicies = policiesResult.data?.filter((p) => p.status === "active").length || 0
      const totalClaims = claimsResult.count || 0
      const pendingClaims =
        claimsResult.data?.filter((c) => ["submitted", "under_review", "investigating"].includes(c.status)).length || 0
      const totalCustomers = customersResult.count || 0
      const totalRevenue = revenueResult.data?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0
      const averageClaimAmount =
        claimsResult.data?.reduce((sum, c) => sum + (c.estimated_damage_cost || 0), 0) / (totalClaims || 1) || 0
      const approvedClaims = claimsResult.data?.filter((c) => c.status === "approved").length || 0
      const claimApprovalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0

      setAnalyticsData({
        totalPolicies,
        activePolicies,
        totalClaims,
        pendingClaims,
        totalCustomers,
        totalRevenue,
        averageClaimAmount,
        claimApprovalRate,
      })

      // Generate chart data
      generateChartData(claimsResult.data || [], policiesResult.data || [])
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (claims: any[], policies: any[]) => {
    // Claims by type
    const claimTypeCount = claims.reduce((acc, claim) => {
      const type = claim.claim_type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const claimTypeLabels = {
      collision: "Colisión",
      theft: "Robo",
      vandalism: "Vandalismo",
      fire: "Incendio",
      flood: "Inundación",
      hail: "Granizo",
      glass: "Cristales",
      other: "Otro",
    }

    setClaimsByType(
      Object.entries(claimTypeCount).map(([type, count]) => ({
        name: claimTypeLabels[type as keyof typeof claimTypeLabels] || type,
        value: count as number,
      })),
    )

    // Claims by status
    const statusCount = claims.reduce((acc, claim) => {
      const status = claim.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const statusLabels = {
      submitted: "Enviadas",
      under_review: "En Revisión",
      investigating: "Investigando",
      approved: "Aprobadas",
      denied: "Denegadas",
      closed: "Cerradas",
      paid: "Pagadas",
    }

    setClaimsByStatus(
      Object.entries(statusCount).map(([status, count]) => ({
        name: statusLabels[status as keyof typeof statusLabels] || status,
        value: count as number,
      })),
    )

    // Monthly trends (simulated data for demo)
    const monthlyData = [
      { name: "Ene", value: 45, amount: 125000 },
      { name: "Feb", value: 52, amount: 142000 },
      { name: "Mar", value: 48, amount: 138000 },
      { name: "Abr", value: 61, amount: 165000 },
      { name: "May", value: 55, amount: 152000 },
      { name: "Jun", value: 67, amount: 178000 },
    ]
    setMonthlyTrends(monthlyData)

    // Risk distribution (simulated)
    const riskData = [
      { name: "Bajo", value: 45, count: 450 },
      { name: "Medio", value: 35, count: 350 },
      { name: "Alto", value: 15, count: 150 },
      { name: "Crítico", value: 5, count: 50 },
    ]
    setRiskDistribution(riskData)
  }

  const COLORS = ["#164e63", "#0891b2", "#84cc16", "#eab308", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4"]

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Análisis y Reportes</h1>
              <p className="text-muted-foreground">Dashboard de métricas y estadísticas del negocio</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
                <SelectItem value="1y">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pólizas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalPolicies.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{analyticsData.activePolicies} activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalCustomers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Base de clientes activa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reclamaciones</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalClaims.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{analyticsData.pendingClaims} pendientes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Primas cobradas</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto Promedio por Reclamación</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.averageClaimAmount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Promedio de daños estimados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.claimApprovalRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Reclamaciones aprobadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ratio Siniestralidad</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.totalRevenue > 0
                    ? (
                        ((analyticsData.averageClaimAmount * analyticsData.totalClaims) / analyticsData.totalRevenue) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Reclamaciones vs Primas</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="claims" className="space-y-6">
            <TabsList>
              <TabsTrigger value="claims">Reclamaciones</TabsTrigger>
              <TabsTrigger value="trends">Tendencias</TabsTrigger>
              <TabsTrigger value="risk">Análisis de Riesgo</TabsTrigger>
            </TabsList>

            <TabsContent value="claims" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Claims by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Reclamaciones por Tipo</CardTitle>
                    <CardDescription>Distribución de tipos de siniestros</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={claimsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {claimsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Claims by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Reclamaciones por Estado</CardTitle>
                    <CardDescription>Estado actual de las reclamaciones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={claimsByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#164e63" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Monthly Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencias Mensuales</CardTitle>
                    <CardDescription>Evolución de reclamaciones y montos por mes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value, name) => [
                            name === "value" ? `${value} reclamaciones` : `$${value?.toLocaleString()}`,
                            name === "value" ? "Reclamaciones" : "Monto",
                          ]}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="value"
                          stackId="1"
                          stroke="#164e63"
                          fill="#164e63"
                          fillOpacity={0.6}
                        />
                        <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#84cc16" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tiempo Promedio de Procesamiento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">8.5 días</div>
                      <p className="text-sm text-muted-foreground mt-2">-12% vs mes anterior</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Satisfacción del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">4.2/5</div>
                      <p className="text-sm text-muted-foreground mt-2">+0.3 vs mes anterior</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Retención de Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">94.2%</div>
                      <p className="text-sm text-muted-foreground mt-2">+1.8% vs mes anterior</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Riesgo</CardTitle>
                    <CardDescription>Clasificación de clientes por nivel de riesgo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={riskDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Risk Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de Riesgo</CardTitle>
                    <CardDescription>Indicadores clave de gestión de riesgo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Detección de Fraude</span>
                        <span className="text-sm text-muted-foreground">2.3%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: "2.3%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Precisión del Modelo</span>
                        <span className="text-sm text-muted-foreground">87.4%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "87.4%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Cobertura de Evaluación</span>
                        <span className="text-sm text-muted-foreground">95.8%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "95.8%" }}></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Alertas Activas</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Reclamaciones de alto riesgo</span>
                          <Badge variant="destructive">3</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Patrones sospechosos</span>
                          <Badge variant="secondary">7</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Revisiones pendientes</span>
                          <Badge variant="outline">12</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Factors Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Factores de Riesgo Principales</CardTitle>
                  <CardDescription>Análisis de los principales factores que afectan el riesgo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                      <span>Factor</span>
                      <span>Impacto</span>
                      <span>Frecuencia</span>
                      <span>Tendencia</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span>Edad del conductor</span>
                      <span className="text-orange-600">Alto</span>
                      <span>78%</span>
                      <span className="text-green-600">↓ -5%</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span>Historial de accidentes</span>
                      <span className="text-red-600">Muy Alto</span>
                      <span>23%</span>
                      <span className="text-red-600">↑ +12%</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span>Zona de circulación</span>
                      <span className="text-yellow-600">Medio</span>
                      <span>65%</span>
                      <span className="text-gray-600">→ 0%</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span>Tipo de vehículo</span>
                      <span className="text-yellow-600">Medio</span>
                      <span>45%</span>
                      <span className="text-green-600">↓ -8%</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span>Kilometraje anual</span>
                      <span className="text-green-600">Bajo</span>
                      <span>34%</span>
                      <span className="text-green-600">↓ -3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
