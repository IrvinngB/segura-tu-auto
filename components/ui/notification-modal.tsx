"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface NotificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
    cancelText?: string;
}

export function NotificationModal({
    open,
    onOpenChange,
    title,
    message,
    type,
    onConfirm,
    confirmText = "Aceptar",
    showCancel = false,
    cancelText = "Cancelar",
}: NotificationModalProps) {
    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle className="h-12 w-12 text-green-600" />;
            case "error":
                return <XCircle className="h-12 w-12 text-red-600" />;
            case "warning":
                return <AlertCircle className="h-12 w-12 text-yellow-600" />;
            case "info":
            default:
                return <Info className="h-12 w-12 text-blue-600" />;
        }
    };

    const getColorClasses = () => {
        switch (type) {
            case "success":
                return {
                    bg: "bg-green-50 dark:bg-green-950/20",
                    border: "border-green-200 dark:border-green-800",
                    button: "bg-green-600 hover:bg-green-700",
                };
            case "error":
                return {
                    bg: "bg-red-50 dark:bg-red-950/20",
                    border: "border-red-200 dark:border-red-800",
                    button: "bg-red-600 hover:bg-red-700",
                };
            case "warning":
                return {
                    bg: "bg-yellow-50 dark:bg-yellow-950/20",
                    border: "border-yellow-200 dark:border-yellow-800",
                    button: "bg-yellow-600 hover:bg-yellow-700",
                };
            case "info":
            default:
                return {
                    bg: "bg-blue-50 dark:bg-blue-950/20",
                    border: "border-blue-200 dark:border-blue-800",
                    button: "bg-blue-600 hover:bg-blue-700",
                };
        }
    };

    const colors = getColorClasses();

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <div className={`rounded-lg p-6 ${colors.bg} ${colors.border} border-2`}>
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto flex items-center justify-center">
                            {getIcon()}
                        </div>
                        <DialogTitle className="text-center text-xl font-semibold">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-base whitespace-pre-line">
                            {message}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex gap-3 mt-6">
                        {showCancel && (
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1"
                            >
                                {cancelText}
                            </Button>
                        )}
                        <Button
                            onClick={handleConfirm}
                            className={`${showCancel ? 'flex-1' : 'w-full'} text-white ${colors.button}`}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default NotificationModal;