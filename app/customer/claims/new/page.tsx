"use client"

import { useState, useEffect } from "react"
import { ClaimForm } from "@/components/claims/claim-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useCustomerData } from "@/hooks/use-customer-data"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"

export default function NewClaimPage() {
  const { customerData, loading: customerLoading, error: customerError } = useCustomerData()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (customerData && !customerLoading) {
      setLoading(false)
    } else if (customerError) {
      setError(customerError)
      setLoading(false)
    }
  }, [customerData, customerLoading, customerError])

  const handleSuccess = () => {
    router.push("/customer/claims")
  }

  const handleCancel = () => {
    router.push("/customer/claims")
  }

  if (customerLoading || loading) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/customer/claims")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nueva Reclamación</h1>
              <p className="text-muted-foreground">Reporta un siniestro para procesar tu reclamación</p>
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                {customerLoading ? "Cargando perfil..." : "Cargando datos del cliente..."}
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (customerError || error) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/customer/claims")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nueva Reclamación</h1>
              <p className="text-muted-foreground">Reporta un siniestro para procesar tu reclamación</p>
            </div>
          </div>

          <Alert variant="destructive" className="max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {customerError || error}
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
            onClick={() => router.push("/customer/claims")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nueva Reclamación</h1>
            <p className="text-muted-foreground">Reporta un siniestro para procesar tu reclamación</p>
          </div>
        </div>

        <ClaimForm 
          customerId={customerData?.id || ""} 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </ProtectedRoute>
  )
}
