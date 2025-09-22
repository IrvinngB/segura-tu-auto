"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Shield,
    Car,
    Star,
    Users,
    CheckCircle,
    ArrowRight,
} from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative bg-gradient-to-br from-background via-muted/50 to-background py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                                Tu{" "}
                                <span className="text-primary">Seguridad</span>{" "}
                                es Nuestra{" "}
                                <span className="text-secondary">
                                    Prioridad
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Protege tu vehículo con las mejores pólizas de
                                seguro. Cobertura completa, atención 24/7 y la
                                tranquilidad que mereces al volante.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    10K+
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Clientes
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    15K+
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Vehículos
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    24/7
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Soporte
                                </div>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" asChild className="text-lg px-8">
                                <Link href="/register">
                                    Cotizar Ahora
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                asChild
                                className="text-lg px-8"
                            >
                                <Link href="#servicios">Conocer Más</Link>
                            </Button>
                        </div>

                        {/* Trust indicators */}
                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-secondary" />
                                <span className="text-sm text-muted-foreground">
                                    Sin compromiso
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-secondary" />
                                <span className="text-sm text-muted-foreground">
                                    Cotización gratuita
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="relative">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                                <CardContent className="p-6 text-center">
                                    <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                                    <h3 className="font-semibold text-foreground">
                                        Protección Total
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Cobertura completa contra todo riesgo
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 mt-8">
                                <CardContent className="p-6 text-center">
                                    <Car className="h-12 w-12 text-secondary mx-auto mb-4" />
                                    <h3 className="font-semibold text-foreground">
                                        Todo Vehículo
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Autos, motos, camiones y más
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 -mt-4">
                                <CardContent className="p-6 text-center">
                                    <Star className="h-12 w-12 text-accent mx-auto mb-4" />
                                    <h3 className="font-semibold text-foreground">
                                        5 Estrellas
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Calificación de nuestros clientes
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mt-4">
                                <CardContent className="p-6 text-center">
                                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                                    <h3 className="font-semibold text-foreground">
                                        Equipo Experto
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Agentes certificados y especializados
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
