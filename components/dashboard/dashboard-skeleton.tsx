import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 w-24" />
                </div>
            ))}
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <div className="flex gap-2 justify-end">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
}
