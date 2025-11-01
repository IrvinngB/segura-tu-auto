'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Shield, User, Lock, Mail, Phone } from 'lucide-react';

export default function SimpleUserManagement() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('¡Función de crear usuario funcionando! Datos: ' + JSON.stringify(formData, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agentes</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Evaluadores</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold">150</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="text-lg font-semibold">
            ➕ Crear Nuevo Usuario
          </TabsTrigger>
          <TabsTrigger value="list">📋 Lista de Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="h-6 w-6 text-primary" />
                🎯 Crear Nuevo Usuario del Sistema
              </CardTitle>
              <CardDescription className="text-base">
                ✨ Como administrador, puedes crear usuarios para agentes, evaluadores o clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold">
                      Nombre *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="Juan"
                        value={formData.firstName}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, firstName: e.target.value }))
                        }
                        className="pl-10 border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold">
                      Apellido *
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Pérez"
                      value={formData.lastName}
                      onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="border-2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Correo Electrónico *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@email.com"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10 border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      Teléfono *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+506 8888 8888"
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10 border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold">
                      Tipo de Usuario *
                    </Label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full p-2 border-2 rounded-md"
                      required
                    >
                      <option value="customer">👤 Cliente</option>
                      <option value="agent">🧑‍💼 Agente</option>
                      <option value="evaluator">🔍 Evaluador</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold">
                      Contraseña *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 border-2"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="px-8"
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
                    🧹 Limpiar
                  </Button>
                  <Button type="submit" className="px-8 bg-primary hover:bg-primary/90">
                    ✨ Crear Usuario
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
                📋 Lista de Usuarios del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">👥 Aquí aparecerá la lista de usuarios creados</p>
                <p className="text-sm mt-2">Funcionalidad completa en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
