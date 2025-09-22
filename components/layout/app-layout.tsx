"use client";

import { useMemo, memo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { RoleBasedSidebar } from "@/components/navigation/role-based-sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
    const { user } = useAuth();
    const pathname = usePathname();

    // No mostrar sidebar en páginas de autenticación y en la página principal si no hay usuario
    const publicPages = useMemo(() => ["/login", "/register", "/auth"], []);
    const shouldShowSidebar = useMemo(() => {
        // Si es una página pública, no mostrar sidebar
        if (publicPages.some((page) => pathname.startsWith(page))) {
            return false;
        }
        // Si es la página principal y no hay usuario, no mostrar sidebar
        if (pathname === "/" && !user) {
            return false;
        }
        // Si hay usuario, mostrar sidebar
        return !!user;
    }, [user, pathname, publicPages]);

    return (
        <div className="min-h-screen bg-background">
            {shouldShowSidebar && <RoleBasedSidebar />}

            <div
                className={cn(
                    "transition-all duration-200",
                    shouldShowSidebar ? "lg:ml-64" : "ml-0"
                )}
            >
                <main className="min-h-screen">{children}</main>
            </div>
        </div>
    );
});
