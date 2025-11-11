'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { Claim } from '@/lib/types/database';
import { MessageCircle, Plus, Send, Mail, Phone, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/components/auth/auth-provider';

interface Communication {
  id: string;
  claim_id: string;
  customer_id: string;
  agent_id: string;
  communication_type: 'email' | 'phone' | 'sms' | 'chat' | 'letter' | 'internal';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  agent: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface ClaimCommunicationsProps {
  claim: Claim;
}

export function ClaimCommunications({ claim }: ClaimCommunicationsProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCommunication, setNewCommunication] = useState({
    type: 'internal' as const,
    subject: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { userProfile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (claim.id) {
      fetchCommunications();
    }
  }, [claim.id]);

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select(
          `
          *,
          agent:users(first_name, last_name, role)
        `
        )
        .eq('claim_id', claim.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCommunication = async () => {
    if (!newCommunication.content.trim() || !userProfile?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('communications').insert({
        claim_id: claim.id,
        customer_id: claim.customer_id,
        agent_id: userProfile.id,
        communication_type: newCommunication.type,
        direction: 'outbound',
        subject: newCommunication.subject || null,
        content: newCommunication.content,
        status: 'sent',
      });

      if (error) throw error;

      // Reset form
      setNewCommunication({
        type: 'internal',
        subject: '',
        content: '',
      });
      setShowAddForm(false);

      // Refresh communications
      await fetchCommunications();
    } catch (error) {
      console.error('Error adding communication:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'internal':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      email: 'Email',
      phone: 'Teléfono',
      sms: 'SMS',
      chat: 'Chat',
      letter: 'Carta',
      internal: 'Nota Interna',
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusBadge = (status: string) => {
    // Simplificado: Solo "Leído" o "No Leído"
    const isRead = status.toLowerCase() === 'read';
    
    return (
      <Badge 
        variant={isRead ? 'default' : 'secondary'}
        className={isRead 
          ? "bg-green-100 text-green-800" 
          : "bg-orange-100 text-orange-800"
        }
      >
        {isRead ? "Leído" : "No Leído"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando comunicaciones...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comunicaciones
            </CardTitle>
            <CardDescription>
              Registro de todas las comunicaciones relacionadas con la reclamación
            </CardDescription>
          </div>
          {(userProfile?.role === 'agent' ||
            userProfile?.role === 'adjuster' ||
            userProfile?.role === 'admin') && (
            <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Nota
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add communication form */}
        {showAddForm && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    value={newCommunication.type}
                    onValueChange={(value: any) =>
                      setNewCommunication(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Nota Interna</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Llamada Telefónica</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newCommunication.type !== 'internal' && (
                  <div>
                    <label className="text-sm font-medium">Asunto</label>
                    <input
                      type="text"
                      value={newCommunication.subject}
                      onChange={e =>
                        setNewCommunication(prev => ({ ...prev, subject: e.target.value }))
                      }
                      className="w-full p-2 border rounded"
                      placeholder="Asunto de la comunicación"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Contenido</label>
                  <Textarea
                    value={newCommunication.content}
                    onChange={e =>
                      setNewCommunication(prev => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="Escribe tu mensaje aquí..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={addCommunication}
                    disabled={!newCommunication.content.trim() || submitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Communications list */}
        {communications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay comunicaciones registradas
          </div>
        ) : (
          <div className="space-y-4">
            {communications.map(comm => (
              <Card key={comm.id} className="border-l-4 border-l-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        {getTypeIcon(comm.communication_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {comm.agent?.first_name} {comm.agent?.last_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(comm.communication_type)}
                          </Badge>
                          {comm.direction === 'inbound' && (
                            <Badge variant="secondary" className="text-xs">
                              Entrante
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {format(new Date(comm.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                        {comm.subject && (
                          <div className="font-medium text-sm mb-2">{comm.subject}</div>
                        )}
                        <div className="text-sm whitespace-pre-wrap">{comm.content}</div>
                      </div>
                    </div>
                    <div>{getStatusBadge(comm.status)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
