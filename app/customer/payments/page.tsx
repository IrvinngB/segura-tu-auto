"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Calendar, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Payment {
  id: string
  amount: number
  payment_type: string
  payment_method: string
  payment_status: string
  payment_date: string
  reference_number: string
  policy: {
    policy_number: string
    premium_amount: number
  }
}

export default function CustomerPaymentsPage() {
  const { userProfile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    if (userProfile) {
      fetchPayments()
    }
  }, [userProfile])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // Obtener el ID del cliente
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", userProfile?.id)
        .single()

      if (customer) {
        // Obtener pagos del cliente
        const { data: paymentsData, error } = await supabase
          .from("payments")
          .select(`
            *,
            policy:policies(
              policy_number,
              premium_amount
            )
          `)
          .eq("customer_id", customer.id)
          .order("payment_date", { ascending: false })

        if (error) {
          setError("Error al cargar los pagos")
        } else {
          setPayments(paymentsData || [])
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error inesperado al cargar los pagos")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "failed":
        return <Badge variant="destructive">Fallido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "tarjeta de crédito":
      case "tarjeta de débito":
        return <CreditCard className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando pagos...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis Pagos</h1>
          <p className="text-muted-foreground">Historial de pagos de tus pólizas</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {payments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes pagos registrados</h3>
              <p className="text-muted-foreground text-center">
                Los pagos de tus pólizas aparecerán aquí una vez que se procesen
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Resumen de pagos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${payments
                      .filter(p => p.payment_status === "completed")
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pagos Completados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {payments.filter(p => p.payment_status === "completed").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {payments.filter(p => p.payment_status === "pending").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de pagos */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>
                  Lista completa de todos tus pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Póliza</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {payment.policy?.policy_number || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.payment_type === "premium" ? "Prima" : payment.payment_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.payment_method)}
                            <span className="text-sm">{payment.payment_method}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ${payment.amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.payment_status)}
                            {getStatusBadge(payment.payment_status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {payment.reference_number}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
