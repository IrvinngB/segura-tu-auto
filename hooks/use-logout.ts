"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function useLogout() {
    const { signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const router = useRouter();

    const handleLogoutClick = () => {
        setShowConfirmationModal(true);
    };

    const handleConfirmLogout = async () => {
        setIsSigningOut(true);

        try {
            await signOut();
            // Redirigir inmediatamente después del logout
            console.log("🔄 Redirigiendo a página principal después de logout...");
            window.location.href = "/";
        } catch (error) {
            console.error("❌ Error signing out:", error);
            // En caso de error, aún redirigir
            window.location.href = "/";
        }
    };

    const handleCancelLogout = () => {
        setShowConfirmationModal(false);
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        // Redirigir a la página pública después de cerrar el modal
        console.log("🔄 Redirigiendo a página principal después de logout...");
        window.location.href = "/"; // Usar window.location para forzar recarga completa
    };

    return {
        isSigningOut,
        showConfirmationModal,
        showSuccessModal,
        handleLogoutClick,
        handleConfirmLogout,
        handleCancelLogout,
        handleSuccessModalClose,
    };
}
