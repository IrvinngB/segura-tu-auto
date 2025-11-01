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

export async function POST(request: NextRequest) {
  try {
    // Obtener token de autorización del header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Crear cliente normal para verificar el usuario actual
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verificar que el usuario actual es admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token no válido' },
        { status: 401 }
      );
    }

    // Verificar rol de administrador
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const userData = await request.json();
    
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      country,
      birthDate,
      licenseYear
    } = userData;

    // Validaciones
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }

    if (role === 'admin') {
      return NextResponse.json(
        { error: 'No se puede crear usuarios administradores' },
        { status: 400 }
      );
    }

    // Crear usuario con Supabase Auth Admin
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email para usuarios creados por admin
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
      },
    });

    if (authError2) {
      console.error('Error creating auth user:', authError2);
      return NextResponse.json(
        { error: authError2.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      );
    }

    // Insertar en tabla users
    const { data: userRecord, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        password_hash: 'handled_by_supabase_auth',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting user record:', insertError);
      // Intentar limpiar el usuario de auth si falla la inserción
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `Error al crear registro de usuario: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Si es cliente, crear perfil de cliente
    if (role === 'customer') {
      const currentYear = new Date().getFullYear();
      const drivingExperience = licenseYear ? currentYear - parseInt(licenseYear) : null;

      const { error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          user_id: authData.user.id,
          date_of_birth: birthDate || null,
          country: country || 'Costa Rica',
          driving_experience_years: drivingExperience,
        });

      if (customerError) {
        console.error('Error creating customer profile:', customerError);
        // No fallar aquí, el usuario ya fue creado exitosamente
        console.warn('Usuario creado pero sin perfil de cliente:', customerError.message);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        firstName,
        lastName,
      },
    });

  } catch (error) {
    console.error('Error in create-user API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
