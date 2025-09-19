import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle>Acceso No Autorizado</CardTitle>
          <CardDescription>No tienes permisos para acceder a esta página.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/dashboard">Ir al Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
