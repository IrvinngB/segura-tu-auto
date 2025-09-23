"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function useLogout() {
    const { signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        if (isSigningOut) return;
        
        setIsSigningOut(true);
        
        try {
            await signOut();
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Error signing out:", error);
            // Aún así mostrar el modal y redirigir
            setShowSuccessModal(true);
        } finally {
            setIsSigningOut(false);
        }
    };

    const handleModalClose = () => {
        setShowSuccessModal(false);
        // Redirigir a la página pública después de cerrar el modal
        router.push('/');
    };

    return {
        isSigningOut,
        showSuccessModal,
        handleSignOut,
        handleModalClose,
    };
}