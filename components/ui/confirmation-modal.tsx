"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/portal";

interface ConfirmationModalProps {
    show: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ConfirmationModal({
    show,
    title = "¿Estás seguro?",
    message,
    confirmText = "Sí, confirmar",
    cancelText = "Cancelar",
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmationModalProps) {
    if (!show) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onCancel}
                />
                <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-16 w-16 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {message}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="min-w-[100px]"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="min-w-[100px]"
                        >
                            {isLoading ? "Cerrando..." : confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
