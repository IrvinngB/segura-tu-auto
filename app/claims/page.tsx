"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ClaimList } from "@/components/claims/claim-list"
import { ClaimForm } from "@/components/claims/claim-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Plus } from "lucide-react"

export default function ClaimsPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <ProtectedRoute allowedRoles={["admin", "agent", "adjuster"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Reclamaciones</h1>
            <p className="text-muted-foreground">Administra las reclamaciones de seguros</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reclamación
          </Button>
        </div>

        {showForm ? (
          <ClaimForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        ) : (
          <ClaimList />
        )}
      </div>
    </ProtectedRoute>
  )
}
