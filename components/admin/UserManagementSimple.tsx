"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    UserPlus, 
    Users, 
    Eye, 
    Edit,
    Phone,
    Mail,
    Calendar,
    Shield
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    country?: string;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "customer", // Por defecto customer
        country: "Costa Rica",
        birthDate: "",
        licenseYear: "",
    });
    const [formLoading, setFormLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const supabase = createClient();
            
            // Obtener usuarios desde la tabla customers
            const { data: customers, error: customersError } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (customersError) {
                throw customersError;
            }

            // Formatear los datos
            const formattedUsers: User[] = (customers || []).map((customer: any) => ({
                id: customer.id,
                email: customer.email,
                role: 'customer',
                created_at: customer.created_at,
                first_name: customer.first_name,
                last_name: customer.last_name,
                phone: customer.phone,
                country: customer.country,
            }));

            setUsers(formattedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los usuarios',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const validatePassword = (password: string) => {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return minLength && hasUpperCase && hasSpecialChar;
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            // Validation
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }

            if (!validatePassword(formData.password)) {
                throw new Error(
                    'La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial'
                );
            }

            if (!formData.firstName || !formData.lastName || !formData.email) {
                throw new Error('Los campos obligatorios no pueden estar vacíos');
            }

            const supabase = createClient();

            // Crear usuario en auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        role: formData.role,
                        country: formData.country,
                    }
                }
            });

            if (authError) throw authError;

            // Crear registro en customers
            if (authData.user) {
                const { error: customerError } = await supabase.from('customers').insert({
                    id: authData.user.id,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone || null,
                    country: formData.country,
                    birth_date: formData.birthDate || null,
                    license_year: formData.licenseYear ? parseInt(formData.licenseYear) : null,
                });

                if (customerError) {
                    throw customerError;
                }
            }

            toast({
                title: 'Usuario creado exitosamente',
                description: `El cliente ${formData.firstName} ${formData.lastName} ha sido registrado`,
            });

            // Reset form and close modal
            setFormData({
                email: "",
                password: "",
                confirmPassword: "",
                firstName: "",
                lastName: "",
                phone: "",
                role: "customer",
                country: "Costa Rica",
                birthDate: "",
                licenseYear: "",
            });
            setShowCreateForm(false);
            fetchUsers();

        } catch (error: any) {
            console.error('Error creating user:', error);
            
            let errorMessage = 'Ocurrió un error al crear el usuario';
            
            if (error.message) {
                if (error.message.includes('User already registered')) {
                    errorMessage = 'Este correo electrónico ya está registrado';
                } else if (error.message.includes('weak password')) {
                    errorMessage = 'La contraseña es demasiado débil';
                } else {
                    errorMessage = error.message;
                }
            }

            toast({
                title: 'Error al crear usuario',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setFormLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        const roleColors = {
            customer: 'bg-green-100 text-green-800',
            agent: 'bg-blue-100 text-blue-800',
            evaluator: 'bg-purple-100 text-purple-800',
        };

        const roleLabels = {
            customer: 'Cliente',
            agent: 'Agente', 
            evaluator: 'Evaluador',
        };

        return (
            <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
                {roleLabels[role as keyof typeof roleLabels] || role}
            </Badge>
        );
    };

    const getRoleStats = () => {
        const stats = users.reduce((acc, user) => {
            const role = user.role || 'customer';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            {
                role: 'customer',
                count: stats.customer || 0,
                label: 'Clientes',
                icon: Users,
                color: 'text-green-600',
            },
        ];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getRoleStats().map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.role}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                        <p className="text-2xl font-bold">{stat.count}</p>
                                    </div>
                                    <Icon className={`h-8 w-8 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Lista de Clientes ({users.length})
                        </CardTitle>
                        <Button 
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            Crear Cliente
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay clientes registrados
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>País</TableHead>
                                    <TableHead>Fecha de Registro</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {user.first_name} {user.last_name}
                                                </p>
                                                {user.phone && (
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {user.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell>
                                            {user.country || 'No especificado'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(user.created_at).toLocaleDateString('es-ES')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal para crear cliente */}
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Crear Nuevo Cliente
                        </DialogTitle>
                        <DialogDescription>
                            Completa el formulario para crear un nuevo cliente del sistema
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre *</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido *</Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">País</Label>
                                <Input
                                    id="country"
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                                <Input
                                    id="birthDate"
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="licenseYear">Año de Obtención de Licencia</Label>
                                <Input
                                    id="licenseYear"
                                    type="number"
                                    min="1950"
                                    max={new Date().getFullYear()}
                                    value={formData.licenseYear}
                                    onChange={(e) => setFormData(prev => ({ ...prev, licenseYear: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    required
                                />
                                <p className="text-xs text-gray-500">
                                    Mínimo 8 caracteres, una mayúscula y un carácter especial
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFormData({
                                        email: "",
                                        password: "",
                                        confirmPassword: "",
                                        firstName: "",
                                        lastName: "",
                                        phone: "",
                                        role: "customer",
                                        country: "Costa Rica",
                                        birthDate: "",
                                        licenseYear: "",
                                    });
                                    setShowCreateForm(false);
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading ? "Creando..." : "Crear Cliente"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserManagement;