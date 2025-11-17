'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Shield, FileText } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ProtectedRoute } from '@/components/auth/protected-route';

interface ReportData {
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  pendingClaims: number;
  totalRevenue: number;
  monthlyRevenue: number;
  customerGrowth: number;
  claimRatio: number;
}

interface ChartData {
  name: string;
  value: number;
  fill?: string;
  [key: string]: any; // Index signature for compatibility with Recharts
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalPolicies: 0,
    activePolicies: 0,
    totalClaims: 0,
    pendingClaims: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    customerGrowth: 0,
    claimRatio: 0,
  });
  const [policyTypeData, setPolicyTypeData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const supabase = createClient();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      // Fetch basic metrics
      const [{ data: policies }, { data: claims }, { data: payments }, { data: customers }] =
        await Promise.all([
          supabase.from('policies').select('id, status, policy_type, created_at, premium_amount'),
          supabase.from('claims').select('id, status, created_at'),
          supabase
            .from('payments')
            .select('amount, created_at, status')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString()),
          supabase
            .from('customers')
            .select('id, created_at')
            .gte('created_at', startDate.toISOString()),
        ]);

      // Calculate metrics
      const totalPolicies = policies?.length || 0;
      const activePolicies = policies?.filter(p => p.status === 'active').length || 0;
      const totalClaims = claims?.length || 0;
      const pendingClaims =
        claims?.filter(c => c.status === 'submitted' || c.status === 'under_review').length || 0;
      const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

      // Monthly revenue
      const currentMonth = startOfMonth(new Date());
      const monthlyPayments = payments?.filter(p => new Date(p.created_at) >= currentMonth) || [];
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // Customer growth
      const customerGrowth = customers?.length || 0;

      // Claim ratio
      const claimRatio = totalPolicies > 0 ? (totalClaims / totalPolicies) * 100 : 0;

      setReportData({
        totalPolicies,
        activePolicies,
        totalClaims,
        pendingClaims,
        totalRevenue,
        monthlyRevenue,
        customerGrowth,
        claimRatio,
      });

      // Policy type distribution
      const policyTypes =
        policies?.reduce((acc: Record<string, number>, policy) => {
          acc[policy.policy_type] = (acc[policy.policy_type] || 0) + 1;
          return acc;
        }, {}) || {};

      const policyTypeChartData = Object.entries(policyTypes).map(([name, value], index) => ({
        name,
        value,
        fill: COLORS[index % COLORS.length],
      }));

      setPolicyTypeData(policyTypeChartData);

      // Monthly revenue trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subDays(new Date(), i * 30));
        const monthEnd = endOfMonth(monthStart);
        const monthPayments =
          payments?.filter(p => {
            const paymentDate = new Date(p.created_at);
            return paymentDate >= monthStart && paymentDate <= monthEnd;
          }) || [];
        const monthRevenue = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

        monthlyTrend.push({
          name: format(monthStart, 'MMM', { locale: es }),
          value: monthRevenue,
        });
      }

      setMonthlyData(monthlyTrend);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportContent = {
      date: format(new Date(), 'dd/MM/yyyy'),
      dateRange: `${dateRange} días`,
      metrics: reportData,
      policyTypes: policyTypeData,
      monthlyTrend: monthlyData,
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-seguros-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Reportes y Analytics
          </h1>
          <p className="text-muted-foreground">Análisis completo del rendimiento del negocio</p>
        </div>
        <div className="flex gap-4 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pólizas Totales</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalPolicies}</div>
                <p className="text-xs text-green-600">{reportData.activePolicies} activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reclamaciones</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalClaims}</div>
                <p className="text-xs text-yellow-600">{reportData.pendingClaims} pendientes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${reportData.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-green-600">
                  ${reportData.monthlyRevenue.toLocaleString()} este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Nuevos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.customerGrowth}</div>
                <p className="text-xs text-blue-600">
                  Ratio de reclamos: {reportData.claimRatio.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Policy Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo de Póliza</CardTitle>
                <CardDescription>Distribución de pólizas por tipo de cobertura</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={policyTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {policyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ingresos Mensuales</CardTitle>
                <CardDescription>Evolución de los ingresos en los últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={value => [`$${value?.toLocaleString()}`, 'Ingresos']} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis Detallado</CardTitle>
              <CardDescription>Métricas adicionales del negocio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {((reportData.activePolicies / reportData.totalPolicies) * 100 || 0).toFixed(1)}
                    %
                  </div>
                  <p className="text-sm text-muted-foreground">Tasa de Pólizas Activas</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    ${(reportData.totalRevenue / reportData.totalPolicies || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Ingreso Promedio por Póliza</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {reportData.claimRatio.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Ratio de Reclamaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
