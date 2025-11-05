'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

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
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer',
  });

  useEffect(() => {
    if (activeUserTab === 'list') {
      fetchUsers();
    }
  }, [activeUserTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sb-sztuxibgvlwbykaopnqg-auth-token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Token de autenticación no encontrado',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/admin/list-users', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }

      const data = await response.json();
      setUsers(data.users);

      // Calculate stats
      const stats = data.users.reduce(
        (acc: UserStats, user: User) => {
          acc.total++;
          switch (user.role) {
            case 'agent':
              acc.agents++;
              break;
            case 'evaluator':
              acc.evaluators++;
              break;
            case 'customer':
              acc.customers++;
              break;
            case 'admin':
              acc.admins++;
              break;
          }
          return acc;
        },
        { total: 0, agents: 0, evaluators: 0, customers: 0, admins: 0 }
      );

      setUserStats(stats);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = localStorage.getItem('sb-sztuxibgvlwbykaopnqg-auth-token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Token de autenticación no encontrado',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario');
      }

      toast({
        title: 'Usuario creado exitosamente',
        description: `${formData.firstName} ${formData.lastName} ha sido agregado como ${formData.role}`,
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'customer',
      });

      // Refresh users list if it's loaded
      if (activeUserTab === 'list') {
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error al crear usuario',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      agent: 'Agente',
      evaluator: 'Evaluador',
      customer: 'Cliente',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'agent':
        return 'default';
      case 'evaluator':
        return 'secondary';
      case 'customer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Gestiona usuarios, pólizas y configuraciones del sistema
            </p>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Pólizas
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehículos
              </TabsTrigger>
              <TabsTrigger value="claims" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reclamaciones
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            {/* Users Tab Content */}
            <TabsContent value="users" className="space-y-6">
              {/* User Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.total}</div>
                    <p className="text-xs text-muted-foreground">Usuarios registrados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Agentes</CardTitle>
                    <User className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{userStats.agents}</div>
                    <p className="text-xs text-muted-foreground">Personal de ventas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Evaluadores</CardTitle>
                    <Shield className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{userStats.evaluators}</div>
                    <p className="text-xs text-muted-foreground">Evaluadores de riesgo</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                    <Users className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{userStats.customers}</div>
                    <p className="text-xs text-muted-foreground">Base de clientes</p>
                  </CardContent>
                </Card>
              </div>

              {/* User Sub-tabs */}
              <Tabs value={activeUserTab} onValueChange={setActiveUserTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Crear Usuario
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Lista de Usuarios
                  </TabsTrigger>
                </TabsList>

                {/* Create User Tab */}
                <TabsContent value="create" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Crear Nuevo Usuario
                      </CardTitle>
                      <CardDescription>
                        Agrega un nuevo usuario al sistema con el rol correspondiente
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">
                              <User className="inline h-4 w-4 mr-1" />
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
                            <Label htmlFor="lastName">Apellido *</Label>
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
                            <Label htmlFor="email">
                              <Mail className="inline h-4 w-4 mr-1" />
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
                            <Label htmlFor="phone">
                              <Phone className="inline h-4 w-4 mr-1" />
                              Teléfono *
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, phone: e.target.value }))
                              }
                              placeholder="+507 6123 4567"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="role">Tipo de Usuario *</Label>
                            <Select
                              value={formData.role}
                              onValueChange={value =>
                                setFormData(prev => ({ ...prev, role: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Cliente</SelectItem>
                                <SelectItem value="agent">Agente</SelectItem>
                                <SelectItem value="evaluator">Evaluador</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password">
                              <Lock className="inline h-4 w-4 mr-1" />
                              Contraseña *
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, password: e.target.value }))
                              }
                              placeholder="••••••••"
                              required
                              minLength={6}
                            />
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
                                firstName: '',
                                lastName: '',
                                phone: '',
                                role: 'customer',
                              })
                            }
                          >
                            Limpiar
                          </Button>
                          <Button type="submit" disabled={creating}>
                            {creating ? (
                              <>
                                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                                Creando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Crear Usuario
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* List Users Tab */}
                <TabsContent value="list" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Lista de Usuarios
                      </CardTitle>
                      <CardDescription>Gestiona todos los usuarios del sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Fecha de Registro</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {users.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8">
                                    No hay usuarios registrados
                                  </TableCell>
                                </TableRow>
                              ) : (
                                users.map(user => (
                                  <TableRow key={user.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">
                                          {user.first_name} {user.last_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          ID: {user.id.slice(0, 8)}...
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone || 'N/A'}</TableCell>
                                    <TableCell>
                                      <Badge variant={getRoleBadgeVariant(user.role)}>
                                        {getRoleDisplayName(user.role)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Other tabs content placeholders */}
            <TabsContent value="policies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Pólizas</CardTitle>
                  <CardDescription>
                    Administra el estado y vencimiento de las pólizas de seguro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Panel de gestión de pólizas - Próximamente
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vehicles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Vehículos</CardTitle>
                  <CardDescription>
                    Administra la información de vehículos registrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Panel de gestión de vehículos - Próximamente
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Reclamaciones</CardTitle>
                  <CardDescription>
                    Administra y procesa las reclamaciones de seguros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Panel de gestión de reclamaciones - Próximamente
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Sistema</CardTitle>
                  <CardDescription>Ajusta la configuración general del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Panel de configuración - Próximamente
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
