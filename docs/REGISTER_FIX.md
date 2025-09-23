# Instrucciones para Corregir el Error de Registro

## Problema Identificado
El error "Could not find the 'birth_date' column of 'users' in the schema cache" ocurre porque el código está intentando insertar datos en columnas que no existen en la tabla `users`.

## Solución Implementada

### 1. Cambios en el Código
Se corrigió el archivo `app/register/page.tsx` para:
- Remover campos inexistentes de la inserción en tabla `users`
- Mover información del conductor a la tabla `customers` con los nombres correctos
- Calcular automáticamente años de experiencia de conducción

### 2. Cambios Necesarios en la Base de Datos
Ejecuta este SQL en tu dashboard de Supabase (SQL Editor):

```sql
-- Add driver history columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS has_accidents BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_claims BOOLEAN DEFAULT false;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN customers.has_accidents IS 'Indicates if the customer has had accidents in the last 3 years';
COMMENT ON COLUMN customers.has_claims IS 'Indicates if the customer has made claims in the last 3 years';

-- Update any existing customers to have default values
UPDATE customers 
SET 
    has_accidents = false,
    has_claims = false
WHERE 
    has_accidents IS NULL 
    OR has_claims IS NULL;
```

### 3. Configuración de Entorno
Crea un archivo `.env.local` en la raíz del proyecto con:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 4. Verificación
Después de ejecutar el SQL y configurar las variables de entorno:
1. Reinicia el servidor de desarrollo
2. Intenta registrar un nuevo usuario
3. El error debería estar resuelto

## Mapeo de Campos Corregido

| Campo en Formulario | Tabla Destino | Columna Destino |
|-------------------|---------------|-----------------|
| firstName | users | first_name |
| lastName | users | last_name |
| email | users | email |
| phone | users | phone |
| role | users | role |
| birthDate | customers | date_of_birth |
| licenseYear | customers | driving_experience_years (calculado) |
| hasAccidents | customers | has_accidents |
| hasClaims | customers | has_claims |