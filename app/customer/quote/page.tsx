"use client"

import { useState } from "react"
import { QuoteForm } from "@/components/customer/quote-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function QuotePage() {
  const [quote, setQuote] = useState<any>(null)

  const handleQuoteSuccess = (quoteData: any) => {
    setQuote(quoteData)
  }

  if (quote) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <div className="container mx-auto py-8 px-4">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">¡Cotización Lista!</CardTitle>
              <CardDescription>Tu cotización personalizada ha sido calculada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">${quote.calculatedPremium.toLocaleString()}</div>
                <div className="text-lg text-muted-foreground">Prima Anual</div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Resumen del Vehículo:</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p>
                    <strong>Vehículo:</strong> {quote.vehicle.year} {quote.vehicle.make} {quote.vehicle.model}
                  </p>
                  <p>
                    <strong>Valor:</strong> ${Number.parseFloat(quote.vehicle.estimatedValue).toLocaleString()}
                  </p>
                  <p>
                    <strong>Uso:</strong> {quote.vehicle.usageType}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button asChild className="flex-1">
                  <Link href="/customer/policies/new">Contratar Póliza</Link>
                </Button>
                <Button variant="outline" onClick={() => setQuote(null)}>
                  Nueva Cotización
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8" />
            Cotización de Seguro
          </h1>
          <p className="text-muted-foreground mt-2">Obtén una cotización personalizada para tu vehículo en minutos</p>
        </div>

        <QuoteForm onSuccess={handleQuoteSuccess} />
      </div>
    </ProtectedRoute>
  )
}
