-- Script para verificar y actualizar roles de usuarios existentes
-- Ejecutar en Supabase SQL Editor si es necesario

-- Ver usuarios actuales y sus roles
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'firstName' as first_name,
    raw_user_meta_data->>'lastName' as last_name,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Si necesitas actualizar el rol de algún usuario específico:
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'admin@example.com';

-- Verificar que existe al menos un administrador
SELECT COUNT(*) as admin_count
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';

-- Si no hay administradores, crear uno:
-- (Reemplaza con el email y datos del usuario que debe ser admin)
/*
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@seguraauto.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    '{"role": "admin", "firstName": "Administrador", "lastName": "Sistema"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
*/