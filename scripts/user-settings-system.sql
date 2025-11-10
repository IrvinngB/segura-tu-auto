-- Agregar tabla de configuraciones de usuario
-- Este archivo debe ser ejecutado por un administrador de base de datos

-- Tabla de configuraciones de usuario
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    theme character varying(10) NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language character varying(5) NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
    timezone character varying(50) NOT NULL DEFAULT 'America/Panama',
    email_notifications boolean NOT NULL DEFAULT true,
    push_notifications boolean NOT NULL DEFAULT true,
    marketing_emails boolean NOT NULL DEFAULT false,
    two_factor_enabled boolean NOT NULL DEFAULT false,
    session_timeout integer NOT NULL DEFAULT 60 CHECK (session_timeout > 0),
    date_format character varying(20) NOT NULL DEFAULT 'dd/mm/yyyy' CHECK (date_format IN ('dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd')),
    currency character varying(3) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'PEN', 'COP', 'CRC', 'GTQ')),
    auto_logout boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_settings_pkey PRIMARY KEY (id),
    CONSTRAINT user_settings_user_id_key UNIQUE (user_id),
    CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualización automática de updated_at
DROP TRIGGER IF EXISTS trigger_update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trigger_update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver y editar sus propias configuraciones
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Los administradores pueden ver todas las configuraciones
CREATE POLICY "Admins can view all settings" ON public.user_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Función para crear configuraciones por defecto para nuevos usuarios
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Si ya existe la configuración, no hacer nada
        RETURN NEW;
END;
$$;

-- Trigger para crear configuraciones automáticamente cuando se crea un usuario
DROP TRIGGER IF EXISTS create_user_settings_on_signup ON public.users;
CREATE TRIGGER create_user_settings_on_signup
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Crear configuraciones por defecto para usuarios existentes que no tengan
INSERT INTO public.user_settings (user_id)
SELECT u.id
FROM public.users u
LEFT JOIN public.user_settings us ON u.id = us.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE public.user_settings IS 'Configuraciones personalizadas de cada usuario';
COMMENT ON COLUMN public.user_settings.theme IS 'Tema de la interfaz: light, dark, system';
COMMENT ON COLUMN public.user_settings.language IS 'Idioma preferido: es, en';
COMMENT ON COLUMN public.user_settings.timezone IS 'Zona horaria del usuario';
COMMENT ON COLUMN public.user_settings.session_timeout IS 'Tiempo de inactividad antes de cerrar sesión (minutos)';