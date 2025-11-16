import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const VALID_TRANSITIONS = {
  agent: {
    submitted: ['under_review', 'pending_documentation', 'denied'],
    under_review: ['investigating', 'pending_documentation', 'denied'],
    pending_documentation: ['under_review', 'denied'],
    denied: ['under_review', 'closed']
  },
  adjuster: {
    investigating: ['waiting_approval', 'approved', 'denied', 'under_review'],
    waiting_approval: ['approved', 'denied', 'investigating']
  },
  admin: {
    '*': '*'
  }
};

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
    const { claimId, newStatus, reason } = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Reclamación no encontrada' }, { status: 404 });
    }

    if (userProfile.role !== 'admin') {
      const validTransitions = VALID_TRANSITIONS[userProfile.role as keyof typeof VALID_TRANSITIONS];
      const allowedNextStates = validTransitions[claim.status as keyof typeof validTransitions];
      
      if (!allowedNextStates || (!allowedNextStates.includes(newStatus) && allowedNextStates !== '*')) {
        return NextResponse.json({ 
          error: `Transición no permitida: ${claim.status} → ${newStatus}` 
        }, { status: 403 });
      }
    }

    const { error: updateError } = await supabase
      .from('claims')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', claimId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Estado actualizado correctamente'
    });

  } catch (error) {
    console.error('Error updating claim status:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
