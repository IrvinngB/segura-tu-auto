# Solución al Error en Registro de Vehículos

## Problema Identificado

Al intentar registrar un vehículo en la página `/customer/vehicles/new`, se producía un error debido a un conflicto entre el esquema de la base de datos y los datos enviados desde el formulario.

### Causa Raíz

En el esquema original de la tabla `vehicles`, los campos `vin` y `license_plate` estaban definidos como:

-   `UNIQUE NOT NULL` - No permitían valores nulos
-   El formulario enviaba `null` cuando estos campos estaban vacíos
-   Esto causaba una violación de la restricción NOT NULL

## Soluciones Implementadas

### 1. Modificación del Esquema de Base de Datos

Creado el script `fix-vehicles-schema.sql` que:

-   Elimina la restricción `NOT NULL` de los campos `vin` y `license_plate`
-   Elimina la restricción `NOT NULL` del campo `estimated_value`
-   Mantiene las restricciones `UNIQUE` para evitar duplicados

```sql
-- Script para corregir el esquema de la tabla vehicles
ALTER TABLE vehicles ALTER COLUMN vin DROP NOT NULL;
ALTER TABLE vehicles ALTER COLUMN license_plate DROP NOT NULL;
ALTER TABLE vehicles ALTER COLUMN estimated_value DROP NOT NULL;
```

### 2. Mejoras en el Formulario de Vehículos

#### Manejo Mejorado de Errores

-   Validaciones del lado cliente antes de enviar datos
-   Mensajes de error específicos para diferentes tipos de errores:
    -   Violación de restricción UNIQUE (VIN o placas duplicadas)
    -   Violación de restricción CHECK (valores inválidos)
    -   Errores de clave foránea
    -   Errores generales de base de datos

#### Preparación Mejorada de Datos

-   Limpieza de espacios en blanco con `.trim()`
-   Conversión explícita de tipos de datos
-   Validación de rangos (año del vehículo)
-   Logging detallado para debugging

#### Mejoras en la UX

-   Etiquetas claras indicando campos opcionales
-   Texto de ayuda descriptivo para campos complejos
-   Mensajes de éxito y error más informativos

### 3. Campos Ahora Opcionales

Los siguientes campos ya no son obligatorios:

-   **VIN**: Puede ser registrado después
-   **Placas**: Puede ser registrado después
-   **Valor Estimado**: Puede ser estimado posteriormente
-   **Color**: Campo opcional
-   **Tamaño del Motor**: Campo opcional
-   **Kilometraje**: Campo opcional
-   **Kilometraje Anual**: Campo opcional

### 4. Campos Obligatorios

Solo los siguientes campos son obligatorios para crear un vehículo:

-   **Marca** (make)
-   **Modelo** (model)
-   **Año** (year) - validado entre 1990 y año actual + 1

## Cómo Probar la Solución

1. **Ejecutar el script de corrección de esquema** (solo si aún no se ha ejecutado):

    ```sql
    -- Ejecutar en el cliente de Supabase SQL
    \i scripts/fix-vehicles-schema.sql
    ```

2. **Probar el registro de vehículo**:

    - Navegar a `/customer/vehicles/new`
    - Llenar solo los campos obligatorios (Marca, Modelo, Año)
    - Dejar VIN y Placas vacíos
    - Enviar el formulario
    - Debe registrar exitosamente

3. **Probar validaciones**:
    - Intentar registrar sin marca o modelo → Error específico
    - Intentar registrar año inválido → Error específico
    - Intentar VIN o placas duplicadas → Error específico

## Archivos Modificados

1. `scripts/fix-vehicles-schema.sql` - Nuevo script para corregir esquema
2. `components/vehicles/vehicle-form.tsx` - Mejoras en manejo de errores y UX
3. `docs/VEHICLE_REGISTRATION_FIX.md` - Esta documentación

## Validación de la Solución

✅ **VIN opcional**: Se puede registrar vehículo sin VIN  
✅ **Placas opcionales**: Se puede registrar vehículo sin placas  
✅ **Valor estimado opcional**: Se puede registrar sin valor  
✅ **Campos obligatorios**: Marca, modelo y año son requeridos  
✅ **Validaciones**: Errores específicos para diferentes casos  
✅ **UX mejorada**: Etiquetas claras y mensajes informativos

## Consideraciones Futuras

-   Implementar validación de formato VIN (17 caracteres alfanuméricos)
-   Implementar validación de formato de placas según región
-   Agregar funcionalidad para editar vehículos existentes
-   Implementar búsqueda de vehículos por VIN o placas
