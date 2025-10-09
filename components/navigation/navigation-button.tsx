"use client";

import { useOptimizedNavigation } from "@/hooks/use-optimized-navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface NavigationButtonProps {
    href: string;
    children: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    disabled?: boolean;
    prefetch?: boolean;
}

/**
 * Botón optimizado para navegación con transiciones suaves
 */
export function NavigationButton({
    href,
    children,
    variant = "default",
    size = "default",
    className,
    disabled,
    prefetch = true,
}: NavigationButtonProps) {
    const { navigate, prefetch: prefetchRoute, isPending } = useOptimizedNavigation();

    const handleClick = () => {
        if (!disabled) {
            navigate(href);
        }
    };

    const handleMouseEnter = () => {
        if (prefetch) {
            prefetchRoute(href);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={cn(className)}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            disabled={disabled || isPending}
        >
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {children}
                </>
            ) : (
                children
            )}
        </Button>
    );
}
