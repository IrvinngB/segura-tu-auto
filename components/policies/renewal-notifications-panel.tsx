"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePolicyRenewalNotifications, useRenewalStats } from "@/hooks/use-policy-renewal-notifications";
import { PolicyRenewal } from "@/components/policies/policy-renewal";
import type { Policy } from "@/lib/types/database";
import { 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Bell, 
  Calendar,
  Shield,
  X,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RenewalNotificationsPanelProps {
  customerId: string;
}

export function RenewalNotificationsPanel({ customerId }: RenewalNotificationsPanelProps) {
  const { notifications, loading, error, markAsRenewed, dismissNotification } = usePolicyRenewalNotifications(customerId);
  const stats = useRenewalStats(customerId);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  const handleRenewalSuccess = (renewedPolicy: Policy) => {
    if (selectedPolicy) {
      markAsRenewed(selectedPolicy.id);
    }
    setShowRenewalModal(false);
    setSelectedPolicy(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expired":
        return <AlertTriangle className="h-4 w-4" />;
      case "expiring":
        return <Clock className="h-4 w-4" />;
      case "renewable":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationMessage = (notification: any) => {
    const policy = notification.policy;
    const vehicleInfo = `${policy.vehicle?.make} ${policy.vehicle?.model} ${policy.vehicle?.year}`;
    
    switch (notification.type) {
      case "expired":
        const daysSinceExpiry = Math.abs(notification.daysUntilExpiry);
        return {
          title: "Póliza Vencida",
          message: `Su póliza para ${vehicleInfo} venció hace ${daysSinceExpiry} días. Renueve ahora para mantener su protección.`,
          variant: "destructive" as const,
          urgency: "high" as const
        };
      case "expiring":
        return {
          title: "Póliza por Vencer",
          message: `Su póliza para ${vehicleInfo} vence en ${notification.daysUntilExpiry} días. Renueve antes del vencimiento.`,
          variant: "default" as const,
          urgency: "medium" as const
        };
      case "renewable":
        return {
          title: "Renovación Disponible",
          message: `Puede renovar anticipadamente su póliza para ${vehicleInfo}. Vence en ${notification.daysUntilExpiry} días.`,
          variant: "secondary" as const,
          urgency: "low" as const
        };
      default:
        return {
          title: "Notificación",
          message: "Información de póliza disponible",
          variant: "outline" as const,
          urgency: "low" as const
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones de Renovación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Verificando notificaciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones de Renovación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              Error al cargar notificaciones: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const sortedNotifications = notifications.sort((a, b) => {
    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    const aUrgency = getNotificationMessage(a).urgency;
    const bUrgency = getNotificationMessage(b).urgency;
    return urgencyOrder[bUrgency] - urgencyOrder[aUrgency];
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones de Renovación
            {notifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Mantenga sus pólizas actualizadas para una protección continua
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.activePolicies}</div>
              <div className="text-sm text-green-700">Activas</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.expiringPolicies}</div>
              <div className="text-sm text-yellow-700">Por vencer</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.expiredPolicies}</div>
              <div className="text-sm text-red-700">Vencidas</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.renewablePolicies}</div>
              <div className="text-sm text-blue-700">Renovables</div>
            </div>
          </div>

          {/* Lista de notificaciones */}
          {sortedNotifications.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                ¡Todo al día!
              </h3>
              <p className="text-muted-foreground">
                No tiene notificaciones de renovación pendientes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedNotifications.map((notification) => {
                const notificationInfo = getNotificationMessage(notification);
                const policy = notification.policy;
                
                return (
                  <Alert 
                    key={notification.id} 
                    className={`relative ${
                      notificationInfo.variant === "destructive" 
                        ? "border-red-200 bg-red-50" 
                        : notificationInfo.variant === "default"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${
                        notificationInfo.variant === "destructive" 
                          ? "text-red-600" 
                          : notificationInfo.variant === "default"
                          ? "text-yellow-600"
                          : "text-blue-600"
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold ${
                            notificationInfo.variant === "destructive" 
                              ? "text-red-800" 
                              : notificationInfo.variant === "default"
                              ? "text-yellow-800"
                              : "text-blue-800"
                          }`}>
                            {notificationInfo.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <AlertDescription className={`mb-3 ${
                          notificationInfo.variant === "destructive" 
                            ? "text-red-700" 
                            : notificationInfo.variant === "default"
                            ? "text-yellow-700"
                            : "text-blue-700"
                        }`}>
                          {notificationInfo.message}
                        </AlertDescription>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {policy.policy_number}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Vence: {format(new Date(policy.end_date), "dd/MM/yyyy", { locale: es })}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setShowRenewalModal(true);
                            }}
                            className={`${
                              notificationInfo.variant === "destructive" 
                                ? "bg-red-600 hover:bg-red-700" 
                                : notificationInfo.variant === "default"
                                ? "bg-yellow-600 hover:bg-yellow-700"
                                : "bg-blue-600 hover:bg-blue-700"
                            } text-white`}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {notification.type === "expired" ? "Renovar Ahora" : "Renovar"}
                          </Button>
                          {notification.type !== "expired" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => dismissNotification(notification.id)}
                            >
                              Recordar después
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Alert>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de renovación */}
      {showRenewalModal && selectedPolicy && (
        <PolicyRenewal
          policy={selectedPolicy}
          onRenewalSuccess={handleRenewalSuccess}
          onClose={() => {
            setShowRenewalModal(false);
            setSelectedPolicy(null);
          }}
        />
      )}
    </>
  );
}