import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Usar service key para bypasear RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service key para admin
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { docId, newFileName, newUrl, fileSize, mimeType } = await request.json();

    console.log('🔄 API: Reemplazando documento:', {
      docId,
      newFileName,
      newUrl,
    });

    // Actualizar usando service key (bypasea RLS)
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('claim_customer_documents')
      .update({
        file_name: newFileName,
        file_url: newUrl,
        file_size: fileSize,
        mime_type: mimeType,
        upload_date: new Date().toISOString(),
        status: 'pending',
      })
      .eq('id', docId)
      .select();

    console.log('📋 API: Resultado del UPDATE:', {
      updateData,
      updateError,
      rowsAffected: updateData?.length || 0,
    });

    if (updateError) {
      throw new Error(`Error en UPDATE: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      throw new Error(`No se encontró documento con ID: ${docId}`);
    }

    return NextResponse.json({
      success: true,
      data: updateData[0],
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
