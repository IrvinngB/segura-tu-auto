"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PolicyList } from "@/components/policies/policy-list"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Plus } from "lucide-react"

export default function PoliciesPage() {
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

        <PolicyList />
      </div>
    </ProtectedRoute>
  )
}
