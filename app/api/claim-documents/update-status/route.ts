import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  license: 'Licencia de Conducir',
  id: 'Identificación Oficial',
  invoice: 'Factura del Vehículo',
  police_report: 'Reporte Policial',
  photos: 'Fotografías del Siniestro',
  other: 'Otro Documento',
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

    const { documentId, newStatus, notes } = await request.json();

    if (!documentId || !newStatus) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'agent', 'adjuster'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: document, error: docError } = await supabase
      .from('claim_customer_documents')
      .select(
        `
        id,
        claim_id,
        customer_id,
        document_type,
        status,
        claim:claims(
          id,
          claim_number,
          status,
          policy_id,
          customer_id
        ),
        customer:customers(
          id,
          user:users(
            email,
            first_name,
            last_name
          )
        )
      `
      )
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const { error: updateDocError } = await supabase
      .from('claim_customer_documents')
      .update({
        status: newStatus,
        notes: notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateDocError) {
      throw updateDocError;
    }

    if (newStatus === 'rejected') {
      const claimId = (document as any).claim_id || (document as any).claim?.id;

      if (claimId) {
        const { error: claimUpdateError } = await supabase
          .from('claims')
          .update({
            status: 'pending_documentation',
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', claimId);

        if (claimUpdateError) {
          console.error('Error actualizando estado de reclamación:', claimUpdateError);
        }
      }

      const customerId = (document as any).customer_id || (document as any).claim?.customer_id;
      const policyId = (document as any).claim?.policy_id || null;
      const claimNumber = (document as any).claim?.claim_number as string | null;

      const docTypeKey = (document as any).document_type as string;
      const docTypeLabel = DOCUMENT_TYPE_LABELS[docTypeKey] || docTypeKey;

      const subject = `Documento rechazado - Reclamación ${claimNumber || ''}`.trim();
      const reasonText =
        typeof notes === 'string' && notes.trim().length > 0
          ? notes.trim()
          : 'El documento no cumple con los requisitos necesarios para continuar con el proceso.';

      const content = [
        'Estimado cliente,',
        '',
        `Uno de los documentos de su reclamación ${claimNumber || ''} ha sido rechazado.`,
        '',
        `Documento: ${docTypeLabel}`,
        `Motivo: ${reasonText}`,
        '',
        'Por favor, inicie sesión en su portal de reclamaciones para subir nuevamente este documento corregido.',
        'Una vez recibido y aprobado, podremos continuar con la gestión de su caso.',
        '',
        'Gracias por su colaboración,',
        'Equipo de SeguraTuAuto',
      ].join('\n');

      const { error: commError } = await supabase.from('communications').insert({
        customer_id: customerId,
        agent_id: userProfile.role !== 'customer' ? user.id : null,
        policy_id: policyId,
        claim_id: claimId,
        communication_type: 'email',
        direction: 'outbound',
        subject,
        content,
        status: 'sent',
      });

      if (commError) {
        console.error('Error creando comunicación de rechazo:', commError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en actualización de estado de documento de reclamación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
