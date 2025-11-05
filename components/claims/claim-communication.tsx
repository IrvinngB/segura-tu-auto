'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import {
  MessageCircle,
  Send,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  Bot,
  Paperclip,
  FileText,
  Image,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface Communication {
  id: string;
  communication_type: string;
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  status: string;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  agent?: {
    first_name: string;
    last_name: string;
  };
}

interface ClaimCommunicationProps {
  claimId: string;
  customerId?: string;
  claimNumber?: string;
  currentUserRole?: string;
}

export function ClaimCommunication({
  claimId,
  customerId,
  claimNumber,
  currentUserRole,
}: ClaimCommunicationProps) {
  const { userProfile } = useAuth();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'chat'>('chat');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadCommunications();

    // Suscripción en tiempo real para nuevos mensajes
    const channel = supabase
      .channel(`claim-communications-${claimId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications',
          filter: `claim_id=eq.${claimId}`,
        },
        payload => {
          console.log('📨 Nueva comunicación:', payload);
          loadCommunications(); // Recargar todas las comunicaciones
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [claimId]);

  const loadCommunications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communications')
        .select(
          `
          id,
          communication_type,
          direction,
          subject,
          content,
          status,
          created_at,
          attachment_url,
          attachment_name,
          attachment_type,
          agent:agent_id(first_name, last_name)
        `
        )
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCommunications((data as any) || []);
    } catch (error) {
      console.error('Error loading communications:', error);
      toast.error('Error al cargar las comunicaciones');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      // Crear un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${claimId}/${Date.now()}.${fileExt}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('claim-attachments')
        .upload(fileName, file);

      if (error) throw error;

      // Obtener URL pública del archivo
      const {
        data: { publicUrl },
      } = supabase.storage.from('claim-attachments').getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    setSending(true);

    try {
      let attachmentUrl = null;

      // Subir archivo si existe
      if (selectedFile) {
        attachmentUrl = await uploadFile(selectedFile);
        if (!attachmentUrl) {
          throw new Error('Error al subir el archivo');
        }
      }

      // Determinar la dirección del mensaje
      const direction = currentUserRole === 'customer' ? 'inbound' : 'outbound';
      const senderId = currentUserRole === 'customer' ? customerId : userProfile?.id;

      // Crear la comunicación en la base de datos
      const communicationData: any = {
        claim_id: claimId,
        communication_type: messageType,
        direction,
        subject: `${direction === 'inbound' ? 'Mensaje del cliente' : 'Respuesta del agente'} - ${claimNumber || claimId}`,
        content: newMessage || (selectedFile ? `Archivo adjunto: ${selectedFile.name}` : ''),
        status: 'sent',
        attachment_url: attachmentUrl,
        attachment_name: selectedFile?.name,
        attachment_type: selectedFile?.type,
      };

      // Asignar el ID correcto según el rol
      if (currentUserRole === 'customer') {
        communicationData.customer_id = customerId;
      } else {
        communicationData.agent_id = userProfile?.id;
      }

      const { error } = await supabase.from('communications').insert(communicationData);

      if (error) throw error;

      // Simular envío real según el tipo de comunicación
      await simulateMessageDelivery(messageType, newMessage, selectedFile);

      // Limpiar formulario
      setNewMessage('');
      setSelectedFile(null);

      toast.success(selectedFile ? 'Archivo enviado exitosamente' : 'Mensaje enviado exitosamente');

      // Recargar comunicaciones
      loadCommunications();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const simulateMessageDelivery = async (type: string, content: string, file?: File | null) => {
    // En un sistema real, aquí se integraría con servicios como:
    // - SendGrid/Amazon SES para emails
    // - Twilio para SMS
    // - Slack/Teams para chat interno

    console.log(`📤 Simulando envío de ${type}:`, content);
    if (file) {
      console.log(`📎 Con archivo adjunto: ${file.name}`);
    }

    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000));

    // En desarrollo, podemos crear una respuesta automática del cliente
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        await supabase.from('communications').insert({
          customer_id: customerId,
          agent_id: null,
          claim_id: claimId,
          communication_type: type,
          direction: 'inbound',
          subject: `Re: Actualización de reclamación ${claimNumber || claimId}`,
          content: file
            ? `Gracias por el archivo ${file.name}. Lo hemos recibido correctamente.`
            : `Gracias por la actualización. He recibido su mensaje: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          status: 'received',
        });
      }, 3000);
    }
  };

  const getMessageIcon = (type: string, direction: string) => {
    if (type === 'system') return Bot;
    if (direction === 'inbound') return User;

    switch (type) {
      case 'email':
        return Mail;
      case 'sms':
        return MessageSquare;
      case 'phone':
        return Phone;
      case 'chat':
        return MessageCircle;
      default:
        return MessageCircle;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'received':
        return CheckCircle;
      case 'failed':
        return Clock;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'received':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const canSendMessages =
    userProfile?.role && ['admin', 'agent', 'adjuster', 'customer'].includes(userProfile.role);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos PNG, JPG, JPEG y PDF');
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 10MB');
        return;
      }

      setSelectedFile(file);
      toast.success(`Archivo ${file.name} seleccionado`);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return FileText;

    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comunicaciones con el Cliente
          <InfoTooltip content="Aquí puedes ver todo el historial de comunicaciones con tu agente o ajustador. Los mensajes se actualizan en tiempo real. Puedes enviar fotos, documentos y mensajes de texto para dar seguimiento a tu reclamación." />
        </CardTitle>
        <CardDescription>
          Historial de comunicaciones y mensajes relacionados con esta reclamación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Historial de comunicaciones */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Cargando comunicaciones...</p>
            </div>
          ) : communications.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay comunicaciones registradas</p>
            </div>
          ) : (
            communications.map(comm => {
              const MessageIcon = getMessageIcon(comm.communication_type, comm.direction);
              const StatusIcon = getStatusIcon(comm.status);

              return (
                <div
                  key={comm.id}
                  className={`p-4 rounded-lg border ${
                    comm.direction === 'outbound'
                      ? 'bg-blue-50 border-blue-200 ml-8'
                      : comm.communication_type === 'system'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200 mr-8'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageIcon className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comm.direction === 'outbound'
                            ? `${comm.agent?.first_name || ''} ${comm.agent?.last_name || ''}`.trim() ||
                              'Agente'
                            : comm.communication_type === 'system'
                              ? 'Sistema'
                              : 'Cliente'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {comm.communication_type === 'email'
                            ? 'Email'
                            : comm.communication_type === 'sms'
                              ? 'SMS'
                              : comm.communication_type === 'chat'
                                ? 'Chat'
                                : comm.communication_type === 'system'
                                  ? 'Sistema'
                                  : 'Mensaje'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <StatusIcon className={`h-3 w-3 ${getStatusColor(comm.status)}`} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comm.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                      </div>

                      {comm.subject && <p className="font-medium text-sm mb-1">{comm.subject}</p>}

                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comm.content}</p>

                      {/* Mostrar archivo adjunto si existe */}
                      {comm.attachment_url && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          {/* Si es una imagen, mostrar vista previa */}
                          {comm.attachment_type?.startsWith('image/') ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Image className="h-6 w-6 text-blue-500" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    📸 {comm.attachment_name || 'Imagen adjunta'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Foto enviada por el cliente
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (comm.attachment_url) {
                                      window.open(comm.attachment_url, '_blank');
                                    }
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="h-4 w-4" />
                                  Ver Completa
                                </Button>
                              </div>
                              {/* Vista previa de la imagen */}
                              <div className="relative max-w-sm">
                                <img
                                  src={comm.attachment_url}
                                  alt={comm.attachment_name || 'Imagen adjunta'}
                                  className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    if (comm.attachment_url) {
                                      window.open(comm.attachment_url, '_blank');
                                    }
                                  }}
                                  onError={e => {
                                    // Si la imagen falla al cargar, mostrar el icono normal
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            /* Para archivos no-imagen, mostrar el icono normal */
                            <div className="flex items-center gap-3">
                              {(() => {
                                const FileIcon = getFileIcon(comm.attachment_type);
                                return <FileIcon className="h-8 w-8 text-blue-500" />;
                              })()}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  📄 {comm.attachment_name || 'Archivo adjunto'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {comm.attachment_type &&
                                    comm.attachment_type.split('/')[1]?.toUpperCase()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (comm.attachment_url) {
                                    window.open(comm.attachment_url, '_blank');
                                  }
                                }}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-4 w-4" />
                                Descargar
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Enviar nuevo mensaje (solo para agentes) */}
        {canSendMessages && (
          <div className="space-y-4 border-t pt-4">
            <Label>Enviar Nuevo Mensaje</Label>

            {/* Tipo de mensaje */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Tipo de Mensaje
                <InfoTooltip content="Selecciona cómo quieres comunicarte con tu agente. Email para mensajes detallados, SMS para notificaciones cortas, o Chat para conversación en tiempo real." />
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={messageType === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('email')}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button
                  variant={messageType === 'sms' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('sms')}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  SMS
                </Button>
                <Button
                  variant={messageType === 'chat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('chat')}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              </div>
            </div>

            {/* Área de mensaje */}
            <Textarea
              placeholder={`Escriba su ${messageType === 'email' ? 'email' : messageType === 'sms' ? 'mensaje SMS' : 'mensaje'} aquí...`}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              rows={4}
              maxLength={messageType === 'sms' ? 160 : undefined}
            />

            {messageType === 'sms' && (
              <p className="text-xs text-muted-foreground">
                {160 - newMessage.length} caracteres restantes
              </p>
            )}

            {/* Archivo adjunto */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Adjuntar Archivo
                <InfoTooltip content="Puedes adjuntar fotos del daño, documentos, cotizaciones o cualquier archivo que ayude con tu reclamación. Formatos permitidos: JPG, PNG, PDF (máximo 10MB)." />
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {uploading ? 'Subiendo...' : 'Adjuntar archivo'}
                </Button>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, JPEG, PDF (máx. 10MB)
                </span>
              </div>

              {/* Mostrar archivo seleccionado */}
              {selectedFile && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const FileIcon = getFileIcon(selectedFile.type);
                      return <FileIcon className="h-6 w-6 text-blue-500" />;
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)} •{' '}
                        {selectedFile.type.split('/')[1]?.toUpperCase()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        // Reset file input
                        const fileInput = document.getElementById(
                          'file-upload'
                        ) as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={sendMessage}
              disabled={sending || (!newMessage.trim() && !selectedFile) || uploading}
              className="w-full"
            >
              {sending ? (
                <>Enviando...</>
              ) : uploading ? (
                <>Subiendo archivo...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {selectedFile
                    ? 'Enviar archivo'
                    : `Enviar ${messageType === 'email' ? 'Email' : messageType === 'sms' ? 'SMS' : 'Mensaje'}`}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Información adicional para clientes */}
        {currentUserRole === 'customer' && (
          <Alert>
            <MessageCircle className="h-4 w-4" />
            <AlertDescription>
              💡 <strong>Tip:</strong> Puede adjuntar fotos del daño, documentos o cualquier
              información adicional que ayude con su reclamación. Su agente recibirá todo
              inmediatamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Mensaje para usuarios no autorizados */}
        {!canSendMessages && currentUserRole !== 'customer' && (
          <Alert>
            <MessageCircle className="h-4 w-4" />
            <AlertDescription>
              Para comunicarse con su agente, puede llamar a nuestro centro de atención o enviar un
              email a soporte@seguratvauto.com
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
