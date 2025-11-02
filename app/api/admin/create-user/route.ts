import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente con permisos de administrador
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sztuxibgvlwbykaopnqg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEyMjA5MCwiZXhwIjoyMDczNjk4MDkwfQ.ptW2xg0PvIr3MwaHIGdv1IQn7-Yickcg_vy4RoCUpB0',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando creación de usuario...');

    // Para desarrollo, omitir verificación de auth temporalmente
    // TODO: Reactivar autenticación en producción

    // Obtener datos del request
    const userData = await request.json();
    console.log('📝 Datos recibidos:', userData);

    const { email, password, firstName, lastName, phone, role, country, birthDate, licenseYear } =
      userData;

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName || !role) {
      console.log('❌ Campos faltantes:', {
        email: !!email,
        password: !!password,
        firstName: !!firstName,
        lastName: !!lastName,
        role: !!role,
      });
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Email inválido:', email);
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 });
    }

    // Validación de contraseña - mismos requisitos que el registro
    if (password.length < 8) {
      console.log('❌ Contraseña muy corta:', password.length);
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      console.log('❌ Contraseña sin mayúscula');
      return NextResponse.json(
        { error: 'La contraseña debe contener al menos una mayúscula' },
        { status: 400 }
      );
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      console.log('❌ Contraseña sin carácter especial');
      return NextResponse.json(
        { error: 'La contraseña debe contener al menos un carácter especial' },
        { status: 400 }
      );
    }

    if (role === 'admin') {
      return NextResponse.json(
        { error: 'No se puede crear usuarios administradores' },
        { status: 400 }
      );
    }

    console.log('✅ Validaciones pasadas, creando usuario...');

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
      return NextResponse.json({ error: authError2.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 });
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

      const { error: customerError } = await supabaseAdmin.from('customers').insert({
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

    console.log('🎉 Usuario creado exitosamente!');
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
    console.error('💥 Error in create-user API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
