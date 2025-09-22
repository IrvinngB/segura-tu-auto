"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Shield,
    Phone,
    Mail,
    MapPin,
    Clock,
    Facebook,
    Instagram,
    Twitter,
    Youtube,
    Send,
    ArrowRight,
} from "lucide-react";

export function PublicFooter() {
    const countries = [
        {
            name: "Costa Rica",
            phone: "+506 2222-3333",
            email: "cr@seguratuauto.com",
            address: "San José, Escazú Centro Empresarial",
        },
        {
            name: "Guatemala",
            phone: "+502 2333-4444",
            email: "gt@seguratuauto.com",
            address: "Guatemala City, Zona 10",
        },
        {
            name: "Honduras",
            phone: "+504 2444-5555",
            email: "hn@seguratuauto.com",
            address: "Tegucigalpa, Col. Palmira",
        },
        {
            name: "El Salvador",
            phone: "+503 2555-6666",
            email: "sv@seguratuauto.com",
            address: "San Salvador, Zona Rosa",
        },
        {
            name: "Nicaragua",
            phone: "+505 2666-7777",
            email: "ni@seguratuauto.com",
            address: "Managua, Los Robles",
        },
        {
            name: "Panamá",
            phone: "+507 2777-8888",
            email: "pa@seguratuauto.com",
            address: "Ciudad de Panamá, Casco Viejo",
        },
    ];

    const quickLinks = [
        { name: "Cotizar Seguro", href: "/register" },
        { name: "Iniciar Sesión", href: "/login" },
        { name: "Reportar Siniestro", href: "/login" },
        { name: "Pagar Mi Póliza", href: "/login" },
        { name: "Red de Talleres", href: "#" },
        { name: "Documentos", href: "#" },
    ];

    const legalLinks = [
        { name: "Términos y Condiciones", href: "#" },
        { name: "Política de Privacidad", href: "#" },
        { name: "Política de Cookies", href: "#" },
        { name: "Defensoría del Cliente", href: "#" },
        { name: "Transparencia", href: "#" },
    ];

    const socialLinks = [
        { icon: Facebook, href: "#", name: "Facebook" },
        { icon: Instagram, href: "#", name: "Instagram" },
        { icon: Twitter, href: "#", name: "Twitter" },
        { icon: Youtube, href: "#", name: "YouTube" },
    ];

    return (
        <footer id="contacto" className="bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="py-16 grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Company Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center space-x-3">
                            <Shield className="h-8 w-8 text-primary" />
                            <h3 className="text-2xl font-bold text-foreground">
                                SeguraTuAuto
                            </h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Protegemos tu vehículo y tu tranquilidad con los
                            mejores seguros de Centroamérica. Más de 10 años
                            brindando confianza y seguridad.
                        </p>

                        {/* Emergency Contact */}
                        <Card className="bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Phone className="h-4 w-4 text-destructive" />
                                    <span className="font-semibold text-foreground text-sm">
                                        Emergencias 24/7
                                    </span>
                                </div>
                                <a
                                    href="tel:911"
                                    className="text-lg font-bold text-destructive hover:text-destructive/80 transition-colors"
                                >
                                    911 - EMERGENCIAS
                                </a>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Línea directa para reportar accidentes y
                                    solicitar asistencia
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact by Country */}
                    <div className="lg:col-span-2">
                        <h4 className="text-lg font-semibold text-foreground mb-6">
                            Contacto por País
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {countries.map((country, index) => (
                                <Card
                                    key={index}
                                    className="group hover:shadow-md transition-all duration-300"
                                >
                                    <CardContent className="p-4">
                                        <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            {country.name}
                                        </h5>
                                        <div className="space-y-2 text-sm">
                                            <a
                                                href={`tel:${country.phone}`}
                                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Phone className="h-3 w-3" />
                                                {country.phone}
                                            </a>
                                            <a
                                                href={`mailto:${country.email}`}
                                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Mail className="h-3 w-3" />
                                                {country.email}
                                            </a>
                                            <p className="text-muted-foreground text-xs">
                                                {country.address}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links & Newsletter */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Quick Links */}
                        <div>
                            <h4 className="text-lg font-semibold text-foreground mb-4">
                                Enlaces Rápidos
                            </h4>
                            <ul className="space-y-2">
                                {quickLinks.map((link, index) => (
                                    <li key={index}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                                        >
                                            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <h4 className="text-lg font-semibold text-foreground mb-4">
                                Mantente Informado
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Recibe consejos de manejo, ofertas especiales y
                                noticias sobre seguros.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="flex-1"
                                />
                                <Button size="icon">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div>
                            <h4 className="text-lg font-semibold text-foreground mb-4">
                                Síguenos
                            </h4>
                            <div className="flex gap-3">
                                {socialLinks.map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.href}
                                        className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                                        aria-label={social.name}
                                    >
                                        <social.icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Hours */}
                <div className="py-6 border-t border-border">
                    <Card className="bg-gradient-to-r from-muted/50 to-transparent">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Clock className="h-5 w-5 text-primary" />
                                <h4 className="font-semibold text-foreground">
                                    Horarios de Atención
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-sm">
                                <div>
                                    <p className="font-medium text-foreground">
                                        Lunes a Viernes
                                    </p>
                                    <p className="text-muted-foreground">
                                        8:00 AM - 6:00 PM
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        Sábados
                                    </p>
                                    <p className="text-muted-foreground">
                                        9:00 AM - 2:00 PM
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        Emergencias
                                    </p>
                                    <p className="text-secondary font-medium">
                                        24/7 Todos los días
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Footer */}
                <div className="py-6 border-t border-border">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                            © 2025 SeguraTuAuto. Todos los derechos reservados.
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {legalLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
