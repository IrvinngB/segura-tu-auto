"use client";

import { useEffect } from "react";

interface DebugModalProps {
    show: boolean;
    onClose: () => void;
}

export function DebugModal({ show, onClose }: DebugModalProps) {
    console.log("🐛 DebugModal render - show:", show);

    useEffect(() => {
        if (show) {
            console.log("🐛 DebugModal mounted and visible");
            const timer = setTimeout(() => {
                console.log("🐛 DebugModal auto-closing after 3 seconds");
                onClose();
            }, 3000);

            return () => {
                console.log("🐛 DebugModal timer cleared");
                clearTimeout(timer);
            };
        }
    }, [show, onClose]);

    if (!show) {
        console.log("🐛 DebugModal not showing - returning null");
        return null;
    }

    console.log("🐛 DebugModal rendering visible modal");

    return (
        <div
            style={{
                position: "fixed",
                top: "0",
                left: "0",
                right: "0",
                bottom: "0",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                zIndex: "999999",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    padding: "30px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                    maxWidth: "400px",
                    textAlign: "center",
                    border: "3px solid red",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        marginBottom: "15px",
                        color: "red",
                    }}
                >
                    🚨 DEBUG MODAL 🚨
                </h2>
                <p
                    style={{
                        fontSize: "16px",
                        marginBottom: "20px",
                        color: "black",
                    }}
                >
                    Si ves este modal, significa que el renderizado funciona
                    correctamente.
                </p>
                <button
                    style={{
                        backgroundColor: "red",
                        color: "white",
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "16px",
                    }}
                    onClick={onClose}
                >
                    Cerrar Debug Modal
                </button>
            </div>
        </div>
    );
}
