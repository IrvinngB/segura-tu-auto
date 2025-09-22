"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, User, MapPin, Calendar } from "lucide-react";

export function TestimonialsSection() {
    const testimonials = [
        {
            name: "María González",
            location: "San José, Costa Rica",
            rating: 5,
            date: "Hace 2 meses",
            text: "Excelente servicio! Cuando tuve mi accidente, el proceso fue súper rápido y sin complicaciones. El agente me atendió las 24 horas y mi auto quedó como nuevo. Totalmente recomendado.",
            plan: "Plan Completo",
            avatar: "MG",
        },
        {
            name: "Carlos Ruiz",
            location: "Guatemala City, Guatemala",
            rating: 5,
            date: "Hace 1 mes",
            text: "Llevo 3 años con SeguraTuAuto y nunca me han fallado. Precios justos, atención personalizada y una app muy fácil de usar. Mi familia está protegida y eso no tiene precio.",
            plan: "Plan Premium",
            avatar: "CR",
        },
        {
            name: "Ana Patricia Morales",
            location: "Tegucigalpa, Honduras",
            rating: 5,
            date: "Hace 3 semanas",
            text: "Me robaron el carro y pensé que sería un proceso horrible, pero SeguraTuAuto me sorprendió. En menos de 10 días ya tenía mi indemnización. Profesionales de primera.",
            plan: "Plan Completo",
            avatar: "AM",
        },
        {
            name: "José Luis Hernández",
            location: "San Salvador, El Salvador",
            rating: 5,
            date: "Hace 1 semana",
            text: "La asistencia vial 24/7 es real! Se me dañó el carro a las 2 AM en carretera y en 30 minutos ya tenía la grúa. Servicio impecable y muy profesional.",
            plan: "Plan Premium",
            avatar: "JH",
        },
        {
            name: "Sofía Vásquez",
            location: "Managua, Nicaragua",
            rating: 5,
            date: "Hace 2 semanas",
            text: "Como mujer, me da mucha tranquilidad saber que tengo un seguro confiable. Los agentes son muy respetuosos y me explican todo de manera clara. 100% satisfecha.",
            plan: "Plan Básico",
            avatar: "SV",
        },
        {
            name: "Roberto Chen",
            location: "Ciudad de Panamá, Panamá",
            rating: 5,
            date: "Hace 1 mes",
            text: "Cambié de mi seguro anterior a SeguraTuAuto y fue la mejor decisión. Mejor precio, mejor servicio y mejor cobertura. Mis amigos ya se están cambiando también.",
            plan: "Plan Completo",
            avatar: "RC",
        },
    ];

    const stats = [
        {
            number: "98%",
            label: "Satisfacción del Cliente",
            description: "De nuestros clientes nos recomiendan",
        },
        {
            number: "4.9/5",
            label: "Calificación Promedio",
            description: "En todas las plataformas de reseñas",
        },
        {
            number: "<24h",
            label: "Tiempo de Respuesta",
            description: "Promedio para reclamaciones",
        },
        {
            number: "+10K",
            label: "Clientes Satisfechos",
            description: "Confían en nosotros diariamente",
        },
    ];

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${
                    i < rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                }`}
            />
        ));
    };

    return (
        <section
            id="testimonios"
            className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Lo Que Dicen Nuestros Clientes
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Miles de conductores ya confían en SeguraTuAuto para
                        proteger sus vehículos. Lee sus experiencias reales y
                        únete a nuestra familia.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {stats.map((stat, index) => (
                        <Card
                            key={index}
                            className="text-center bg-gradient-to-br from-card to-muted/50"
                        >
                            <CardContent className="p-6">
                                <div className="text-3xl font-bold text-primary mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-sm font-medium text-foreground mb-1">
                                    {stat.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {stat.description}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {testimonials.map((testimonial, index) => (
                        <Card
                            key={index}
                            className="group hover:shadow-lg transition-all duration-300 bg-card border-2 hover:border-primary/20"
                        >
                            <CardContent className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-medium text-primary">
                                                {testimonial.avatar}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">
                                                {testimonial.name}
                                            </h4>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {testimonial.location}
                                            </div>
                                        </div>
                                    </div>
                                    <Quote className="h-6 w-6 text-primary/30 flex-shrink-0" />
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex gap-1">
                                        {renderStars(testimonial.rating)}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {testimonial.date}
                                    </div>
                                </div>

                                {/* Testimonial Text */}
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                    "{testimonial.text}"
                                </p>

                                {/* Plan Badge */}
                                <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                                    {testimonial.plan}
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-primary/10">
                                    <Star className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">
                                Calidad Garantizada
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Certificados por la Superintendencia de Seguros
                                de cada país
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-center bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                        <CardContent className="p-6">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-secondary/10">
                                    <User className="h-8 w-8 text-secondary" />
                                </div>
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">
                                Atención Personal
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Cada cliente tiene un agente dedicado disponible
                                cuando lo necesite
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-center bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                        <CardContent className="p-6">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-accent/10">
                                    <Quote className="h-8 w-8 text-accent" />
                                </div>
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">
                                Transparencia Total
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Sin letra pequeña ni sorpresas. Todo claro desde
                                el primer día
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
