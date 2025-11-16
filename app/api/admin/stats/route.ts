import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener estadísticas de vehículos
    const { count: totalVehicles } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });

    const { data: vehiclesWithPolicies } = await supabase
      .from('vehicles')
      .select('id, policies!inner(id, status)')
      .eq('policies.status', 'active');

    const insuredVehicles = vehiclesWithPolicies?.length || 0;
    const uninsuredVehicles = (totalVehicles || 0) - insuredVehicles;

    // Obtener estadísticas de reclamaciones
    const { count: totalClaims } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true });

    const { count: pendingClaims } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .in('status', ['submitted', 'under_review', 'investigating']);

    const { count: approvedClaims } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedClaims } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .in('status', ['denied', 'rejected']);

    // Obtener estadísticas de pólizas
    const { count: totalPolicies } = await supabase
      .from('policies')
      .select('*', { count: 'exact', head: true });

    const { count: activePolicies } = await supabase
      .from('policies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: expiredPolicies } = await supabase
      .from('policies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');

    const stats = {
      vehicles: {
        total: totalVehicles || 0,
        insured: insuredVehicles,
        uninsured: uninsuredVehicles,
      },
      claims: {
        total: totalClaims || 0,
        pending: pendingClaims || 0,
        approved: approvedClaims || 0,
        rejected: rejectedClaims || 0,
      },
      policies: {
        total: totalPolicies || 0,
        active: activePolicies || 0,
        expired: expiredPolicies || 0,
      },
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
