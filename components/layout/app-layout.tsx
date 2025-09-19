"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { RoleBasedSidebar } from "@/components/navigation/role-based-sidebar"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  // No mostrar sidebar en páginas de autenticación
  const authPages = ["/login", "/register", "/auth"]
  const shouldShowSidebar = user && !authPages.some(page => pathname.startsWith(page))

  return (
    <div className="min-h-screen bg-background">
      {shouldShowSidebar && <RoleBasedSidebar />}
      
      <div className={cn(
        "transition-all duration-200",
        shouldShowSidebar ? "lg:ml-64" : "ml-0"
      )}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
