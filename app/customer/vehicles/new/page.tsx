"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"

export default function NewVehiclePage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [customerId, setCustomerId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    if (userProfile) {
      fetchCustomerData()
    }
  }, [userProfile])

  const fetchCustomerData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", userProfile?.id)
        .single()

      if (customerError) {
        console.error("Error fetching customer:", customerError)
        setError("Error al cargar los datos del cliente. Por favor, verifica que tu perfil esté completo.")
        return
      }

      if (customer) {
        setCustomerId(customer.id)
      } else {
        setError("No se encontró el perfil de cliente. Por favor, completa tu perfil primero.")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error inesperado al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push("/customer/vehicles")
  }

  const handleCancel = () => {
    router.push("/customer/vehicles")
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/customer/vehicles")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nuevo Vehículo</h1>
              <p className="text-muted-foreground">Agrega un nuevo vehículo a tu perfil</p>
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando datos del cliente...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/customer/vehicles")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nuevo Vehículo</h1>
              <p className="text-muted-foreground">Agrega un nuevo vehículo a tu perfil</p>
            </div>
          </div>

          <Alert variant="destructive" className="max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button onClick={() => router.push("/customer/dashboard")}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/customer/vehicles")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nuevo Vehículo</h1>
            <p className="text-muted-foreground">Agrega un nuevo vehículo a tu perfil</p>
          </div>
        </div>

        <VehicleForm 
          customerId={customerId} 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </ProtectedRoute>
  )
}
