import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('🔄 PATCH /api/quotes/[id] - Starting quote action');
  console.log('📋 Quote ID:', params.id);

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log('🔐 Auth check:', {
    user: user?.id,
    authError: authError?.message,
  });

  if (authError || !user) {
    console.log('❌ Authentication failed');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Check if user is agent or admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'agent'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { action, notes, rejected_reason } = body;

    console.log('📝 Request body:', { action, notes, rejected_reason });

    if (!['approve', 'reject'].includes(action)) {
      console.log('❌ Invalid action:', action);
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    // Get the quote to check if it exists and is pending
    const { data: existingQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (existingQuote.status !== 'pending') {
      return NextResponse.json({ error: 'La cotización no está pendiente' }, { status: 400 });
    }

    if (action === 'approve') {
      console.log('✅ Approving quote and creating policy...');

      // If approving, create a policy from the quote
      const policyNumber = `POL-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      console.log('🎫 Generated policy number:', policyNumber);

      // Calculate total coverage limit from selected coverages
      let totalCoverageLimit = 0;
      if (existingQuote.selected_coverages && Array.isArray(existingQuote.selected_coverages)) {
        totalCoverageLimit = existingQuote.selected_coverages.reduce(
          (sum: number, coverage: any) => sum + (coverage.coverage_limit || 0),
          0
        );
      }

      // Create policy with approved status (esperando pago del cliente)
      const policyData = {
        policy_number: policyNumber,
        customer_id: existingQuote.customer_id,
        vehicle_id: existingQuote.vehicle_id,
        agent_id: user.id,
        policy_type: existingQuote.policy_type,
        status: 'approved', // Póliza aprobada, esperando pago del cliente para activarse
        start_date: existingQuote.start_date,
        end_date: existingQuote.end_date,
        premium_amount: existingQuote.premium_amount,
        payment_frequency: existingQuote.payment_frequency || 'monthly',
        auto_renewal: existingQuote.auto_renewal || false,
        risk_assessment: existingQuote.risk_assessment,
        total_coverage_limit: totalCoverageLimit > 0 ? totalCoverageLimit : null,
      };

      console.log('💾 Policy data to insert:', policyData);

      const { data: policy, error: policyError } = await supabase
        .from('policies')
        .insert(policyData)
        .select()
        .single();

      if (policyError) {
        console.error('❌ Policy creation error:', policyError);
        return NextResponse.json(
          {
            error: `Error al crear la póliza: ${policyError.message}`,
          },
          { status: 500 }
        );
      }

      console.log('✅ Policy created successfully:', policy.id);

      // Create policy coverages if selected_coverages exist
      if (existingQuote.selected_coverages && existingQuote.selected_coverages.length > 0) {
        const coveragesToInsert = existingQuote.selected_coverages.map((coverage: any) => ({
          policy_id: policy.id,
          coverage_type_id: coverage.coverage_type_id,
          coverage_limit: coverage.coverage_limit,
          deductible: coverage.deductible,
          premium: coverage.premium,
        }));

        const { error: coverageError } = await supabase
          .from('policy_coverages')
          .insert(coveragesToInsert);

        if (coverageError) {
          console.error('Error creating policy coverages:', coverageError);
          // Don't fail the whole operation for coverage errors
        }
      }

      // Update quote status to approved and converted
      const { data: updatedQuote, error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'converted',
          agent_id: user.id,
          agent_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Create communication for approval
      const { error: commError } = await supabase.from('communications').insert({
        customer_id: existingQuote.customer_id,
        communication_type: 'quote_approved',
        direction: 'outbound',
        subject: `Cotización aprobada – Póliza ${existingQuote.quote_number}`,
        content: `Estimado cliente,

Te informamos que tu cotización ${existingQuote.quote_number} ha sido aprobada por nuestro equipo.
Para activar tu póliza, por favor ingresa al Centro de Pagos y completa el pago inicial de activación.
${notes && notes.trim().length > 0 ? `\nNotas del agente:\n${notes}\n` : ''}
Si tienes alguna duda, por favor contacta a tu agente o a nuestro centro de atención.`,
        metadata: {
          quoteId: existingQuote.id,
          quoteNumber: existingQuote.quote_number,
          policyType: existingQuote.policy_type
        },
        status: 'unread'
      });

      if (commError) {
        console.error('❌ Error creating approval communication:', commError);
      } else {
        console.log('✅ Approval communication created successfully for customer:', existingQuote.customer_id);
      }

      return NextResponse.json({
        quote: updatedQuote,
        policy,
        message: 'Cotización aprobada. La póliza está pendiente de pago del cliente para activarse.',
      });
    } else {
      // Reject the quote
      const { data: updatedQuote, error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'rejected',
          agent_id: user.id,
          agent_notes: notes,
          rejected_reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Create communication for rejection
      const { error: commError } = await supabase.from('communications').insert({
        customer_id: existingQuote.customer_id,
        communication_type: 'quote_rejected',
        direction: 'outbound',
        subject: `Cotización rechazada – Póliza ${existingQuote.quote_number}`,
        content: `Estimado cliente,

Le informamos que su cotización ${existingQuote.quote_number} ha sido rechazada por nuestro equipo.

📌 Motivo del rechazo:
${rejected_reason}

📝 Notas del agente:
${notes || 'El agente no dejó notas adicionales.'}

Por favor revisa los detalles indicados y, si lo deseas, crea una nueva cotización con la información actualizada.

Si tienes alguna duda, por favor contacta a tu agente o a nuestro centro de atención.`,
        metadata: {
          quoteId: existingQuote.id,
          quoteNumber: existingQuote.quote_number,
          policyType: existingQuote.policy_type
        },
        status: 'unread'
      });

      if (commError) {
        console.error('❌ Error creating rejection communication:', commError);
      } else {
        console.log('✅ Rejection communication created successfully for customer:', existingQuote.customer_id);
      }

      return NextResponse.json({
        quote: updatedQuote,
        message: 'Cotización rechazada exitosamente',
      });
    }
  } catch (error) {
    console.error('Error processing quote:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
