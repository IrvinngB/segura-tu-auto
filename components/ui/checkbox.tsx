"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({
    className,
    ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                "peer size-4 shrink-0 rounded-[4px] border-2 border-gray-400 bg-white shadow-sm transition-all duration-200 outline-none",
                "hover:border-gray-500 hover:shadow-md",
                "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2",
                "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
                // Dark mode styles
                "dark:border-gray-500 dark:bg-gray-800",
                "dark:hover:border-gray-400 dark:hover:bg-gray-700",
                "dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary",
                "dark:disabled:bg-gray-900 dark:disabled:border-gray-600",
                className
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                className="flex items-center justify-center text-current transition-none"
            >
                <CheckIcon className="size-3.5 font-bold" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
