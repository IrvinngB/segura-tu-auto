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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Users, Eye, Edit, Trash2, Phone, Mail, Calendar, Shield, User, Lock, EyeOff, Home, Car } from 'lucide-react';
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
  email?: string;
  created_at: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: string;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Obtener token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('/api/admin/list-users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar usuarios');
      }

      setUsers(result.users || []);
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
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    return minLength && hasUpperCase && hasSpecialChar;
  };

  // Funciones para validar cada requisito individualmente
  const hasMinLength = (password: string) => password.length >= 8;
  const hasUppercase = (password: string) => /[A-Z]/.test(password);
  const hasSpecialChar = (password: string) =>
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Función para verificar si todos los campos requeridos están completos
  const isFormValid = () => {
    const basicFieldsComplete =
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.confirmPassword.trim() !== '' &&
      formData.role.trim() !== '' &&
      formData.password === formData.confirmPassword &&
      validatePassword(formData.password);

    // Si es customer, verificar campos adicionales requeridos
    if (formData.role === 'customer') {
      const customerFieldsComplete =
        formData.country.trim() !== '' &&
        formData.birthDate.trim() !== '' &&
        formData.licenseYear.trim() !== '';

      return basicFieldsComplete && customerFieldsComplete;
    }

    return basicFieldsComplete;
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

      // Obtener token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      // Crear usuario a través de API
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          country: formData.country,
          birthDate: formData.birthDate,
          licenseYear: formData.licenseYear,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario');
      }

      console.log('Usuario creado exitosamente:', result.user);

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
      fetchUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);

      let errorMessage = 'Ocurrió un error al crear el usuario';

      if (error.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'Este correo electrónico ya está registrado';
        } else if (error.message.includes('weak password')) {
          errorMessage = 'La contraseña es demasiado débil';
        } else if (error.message.includes('duplicate key value violates unique constraint')) {
          errorMessage = 'Este correo electrónico ya está registrado';
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
        const role = user.user_metadata?.role || 'customer';
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

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Crear Usuario</TabsTrigger>
          <TabsTrigger value="list">Lista de Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crear Nuevo Usuario
              </CardTitle>
              <CardDescription>
                Crea usuarios para agentes, evaluadores o clientes del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-6">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="Juan"
                          value={formData.firstName}
                          onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido *</Label>
                      <Input
                        id="lastName"
                        placeholder="Pérez"
                        value={formData.lastName}
                        onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="usuario@email.com"
                          value={formData.email}
                          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+506 8888 8888"
                          value={formData.phone}
                          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Tipo de Usuario *</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.role}
                          onValueChange={value => setFormData(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">👤 Cliente - Usuarios finales que compran seguros</SelectItem>
                            <SelectItem value="agent">🧑‍💼 Agente - Gestiona pólizas y clientes</SelectItem>
                            <SelectItem value="evaluator">🔍 Evaluador/Adjuster - Procesa reclamaciones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          value={formData.country}
                          onValueChange={value => setFormData(prev => ({ ...prev, country: value }))}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Selecciona el país" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                            <SelectItem value="Guatemala">Guatemala</SelectItem>
                            <SelectItem value="Honduras">Honduras</SelectItem>
                            <SelectItem value="El Salvador">El Salvador</SelectItem>
                            <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                            <SelectItem value="Panamá">Panamá</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información Adicional para Clientes */}
                {formData.role === 'customer' && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Información del Conductor
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Esta información es necesaria para clientes que cotizarán seguros
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={e =>
                              setFormData(prev => ({ ...prev, birthDate: e.target.value }))
                            }
                            className="pl-10"
                            max={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="licenseYear">Año que Obtuvo la Licencia *</Label>
                        <Input
                          id="licenseYear"
                          type="number"
                          placeholder="2010"
                          value={formData.licenseYear}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, licenseYear: e.target.value }))
                          }
                          min="1970"
                          max={new Date().getFullYear()}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Credenciales */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Credenciales de Acceso
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <div className="text-xs space-y-1 mb-2">
                      <div
                        className={`flex items-center gap-2 ${
                          hasMinLength(formData.password) ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasMinLength(formData.password) ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        ></span>
                        Mínimo 8 caracteres
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          hasUppercase(formData.password) ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasUppercase(formData.password) ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        ></span>
                        Al menos 1 mayúscula
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          hasSpecialChar(formData.password) ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasSpecialChar(formData.password) ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        ></span>
                        Al menos 1 carácter especial
                      </div>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                      <p className="text-xs text-red-600">Las contraseñas no coinciden</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
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
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                  >
                    Limpiar
                  </Button>
                  <Button type="submit" disabled={formLoading || !isFormValid()}>
                    {formLoading ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

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
                            {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                          </p>
                          {user.user_metadata?.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.user_metadata.phone}
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
                        {getRoleBadge(user.user_metadata?.role || 'customer')}
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
      </Tabs>
    </div>
  );
};

export default UserManagement;
