# Solución al Error de Esquema de Vehículos

## 🚨 Problema Identificado

**Error:** `Could not find the 'usage_type' column of 'vehicles' in the schema cache`

**Causa:** El componente `VehicleForm` estaba intentando insertar datos en una columna `usage_type` que no existía en la tabla `vehicles` de la base de datos.

## ✅ Solución Implementada

### **1. Actualización del Esquema de Base de Datos**

**Archivo:** `scripts/database.sql`
- ✅ Agregada columna `usage_type` a la tabla `vehicles`
- ✅ Restricción CHECK con valores válidos: `('personal', 'commercial', 'taxi', 'delivery', 'other')`

```sql
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS usage_type VARCHAR(20) CHECK (usage_type IN ('personal', 'commercial', 'taxi', 'delivery', 'other'));
```

### **2. Corrección de Valores en VehicleForm**

**Archivo:** `components/vehicles/vehicle-form.tsx`
- ✅ **fuel_type**: Corregidos valores para coincidir con el esquema
- ✅ **transmission**: Corregidos valores para coincidir con el esquema  
- ✅ **vehicle_type**: Corregidos valores para coincidir con el esquema
- ✅ **usage_type**: Agregadas opciones adicionales
- ✅ **garage_type**: Corregidos valores para coincidir con el esquema

### **3. Valores Corregidos**

| Campo | Valores Anteriores | Valores Corregidos |
|-------|-------------------|-------------------|
| `fuel_type` | `gasoline, diesel, hybrid, electric, gas` | `Gasolina, Diesel, Híbrido, Eléctrico, GLP` |
| `transmission` | `manual, automatic, cvt` | `Manual, Automático, CVT` |
| `vehicle_type` | `sedan, hatchback, suv, pickup, coupe, convertible, wagon, van` | `Sedán, Hatchback, SUV, Pickup, Coupé, Convertible, Wagon` |
| `usage_type` | `personal, commercial, mixed` | `personal, commercial, taxi, delivery, other` |
| `garage_type` | `garage, carport, driveway, street` | `enclosed, covered, street` |

## 🛠️ Pasos para Aplicar la Solución

### **1. Actualizar la Base de Datos**

```bash
# Ejecutar script para agregar la columna usage_type
psql -f scripts/add-usage-type-column.sql

# Verificar el esquema
psql -f scripts/verify-vehicles-schema.sql
```

### **2. Insertar Datos de Prueba (Opcional)**

```bash
# Insertar vehículos de prueba
psql -f scripts/insert-test-vehicles.sql
```

### **3. Verificar que Funciona**

1. **Ir a la página de vehículos**: `/customer/vehicles`
2. **Hacer clic en "Agregar Vehículo"**
3. **Llenar el formulario** con datos válidos
4. **Verificar que se guarda** sin errores

## 📋 Scripts Creados

### **1. `scripts/add-usage-type-column.sql`**
- Agrega la columna `usage_type` a la tabla `vehicles`
- Actualiza registros existentes con valor por defecto
- Verifica que la columna se agregó correctamente

### **2. `scripts/verify-vehicles-schema.sql`**
- Verifica la estructura completa de la tabla `vehicles`
- Verifica restricciones CHECK
- Verifica índices
- Detecta valores inválidos

### **3. `scripts/insert-test-vehicles.sql`**
- Inserta vehículos de prueba
- Incluye diferentes tipos de vehículos
- Verifica que los datos se insertan correctamente

## 🔍 Verificación de la Solución

### **1. Verificar Esquema de Base de Datos**
```sql
-- Verificar que la columna usage_type existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
    AND column_name = 'usage_type';
```

### **2. Verificar Valores Válidos**
```sql
-- Verificar restricciones CHECK
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%vehicles%';
```

### **3. Probar Inserción**
```sql
-- Probar inserción de vehículo
INSERT INTO vehicles (
    customer_id, make, model, year, vin, license_plate,
    fuel_type, transmission, vehicle_type, usage_type, garage_type, estimated_value
) VALUES (
    'customer-uuid', 'Toyota', 'Corolla', 2020, 'TEST123', 'TEST-001',
    'Gasolina', 'Manual', 'Sedán', 'personal', 'enclosed', 15000.00
);
```

## 🚨 Consideraciones Importantes

### **1. Valores por Defecto**
- Los valores por defecto en el `VehicleForm` han sido actualizados
- Asegúrate de que coincidan con las restricciones CHECK

### **2. Datos Existentes**
- Si hay vehículos existentes, se actualizarán con `usage_type = 'personal'`
- Verifica que no haya valores inválidos en otros campos

### **3. Consistencia**
- Todos los formularios deben usar los mismos valores
- Verifica otros componentes que puedan usar la tabla `vehicles`

## 🎯 Resultado Esperado

Después de aplicar la solución:

1. ✅ **No más errores** de columna faltante
2. ✅ **Formulario de vehículos** funciona correctamente
3. ✅ **Datos se guardan** en la base de datos
4. ✅ **Valores válidos** según restricciones CHECK
5. ✅ **Esquema consistente** entre código y base de datos

---

**Estado:** ✅ Solucionado
**Archivos modificados:** `scripts/database.sql`, `components/vehicles/vehicle-form.tsx`
**Scripts creados:** 3 scripts de verificación y corrección
