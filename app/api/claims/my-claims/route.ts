import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('claims')
      .select(`
        *,
        policy:policies(
          *,
          vehicle:vehicles(*)
        ),
        customer:customers(
          *,
          user:users(*)
        ),
        adjuster:users!claims_adjuster_id_fkey(*),
        agent:users!claims_agent_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (userProfile?.role === 'adjuster') {
      // Mostrar todas las reclamaciones asignadas a CUALQUIER ajustador (Single Evaluator Mode)
      query = query.not('adjuster_id', 'is', null);
    } else if (userProfile?.role === 'agent') {
      query = query.eq('agent_id', user.id);
    }

    const { data: claims, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ claims: claims || [] });

  } catch (error) {
    console.error('Error fetching my claims:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
