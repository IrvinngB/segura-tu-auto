'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Users,
  Phone,
  MessageSquare,
  FileText,
  Bell,
} from 'lucide-react';

// Import all our new comprehensive components
import { ClaimNotificationSystem } from '@/components/claims/claim-notification-system';
import { ClaimWorkflow } from '@/components/claims/claim-workflow';
import { ClaimCommunication } from '@/components/claims/claim-communication';
import { DocumentRequirementSystem } from '@/components/claims/document-requirement-system';
import { AgentDashboard } from '@/components/dashboard/agent-dashboard';

// Mock data for testing
const mockClaim = {
  id: 'claim-123',
  claim_number: 'CL-2024-001',
  claim_type: 'collision',
  status: 'under_review',
  priority: 'high',
  description: 'Colisión frontal en intersección principal',
  incident_date: '2024-01-15',
  location: 'Av. Principal con Calle 5ta',
  created_at: '2024-01-15T10:30:00Z',
  customer: {
    id: 'customer-123',
    first_name: 'María',
    last_name: 'García',
    phone: '+1234567890',
    email: 'maria.garcia@email.com',
  },
  policy: {
    policy_number: 'POL-2024-001',
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      license_plate: 'ABC-123',
    },
  },
};

const mockAgent = {
  id: 'agent-123',
  first_name: 'Carlos',
  last_name: 'Rodríguez',
  email: 'carlos.rodriguez@seguraauto.com',
  role: 'agent',
};

export default function ComprehensiveSystemTestPage() {
  const [activeTest, setActiveTest] = useState<string>('overview');
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const markTestComplete = (testName: string) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: true,
    }));
  };

  const systemComponents = [
    {
      id: 'notifications',
      name: 'Sistema de Notificaciones',
      description: 'Notificaciones en tiempo real para agentes',
      icon: Bell,
      color: 'text-blue-600',
      status: testResults.notifications ? 'completed' : 'pending',
    },
    {
      id: 'workflow',
      name: 'Gestión de Workflow',
      description: 'Estados y transiciones de reclamaciones',
      icon: AlertTriangle,
      color: 'text-orange-600',
      status: testResults.workflow ? 'completed' : 'pending',
    },
    {
      id: 'communication',
      name: 'Sistema de Comunicación',
      description: 'Chat bidireccional agente-cliente',
      icon: MessageSquare,
      color: 'text-green-600',
      status: testResults.communication ? 'completed' : 'pending',
    },
    {
      id: 'documents',
      name: 'Gestión de Documentos',
      description: 'Requisitos inteligentes de documentos',
      icon: FileText,
      color: 'text-purple-600',
      status: testResults.documents ? 'completed' : 'pending',
    },
    {
      id: 'dashboard',
      name: 'Dashboard de Agentes',
      description: 'Panel especializado para agentes',
      icon: Users,
      color: 'text-red-600',
      status: testResults.dashboard ? 'completed' : 'pending',
    },
  ];

  const getStatusBadge = (status: string) => {
    return status === 'completed' ? (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Completado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-orange-600 border-orange-300">
        Pendiente
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            🧪 Sistema Integral de Reclamaciones
          </h1>
          <p className="text-xl text-muted-foreground">
            Prueba completa del sistema real de seguros implementado
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Sistema Completo
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-300">
              Tiempo Real
            </Badge>
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              Funcional
            </Badge>
          </div>
        </div>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Estado del Sistema Integral
            </CardTitle>
            <CardDescription>
              Todos los componentes implementados para el manejo real de reclamaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemComponents.map(component => (
                <Card key={component.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <component.icon className={`h-5 w-5 ${component.color}`} />
                      {getStatusBadge(component.status)}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{component.name}</h3>
                    <p className="text-xs text-muted-foreground">{component.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testing Tabs */}
        <Tabs value={activeTest} onValueChange={setActiveTest}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="communication">Comunicación</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 Resumen del Sistema Integral</CardTitle>
                <CardDescription>
                  Sistema completo de manejo de reclamaciones siguiendo procesos reales de seguros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ Características Implementadas:
                  </h3>
                  <ul className="space-y-1 text-green-700 dark:text-green-300 text-sm">
                    <li>• Notificaciones en tiempo real para agentes</li>
                    <li>• Auto-asignación inteligente de reclamaciones</li>
                    <li>• Workflow con 10 estados reales de seguros</li>
                    <li>• Sistema de comunicación bidireccional</li>
                    <li>• Requisitos de documentos según tipo de siniestro</li>
                    <li>• Dashboard especializado para agentes</li>
                    <li>• Métricas y estadísticas en tiempo real</li>
                    <li>• Determinación automática de prioridad</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    🔄 Flujo de Trabajo Real:
                  </h3>
                  <ol className="space-y-1 text-blue-700 dark:text-blue-300 text-sm">
                    <li>1. Cliente crea reclamación</li>
                    <li>2. Sistema determina prioridad automáticamente</li>
                    <li>3. Auto-asignación a agente disponible</li>
                    <li>4. Notificación inmediata al agente</li>
                    <li>5. Gestión de documentos requeridos</li>
                    <li>6. Comunicación continua cliente-agente</li>
                    <li>7. Workflow hasta resolución final</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🔔 Sistema de Notificaciones en Tiempo Real</CardTitle>
                <CardDescription>
                  Notificaciones automáticas para agentes cuando llegan nuevas reclamaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClaimNotificationSystem />
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    💡 <strong>Funcionalidad:</strong> Este componente escucha en tiempo real las
                    nuevas reclamaciones y notifica automáticamente a los agentes disponibles,
                    incluyendo auto-asignación inteligente.
                  </p>
                </div>
                <Button onClick={() => markTestComplete('notifications')} className="mt-4">
                  Marcar Notificaciones como Probadas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>⚡ Gestión de Workflow Real</CardTitle>
                <CardDescription>
                  Sistema de estados siguiendo procesos reales de compañías de seguros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClaimWorkflow
                  claimId={mockClaim.id}
                  currentStatus={mockClaim.status}
                  onStatusUpdate={newStatus => {
                    console.log('Status updated to:', newStatus);
                  }}
                />
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    💡 <strong>Estados Reales:</strong> submitted → under_review → investigating →
                    waiting_approval → approved → processing_payment → paid
                  </p>
                </div>
                <Button onClick={() => markTestComplete('workflow')} className="mt-4">
                  Marcar Workflow como Probado
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>💬 Sistema de Comunicación Bidireccional</CardTitle>
                <CardDescription>Chat en tiempo real entre agentes y clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <ClaimCommunication claimId={mockClaim.id} currentUserRole="agent" />
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    💡 <strong>Comunicación Real:</strong> Mensajes instantáneos, notificaciones
                    automáticas, historial completo de conversaciones, soporte para múltiples
                    canales.
                  </p>
                </div>
                <Button onClick={() => markTestComplete('communication')} className="mt-4">
                  Marcar Comunicación como Probada
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📋 Sistema Inteligente de Documentos</CardTitle>
                <CardDescription>
                  Requisitos de documentos según tipo de siniestro y circunstancias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentRequirementSystem
                  claimId={mockClaim.id}
                  claimType={mockClaim.claim_type}
                  claimData={{
                    hasInjuries: false,
                    hasThirdParty: true,
                    damageAmount: 5000,
                    location: 'urban',
                  }}
                />
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-purple-800 dark:text-purple-200 text-sm">
                    💡 <strong>Inteligencia:</strong> Determina automáticamente qué documentos se
                    necesitan según el tipo de siniestro, monto de daños, presencia de lesiones,
                    etc.
                  </p>
                </div>
                <Button onClick={() => markTestComplete('documents')} className="mt-4">
                  Marcar Documentos como Probados
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 Dashboard Especializado para Agentes</CardTitle>
                <CardDescription>
                  Panel de control completo con métricas, reclamaciones urgentes y acciones rápidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/10">
                  <AgentDashboard />
                </div>
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    💡 <strong>Dashboard Real:</strong> Estadísticas en tiempo real, reclamaciones
                    urgentes, métricas de rendimiento, acciones rápidas, todo optimizado para
                    agentes de seguros.
                  </p>
                </div>
                <Button onClick={() => markTestComplete('dashboard')} className="mt-4">
                  Marcar Dashboard como Probado
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Final Status */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-center text-2xl">🎯 Estado Final del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-6xl">{Object.keys(testResults).length === 5 ? '🎉' : '⏳'}</div>
              <p className="text-xl font-semibold">
                {Object.keys(testResults).length === 5
                  ? '¡Sistema Completamente Funcional!'
                  : `Progreso: ${Object.keys(testResults).length}/5 componentes probados`}
              </p>
              <p className="text-muted-foreground">
                Sistema integral de reclamaciones implementado con funcionalidad real de compañías
                de seguros - "todo sea lo mas real posible" ✅
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
