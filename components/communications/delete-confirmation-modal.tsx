"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    count: number;
    isDeletingAll?: boolean;
    isLoading?: boolean;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    count,
    isDeletingAll = false,
    isLoading = false,
}: DeleteConfirmationModalProps) {
    const getTitle = () => {
        return "Confirmar eliminación";
    };

    const getDescription = () => {
        if (isDeletingAll) {
            return "¿Estás seguro de que deseas eliminar todas las comunicaciones?";
        }
        if (count === 1) {
            return "¿Estás seguro de que deseas eliminar 1 mensaje?";
        }
        return `¿Estás seguro de que deseas eliminar ${count} mensajes?`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] border-slate-700 bg-[#1E293B] text-slate-100 shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 text-red-500 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-full">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl font-semibold text-slate-100">{getTitle()}</DialogTitle>
                    </div>
                    <DialogDescription className="text-base text-slate-400 pt-2">
                        {getDescription()}
                    </DialogDescription>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Esta acción no se puede deshacer.
                    </p>
                </DialogHeader>
                <DialogFooter className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-colors"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 transition-all"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isLoading ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
