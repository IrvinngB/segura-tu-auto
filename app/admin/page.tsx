'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Users, UserPlus, Mail, Phone, User, Lock, AlertCircle, CheckCircle, Car, Settings, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { PolicyExpirationManager } from '@/components/policies/policy-expiration-manager';

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
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, agents: 0, evaluators: 0, customers: 0, admins: 0 });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch users and stats
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/list-users', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setUserStats(data.stats);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error de validación",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
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

      if (response.ok) {
        toast({
          title: "¡Éxito!",
          description: "Usuario creado correctamente",
        });
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'customer',
        });
        // Refresh users list if we're on that tab
        if (activeUserTab === 'list') {
          fetchUsers();
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                Gestiona usuarios, pólizas y configuraciones del sistema
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
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
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
                    <CardTitle className="flex items-center space-x-2">
                      <UserPlus className="h-5 w-5" />
                      <span>Crear Nuevo Usuario</span>
                    </CardTitle>
                    <CardDescription>
                      Agrega un nuevo usuario al sistema con el rol correspondiente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Nombre *</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
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
                            onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Pérez"
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
                            placeholder="usuario@email.com"
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
                            placeholder="+506 8888 8888"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="role">Tipo de Usuario *</Label>
                          <Select value={formData.role} onValueChange={value => setFormData(prev => ({ ...prev, role: value }))}>
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

                        <div className="space-y-2">
                          <Label htmlFor="password">Contraseña *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="••••••••"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="••••••••"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-4">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({
                            email: '',
                            password: '',
                            confirmPassword: '',
                            firstName: '',
                            lastName: '',
                            phone: '',
                            role: 'customer',
                          })}
                          disabled={loading}
                        >
                          Limpiar
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? 'Creando...' : 'Crear Usuario'}
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
                    <CardDescription>
                      Administra todos los usuarios del sistema
                    </CardDescription>
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.first_name} {user.last_name}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  user.role === 'admin' ? 'default' :
                                  user.role === 'agent' ? 'secondary' :
                                  user.role === 'evaluator' ? 'outline' : 
                                  'secondary'
                                }>
                                  {user.role === 'admin' ? 'Administrador' :
                                   user.role === 'agent' ? 'Agente' :
                                   user.role === 'evaluator' ? 'Evaluador' : 'Cliente'}
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
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Pólizas</CardTitle>
                <CardDescription>Administra las pólizas de seguro</CardDescription>
              </CardHeader>
              <CardContent>
                <PolicyExpirationManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Vehículos</CardTitle>
                <CardDescription>Administra los vehículos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Funcionalidad de vehículos próximamente...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Reclamaciones</CardTitle>
                <CardDescription>Administra las reclamaciones de seguros</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Funcionalidad de reclamaciones próximamente...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
                <CardDescription>Ajustes generales de la aplicación</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Configuraciones próximamente...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
