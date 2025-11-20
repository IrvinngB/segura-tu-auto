"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PolicyList } from "@/components/policies/policy-list"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Plus } from "lucide-react"
import type { Policy } from "@/lib/types/database"

export default function PoliciesPage() {
  const router = useRouter()

  const handleEditPolicy = (policy: Policy) => {
    router.push(`/policies/${policy.id}/edit`)
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "agent"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Pólizas</h1>
            <p className="text-muted-foreground">Administra las pólizas de seguro de todos los clientes</p>
          </div>
          <Button asChild>
            <Link href="/policies/new">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Póliza
            </Link>
          </Button>
        </div>

        <PolicyList onEditPolicy={handleEditPolicy} />
      </div>
    </ProtectedRoute>
  )
}
