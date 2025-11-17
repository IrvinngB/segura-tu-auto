'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { createClient } from '@/lib/supabase/client';
import { Search, Shield, Calendar, User, Activity, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: any;
  new_values: any;
  changed_by: string;
  changed_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'INSERT':
      return 'bg-green-100 text-green-800';
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTableDisplayName = (tableName: string) => {
  const tableNames: Record<string, string> = {
    policies: 'Pólizas',
    claims: 'Reclamaciones',
    customers: 'Clientes',
    vehicles: 'Vehículos',
    payments: 'Pagos',
    users: 'Usuarios',
    quotes: 'Cotizaciones',
    coverage_types: 'Tipos de Cobertura',
    policy_coverages: 'Coberturas de Póliza',
  };
  return tableNames[tableName] || tableName;
};

const formatJsonDiff = (
  oldValues: any,
  newValues: any
): string | Array<{ field: string; old: any; new: any }> => {
  if (!oldValues && !newValues) return 'Sin cambios';

  const changes: Array<{ field: string; old: any; new: any }> = [];

  if (newValues && typeof newValues === 'object') {
    Object.keys(newValues).forEach(key => {
      const oldVal = oldValues?.[key];
      const newVal = newValues[key];

      if (oldVal !== newVal) {
        changes.push({
          field: key,
          old: oldVal,
          new: newVal,
        });
      }
    });
  }

  return changes;
};

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAuditLogs();
  }, [tableFilter, actionFilter, dateFilter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(
          `
          *,
          user:users(first_name, last_name, email, role)
        `
        )
        .order('changed_at', { ascending: false });

      // Apply filters
      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      // Date filter
      if (dateFilter !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateFilter));
        query = query.gte('changed_at', daysAgo.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error fetching audit logs:', error);
        // Si la tabla no existe o no hay datos, no es un error crítico
        setAuditLogs([]);
      } else {
        setAuditLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Fecha', 'Usuario', 'Tabla', 'Acción', 'ID Registro', 'Cambios'].join(','),
      ...auditLogs.map(log =>
        [
          format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm'),
          `${log.user?.first_name || ''} ${log.user?.last_name || ''}`.trim() || log.changed_by,
          getTableDisplayName(log.table_name),
          log.action,
          log.record_id,
          JSON.stringify(formatJsonDiff(log.old_values, log.new_values)),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      log.table_name.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.record_id.toLowerCase().includes(searchLower) ||
      (log.user?.first_name || '').toLowerCase().includes(searchLower) ||
      (log.user?.last_name || '').toLowerCase().includes(searchLower) ||
      (log.user?.email || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Auditoría del Sistema
            </h1>
            <p className="text-muted-foreground">
              Registro completo de cambios y actividad del sistema
            </p>
          </div>
          <Button onClick={exportAuditLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Usuario, tabla, acción..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tabla</label>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tablas</SelectItem>
                    <SelectItem value="policies">Pólizas</SelectItem>
                    <SelectItem value="claims">Reclamaciones</SelectItem>
                    <SelectItem value="customers">Clientes</SelectItem>
                    <SelectItem value="vehicles">Vehículos</SelectItem>
                    <SelectItem value="payments">Pagos</SelectItem>
                    <SelectItem value="users">Usuarios</SelectItem>
                    <SelectItem value="quotes">Cotizaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Acción</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    <SelectItem value="INSERT">Creación</SelectItem>
                    <SelectItem value="UPDATE">Actualización</SelectItem>
                    <SelectItem value="DELETE">Eliminación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Último día</SelectItem>
                    <SelectItem value="7">Última semana</SelectItem>
                    <SelectItem value="30">Último mes</SelectItem>
                    <SelectItem value="90">Últimos 3 meses</SelectItem>
                    <SelectItem value="all">Todo el tiempo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {auditLogs.length === 0 && !searchTerm && tableFilter === 'all' && actionFilter === 'all'
                      ? 'Sistema de Auditoría Activo'
                      : 'No se encontraron registros'}
                  </h3>
                  <p className="text-muted-foreground">
                    {auditLogs.length === 0 && !searchTerm && tableFilter === 'all' && actionFilter === 'all'
                      ? 'Los cambios en el sistema se registrarán automáticamente aquí. Realiza alguna acción (crear, actualizar o eliminar) para ver los registros.'
                      : 'No hay registros de auditoría que coincidan con los filtros seleccionados.'}
                  </p>
                  {auditLogs.length === 0 && !searchTerm && tableFilter === 'all' && actionFilter === 'all' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left max-w-md mx-auto">
                      <h4 className="font-semibold text-blue-900 mb-2">¿Qué se registra?</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Creación de pólizas, reclamaciones y usuarios</li>
                        <li>• Actualizaciones de datos importantes</li>
                        <li>• Eliminación de registros</li>
                        <li>• Cambios en estados y configuraciones</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredLogs.map(log => (
                <Card key={log.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 rounded-full bg-gray-100">
                          <Activity className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getActionColor(log.action)}>
                              {log.action === 'INSERT'
                                ? 'Creación'
                                : log.action === 'UPDATE'
                                  ? 'Actualización'
                                  : 'Eliminación'}
                            </Badge>
                            <Badge variant="outline">{getTableDisplayName(log.table_name)}</Badge>
                            <span className="text-sm text-muted-foreground">
                              ID: {log.record_id}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user
                                ? `${log.user.first_name} ${log.user.last_name} (${log.user.role})`
                                : log.changed_by}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(log.changed_at), "dd MMM yyyy 'a las' HH:mm", {
                                locale: es,
                              })}
                            </div>
                          </div>

                          {/* Expandible changes section */}
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              className="text-xs"
                            >
                              {expandedLog === log.id ? 'Ocultar cambios' : 'Ver cambios'}
                            </Button>

                            {expandedLog === log.id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                {(() => {
                                  const changes = formatJsonDiff(log.old_values, log.new_values);
                                  if (typeof changes === 'string') {
                                    return (
                                      <p className="text-sm text-muted-foreground">{changes}</p>
                                    );
                                  }

                                  return (
                                    <div className="space-y-2">
                                      {changes.map((change, index) => (
                                        <div key={index} className="text-xs">
                                          <span className="font-medium">{change.field}:</span>
                                          <div className="ml-2">
                                            {change.old !== undefined && (
                                              <div className="text-red-600">
                                                - {JSON.stringify(change.old)}
                                              </div>
                                            )}
                                            {change.new !== undefined && (
                                              <div className="text-green-600">
                                                + {JSON.stringify(change.new)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Estadísticas de Auditoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredLogs.filter(l => l.action === 'INSERT').length}
                </div>
                <p className="text-sm text-muted-foreground">Creaciones</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredLogs.filter(l => l.action === 'UPDATE').length}
                </div>
                <p className="text-sm text-muted-foreground">Actualizaciones</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredLogs.filter(l => l.action === 'DELETE').length}
                </div>
                <p className="text-sm text-muted-foreground">Eliminaciones</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(filteredLogs.map(l => l.changed_by)).size}
                </div>
                <p className="text-sm text-muted-foreground">Usuarios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
