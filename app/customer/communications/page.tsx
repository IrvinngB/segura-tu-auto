"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useCustomerDataSimple } from "@/hooks/use-customer-data-simple"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Mail, Phone, Calendar, User, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Communication {
  id: string
  communication_type: string
  direction: string
  subject: string
  content: string
  status: string
  created_at: string
  agent: {
    first_name: string
    last_name: string
    email: string
  }
  policy: {
    policy_number: string
  }
}

export default function CustomerCommunicationsPage() {
  const { customerData, loading: customerLoading, error: customerError } = useCustomerDataSimple()
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    if (customerData && !customerLoading) {
      fetchCommunications()
    }
  }, [customerData, customerLoading])

  const fetchCommunications = async () => {
    if (!customerData) return

    try {
      setLoading(true)
      setError("")
      
      console.log("Buscando comunicaciones para cliente:", customerData.id)
      
      // Obtener comunicaciones del cliente
      const { data: communicationsData, error: communicationsError } = await supabase
        .from("communications")
        .select(`
          *,
          agent:users!communications_agent_id_fkey(
            first_name,
            last_name,
            email
          ),
          policy:policies(
            policy_number
          )
        `)
        .eq("customer_id", customerData.id)
        .order("created_at", { ascending: false })

      if (communicationsError) {
        console.error("Error obteniendo comunicaciones:", communicationsError)
        setError(`Error al cargar las comunicaciones: ${communicationsError.message}`)
      } else {
        console.log("Comunicaciones encontradas:", communicationsData?.length || 0)
        setCommunications(communicationsData || [])
      }
    } catch (error) {
      console.error("Error inesperado:", error)
      setError("Error inesperado al cargar las comunicaciones")
    } finally {
      setLoading(false)
    }
  }

  const getCommunicationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getDirectionBadge = (direction: string) => {
    switch (direction.toLowerCase()) {
      case "inbound":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Recibido</Badge>
      case "outbound":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Enviado</Badge>
      default:
        return <Badge variant="outline">{direction}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "sent":
        return <Badge variant="default" className="bg-green-100 text-green-800">Enviado</Badge>
      case "delivered":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Entregado</Badge>
      case "read":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Leído</Badge>
      case "failed":
        return <Badge variant="destructive">Fallido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (customerLoading || loading) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {customerLoading ? "Cargando perfil..." : "Cargando comunicaciones..."}
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (customerError) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive">{customerError}</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Comunicaciones</h1>
          <p className="text-muted-foreground">Mensajes y notificaciones de SeguraTuAuto</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {communications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes comunicaciones</h3>
              <p className="text-muted-foreground text-center">
                Los mensajes y notificaciones de SeguraTuAuto aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Resumen de comunicaciones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{communications.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recibidos</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {communications.filter(c => c.direction === "inbound").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enviados</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {communications.filter(c => c.direction === "outbound").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de comunicaciones */}
            <div className="space-y-4">
              {communications.map((communication) => (
                <Card key={communication.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getCommunicationIcon(communication.communication_type)}
                        <div>
                          <CardTitle className="text-lg">{communication.subject}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(communication.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getDirectionBadge(communication.direction)}
                        {getStatusBadge(communication.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {communication.content}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            {communication.direction === "inbound" ? "De:" : "Para:"} 
                            {communication.agent ? 
                              ` ${communication.agent.first_name} ${communication.agent.last_name}` : 
                              " SeguraTuAuto"
                            }
                          </span>
                        </div>
                        
                        {communication.policy && (
                          <Badge variant="outline" className="text-xs">
                            Póliza: {communication.policy.policy_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
