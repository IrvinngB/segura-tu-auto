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

    const { claimId } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'adjuster') {
      return NextResponse.json({ 
        error: 'Solo ajustadores pueden tomar reclamaciones' 
      }, { status: 403 });
    }

    const { data: claim } = await supabase
      .from('claims')
      .select('adjuster_id, status, claim_number')
      .eq('id', claimId)
      .single();

    if (!claim) {
      return NextResponse.json({ error: 'Reclamación no encontrada' }, { status: 404 });
    }

    if (claim.adjuster_id) {
      if (claim.adjuster_id === user.id) {
        return NextResponse.json({ 
          error: 'Ya tienes asignada esta reclamación',
          alreadyAssigned: true
        }, { status: 400 });
      }

      const { data: currentAdjuster } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', claim.adjuster_id)
        .single();

      return NextResponse.json({ 
        error: `Esta reclamación ya fue tomada por ${currentAdjuster?.first_name} ${currentAdjuster?.last_name}`,
        takenByOther: true
      }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('claims')
      .update({
        adjuster_id: user.id,
        status: 'investigating',
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', claimId)
      .is('adjuster_id', null);

    if (updateError) {
      if (updateError.message.includes('violates')) {
        return NextResponse.json({ 
          error: 'Esta reclamación ya fue tomada por otro ajustador',
          takenByOther: true
        }, { status: 409 });
      }
      throw updateError;
    }

    return NextResponse.json({ 
      success: true,
      message: `Reclamación ${claim.claim_number} asignada correctamente`,
      adjuster: {
        id: user.id,
        name: `${userProfile.first_name} ${userProfile.last_name}`
      }
    });

  } catch (error) {
    console.error('Error taking claim:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
