import { memo } from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export const LoadingSpinner = memo(function LoadingSpinner({ 
  size = "md", 
  className,
  text = "Cargando..." 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-32 w-32"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="text-center">
        <div className={cn(
          "animate-spin rounded-full border-b-2 border-primary",
          sizeClasses[size]
        )} />
        {text && (
          <p className="mt-4 text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  )
})