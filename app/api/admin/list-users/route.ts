import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente con permisos de administrador
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Iniciando listado de usuarios...');
    
    // Para desarrollo, omitir verificación de auth temporalmente
    // TODO: Reactivar autenticación en producción

    // Obtener usuarios desde la tabla users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }

    console.log(`✅ Encontrados ${users?.length || 0} usuarios`);

    // Calcular estadísticas
    const stats = {
      total: users?.length || 0,
      agents: users?.filter(u => u.role === 'agent').length || 0,
      evaluators: users?.filter(u => u.role === 'evaluator').length || 0,
      customers: users?.filter(u => u.role === 'customer').length || 0,
      admins: 0, // No incluimos admins en la lista
    };

    return NextResponse.json({
      success: true,
      users: users || [],
      stats,
    });
  } catch (error) {
    console.error('💥 Error in list-users API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
