"use client"

import { useRouter } from "next/navigation"
import { PolicyForm } from "@/components/policies/policy-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewPolicyPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/policies")
  }

  const handleCancel = () => {
    router.push("/policies")
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "agent"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/policies")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nueva Póliza</h1>
            <p className="text-muted-foreground">Crea una nueva póliza de seguro para un cliente</p>
          </div>
        </div>

        <PolicyForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </ProtectedRoute>
  )
}
