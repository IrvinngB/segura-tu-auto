'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Shield,
  Users,
  UserPlus,
  Mail,
  Phone,
  User,
  Lock,
  AlertCircle,
  CheckCircle,
  Car,
  Settings,
  FileText,
  TrendingUp,
  BarChart3,
  Edit,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { PolicyExpirationManager } from '@/components/policies/policy-expiration-manager';
import { MessageModal } from '@/components/ui/input-modal';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  created_at: string;
}

interface UserStats {
  total: number;
  agents: number;
  evaluators: number;
  customers: number;
  admins: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [activeUserTab, setActiveUserTab] = useState('create');
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    agents: 0,
    evaluators: 0,
    customers: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; userId: string | null }>({
    show: false,
    userId: null,
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer',
    country: 'Costa Rica',
    birthDate: '',
    licenseYear: '',
  });
  const [successModal, setSuccessModal] = useState({
    show: false,
    title: '',
    message: '',
  });
  const [systemStats, setSystemStats] = useState({
    vehicles: { total: 0, insured: 0, uninsured: 0 },
    claims: { total: 0, pending: 0, approved: 0, rejected: 0 },
    policies: { total: 0, active: 0, expired: 0 },
  });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch users and stats
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Cargando usuarios...');

      const response = await fetch('/api/admin/list-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Respuesta de lista de usuarios:', data);

      if (response.ok) {
        setUsers(data.users || []);
        setUserStats(data.stats || { total: 0, agents: 0, evaluators: 0, customers: 0, admins: 0 });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudieron cargar los usuarios',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeUserTab === 'list') {
      fetchUsers();
    }
  }, [activeUserTab]);

  // Cargar estadísticas al inicio
  useEffect(() => {
    fetchUsers();
    fetchSystemStats();
    fetchVehicles();
    fetchClaims();
    fetchPolicies();
  }, []);

  // Función para validar la contraseña
  const validatePassword = (password: string) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false; // Al menos una mayúscula
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false; // Al menos un carácter especial
    return true;
  };

  // Funciones para validar cada requisito individualmente
  const hasMinLength = (password: string) => password.length >= 8;
  const hasUppercase = (password: string) => /[A-Z]/.test(password);
  const hasSpecialChar = (password: string) =>
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Función para validar email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de email
    if (!validateEmail(formData.email)) {
      toast({
        title: 'Error de validación',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    // Validación de contraseña
    if (!validatePassword(formData.password)) {
      toast({
        title: 'Error de validación',
        description:
          'La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial',
        variant: 'destructive',
      });
      return;
    }

    // Validación de confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error de validación',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    // Validación de campos requeridos
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: 'Error de validación',
        description: 'El nombre y apellido son requeridos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Enviando datos:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        country: formData.country,
        birthDate: formData.birthDate,
        licenseYear: formData.licenseYear,
      });

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      console.log('Respuesta del servidor:', result);

      if (response.ok) {
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'customer',
          country: 'Costa Rica',
          birthDate: '',
          licenseYear: '',
        });

        // Mostrar modal de éxito
        setSuccessModal({
          show: true,
          title: '¡Usuario Creado Exitosamente!',
          message: `El usuario ${formData.firstName} ${formData.lastName} ha sido creado correctamente con el rol de ${
            formData.role === 'customer'
              ? 'Cliente'
              : formData.role === 'agent'
                ? 'Agente'
                : formData.role === 'evaluator'
                  ? 'Evaluador'
                  : 'Administrador'
          }.`,
        });

        // Refresh statistics
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo crear el usuario',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      confirmPassword: '',
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone || '',
      role: user.role,
      country: 'Costa Rica',
      birthDate: '',
      licenseYear: '',
    });
    setActiveUserTab('create');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar usuario');
      }

      toast({
        title: 'Usuario actualizado',
        description: `${formData.firstName} ${formData.lastName} ha sido actualizado exitosamente.`,
      });

      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'customer',
        country: 'Costa Rica',
        birthDate: '',
        licenseYear: '',
      });
      
      fetchUsers();
      setActiveUserTab('list');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm.userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${deleteConfirm.userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar usuario');
      }

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado exitosamente.',
      });

      setDeleteConfirm({ show: false, userId: null });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'customer',
      country: 'Costa Rica',
      birthDate: '',
      licenseYear: '',
    });
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/claims');
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims?.slice(0, 10) || []);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.policies || []);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Panel de Administración</h1>
              <p className="text-muted-foreground">
                Gestiona usuarios, pólizas y configuraciones del sistema xd
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.agents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluadores</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.evaluators}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.customers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Pólizas</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center space-x-2">
              <Car className="h-4 w-4" />
              <span>Vehículos</span>
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Reclamaciones</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Tabs value={activeUserTab} onValueChange={setActiveUserTab}>
              <TabsList>
                <TabsTrigger value="create">Crear Usuario</TabsTrigger>
                <TabsTrigger value="list">Lista de Usuarios</TabsTrigger>
              </TabsList>

              {/* Create User Tab */}
              <TabsContent value="create">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {editingUser ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                        <span>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</span>
                      </div>
                      {editingUser && (
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {editingUser 
                        ? 'Modifica la información del usuario' 
                        : 'Agrega un nuevo usuario al sistema con el rol correspondiente'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={editingUser ? handleUpdateUser : handleSubmit} className="space-y-8">
                      {/* Información Básica */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground border-b pb-2">
                          Información Básica
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="firstName"
                              className="text-sm font-medium text-foreground"
                            >
                              Nombre *
                            </Label>
                            <Input
                              id="firstName"
                              type="text"
                              value={formData.firstName}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, firstName: e.target.value }))
                              }
                              placeholder="Juan"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="lastName"
                              className="text-sm font-medium text-foreground"
                            >
                              Apellido *
                            </Label>
                            <Input
                              id="lastName"
                              type="text"
                              value={formData.lastName}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, lastName: e.target.value }))
                              }
                              placeholder="Pérez"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                              Correo Electrónico *
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, email: e.target.value }))
                              }
                              placeholder="usuario@email.com"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                              Teléfono
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, phone: e.target.value }))
                              }
                              placeholder="+506 8888 8888"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="role" className="text-sm font-medium text-foreground">
                              Tipo de Usuario *
                            </Label>
                            <Select
                              value={formData.role}
                              onValueChange={value =>
                                setFormData(prev => ({ ...prev, role: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Cliente</SelectItem>
                                <SelectItem value="agent">Agente</SelectItem>
                                <SelectItem value="evaluator">Evaluador</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Información Personal Adicional */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground border-b pb-2">
                          Información Personal Adicional
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="country" className="text-sm font-medium">
                              País de Residencia *
                            </Label>
                            <Select
                              value={formData.country}
                              onValueChange={value =>
                                setFormData(prev => ({ ...prev, country: value }))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona un país" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Costa Rica">🇨🇷 Costa Rica</SelectItem>
                                <SelectItem value="Guatemala">🇬🇹 Guatemala</SelectItem>
                                <SelectItem value="El Salvador">🇸🇻 El Salvador</SelectItem>
                                <SelectItem value="Honduras">🇭🇳 Honduras</SelectItem>
                                <SelectItem value="Nicaragua">🇳🇮 Nicaragua</SelectItem>
                                <SelectItem value="Panamá">🇵🇦 Panamá</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="birthDate" className="text-sm font-medium">
                              Fecha de Nacimiento *
                            </Label>
                            <Input
                              id="birthDate"
                              type="date"
                              value={formData.birthDate}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, birthDate: e.target.value }))
                              }
                              className="w-full"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Debe ser mayor de 18 años
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="licenseYear" className="text-sm font-medium">
                              Año que se Obtuvo la Licencia *
                            </Label>
                            <Input
                              id="licenseYear"
                              type="number"
                              min="1950"
                              max={new Date().getFullYear()}
                              value={formData.licenseYear}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, licenseYear: e.target.value }))
                              }
                              placeholder={`Ej: ${new Date().getFullYear() - 10}`}
                              className="w-full"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Entre 1950 y {new Date().getFullYear()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Seguridad y Contraseña */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground border-b pb-2">
                          Seguridad y Contraseña
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="password"
                              className="text-sm font-medium text-foreground"
                            >
                              Contraseña *
                            </Label>
                            <div className="text-xs space-y-1">
                              <div
                                className={`flex items-center gap-2 ${
                                  hasMinLength(formData.password)
                                    ? 'text-green-600'
                                    : 'text-red-600'
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
                                  hasUppercase(formData.password)
                                    ? 'text-green-600'
                                    : 'text-red-600'
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
                                  hasSpecialChar(formData.password)
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    hasSpecialChar(formData.password)
                                      ? 'bg-green-600'
                                      : 'bg-red-600'
                                  }`}
                                ></span>
                                Al menos 1 carácter especial
                              </div>
                            </div>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, password: e.target.value }))
                              }
                              placeholder="••••••••"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="confirmPassword"
                              className="text-sm font-medium text-foreground"
                            >
                              Confirmar Contraseña *
                            </Label>
                            <div className="text-xs space-y-1">
                              <div
                                className={`flex items-center gap-2 ${
                                  formData.confirmPassword &&
                                  formData.password === formData.confirmPassword
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    formData.confirmPassword &&
                                    formData.password === formData.confirmPassword
                                      ? 'bg-green-600'
                                      : 'bg-red-600'
                                  }`}
                                ></span>
                                {formData.confirmPassword
                                  ? formData.password === formData.confirmPassword
                                    ? 'Las contraseñas coinciden'
                                    : 'Las contraseñas no coinciden'
                                  : 'Confirma tu contraseña'}
                              </div>
                            </div>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={formData.confirmPassword}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                              }
                              placeholder="••••••••"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-4">
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
                              role: 'customer',
                              country: 'Costa Rica',
                              birthDate: '',
                              licenseYear: '',
                            })
                          }
                          disabled={loading}
                        >
                          Limpiar
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            loading ||
                            !formData.firstName.trim() ||
                            !formData.lastName.trim() ||
                            (!editingUser && (!formData.email.trim() ||
                            !formData.password.trim() ||
                            !isPasswordValid(formData.password) ||
                            formData.password !== formData.confirmPassword))
                          }
                          className="min-w-[120px]"
                        >
                          {loading 
                            ? (editingUser ? 'Actualizando...' : 'Creando...') 
                            : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Users List Tab */}
              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Lista de Usuarios</span>
                    </CardTitle>
                    <CardDescription>Administra todos los usuarios del sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="text-muted-foreground">Cargando usuarios...</div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Fecha de Registro</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.first_name} {user.last_name}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    user.role === 'admin'
                                      ? 'default'
                                      : user.role === 'agent'
                                        ? 'secondary'
                                        : user.role === 'adjuster'
                                          ? 'outline'
                                          : 'secondary'
                                  }
                                >
                                  {user.role === 'admin'
                                    ? 'Administrador'
                                    : user.role === 'agent'
                                      ? 'Agente'
                                      : user.role === 'adjuster'
                                        ? 'Ajustador'
                                        : 'Cliente'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Activo
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    title="Editar usuario"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirm({ show: true, userId: user.id })}
                                    title="Eliminar usuario"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={user.id === user?.id}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Other Tabs - Placeholder */}
          <TabsContent value="policies">
            <div className="space-y-6">
              {/* Policy Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pólizas</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.policies.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Activas</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.policies.active}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.policies.expired}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Policies Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Pólizas Registradas</span>
                  </CardTitle>
                  <CardDescription>Lista de todas las pólizas en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número de Póliza</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Prima</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No hay pólizas registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        policies.slice(0, 10).map((policy) => (
                          <TableRow key={policy.id}>
                            <TableCell className="font-medium">{policy.policy_number}</TableCell>
                            <TableCell>
                              {policy.customers?.first_name || 'N/A'}{' '}
                              {policy.customers?.last_name || ''}
                            </TableCell>
                            <TableCell>
                              {policy.vehicle?.make} {policy.vehicle?.model} ({policy.vehicle?.year})
                            </TableCell>
                            <TableCell className="capitalize">{policy.policy_type?.replace('_', ' ')}</TableCell>
                            <TableCell>${policy.premium_amount?.toLocaleString()}</TableCell>
                            <TableCell>
                              {policy.status === 'active' && (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Activa
                                </Badge>
                              )}
                              {policy.status === 'expired' && (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Expirada
                                </Badge>
                              )}
                              {policy.status === 'cancelled' && (
                                <Badge variant="outline" className="text-gray-600">
                                  Cancelada
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{new Date(policy.end_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/policies/${policy.id}`}
                              >
                                Ver Detalles
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vehicles">
            <div className="space-y-6">
              {/* Vehicle Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Vehículos</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.vehicles.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Asegurados</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.vehicles.insured}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sin Seguro</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.vehicles.uninsured}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-5 w-5" />
                    <span>Vehículos Registrados</span>
                  </CardTitle>
                  <CardDescription>Lista de todos los vehículos en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Marca/Modelo</TableHead>
                        <TableHead>Año</TableHead>
                        <TableHead>Propietario</TableHead>
                        <TableHead>Estado Seguro</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay vehículos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicles.slice(0, 10).map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                            <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                            <TableCell>{vehicle.year}</TableCell>
                            <TableCell>
                              {vehicle.policies?.[0]?.customers?.first_name || 'N/A'}{' '}
                              {vehicle.policies?.[0]?.customers?.last_name || ''}
                            </TableCell>
                            <TableCell>
                              {vehicle.policies?.length > 0 ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Asegurado
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Sin Seguro
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/vehicles/${vehicle.id}`}
                              >
                                Ver Detalles
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="claims">
            <div className="space-y-6">
              {/* Claims Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reclamaciones</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.claims.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.claims.pending}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.claims.approved}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.claims.rejected}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Claims Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Reclamaciones Recientes</span>
                  </CardTitle>
                  <CardDescription>Administra todas las reclamaciones de seguros</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No hay reclamaciones registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        claims.map((claim) => (
                          <TableRow key={claim.id}>
                            <TableCell className="font-medium">#{claim.claim_number || claim.id.slice(0, 8)}</TableCell>
                            <TableCell>
                              {claim.customer?.first_name || claim.policy?.customers?.first_name || 'N/A'}{' '}
                              {claim.customer?.last_name || claim.policy?.customers?.last_name || ''}
                            </TableCell>
                            <TableCell>{claim.policy?.vehicle?.license_plate || 'N/A'}</TableCell>
                            <TableCell className="capitalize">{claim.claim_type?.replace('_', ' ') || 'N/A'}</TableCell>
                            <TableCell>${claim.estimated_damage_cost?.toLocaleString() || '0'}</TableCell>
                            <TableCell>
                              {claim.status === 'submitted' && (
                                <Badge variant="outline" className="text-gray-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Enviada
                                </Badge>
                              )}
                              {claim.status === 'under_review' && (
                                <Badge variant="outline" className="text-blue-600">
                                  En Revisión
                                </Badge>
                              )}
                              {claim.status === 'investigating' && (
                                <Badge variant="outline" className="text-yellow-600">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Investigando
                                </Badge>
                              )}
                              {claim.status === 'approved' && (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aprobada
                                </Badge>
                              )}
                              {claim.status === 'denied' && (
                                <Badge variant="destructive">
                                  Denegada
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{new Date(claim.incident_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.location.href = `/claims/${claim.id}`}
                                >
                                  Ver
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Success Modal */}
      <MessageModal
        show={successModal.show}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ show: false, title: '', message: '' })}
        type="success"
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Confirmar Eliminación
              </CardTitle>
              <CardDescription>
                Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro de que deseas eliminar este usuario?
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ show: false, userId: null })}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Eliminar Usuario'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
