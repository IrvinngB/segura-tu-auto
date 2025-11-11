'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, FileText, CheckCircle, Clock, X } from 'lucide-react';
import { useDocumentRequestNotifications } from '@/hooks/use-document-request-notifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface DocumentRequestNotificationProps {
  customerId: string;
}

const DOCUMENT_TYPE_NAMES: Record<string, string> = {
  photos: 'Fotos adicionales del daño',
  police_report: 'Reporte policial',
  repair_estimate: 'Cotización de reparación',
  medical_report: 'Reporte médico',
  witness_statement: 'Declaración de testigos',
  third_party_info: 'Información de terceros',
  other: 'Otros documentos',
};

export function DocumentRequestNotification({ customerId }: DocumentRequestNotificationProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead } =
    useDocumentRequestNotifications(customerId);
  const router = useRouter();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    router.push(`/customer/claims/${notification.claim_id}`);
    setOpen(false);
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <>
      {/* Botón de notificaciones */}
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="relative">
        <Bell className="h-4 w-4 mr-2" />
        Notificaciones
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-2 h-5 w-5 rounded-full text-xs flex items-center justify-center p-0"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Modal de notificaciones */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Solicitudes de Documentos
            </DialogTitle>
            <DialogDescription>
              Revisa las solicitudes de documentos adicionales para tus reclamaciones
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Sin solicitudes pendientes</h3>
                <p className="text-sm text-muted-foreground">
                  No tienes solicitudes de documentos en este momento.
                </p>
              </div>
            ) : (
              <>
                {/* Notificaciones no leídas */}
                {unreadNotifications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Nuevas Solicitudes ({unreadNotifications.length})
                    </h3>
                    <div className="space-y-3">
                      {unreadNotifications.map(notification => (
                        <Card
                          key={notification.id}
                          className="border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4 text-orange-600" />
                                Reclamación {notification.claim_number}
                              </CardTitle>
                              <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                                Nuevo
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              {format(
                                new Date(notification.created_at),
                                "d 'de' MMMM 'a las' HH:mm",
                                {
                                  locale: es,
                                }
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm mb-3">
                              Se han solicitado los siguientes documentos:
                            </p>
                            <div className="space-y-1 mb-3">
                              {notification.requested_documents.map((docType, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                                  {DOCUMENT_TYPE_NAMES[docType] || docType}
                                </div>
                              ))}
                            </div>
                            {notification.notes && (
                              <div className="bg-white p-2 rounded border text-sm">
                                <p className="font-medium">Instrucciones adicionales:</p>
                                <p className="text-muted-foreground mt-1">{notification.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notificaciones leídas */}
                {notifications.filter(n => n.read).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Solicitudes Anteriores
                    </h3>
                    <div className="space-y-2">
                      {notifications
                        .filter(n => n.read)
                        .slice(0, 5)
                        .map(notification => (
                          <Card
                            key={notification.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors opacity-75"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">
                                    Reclamación {notification.claim_number}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(notification.created_at), 'd MMM', {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
