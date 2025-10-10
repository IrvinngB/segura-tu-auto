"use client";

import { Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

export function LoadingScreen({ 
    message = "Cargando...", 
    fullScreen = true,
    className 
}: LoadingScreenProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-4",
                fullScreen && "min-h-screen bg-background",
                className
            )}
        >
            <div className="relative">
                <Shield className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">{message}</p>
                <div className="flex gap-1 justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );
}

export function InlineLoadingSpinner({ message }: { message?: string }) {
    return (
        <div className="flex items-center gap-3 py-8">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
        </div>
    );
}
