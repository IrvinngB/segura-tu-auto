"use client";

import { Button } from "@/components/ui/button";
import { SuccessModal } from "@/components/ui/success-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useLogout } from "@/hooks/use-logout";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
    variant?:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
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
    iconOnly = false,
}: LogoutButtonProps) {
    const {
        isSigningOut,
        showConfirmationModal,
        showSuccessModal,
        handleLogoutClick,
        handleConfirmLogout,
        handleCancelLogout,
        handleSuccessModalClose,
    } = useLogout();

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleLogoutClick}
                disabled={isSigningOut}
                className={`flex items-center ${
                    iconOnly ? "space-x-2" : ""
                } ${className}`}
            >
                {showIcon && (
                    <LogOut className={iconOnly ? "h-4 w-4" : "mr-3 h-4 w-4"} />
                )}
                {!iconOnly && <span>Cerrar Sesión</span>}
            </Button>

            <ConfirmationModal
                show={showConfirmationModal}
                title="¿Cerrar Sesión?"
                message="¿Estás seguro que deseas cerrar tu sesión? Serás redirigido a la página principal."
                confirmText="Sí, cerrar sesión"
                cancelText="Cancelar"
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
                isLoading={isSigningOut}
            />

            <SuccessModal
                show={showSuccessModal}
                title="¡Sesión Cerrada Correctamente!"
                message="Has cerrado sesión exitosamente. Te estamos redirigiendo a la página principal..."
                duration={2500}
                onClose={handleSuccessModalClose}
            />
        </>
    );
}
