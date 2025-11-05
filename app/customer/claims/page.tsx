"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ClaimList } from "@/components/claims/claim-list"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { Claim } from "@/lib/types/database"
import { InfoTooltip } from "@/components/ui/info-tooltip"

export default function CustomerClaimsPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [customerId, setCustomerId] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    if (userProfile) {
      fetchCustomerId()
    }
  }, [userProfile])

  const fetchCustomerId = async () => {
    try {
      const { data: customer } = await supabase.from("customers").select("id").eq("user_id", userProfile?.id).single()

      if (customer) {
        setCustomerId(customer.id)
      }
    } catch (error) {
      console.error("Error fetching customer ID:", error)
    }
  }

  const handleViewClaim = (claim: Claim) => {
    // Navegar a la página de detalles de la reclamación
    router.push(`/customer/claims/${claim.id}`)
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Mis Reclamaciones
              <InfoTooltip 
                content="Aquí puedes ver todas tus reclamaciones, crear nuevas y dar seguimiento a su progreso. Haz clic en cualquier reclamación para ver más detalles."
                side="right"
              />
            </h1>
            <p className="text-muted-foreground">Administra tus reclamaciones de seguro</p>
          </div>
          <Button asChild>
            <Link href="/customer/claims/new">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reclamación
            </Link>
          </Button>
        </div>

        {customerId && <ClaimList customerId={customerId} onViewClaim={handleViewClaim} />}
      </div>
    </ProtectedRoute>
  )
}
