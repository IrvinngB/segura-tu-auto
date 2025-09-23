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
        console.log("🔐 Logout click - showing confirmation modal");
        setShowConfirmationModal(true);
    };

    const handleConfirmLogout = async () => {
        console.log("✅ User confirmed logout - starting process");
        setIsSigningOut(true);

        try {
            await signOut();
            console.log("🚪 SignOut successful - showing success modal");
            setShowConfirmationModal(false);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("❌ Error signing out:", error);
            // Aún así mostrar el modal de éxito y redirigir
            console.log("🔄 Showing success modal despite error");
            setShowConfirmationModal(false);
            setShowSuccessModal(true);
        } finally {
            setIsSigningOut(false);
        }
    };

    const handleCancelLogout = () => {
        console.log("❌ User cancelled logout");
        setShowConfirmationModal(false);
    };

    const handleSuccessModalClose = () => {
        console.log("✅ Success modal closed - redirecting");
        setShowSuccessModal(false);
        // Redirigir a la página pública después de cerrar el modal
        router.push("/");
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
