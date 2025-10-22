'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Users, Eye, Edit, Trash2, Phone, Mail, Calendar, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  raw_user_meta_data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
    country: 'Costa Rica',
    birthDate: '',
    licenseYear: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const {
        data: { users },
        error,
      } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (error) throw error;

      // Filtrar usuarios para excluir administradores
      const filteredUsers = (users || []).filter(user => {
        const userRole = user.raw_user_meta_data?.role || 'customer';
        return userRole !== 'admin';
      });

      setUsers(filteredUsers);
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

      if (!formData.role) {
        throw new Error('Debes seleccionar un rol');
      }

      // Validar que no se intente crear un administrador
      if (formData.role === 'admin') {
        throw new Error('No tienes permisos para crear usuarios administradores');
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        user_metadata: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          country: formData.country,
          birthDate: formData.birthDate,
          licenseYear: formData.licenseYear,
        },
      });

      if (authError) throw authError;

      // If role is customer, also create customer record
      if (formData.role === 'customer' && authData.user) {
        const { error: customerError } = await supabase.from('customers').insert({
          id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          birth_date: formData.birthDate || null,
          license_year: formData.licenseYear ? parseInt(formData.licenseYear) : null,
        });

        if (customerError) {
          console.error('Error creating customer record:', customerError);
          // Note: Don't throw here as the user was created successfully
        }
      }

      toast({
        title: 'Usuario creado exitosamente',
        description: `El usuario ${formData.email} ha sido creado con rol ${formData.role}`,
      });

      // Reset form and refresh users
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: '',
        country: 'Costa Rica',
        birthDate: '',
        licenseYear: '',
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
      admin: 'bg-red-100 text-red-800',
      agent: 'bg-blue-100 text-blue-800',
      evaluator: 'bg-purple-100 text-purple-800',
      customer: 'bg-green-100 text-green-800',
    };

    const roleLabels = {
      admin: 'Administrador',
      agent: 'Agente',
      evaluator: 'Evaluador',
      customer: 'Cliente',
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
        {roleLabels[role as keyof typeof roleLabels] || role}
      </Badge>
    );
  };

  const getRoleStats = () => {
    const stats = users.reduce(
      (acc, user) => {
        const role = user.raw_user_meta_data?.role || user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return [
      {
        role: 'agent',
        count: stats.agent || 0,
        label: 'Agentes',
        icon: Users,
        color: 'text-blue-600',
      },
      {
        role: 'evaluator',
        count: stats.evaluator || 0,
        label: 'Evaluadores',
        icon: Shield,
        color: 'text-purple-600',
      },
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
        {getRoleStats().map(stat => {
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

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Usuarios</TabsTrigger>
          <TabsTrigger value="create">Crear Usuario</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios del Sistema ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.raw_user_meta_data?.firstName} {user.raw_user_meta_data?.lastName}
                          </p>
                          {user.raw_user_meta_data?.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.raw_user_meta_data.phone}
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
                        {getRoleBadge(user.raw_user_meta_data?.role || 'customer')}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crear Nuevo Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rol *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={value => setFormData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Cliente</SelectItem>
                        <SelectItem value="agent">Agente</SelectItem>
                        <SelectItem value="evaluator">Evaluador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      type="text"
                      value={formData.country}
                      onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>

                  {formData.role === 'customer' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, birthDate: e.target.value }))
                          }
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
                          onChange={e =>
                            setFormData(prev => ({ ...prev, licenseYear: e.target.value }))
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                      onChange={e =>
                        setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        email: '',
                        password: '',
                        confirmPassword: '',
                        firstName: '',
                        lastName: '',
                        phone: '',
                        role: '',
                        country: 'Costa Rica',
                        birthDate: '',
                        licenseYear: '',
                      })
                    }
                  >
                    Limpiar
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
