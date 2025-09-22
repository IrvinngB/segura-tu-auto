import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
                // Modo claro: sombreado más prominente
                "bg-white border-gray-300 shadow-md hover:shadow-lg",
                // Modo oscuro: fondo más resaltante
                "dark:bg-gray-800/80 dark:border-gray-600 dark:shadow-xl dark:hover:bg-gray-700/90",
                "border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-lg dark:focus-visible:shadow-2xl",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                className
            )}
            {...props}
        />
    );
}

export { Input };
