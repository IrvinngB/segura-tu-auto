import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ 
  message = "Cargando...", 
  size = "md",
  className = ""
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto mb-4 text-primary`} />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
