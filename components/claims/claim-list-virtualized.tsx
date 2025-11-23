'use client';

import { memo, useMemo } from 'react';
import { FixedSizeList } from 'react-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Eye, Settings, Calendar, Clock, AlertTriangle } from 'lucide-react';
import type { Claim } from '@/lib/types/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VirtualizedClaimListProps {
  claims: Claim[];
  onViewClaim?: (claim: Claim) => void;
  onEditClaim?: (claim: Claim) => void;
  userRole?: string;
  showCustomer?: boolean;
}

const ClaimRow = memo(function ClaimRow({
  claim,
  onView,
  onEdit,
  userRole,
  showCustomer,
  style,
}: {
  claim: Claim;
  onView?: (claim: Claim) => void;
  onEdit?: (claim: Claim) => void;
  userRole?: string;
  showCustomer?: boolean;
  style: React.CSSProperties;
}) {
  const getStatusBadge = (status: string) => {
    const submittedLabel =
      userRole === 'agent' || userRole === 'adjuster' ? 'Por revisar' : 'Enviada';

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      submitted: { label: submittedLabel, variant: 'secondary' },
      under_review: { label: 'En Revisión', variant: 'default' },
      pending_documentation: { label: 'Documentos Pendientes', variant: 'outline' },
      waiting_approval: { label: 'Esperando Aprobación', variant: 'outline' },
      investigating: { label: 'En Investigación', variant: 'default' },
      approved: { label: 'Aprobada', variant: 'default' },
      processing_payment: { label: 'Procesando Pago', variant: 'secondary' },
      denied: { label: 'Denegada', variant: 'destructive' },
      closed: { label: 'Cerrada', variant: 'outline' },
      paid: { label: 'Pagada', variant: 'default' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canEdit = useMemo(() => {
    if (userRole === 'admin') return claim.status !== 'closed';
    if (userRole === 'agent') {
      return [
        'submitted',
        'under_review',
        'pending_documentation',
        'approved',
        'processing_payment',
        'denied',
      ].includes(claim.status);
    }
    if (userRole === 'adjuster') {
      return ['investigating', 'waiting_approval'].includes(claim.status);
    }
    return false;
  }, [userRole, claim.status]);

  return (
    <div
      style={style}
      className="flex items-center gap-4 border-b px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 grid grid-cols-6 gap-4 items-center">
        <div>
          <div className="font-medium text-sm">{claim.claim_number}</div>
          <div className="text-xs text-muted-foreground">{claim.claim_type}</div>
        </div>

        {showCustomer && (
          <div>
            <div className="text-sm font-medium">
              {claim.customer?.user?.first_name} {claim.customer?.user?.last_name}
            </div>
            <div className="text-xs text-muted-foreground">{claim.customer?.user?.email}</div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium">{claim.policy?.policy_number}</div>
          <div className="text-xs text-muted-foreground">
            {claim.policy?.vehicle?.year} {claim.policy?.vehicle?.make}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {getStatusBadge(claim.status)}
          {claim.injury_involved && (
            <Badge variant="destructive" className="text-xs w-fit">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Lesiones
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <PriorityBadge priority={claim.priority} />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(claim.incident_date), 'dd/MM/yyyy', { locale: es })}
          </div>
        </div>

        <div className="text-sm">
          {claim.estimated_damage_cost && (
            <div>${claim.estimated_damage_cost.toLocaleString()}</div>
          )}
          {claim.approved_amount && (
            <div className="text-xs text-green-600">
              Aprobado: ${claim.approved_amount.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onView?.(claim)} title="Ver detalles">
          <Eye className="h-4 w-4" />
        </Button>

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(claim)}
            title={
              userRole === 'admin'
                ? 'Control Total'
                : userRole === 'agent'
                  ? 'Gestión Administrativa'
                  : 'Evaluación Técnica'
            }
            className={
              userRole === 'admin'
                ? 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200'
                : userRole === 'agent'
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
            }
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

export const VirtualizedClaimList = memo(function VirtualizedClaimList({
  claims,
  onViewClaim,
  onEditClaim,
  userRole,
  showCustomer = true,
}: VirtualizedClaimListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const claim = claims[index];
    return (
      <ClaimRow
        claim={claim}
        onView={onViewClaim}
        onEdit={onEditClaim}
        userRole={userRole}
        showCustomer={showCustomer}
        style={style}
      />
    );
  };

  if (claims.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No se encontraron reclamaciones
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <FixedSizeList height={600} itemCount={claims.length} itemSize={100} width="100%">
        {Row}
      </FixedSizeList>
    </div>
  );
});
