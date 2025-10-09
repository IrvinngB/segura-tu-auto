"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook optimizado para navegación con transiciones suaves
 */
export function useOptimizedNavigation() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const navigate = useCallback((href: string, options?: { replace?: boolean; scroll?: boolean }) => {
        startTransition(() => {
            if (options?.replace) {
                router.replace(href);
            } else {
                router.push(href);
            }
            
            if (options?.scroll !== false) {
                window.scrollTo(0, 0);
            }
        });
    }, [router]);

    const prefetch = useCallback((href: string) => {
        router.prefetch(href);
    }, [router]);

    return {
        navigate,
        prefetch,
        isPending,
    };
}
