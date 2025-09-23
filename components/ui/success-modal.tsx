"use client";

import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
    show: boolean;
    title?: string;
    message: string;
    duration?: number;
    onClose: () => void;
}

export function SuccessModal({ 
    show, 
    title = "¡Éxito!", 
    message, 
    duration = 2000, 
    onClose 
}: SuccessModalProps) {
    useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {message}
                </p>
            </div>
        </div>
    );
}