"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/navigation/sidebar"
import { createBrowserClient } from "@supabase/ssr"
import type { Customer } from "@/lib/types/database"
import { Search, Users, Eye, Edit, Phone, Mail, MapPin, Calendar, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchTerm, riskFilter])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          *,
          user:users(*),
          policies:policies(count),
          claims:claims(count)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      if (data) {
        setCustomers(data)
        setFilteredCustomers(data)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = customers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.user?.phone?.includes(searchTerm),
      )
    }

    // Risk filter
    if (riskFilter !== "all") {
      filtered = filtered.filter((customer) => {
        const riskScore = customer.risk_score || 0
        switch (riskFilter) {
          case "low":
            return riskScore <= 30
          case "medium":
            return riskScore > 30 && riskScore <= 70
          case "high":
            return riskScore > 70
          default:
            return true
        }
      })
    }

    setFilteredCustomers(filtered)
  }

  const getRiskBadge = (riskScore: number) => {
    if (riskScore <= 30) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Bajo
        </Badge>
      )
    } else if (riskScore <= 70) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Medio
        </Badge>
      )
    } else {
      return <Badge variant="destructive">Alto</Badge>
    }
  }

  const getAgeFromBirthDate = (birthDate: string | null) => {
    if (!birthDate) return "N/A"
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Clientes</h1>
            <p className="text-muted-foreground">Administra la información y perfiles de riesgo de los clientes</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">Base de clientes activa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Riesgo Bajo</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {customers.filter((c) => (c.risk_score || 0) <= 30).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((customers.filter((c) => (c.risk_score || 0) <= 30).length / customers.length) * 100).toFixed(1)}%
                  del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Riesgo Medio</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {customers.filter((c) => (c.risk_score || 0) > 30 && (c.risk_score || 0) <= 70).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (customers.filter((c) => (c.risk_score || 0) > 30 && (c.risk_score || 0) <= 70).length /
                      customers.length) *
                    100
                  ).toFixed(1)}
                  % del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Riesgo Alto</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {customers.filter((c) => (c.risk_score || 0) > 70).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((customers.filter((c) => (c.risk_score || 0) > 70).length / customers.length) * 100).toFixed(1)}%
                  del total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Clientes
              </CardTitle>
              <CardDescription>Busca y filtra clientes por diferentes criterios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder="Filtrar por riesgo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los riesgos</SelectItem>
                    <SelectItem value="low">Riesgo Bajo</SelectItem>
                    <SelectItem value="medium">Riesgo Medio</SelectItem>
                    <SelectItem value="high">Riesgo Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customers Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Riesgo</TableHead>
                      <TableHead>Pólizas</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No se encontraron clientes
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {customer.user?.first_name} {customer.user?.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">ID: {customer.id.slice(0, 8)}...</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                <span>{customer.user?.email}</span>
                              </div>
                              {customer.user?.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  <span>{customer.user?.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span>{getAgeFromBirthDate(customer.date_of_birth)} años</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {customer.city || "N/A"}, {customer.state || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getRiskBadge(customer.risk_score || 0)}
                              <span className="text-xs text-muted-foreground">Score: {customer.risk_score || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="text-lg font-semibold">{(customer as any).policies?.length || 0}</div>
                              <div className="text-xs text-muted-foreground">activas</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(customer.created_at), "dd/MM/yyyy", { locale: es })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
