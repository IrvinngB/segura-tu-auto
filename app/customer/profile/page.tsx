"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { createBrowserClient } from "@supabase/ssr";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
    User,
    Mail,
    Phone,
    ArrowLeft,
    Save,
    Eye,
    EyeOff,
} from "lucide-react";

interface UserData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
}

interface CustomerData {
    address?: string;
    phone?: string;
    date_of_birth?: string;
}

export default function CustomerProfilePage() {
    const { user, userProfile } = useAuth();
    const [userData, setUserData] = useState<UserData>({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
    });
    const [customerData, setCustomerData] = useState<CustomerData>({
        address: "",
        phone: "",
        date_of_birth: "",
    });
    const [customerId, setCustomerId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (user && userProfile) {
            fetchProfileData();
        }
    }, [user, userProfile]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            setError("");

            // Obtener datos del usuario
            const { data: authUser, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                throw authError;
            }

            if (authUser.user) {
                setUserData({
                    first_name: userProfile?.first_name || "",
                    last_name: userProfile?.last_name || "",
                    email: authUser.user.email || "",
                    phone: userProfile?.phone || "",
                });
            }

            // Obtener datos del cliente
            const { data: customer, error: customerError } = await supabase
                .from("customers")
                .select("id, address, phone, date_of_birth")
                .eq("user_id", user?.id)
                .single();

            if (customerError && customerError.code !== 'PGRST116') {
                console.error("Error fetching customer:", customerError);
            } else if (customer) {
                setCustomerId(customer.id);
                setCustomerData({
                    address: customer.address || "",
                    phone: customer.phone || "",
                    date_of_birth: customer.date_of_birth || "",
                });
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
            setError("Error al cargar los datos del perfil");
        } finally {
            setLoading(false);
        }
    };

    const handleUserDataChange = (field: keyof UserData, value: string) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };

    const handleCustomerDataChange = (field: keyof CustomerData, value: string) => {
        setCustomerData(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            // Actualizar datos del usuario en auth.users (metadata)
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                }
            });

            if (updateError) {
                throw updateError;
            }

            // Actualizar datos en la tabla users
            const { error: userError } = await supabase
                .from("users")
                .update({
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                })
                .eq("id", user?.id);

            if (userError) {
                throw userError;
            }

            // Actualizar o insertar datos del cliente
            if (customerId) {
                // Actualizar cliente existente
                const { error: customerError } = await supabase
                    .from("customers")
                    .update({
                        address: customerData.address,
                        phone: customerData.phone,
                        date_of_birth: customerData.date_of_birth || null,
                    })
                    .eq("id", customerId);

                if (customerError) {
                    throw customerError;
                }
            } else {
                // Crear nuevo registro de cliente
                const { data: newCustomer, error: customerError } = await supabase
                    .from("customers")
                    .insert({
                        user_id: user?.id,
                        address: customerData.address,
                        phone: customerData.phone,
                        date_of_birth: customerData.date_of_birth || null,
                    })
                    .select("id")
                    .single();

                if (customerError) {
                    throw customerError;
                }

                if (newCustomer) {
                    setCustomerId(newCustomer.id);
                }
            }

            setSuccess("Perfil actualizado exitosamente");
            
            // Recargar la página después de 2 segundos para reflejar los cambios
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error: any) {
            console.error("Error updating profile:", error);
            setError(error.message || "Error al actualizar el perfil");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangingPassword(true);
        setError("");
        setSuccess("");

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setChangingPassword(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres");
            setChangingPassword(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) {
                throw error;
            }

            setSuccess("Contraseña actualizada exitosamente");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

        } catch (error: any) {
            console.error("Error changing password:", error);
            setError(error.message || "Error al cambiar la contraseña");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["customer"]}>
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={["customer"]}>
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Mi Perfil</h1>
                            <p className="text-muted-foreground">
                                Actualiza tu información personal
                            </p>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-6">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Información Personal */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Información Personal
                                </CardTitle>
                                <CardDescription>
                                    Actualiza tus datos personales básicos
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">Nombre *</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="firstName"
                                                    placeholder="Tu nombre"
                                                    value={userData.first_name}
                                                    onChange={(e) => 
                                                        handleUserDataChange("first_name", e.target.value)
                                                    }
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Apellido *</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="lastName"
                                                    placeholder="Tu apellido"
                                                    value={userData.last_name}
                                                    onChange={(e) => 
                                                        handleUserDataChange("last_name", e.target.value)
                                                    }
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Correo Electrónico</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={userData.email}
                                                className="pl-10 bg-muted/50"
                                                disabled
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            El correo electrónico no se puede cambiar
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+52 55 1234 5678"
                                                value={customerData.phone}
                                                onChange={(e) => 
                                                    handleCustomerDataChange("phone", e.target.value)
                                                }
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Dirección</Label>
                                        <Input
                                            id="address"
                                            placeholder="Calle, colonia, ciudad..."
                                            value={customerData.address}
                                            onChange={(e) => 
                                                handleCustomerDataChange("address", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={customerData.date_of_birth}
                                            onChange={(e) => 
                                                handleCustomerDataChange("date_of_birth", e.target.value)
                                            }
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <LoadingSpinner size="sm" className="mr-2" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Guardar Cambios
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Cambiar Contraseña */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="h-5 w-5" />
                                    Cambiar Contraseña
                                </CardTitle>
                                <CardDescription>
                                    Actualiza tu contraseña de acceso
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Mínimo 6 caracteres"
                                                value={passwordData.newPassword}
                                                onChange={(e) => 
                                                    handlePasswordChange("newPassword", e.target.value)
                                                }
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Repite tu nueva contraseña"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => 
                                                handlePasswordChange("confirmPassword", e.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                    >
                                        {changingPassword ? (
                                            <LoadingSpinner size="sm" className="mr-2" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Cambiar Contraseña
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}