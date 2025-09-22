"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    Car,
    Wrench,
    Phone,
    Clock,
    FileText,
    Users,
    TrendingUp,
    Heart,
    Home,
    Briefcase,
} from "lucide-react";

export function ServicesSection() {
    const services = [
        {
            icon: Shield,
            title: "Seguro Todo Riesgo",
            description:
                "Cobertura completa contra accidentes, robo, vandalismo y fenómenos naturales.",
            features: [
                "Responsabilidad civil",
                "Daños propios",
                "Robo total o parcial",
                "Fenómenos naturales",
            ],
            popular: true,
        },
        {
            icon: Car,
            title: "Seguro Básico",
            description:
                "Protección esencial con responsabilidad civil obligatoria y servicios básicos.",
            features: [
                "Responsabilidad civil",
                "Asistencia vial",
                "Gastos médicos",
                "Defensa jurídica",
            ],
            popular: false,
        },
        {
            icon: Wrench,
            title: "Asistencia Vial 24/7",
            description:
                "Servicio de grúa, mecánica de emergencia y auxilio vial las 24 horas.",
            features: [
                "Grúa hasta 50km",
                "Mecánica de emergencia",
                "Combustible",
                "Batería y llantas",
            ],
            popular: false,
        },
        {
            icon: Heart,
            title: "Seguro de Vida",
            description:
                "Protección financiera para tu familia en caso de accidentes de tránsito.",
            features: [
                "Muerte accidental",
                "Invalidez total",
                "Gastos funerarios",
                "Renta diaria",
            ],
            popular: false,
        },
        {
            icon: FileText,
            title: "Gestión de Reclamaciones",
            description:
                "Proceso rápido y eficiente para el manejo de siniestros y reclamaciones.",
            features: [
                "Atención 24/7",
                "Proceso digital",
                "Evaluación rápida",
                "Pago ágil",
            ],
            popular: false,
        },
        {
            icon: Users,
            title: "Asesoría Personalizada",
            description:
                "Agentes especializados te ayudan a elegir la mejor cobertura para tu vehículo.",
            features: [
                "Consulta gratuita",
                "Análisis de riesgo",
                "Comparación de planes",
                "Seguimiento",
            ],
            popular: false,
        },
    ];

    const additionalServices = [
        {
            icon: Home,
            title: "Seguro de Hogar",
            description: "Protege tu hogar y patrimonio familiar",
        },
        {
            icon: Briefcase,
            title: "Seguro Empresarial",
            description: "Cobertura para flotas y vehículos comerciales",
        },
        {
            icon: TrendingUp,
            title: "Inversiones",
            description: "Productos de ahorro e inversión a largo plazo",
        },
    ];

    return (
        <section
            id="servicios"
            className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Nuestros Servicios
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Ofrecemos una amplia gama de servicios de seguros
                        diseñados para proteger lo que más te importa con la
                        mejor relación calidad-precio del mercado.
                    </p>
                </div>

                {/* Main Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {services.map((service, index) => (
                        <Card
                            key={index}
                            className="relative group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                        >
                            {service.popular && (
                                <Badge className="absolute -top-2 left-4 bg-secondary text-secondary-foreground">
                                    Más Popular
                                </Badge>
                            )}
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <service.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">
                                        {service.title}
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-muted-foreground">
                                    {service.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {service.features.map(
                                        (feature, featureIndex) => (
                                            <li
                                                key={featureIndex}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <div className="h-1.5 w-1.5 rounded-full bg-secondary flex-shrink-0" />
                                                <span className="text-muted-foreground">
                                                    {feature}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Additional Services */}
                <div className="border-t border-border pt-16">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl font-bold text-foreground mb-4">
                            Otros Servicios
                        </h3>
                        <p className="text-muted-foreground">
                            Complementa tu protección con nuestros servicios
                            adicionales
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {additionalServices.map((service, index) => (
                            <Card
                                key={index}
                                className="text-center group hover:shadow-md transition-all duration-300"
                            >
                                <CardContent className="pt-6">
                                    <div className="mb-4">
                                        <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                                            <service.icon className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-semibold text-foreground mb-2">
                                        {service.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {service.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="text-center mt-16">
                    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Phone className="h-6 w-6 text-primary" />
                            <Clock className="h-6 w-6 text-secondary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                            ¿Necesitas más información?
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Nuestros agentes están disponibles 24/7 para
                            ayudarte a encontrar la mejor opción
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="tel:+1234567890"
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                                Llamar Ahora
                            </a>
                            <a
                                href="#contacto"
                                className="inline-flex items-center gap-2 bg-card text-foreground border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors"
                            >
                                <FileText className="h-4 w-4" />
                                Solicitar Cotización
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
