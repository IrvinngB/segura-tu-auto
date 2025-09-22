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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
    Shield,
    Mail,
    Lock,
    User,
    Phone,
    Eye,
    EyeOff,
    Home,
} from "lucide-react";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "customer",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            setLoading(false);
            return;
        }

        try {
            // Create auth user (sin confirmación por correo para desarrollo)
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    // Desactivar confirmación por correo para desarrollo
                    emailRedirectTo: undefined,
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone,
                        role: formData.role,
                    },
                },
            });

            if (error) {
                setError(`Error de autenticación: ${error.message}`);
                return;
            }

            if (data.user) {
                console.log("Usuario creado en auth:", data.user.id);

                // Insert user data into users table
                const { data: userData, error: insertError } = await supabase
                    .from("users")
                    .insert({
                        id: data.user.id,
                        email: formData.email,
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone,
                        role: formData.role,
                        password_hash: "handled_by_supabase_auth",
                    })
                    .select();

                if (insertError) {
                    console.error("Error insertando usuario:", insertError);
                    setError(
                        `Error creando perfil de usuario: ${insertError.message}`
                    );
                    return;
                }

                console.log("Usuario insertado en tabla users:", userData);

                // If customer, create customer profile
                if (formData.role === "customer") {
                    const { data: customerData, error: customerError } =
                        await supabase
                            .from("customers")
                            .insert({
                                user_id: data.user.id,
                            })
                            .select();

                    if (customerError) {
                        console.error(
                            "Error creando perfil de cliente:",
                            customerError
                        );
                        setError(
                            `Error creando perfil de cliente: ${customerError.message}`
                        );
                        return;
                    }

                    console.log("Perfil de cliente creado:", customerData);
                }

                setSuccess(
                    "Cuenta creada exitosamente. Ya puedes iniciar sesión."
                );
            }
        } catch (err) {
            console.error("Error inesperado:", err);
            setError(
                `Error inesperado: ${
                    err instanceof Error ? err.message : "Error desconocido"
                }`
            );
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
                    <p className="text-muted-foreground mt-2">Crea tu cuenta</p>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Registro</CardTitle>
                        <CardDescription>
                            Completa la información para crear tu cuenta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {success && (
                                <Alert>
                                    <AlertDescription>
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombre</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="firstName"
                                            placeholder="Juan"
                                            value={formData.firstName}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "firstName",
                                                    e.target.value
                                                )
                                            }
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Apellido</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Pérez"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "lastName",
                                                e.target.value
                                            )
                                        }
                                        required
                                    />
                                </div>
                            </div>

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
                                        value={formData.email}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "email",
                                                e.target.value
                                            )
                                        }
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+52 55 1234 5678"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "phone",
                                                e.target.value
                                            )
                                        }
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Tipo de Usuario</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        handleInputChange("role", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona tu rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="customer">
                                            Cliente
                                        </SelectItem>
                                        <SelectItem value="agent">
                                            Agente
                                        </SelectItem>
                                        <SelectItem value="adjuster">
                                            Ajustador
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
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
                                        value={formData.password}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "password",
                                                e.target.value
                                            )
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
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    Confirmar Contraseña
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "confirmPassword",
                                                e.target.value
                                            )
                                        }
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Creando cuenta..." : "Crear Cuenta"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                ¿Ya tienes una cuenta?{" "}
                                <Link
                                    href="/login"
                                    className="text-primary hover:underline"
                                >
                                    Inicia sesión aquí
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
