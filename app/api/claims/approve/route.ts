import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { claimId, approvedAmount, reason } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['adjuster', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ 
        error: 'No autorizado para aprobar reclamaciones' 
      }, { status: 403 });
    }

    const { data: claim } = await supabase
      .from('claims')
      .select(`
        *,
        policy:policies(
          coverage_limit,
          deductible_amount,
          status,
          start_date,
          end_date,
          vehicle:vehicles(market_value)
        )
      `)
      .eq('id', claimId)
      .single();

    if (!claim) {
      return NextResponse.json({ error: 'Reclamación no encontrada' }, { status: 404 });
    }

    if (claim.policy.status !== 'active') {
      return NextResponse.json({ 
        error: 'La póliza no está activa' 
      }, { status: 400 });
    }

    const incidentDate = new Date(claim.incident_date);
    const policyStart = new Date(claim.policy.start_date);
    const policyEnd = new Date(claim.policy.end_date);

    if (incidentDate < policyStart || incidentDate > policyEnd) {
      return NextResponse.json({ 
        error: 'El siniestro ocurrió fuera de la vigencia de la póliza' 
      }, { status: 400 });
    }

    if (approvedAmount <= 0) {
      return NextResponse.json({ 
        error: 'Monto debe ser mayor a 0' 
      }, { status: 400 });
    }

    if (approvedAmount > claim.policy.coverage_limit) {
      return NextResponse.json({ 
        error: `Monto excede límite de cobertura: $${claim.policy.coverage_limit.toLocaleString()}` 
      }, { status: 400 });
    }

    const deducible = claim.policy.deductible_amount || 0;
    const montoNeto = approvedAmount - deducible;

    if (montoNeto <= 0) {
      return NextResponse.json({ 
        error: `Monto no cubre el deducible de $${deducible.toLocaleString()}` 
      }, { status: 400 });
    }

    const vehicleValue = claim.policy.vehicle?.market_value || 0;
    if (vehicleValue > 0 && approvedAmount > vehicleValue * 0.9) {
      console.warn(`⚠️ ALERTA FRAUDE: Monto aprobado ($${approvedAmount}) > 90% valor vehículo ($${vehicleValue})`);
    }

    const { data: yearClaims } = await supabase
      .from('claims')
      .select('approved_amount')
      .eq('customer_id', claim.customer_id)
      .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString())
      .neq('id', claimId);

    const sumaAnual = yearClaims?.reduce((sum, c) => sum + (c.approved_amount || 0), 0) || 0;
    
    if (sumaAnual + approvedAmount > claim.policy.coverage_limit) {
      return NextResponse.json({ 
        error: `Excede límite anual. Ya se han aprobado $${sumaAnual.toLocaleString()} este año` 
      }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('claims')
      .update({
        status: 'approved',
        approved_amount: approvedAmount,
        deductible_amount: deducible,
        net_amount: montoNeto,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true,
      data: {
        approved_amount: approvedAmount,
        deductible_amount: deducible,
        net_amount: montoNeto
      }
    });

  } catch (error) {
    console.error('Error approving claim:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
