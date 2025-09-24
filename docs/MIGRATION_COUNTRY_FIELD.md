# Migración de Campo Country - Instrucciones

## Error Actual
```
Error creando perfil de cliente: Could not find the 'country' column of 'customers' in the schema cache
```

## Solución: Agregar Columna Country

### Opción 1: SQL Editor en Supabase Dashboard

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/sztuxibgvlwbykaopnqg
2. Ve a SQL Editor
3. Ejecuta el siguiente SQL:

```sql
-- Agregar columna country a la tabla customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Panamá';

-- Crear índice para consultas basadas en ubicación
CREATE INDEX IF NOT EXISTS idx_customers_country ON customers(country);

-- Actualizar clientes existentes con país por defecto
UPDATE customers 
SET country = 'Panamá'
WHERE country IS NULL;
```

### Opción 2: Verificar desde la Aplicación

Después de ejecutar la migración SQL, intenta registrar un nuevo cliente para verificar que funciona.

## Países Disponibles

El selector incluirá estos países (según implementación actual):
- Panamá (por defecto)
- México
- Estados Unidos
- Canadá
- Guatemala, Belice, El Salvador, Honduras, Nicaragua, Costa Rica
- Colombia, Venezuela, Ecuador, Perú, Brasil, Argentina, Chile, Uruguay, Paraguay, Bolivia
- España
- Otro

## Verificación

Una vez ejecutada la migración, la página de registro debería funcionar sin errores al crear clientes.