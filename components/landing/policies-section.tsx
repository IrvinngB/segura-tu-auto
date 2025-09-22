"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Check,
    X,
    Star,
    Shield,
    Zap,
    Crown,
    ArrowRight,
    Calculator,
} from "lucide-react";

export function PoliciesSection() {
    const policies = [
        {
            name: "Básico",
            description: "Protección esencial para conductores responsables",
            price: "Desde $299",
            period: "/mes",
            icon: Shield,
            color: "from-blue-500/10 to-blue-600/10",
            borderColor: "border-blue-500/20",
            popular: false,
            features: [
                { name: "Responsabilidad Civil Obligatoria", included: true },
                { name: "Asistencia Vial Básica", included: true },
                { name: "Gastos Médicos (hasta $50K)", included: true },
                { name: "Defensa Jurídica", included: true },
                { name: "Robo Total", included: false },
                { name: "Daños Propios", included: false },
                { name: "Fenómenos Naturales", included: false },
                { name: "Asistencia 24/7", included: false },
            ],
        },
        {
            name: "Completo",
            description: "La protección ideal para la mayoría de conductores",
            price: "Desde $599",
            period: "/mes",
            icon: Star,
            color: "from-secondary/10 to-secondary/5",
            borderColor: "border-secondary/30",
            popular: true,
            features: [
                { name: "Responsabilidad Civil Obligatoria", included: true },
                { name: "Asistencia Vial Completa", included: true },
                { name: "Gastos Médicos (hasta $100K)", included: true },
                { name: "Defensa Jurídica", included: true },
                { name: "Robo Total", included: true },
                { name: "Daños Propios (80% valor)", included: true },
                { name: "Fenómenos Naturales", included: true },
                { name: "Asistencia 24/7", included: false },
            ],
        },
        {
            name: "Premium",
            description: "Máxima protección sin límites ni restricciones",
            price: "Desde $899",
            period: "/mes",
            icon: Crown,
            color: "from-primary/10 to-primary/5",
            borderColor: "border-primary/30",
            popular: false,
            features: [
                { name: "Responsabilidad Civil Obligatoria", included: true },
                { name: "Asistencia Vial Premium", included: true },
                { name: "Gastos Médicos (hasta $200K)", included: true },
                { name: "Defensa Jurídica", included: true },
                { name: "Robo Total", included: true },
                { name: "Daños Propios (100% valor)", included: true },
                { name: "Fenómenos Naturales", included: true },
                { name: "Asistencia 24/7", included: true },
            ],
        },
    ];

    const additionalBenefits = [
        "Sin deducible en talleres afiliados",
        "Vehículo de reemplazo incluido",
        "Cobertura en toda Centroamérica",
        "App móvil para reportar siniestros",
        "Red de talleres certificados",
        "Evaluación digital de daños",
    ];

    return (
        <section id="polizas" className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Planes de Pólizas
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                        Encuentra el plan perfecto para tu vehículo y estilo de
                        vida. Todos nuestros planes incluyen las mejores
                        coberturas del mercado.
                    </p>

                    {/* Quick Calculator CTA */}
                    <div className="inline-flex items-center gap-2 bg-muted rounded-full px-6 py-3 text-sm">
                        <Calculator className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">
                            Los precios varían según el modelo y año de tu
                            vehículo
                        </span>
                    </div>
                </div>

                {/* Policies Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    {policies.map((policy, index) => (
                        <Card
                            key={index}
                            className={`relative group hover:shadow-xl transition-all duration-300 ${
                                policy.popular
                                    ? "ring-2 ring-secondary scale-105"
                                    : ""
                            } bg-gradient-to-br ${policy.color} border-2 ${
                                policy.borderColor
                            }`}
                        >
                            {policy.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-secondary text-secondary-foreground px-4 py-1">
                                        <Star className="h-3 w-3 mr-1" />
                                        Más Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-4">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                                        <policy.icon className="h-8 w-8 text-primary" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold">
                                    {policy.name}
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    {policy.description}
                                </CardDescription>
                                <div className="mt-4">
                                    <div className="text-3xl font-bold text-foreground">
                                        {policy.price}
                                        <span className="text-lg font-normal text-muted-foreground">
                                            {policy.period}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {policy.features.map(
                                        (feature, featureIndex) => (
                                            <li
                                                key={featureIndex}
                                                className="flex items-center gap-3"
                                            >
                                                {feature.included ? (
                                                    <Check className="h-4 w-4 text-secondary flex-shrink-0" />
                                                ) : (
                                                    <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                )}
                                                <span
                                                    className={`text-sm ${
                                                        feature.included
                                                            ? "text-foreground"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {feature.name}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>

                                <div className="pt-4">
                                    <Button
                                        className={`w-full ${
                                            policy.popular
                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                                : ""
                                        }`}
                                        variant={
                                            policy.popular
                                                ? "default"
                                                : "outline"
                                        }
                                        asChild
                                    >
                                        <Link
                                            href="/register"
                                            className="flex items-center justify-center gap-2"
                                        >
                                            Cotizar {policy.name}
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Additional Benefits */}
                <div className="bg-gradient-to-r from-card to-muted/50 rounded-2xl p-8 mb-12">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-foreground mb-4">
                            Beneficios Incluidos en Todos los Planes
                        </h3>
                        <p className="text-muted-foreground">
                            Porque tu tranquilidad no tiene precio
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {additionalBenefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-4 bg-card rounded-lg"
                            >
                                <div className="p-1 rounded-full bg-secondary/10">
                                    <Check className="h-4 w-4 text-secondary" />
                                </div>
                                <span className="text-sm text-foreground">
                                    {benefit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison CTA */}
                <div className="text-center">
                    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Zap className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold text-foreground">
                                    ¿No estás seguro cuál elegir?
                                </h3>
                            </div>
                            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                Nuestros agentes expertos te ayudarán a comparar
                                planes y encontrar la cobertura perfecta para tu
                                vehículo y presupuesto.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg">
                                    <Link
                                        href="/register"
                                        className="flex items-center gap-2"
                                    >
                                        <Calculator className="h-4 w-4" />
                                        Calcular Mi Seguro
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white" asChild>
                                    <Link href="#contacto">
                                        Hablar con un Agente
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
