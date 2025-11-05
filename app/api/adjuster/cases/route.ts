import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verificar que el usuario sea adjuster
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'adjuster') {
      return NextResponse.json({ error: 'Forbidden - Only adjusters can access' }, { status: 403 });
    }

    // 3. Obtener casos activos (pending y under_review)
    const { data: activeClaims, error: activeError } = await supabase
      .from('claims')
      .select(
        `
        id,
        claim_number,
        status,
        incident_date,
        incident_description,
        claim_amount,
        created_at,
        policies!inner (
          id,
          policy_number,
          customers!inner (
            id,
            first_name,
            last_name
          ),
          vehicles!inner (
            id,
            make,
            model,
            year
          )
        )
      `
      )
      .in('status', ['pending', 'under_review'])
      .order('created_at', { ascending: false });

    if (activeError) throw activeError;

    // 4. Obtener histórico de casos (approved y rejected)
    const { data: historyClaims, error: historyError } = await supabase
      .from('claims')
      .select(
        `
        id,
        claim_number,
        status,
        incident_date,
        incident_description,
        claim_amount,
        created_at,
        updated_at,
        policies!inner (
          id,
          policy_number,
          customers!inner (
            id,
            first_name,
            last_name
          ),
          vehicles!inner (
            id,
            make,
            model,
            year
          )
        )
      `
      )
      .in('status', ['approved', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(50);

    if (historyError) throw historyError;

    // 5. Formatear datos activos
    const formattedActive = activeClaims?.map(claim => {
      const policy = Array.isArray(claim.policies) ? claim.policies[0] : claim.policies;
      const customer = Array.isArray(policy?.customers)
        ? policy.customers[0]
        : policy?.customers;
      const vehicle = Array.isArray(policy?.vehicles) ? policy.vehicles[0] : policy?.vehicles;

      return {
        id: claim.id,
        claim_id: claim.id,
        claim_number: claim.claim_number,
        status: claim.status,
        assigned_date: claim.created_at,
        customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'N/A',
        vehicle_info: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'N/A',
        incident_description: claim.incident_description || 'Sin descripción',
        claim_amount: claim.claim_amount,
      };
    }) || [];

    // 6. Formatear datos históricos
    const formattedHistory = historyClaims?.map(claim => {
      const policy = Array.isArray(claim.policies) ? claim.policies[0] : claim.policies;
      const customer = Array.isArray(policy?.customers)
        ? policy.customers[0]
        : policy?.customers;
      const vehicle = Array.isArray(policy?.vehicles) ? policy.vehicles[0] : policy?.vehicles;

      return {
        id: claim.id,
        claim_id: claim.id,
        claim_number: claim.claim_number,
        status: claim.status,
        assigned_date: claim.created_at,
        closed_date: claim.updated_at,
        customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'N/A',
        vehicle_info: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'N/A',
        incident_description: claim.incident_description || 'Sin descripción',
        claim_amount: claim.claim_amount,
      };
    }) || [];

    return NextResponse.json({
      active: formattedActive,
      history: formattedHistory,
    });
  } catch (error) {
    console.error('Error fetching adjuster cases:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
