"use client";

import { useMemo, memo, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
    AdminSidebar,
    AgentSidebar,
    CustomerSidebar,
    AdjusterSidebar
} from "@/components/navigation/role-specific-sidebars";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
    const { user, userProfile, loading } = useAuth();
    const pathname = usePathname();
    const [showInitialLoader, setShowInitialLoader] = useState(true);

    // Ocultar el loader inicial después de un tiempo máximo
    useEffect(() => {
        if (!loading) {
            // Pequeño delay para transición suave
            const timer = setTimeout(() => {
                setShowInitialLoader(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    // No mostrar sidebar en páginas de autenticación y en la página principal si no hay usuario
    const publicPages = useMemo(() => ["/login", "/register", "/auth"], []);
    const isPublicPage = useMemo(() => 
        publicPages.some((page) => pathname.startsWith(page)),
        [pathname, publicPages]
    );
    
    const shouldShowSidebar = useMemo(() => {
        // Si es una página pública, no mostrar sidebar
        if (isPublicPage) {
            return false;
        }
        // Si es la página principal y no hay usuario, no mostrar sidebar
        if (pathname === "/" && !user) {
            return false;
        }
        // Si hay usuario, mostrar sidebar
        return !!user;
    }, [user, pathname, isPublicPage]);

    const renderSidebar = () => {
        if (!userProfile?.role) return null;

        switch (userProfile.role) {
            case 'admin':
                return <AdminSidebar userProfile={userProfile} />;
            case 'agent':
                return <AgentSidebar userProfile={userProfile} />;
            case 'customer':
                return <CustomerSidebar userProfile={userProfile} />;
            case 'adjuster':
                return <AdjusterSidebar userProfile={userProfile} />;
            default:
                return null;
        }
    };

    // Mostrar loading screen solo al inicio y en páginas privadas
    if (loading && showInitialLoader && !isPublicPage) {
        return <LoadingScreen message="Cargando..." />;
    }

    return (
        <div className="min-h-screen bg-background">
            {shouldShowSidebar && renderSidebar()}

            <div
                className={cn(
                    "transition-all duration-200",
                    shouldShowSidebar ? "lg:ml-64" : "ml-0"
                )}
            >
                <Suspense fallback={<DashboardSkeleton />}>
                    <main className="min-h-screen">{children}</main>
                </Suspense>
            </div>
        </div>
    );
});
