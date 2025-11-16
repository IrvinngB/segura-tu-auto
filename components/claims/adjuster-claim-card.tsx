'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Clock, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Car,
  User,
  MapPin,
  FileText,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Claim } from '@/lib/types/database';
import { toast } from 'sonner';

interface AdjusterClaimCardProps {
  claim: Claim;
  onView: (claim: Claim) => void;
  isAssignedToMe: boolean;
  onTake?: () => void;
}

export function AdjusterClaimCard({ claim, onView, isAssignedToMe, onTake }: AdjusterClaimCardProps) {
  const [taking, setTaking] = useState(false);

  const handleTakeClaim = async () => {
    setTaking(true);
    try {
      const response = await fetch('/api/claims/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId: claim.id })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.takenByOther) {
          toast.error('Esta reclamación ya fue tomada por otro ajustador');
        } else {
          toast.error(data.error || 'Error al tomar la reclamación');
        }
        return;
      }

      toast.success(`Reclamación ${claim.claim_number} asignada correctamente`);
      if (onTake) onTake();
    } catch (error) {
      toast.error('Error al tomar la reclamación');
    } finally {
      setTaking(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      investigating: 'bg-blue-500',
      waiting_approval: 'bg-yellow-500',
      approved: 'bg-green-500',
      denied: 'bg-red-500',
      submitted: 'bg-gray-400',
      under_review: 'bg-purple-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      submitted: 'Por Asignar',
      under_review: 'En Revisión',
      investigating: 'Evaluando',
      waiting_approval: 'Por Aprobar',
      approved: 'Aprobada',
      denied: 'Denegada'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const daysSinceIncident = Math.floor(
    (new Date().getTime() - new Date(claim.incident_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isAssignedToMe ? 'border-blue-500 border-2' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg">{claim.claim_number}</h3>
              {isAssignedToMe && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  Asignada a mí
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(claim.status)}`} />
              <span className="text-sm font-medium">{getStatusLabel(claim.status)}</span>
              <Badge className={`${getPriorityColor(claim.priority)} border`}>
                {getPriorityLabel(claim.priority)}
              </Badge>
            </div>
          </div>

          {isAssignedToMe ? (
            <Button onClick={() => onView(claim)} size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Evaluar
            </Button>
          ) : !claim.adjuster_id ? (
            <Button 
              onClick={handleTakeClaim} 
              size="sm"
              disabled={taking}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {taking ? 'Tomando...' : 'Tomar'}
            </Button>
          ) : (
            <Button onClick={() => onView(claim)} size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Ver
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium truncate">
                {claim.customer?.user?.first_name} {claim.customer?.user?.last_name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Car className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Vehículo</p>
              <p className="text-sm font-medium truncate">
                {claim.policy?.vehicle?.year} {claim.policy?.vehicle?.make}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Tipo</p>
              <p className="text-sm font-medium">{claim.claim_type}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Siniestro</p>
              <p className="text-sm font-medium">
                {format(new Date(claim.incident_date), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {claim.incident_location && (
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Ubicación</p>
              <p className="text-sm">{claim.incident_location}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Daño Estimado</p>
            <p className="text-lg font-bold">
              ${claim.estimated_damage_cost?.toLocaleString() || '0'}
            </p>
          </div>
          {daysSinceIncident > 7 && (
            <div className="flex items-center gap-1 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">{daysSinceIncident} días</span>
            </div>
          )}
        </div>

        {claim.incident_description && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Descripción</p>
            <p className="text-sm line-clamp-2">{claim.incident_description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
