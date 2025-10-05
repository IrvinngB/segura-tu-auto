"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, Home } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    // Función para traducir mensajes de error a español
    const getErrorMessage = (errorMessage: string) => {
        const errorMap: { [key: string]: string } = {
            "Invalid login credentials": "Correo electrónico o contraseña incorrectos",
            "Email not confirmed": "Tu cuenta aún no ha sido verificada. Revisa tu correo electrónico",
            "Too many requests": "Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde",
            "User not found": "No se encontró una cuenta con este correo electrónico",
            "Invalid email": "El formato del correo electrónico no es válido",
            "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
            "Network error": "Error de conexión. Verifica tu conexión a internet",
            "An unexpected error occurred": "Ocurrió un error inesperado. Por favor, inténtalo de nuevo"
        };

        // Buscar coincidencias exactas o parciales
        for (const [key, value] of Object.entries(errorMap)) {
            if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }

        // Si no encuentra una traducción específica, devolver un mensaje genérico
        return "Error de autenticación. Verifica tus credenciales e inténtalo de nuevo";
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes("sb-")) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(getErrorMessage(error.message));
                return;
            }

            if (data.user) {
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", data.user.id)
                    .maybeSingle();

                if (userError) {
                    console.error("Error fetching user data:", userError);
                    console.warn("User profile not found, redirecting to home");
                    router.push("/");
                    return;
                }

                if (!userData) {
                    console.warn("User profile not found, redirecting to home");
                    router.push("/");
                    return;
                }

                console.log(`✅ Login successful for ${userData.role}`);
                router.push("/");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(getErrorMessage("An unexpected error occurred"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            {/* Botón de volver al inicio - Posición superior */}
            <Link href="/" className="fixed top-6 left-6 z-50 group">
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white dark:hover:bg-gray-700"
                >
                    <Home className="h-4 w-4 mr-2 text-primary group-hover:text-primary/80 transition-colors" />
                    <span className="font-medium">Inicio</span>
                </Button>
            </Link>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Shield className="h-12 w-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        SeguraTuAuto
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Inicia sesión en tu cuenta
                    </p>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Iniciar Sesión</CardTitle>
                        <CardDescription>
                            Ingresa tus credenciales para acceder al sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Correo Electrónico
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <Eye className="h-4 w-4" />
                                        ) : (
                                            <EyeOff className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading
                                    ? "Iniciando sesión..."
                                    : "Iniciar Sesión"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                ¿No tienes una cuenta?{" "}
                                <Link
                                    href="/register"
                                    className="text-primary hover:underline"
                                >
                                    Regístrate aquí
                                </Link>
                            </p>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-primary hover:underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
