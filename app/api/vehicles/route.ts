import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        policies(
          id,
          policy_number,
          status,
          customers(
            id,
            first_name,
            last_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vehicles: vehicles || [] });
  } catch (error: any) {
    console.error('Error in GET /api/vehicles:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
