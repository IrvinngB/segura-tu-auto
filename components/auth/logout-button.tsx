"use client";

import { Button } from "@/components/ui/button";
import { SuccessModal } from "@/components/ui/success-modal";
import { useLogout } from "@/hooks/use-logout";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    showIcon?: boolean;
    iconOnly?: boolean;
}

export function LogoutButton({ 
    variant = "outline", 
    size = "sm", 
    className = "",
    showIcon = true,
    iconOnly = false 
}: LogoutButtonProps) {
    const { isSigningOut, showSuccessModal, handleSignOut, handleModalClose } = useLogout();

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`flex items-center space-x-2 ${className}`}
            >
                {showIcon && <LogOut className="h-4 w-4" />}
                {!iconOnly && (
                    <span>{isSigningOut ? "Cerrando..." : "Cerrar Sesión"}</span>
                )}
            </Button>

            <SuccessModal
                show={showSuccessModal}
                title="¡Sesión Cerrada!"
                message="Has cerrado sesión exitosamente. Redirigiendo a la página principal..."
                duration={2000}
                onClose={handleModalClose}
            />
        </>
    );
}