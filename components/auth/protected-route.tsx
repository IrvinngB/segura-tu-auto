"use client"

import type React from "react"
import { useAuth } from "./auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles = [], redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  // Memoizar la validación de roles para evitar recálculos innecesarios
  const isAuthorized = useMemo(() => {
    if (!user) return false
    if (allowedRoles.length === 0) return true
    if (!userProfile) return false
    return allowedRoles.includes(userProfile.role)
  }, [user, userProfile, allowedRoles])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (allowedRoles.length > 0 && userProfile && !allowedRoles.includes(userProfile.role)) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, userProfile, loading, router, allowedRoles, redirectTo])

  // Mostrar loading solo si realmente está cargando
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // No renderizar nada si no está autorizado (evita flash de contenido)
  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
