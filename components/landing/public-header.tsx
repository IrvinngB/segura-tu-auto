"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";

export function PublicHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <Shield className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold text-foreground">
                            SeguraTuAuto
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <a
                            href="#servicios"
                            className="text-foreground hover:text-primary transition-colors"
                        >
                            Servicios
                        </a>
                        <a
                            href="#polizas"
                            className="text-foreground hover:text-primary transition-colors"
                        >
                            Pólizas
                        </a>
                        <a
                            href="#testimonios"
                            className="text-foreground hover:text-primary transition-colors"
                        >
                            Testimonios
                        </a>
                        <a
                            href="#contacto"
                            className="text-foreground hover:text-primary transition-colors"
                        >
                            Contacto
                        </a>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="h-9 w-9"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {/* Desktop Auth Buttons */}
                        <div className="hidden md:flex space-x-2">
                            <Button variant="outline" asChild>
                                <Link href="/login">Iniciar Sesión</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Registrarse</Link>
                            </Button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-border">
                        <nav className="flex flex-col space-y-4">
                            <a
                                href="#servicios"
                                className="text-foreground hover:text-primary transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Servicios
                            </a>
                            <a
                                href="#polizas"
                                className="text-foreground hover:text-primary transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Pólizas
                            </a>
                            <a
                                href="#testimonios"
                                className="text-foreground hover:text-primary transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Testimonios
                            </a>
                            <a
                                href="#contacto"
                                className="text-foreground hover:text-primary transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Contacto
                            </a>
                            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                                <Button variant="outline" asChild>
                                    <Link href="/login">Iniciar Sesión</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/register">Registrarse</Link>
                                </Button>
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
