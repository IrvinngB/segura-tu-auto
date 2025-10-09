"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PrefetchLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    prefetch?: boolean;
}

/**
 * Componente Link optimizado con prefetch automático
 * Carga la página en segundo plano al pasar el mouse
 */
export function OptimizedLink({ 
    href, 
    children, 
    className, 
    prefetch = true 
}: PrefetchLinkProps) {
    const router = useRouter();

    const handleMouseEnter = () => {
        if (prefetch) {
            // Prefetch cuando el usuario pasa el mouse
            router.prefetch(href);
        }
    };

    return (
        <Link 
            href={href} 
            className={className}
            onMouseEnter={handleMouseEnter}
            prefetch={prefetch}
        >
            {children}
        </Link>
    );
}

/**
 * Hook para prefetch de rutas críticas al montar el componente
 */
export function usePrefetchRoutes(routes: string[]) {
    const router = useRouter();

    useEffect(() => {
        // Prefetch después de un pequeño delay para no interferir con la carga inicial
        const timer = setTimeout(() => {
            routes.forEach(route => {
                router.prefetch(route);
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [routes, router]);
}
