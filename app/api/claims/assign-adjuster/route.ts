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

    const { claimId, adjusterId } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'agent'].includes(userProfile?.role || '')) {
      return NextResponse.json({ 
        error: 'No autorizado para asignar ajustadores' 
      }, { status: 403 });
    }

    const { data: claim } = await supabase
      .from('claims')
      .select('adjuster_id, status')
      .eq('id', claimId)
      .single();

    if (!claim) {
      return NextResponse.json({ error: 'Reclamación no encontrada' }, { status: 404 });
    }

    if (claim.adjuster_id && claim.adjuster_id !== adjusterId) {
      const { data: currentAdjuster } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', claim.adjuster_id)
        .single();

      return NextResponse.json({ 
        error: `Esta reclamación ya está asignada a ${currentAdjuster?.first_name} ${currentAdjuster?.last_name}. Debe desasignarla primero.`,
        currentAdjuster: currentAdjuster
      }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('claims')
      .update({
        adjuster_id: adjusterId,
        status: 'investigating',
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Ajustador asignado correctamente'
    });

  } catch (error) {
    console.error('Error assigning adjuster:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const { claimId } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin'].includes(userProfile?.role || '')) {
      return NextResponse.json({ 
        error: 'Solo administradores pueden desasignar ajustadores' 
      }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('claims')
      .update({
        adjuster_id: null,
        status: 'under_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Ajustador desasignado correctamente'
    });

  } catch (error) {
    console.error('Error unassigning adjuster:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
