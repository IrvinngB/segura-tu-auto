"use client"

import { useState, useEffect } from "react"
import { ClaimList } from "@/components/claims/claim-list"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function CustomerClaimsPage() {
  const { userProfile } = useAuth()
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

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis Reclamaciones</h1>
            <p className="text-muted-foreground">Administra tus reclamaciones de seguro</p>
          </div>
          <Button asChild>
            <Link href="/customer/claims/new">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reclamación
            </Link>
          </Button>
        </div>

        {customerId && <ClaimList customerId={customerId} />}
      </div>
    </ProtectedRoute>
  )
}
