"use client";

import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface SimpleSuccessModalProps {
    show: boolean;
    title?: string;
    message: string;
    duration?: number;
    onClose: () => void;
}

export function SimpleSuccessModal({
    show,
    title = "¡Éxito!",
    message,
    duration = 3000,
    onClose,
}: SimpleSuccessModalProps) {
    console.log("🎯 SimpleSuccessModal render - show:", show);

    useEffect(() => {
        if (show && duration > 0) {
            console.log("⏱️ Simple modal timer for", duration, "ms");
            const timer = setTimeout(() => {
                console.log("⏰ Simple modal timer expired");
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) {
        console.log("❌ Simple modal not showing");
        return null;
    }

    console.log("✅ Rendering simple success modal");

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(4px)",
            }}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md text-center shadow-2xl border border-gray-200 dark:border-gray-700"
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "32px",
                    maxWidth: "400px",
                    textAlign: "center",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    border: "1px solid #e5e7eb",
                }}
            >
                <div className="flex justify-center mb-4">
                    <CheckCircle
                        className="h-16 w-16 text-green-500"
                        style={{
                            width: "64px",
                            height: "64px",
                            color: "#10b981",
                        }}
                    />
                </div>
                <h3
                    className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                    style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "#111827",
                        marginBottom: "8px",
                    }}
                >
                    {title}
                </h3>
                <p
                    className="text-gray-600 dark:text-gray-300 mb-4"
                    style={{ color: "#4b5563", marginBottom: "16px" }}
                >
                    {message}
                </p>
            </div>
        </div>
    );
}
