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
import { Checkbox } from "@/components/ui/checkbox";
import { SuccessModal } from "@/components/ui/success-modal";
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
    Calendar,
    Car,
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
        // Location information
        country: "México",
        // Driver information
        birthDate: "",
        licenseYear: "",
        hasAccidents: false,
        hasClaims: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

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

        // Validar roles permitidos
        const allowedRoles = ["customer", "agent"];
        if (!allowedRoles.includes(formData.role)) {
            setError("Rol no permitido. Solo se permiten clientes y agentes.");
            setLoading(false);
            return;
        }

        try {
            // Create auth user
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    // Para desarrollo, no requerir confirmación por email
                    emailRedirectTo:
                        process.env.NODE_ENV === "development"
                            ? undefined
                            : `${window.location.origin}/auth/callback`,
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
                console.log(
                    "Email confirmado:",
                    data.user.email_confirmed_at !== null
                );

                // Si el email no está confirmado, mostrar mensaje de confirmación
                if (!data.user.email_confirmed_at) {
                    setShowSuccessModal(true);
                    return; // No crear registros adicionales hasta confirmar email
                }

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
                    // Calculate driving experience from license year
                    const currentYear = new Date().getFullYear();
                    const drivingExperience = formData.licenseYear
                        ? currentYear - parseInt(formData.licenseYear)
                        : null;

                    const { data: customerData, error: customerError } =
                        await supabase
                            .from("customers")
                            .insert({
                                user_id: data.user.id,
                                date_of_birth: formData.birthDate || null,
                                // Location field
                                country: formData.country || "Panamá",
                                // Driver information
                                driving_experience_years: drivingExperience,
                                has_accidents: formData.hasAccidents,
                                has_claims: formData.hasClaims,
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
                } else if (formData.role === "agent") {
                    // For agents, we might want to create a different profile or just the user record
                    // This can be extended later if needed
                    console.log(
                        "Perfil de agente creado - solo registro de usuario"
                    );
                }

                // Mostrar modal de éxito
                setShowSuccessModal(true);
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

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        // Redirigir al login después del registro exitoso
        router.push("/login");
    };

    // Función para verificar si todos los campos requeridos están completos
    const isFormValid = () => {
        // Campos básicos requeridos para todos los roles
        const basicFieldsComplete =
            formData.firstName.trim() !== "" &&
            formData.lastName.trim() !== "" &&
            formData.email.trim() !== "" &&
            formData.password.trim() !== "" &&
            formData.confirmPassword.trim() !== "" &&
            formData.password === formData.confirmPassword &&
            formData.password.length >= 6;

        // Debug: log para ver qué está pasando
        console.log("Form validation:", {
            role: formData.role,
            firstName: formData.firstName.trim() !== "",
            lastName: formData.lastName.trim() !== "",
            email: formData.email.trim() !== "",
            password: formData.password.trim() !== "",
            confirmPassword: formData.confirmPassword.trim() !== "",
            passwordsMatch: formData.password === formData.confirmPassword,
            passwordLength: formData.password.length >= 6,
            basicComplete: basicFieldsComplete,
            country: formData.country.trim() !== "",
        });

        // Si es customer, verificar campos adicionales requeridos
        if (formData.role === "customer") {
            const customerFieldsComplete = formData.country.trim() !== "";
            // birthDate y licenseYear son opcionales para customer
            return basicFieldsComplete && customerFieldsComplete;
        }

        // Para agent, solo campos básicos (no requiere birthDate, country, etc.)
        return basicFieldsComplete;
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

                            {/* Location Information Section - Only for customers */}
                            {formData.role === "customer" && (
                                <>
                                    <div className="pt-4 border-t border-border">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Home className="h-5 w-5" />
                                            Información de Ubicación
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Selecciona tu país de residencia
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="country">
                                            País de Residencia *
                                        </Label>
                                        <Select
                                            value={formData.country}
                                            onValueChange={(value) =>
                                                handleInputChange(
                                                    "country",
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona tu país *" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="México">
                                                    México
                                                </SelectItem>
                                                <SelectItem value="Estados Unidos">
                                                    Estados Unidos
                                                </SelectItem>
                                                <SelectItem value="Canadá">
                                                    Canadá
                                                </SelectItem>
                                                <SelectItem value="Guatemala">
                                                    Guatemala
                                                </SelectItem>
                                                <SelectItem value="Belice">
                                                    Belice
                                                </SelectItem>
                                                <SelectItem value="El Salvador">
                                                    El Salvador
                                                </SelectItem>
                                                <SelectItem value="Honduras">
                                                    Honduras
                                                </SelectItem>
                                                <SelectItem value="Nicaragua">
                                                    Nicaragua
                                                </SelectItem>
                                                <SelectItem value="Costa Rica">
                                                    Costa Rica
                                                </SelectItem>
                                                <SelectItem value="Panamá">
                                                    Panamá
                                                </SelectItem>
                                                <SelectItem value="Colombia">
                                                    Colombia
                                                </SelectItem>
                                                <SelectItem value="Venezuela">
                                                    Venezuela
                                                </SelectItem>
                                                <SelectItem value="Ecuador">
                                                    Ecuador
                                                </SelectItem>
                                                <SelectItem value="Perú">
                                                    Perú
                                                </SelectItem>
                                                <SelectItem value="Brasil">
                                                    Brasil
                                                </SelectItem>
                                                <SelectItem value="Argentina">
                                                    Argentina
                                                </SelectItem>
                                                <SelectItem value="Chile">
                                                    Chile
                                                </SelectItem>
                                                <SelectItem value="Uruguay">
                                                    Uruguay
                                                </SelectItem>
                                                <SelectItem value="Paraguay">
                                                    Paraguay
                                                </SelectItem>
                                                <SelectItem value="Bolivia">
                                                    Bolivia
                                                </SelectItem>
                                                <SelectItem value="España">
                                                    España
                                                </SelectItem>
                                                <SelectItem value="Otro">
                                                    Otro
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {/* Driver Information Section - Only for customers */}
                            {formData.role === "customer" && (
                                <>
                                    <div className="pt-4 border-t border-border">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Car className="h-5 w-5" />
                                            Información del Conductor
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Esta información nos ayuda a
                                            calcular cotizaciones personalizadas
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="birthDate">
                                                Fecha de Nacimiento
                                            </Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="birthDate"
                                                    type="date"
                                                    value={formData.birthDate}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "birthDate",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="pl-10"
                                                    max={
                                                        new Date()
                                                            .toISOString()
                                                            .split("T")[0]
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="licenseYear">
                                                Año que Obtuvo la Licencia
                                            </Label>
                                            <Input
                                                id="licenseYear"
                                                type="number"
                                                placeholder="2010"
                                                value={formData.licenseYear}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "licenseYear",
                                                        e.target.value
                                                    )
                                                }
                                                min="1970"
                                                max={new Date().getFullYear()}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="hasAccidents"
                                                checked={formData.hasAccidents}
                                                onCheckedChange={(checked) =>
                                                    handleInputChange(
                                                        "hasAccidents",
                                                        checked as boolean
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="hasAccidents"
                                                className="text-sm"
                                            >
                                                He tenido accidentes en los
                                                últimos 3 años
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="hasClaims"
                                                checked={formData.hasClaims}
                                                onCheckedChange={(checked) =>
                                                    handleInputChange(
                                                        "hasClaims",
                                                        checked as boolean
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="hasClaims"
                                                className="text-sm"
                                            >
                                                He hecho reclamaciones en los
                                                últimos 3 años
                                            </Label>
                                        </div>
                                    </div>
                                </>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading || !isFormValid()}
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

            {/* Success Modal */}
            <SuccessModal
                show={showSuccessModal}
                title="¡Registro Exitoso!"
                message="Tu cuenta ha sido creada. Revisa tu email para confirmar tu cuenta antes de iniciar sesión."
                duration={3000}
                onClose={handleSuccessModalClose}
            />
        </div>
    );
}
