import { memo } from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export const Skeleton = memo(function Skeleton({ 
  className
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted h-4 w-full",
        className
      )}
    />
  )
})

// Componentes de skeleton predefinidos
export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/5" />
        <Skeleton />
        <Skeleton className="w-4/5" />
      </div>
    </div>
  )
})

export const TableSkeleton = memo(function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="w-1/4" />
          <Skeleton className="w-1/4" />
          <Skeleton className="w-1/4" />
          <Skeleton className="w-1/4" />
        </div>
      ))}
    </div>
  )
})

export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      
      {/* Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      
      {/* Navigation */}
      <CardSkeleton />
    </div>
  )
})