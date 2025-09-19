import { Suspense, memo } from "react"
import { LoadingSpinner } from "./loading-spinner"

interface LazyPageProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const LazyPage = memo(function LazyPage({ 
  children, 
  fallback = <LoadingSpinner size="lg" className="min-h-screen" />
}: LazyPageProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
})
