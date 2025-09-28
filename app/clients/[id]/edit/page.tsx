"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { createBrowserClient } from "@supabase/ssr";
import type { Customer } from "@/lib/types/database";
import {
    ArrowLeft,
    Save,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";

export default function EditClientPage() {
    const params = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        country: "Panamá",
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (params.id) {
            fetchCustomerData();
        }
    }, [params.id]);

    const fetchCustomerData = async () => {
        try {
            const { data: customerData, error } = await supabase
                .from("customers")
                .select(`
                    *,
                    user:users(*)
                `)
                .eq("id", params.id)
                .single();

            if (error) throw error;
            if (customerData) {
                setCustomer(customerData);
                setFormData({
                    first_name: customerData.user?.first_name || "",
                    last_name: customerData.user?.last_name || "",
                    email: customerData.user?.email || "",
                    phone: customerData.user?.phone || "",
                    date_of_birth: customerData.date_of_birth
                        ? format(new Date(customerData.date_of_birth), "yyyy-MM-dd")
                        : "",
                    country: customerData.country || "Panamá",
                });
            }
        } catch (error) {
            console.error("Error fetching customer:", error);
            toast({
                title: "Error",
                description: "No se pudo cargar la información del cliente.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Update user data
            const { error: userError } = await supabase
                .from("users")
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                })
                .eq("id", customer?.user_id);

            if (userError) throw userError;

            // Update customer data
            const { error: customerError } = await supabase
                .from("customers")
                .update({
                    date_of_birth: formData.date_of_birth || null,
                    country: formData.country,
                })
                .eq("id", customer?.id);

            if (customerError) throw customerError;

            toast({
                title: "Cliente actualizado",
                description: "Los datos del cliente se han guardado correctamente.",
                variant: "default",
            });

            router.push(`/clients/${customer?.id}`);
        } catch (error) {
            console.error("Error updating customer:", error);
            toast({
                title: "Error",
                description: "No se pudieron guardar los cambios.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex min-h-screen bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Cliente no encontrado</h2>
                        <Button onClick={() => router.push("/clients")}>
                            Volver a la lista
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <div className="flex-1">
                <div className="max-w-4xl mx-auto p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/clients/${customer.id}`)}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    Editar Cliente
                                </h1>
                                <p className="text-muted-foreground">
                                    Modificar la información del cliente
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Información del Cliente
                            </CardTitle>
                            <CardDescription>
                                Actualiza los datos personales del cliente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* First Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">Nombre</Label>
                                        <Input
                                            id="first_name"
                                            value={formData.first_name}
                                            onChange={(e) => handleInputChange("first_name", e.target.value)}
                                            placeholder="Ingrese el nombre"
                                            required
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Apellido</Label>
                                        <Input
                                            id="last_name"
                                            value={formData.last_name}
                                            onChange={(e) => handleInputChange("last_name", e.target.value)}
                                            placeholder="Ingrese el apellido"
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Correo Electrónico</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange("email", e.target.value)}
                                                placeholder="cliente@ejemplo.com"
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                                placeholder="+507 6000-0000"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="space-y-2">
                                        <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="date_of_birth"
                                                type="date"
                                                value={formData.date_of_birth}
                                                onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Country */}
                                    <div className="space-y-2">
                                        <Label htmlFor="country">País</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="country"
                                                value={formData.country}
                                                onChange={(e) => handleInputChange("country", e.target.value)}
                                                placeholder="País de residencia"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4 pt-6">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {saving ? "Guardando..." : "Guardar Cambios"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push(`/clients/${customer.id}`)}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
