import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  // Normalizar la prioridad para que coincida con las claves
  const normalizedPriority = priority?.toLowerCase() || "low";

  const config: Record<string, { label: string; classes: string }> = {
    low: {
      label: "Baja",
      classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    },
    medium: {
      label: "Media",
      classes: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800",
    },
    high: {
      label: "Alta",
      classes: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800",
    },
    urgent: {
      label: "Urgente",
      classes: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800",
    },
  };

  // Fallback para valores no reconocidos
  const { label, classes } = config[normalizedPriority] || {
    label: priority || "Desconocida",
    classes: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Badge
      variant="outline" // Usamos outline como base para tener borde, pero agregamos fondo con clases
      className={cn(
        "border px-3 py-1 min-w-[70px] capitalize", // Forzamos ancho mínimo para uniformidad visual si se desea, o quitamos min-w
        classes,
        className
      )}
    >
      {label}
    </Badge>
  );
}
