# Solución al Error de Creación de Pólizas

## 🚨 Problema Identificado

**Error:** `Could not find the 'auto_renewal' column of 'policies' in the schema cache`

**Causa:** El componente `PolicyForm` estaba intentando insertar datos en una columna `auto_renewal` que no existía en la tabla `policies` de la base de datos.

## ✅ Solución Implementada

### **1. Esquema de Base de Datos Actualizado** (`scripts/database.sql`):
- ✅ **Agregada columna `auto_renewal`** a la tabla `policies`
- ✅ **Tipo BOOLEAN** con valor por defecto `false`
- ✅ **Posición correcta** en el esquema de la tabla

### **2. Script de Actualización Creado** (`scripts/add-auto-renewal-column.sql`):
- ✅ **Agrega la columna** a la base de datos existente
- ✅ **Actualiza registros existentes** con valor por defecto
- ✅ **Verifica la estructura** de la tabla

### **3. Componente PolicyForm Corregido** (`components/policies/policy-form.tsx`):
- ✅ **Consulta corregida**: Removida la condición `is_active = true` inexistente
- ✅ **Mejor manejo de errores**: Logs detallados y mensajes específicos
- ✅ **Debug info**: Información de depuración en desarrollo
- ✅ **Validación de datos**: Verifica que se carguen las coberturas correctamente

## 🛠️ Pasos para Aplicar la Solución

### **1. Actualizar la Base de Datos**

```bash
# Agregar la columna auto_renewal
psql -f scripts/add-auto-renewal-column.sql
```

### **2. Ejecutar Script de Diagnóstico**

```bash
# Diagnosticar problemas con pólizas
psql -f scripts/diagnose-policy-creation.sql
```

### **3. Insertar Datos de Prueba (Si es Necesario)**

```bash
# Insertar coberturas si no existen
psql -f scripts/insert-coverage-types.sql

# Insertar vehículos de prueba
psql -f scripts/insert-test-vehicles-for-quote.sql
```

### **4. Verificar en el Navegador**

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Console**
3. **Navegar a** `/customer/policies/new` o `/policies/new`
4. **Llenar el formulario** con datos válidos
5. **Hacer clic en "Crear Póliza"**
6. **Verificar que no hay errores** en la consola

## 🔍 Diagnóstico de Problemas

### **1. Verificar Consola del Navegador**
- **Antes**: `Could not find the 'auto_renewal' column of 'policies' in the schema cache`
- **Después**: Sin errores, póliza creada exitosamente

### **2. Verificar Debug Info (Desarrollo)**
En modo desarrollo, verás una sección de debug que muestra:
- Cliente seleccionado: Sí/No
- Vehículo seleccionado: Sí/No
- Coberturas seleccionadas: Número
- Loading: Sí/No
- Prima calculada: $Monto

### **3. Verificar Base de Datos**
- Ejecutar `scripts/diagnose-policy-creation.sql`
- Verificar que la columna `auto_renewal` existe
- Confirmar que hay datos en las tablas relacionadas

## 📋 Scripts Creados

### **1. `scripts/add-auto-renewal-column.sql`**
- Agrega la columna `auto_renewal` a la tabla `policies`
- Actualiza registros existentes con valor por defecto
- Verifica que la columna se agregó correctamente

### **2. `scripts/diagnose-policy-creation.sql`**
- Verifica estructura de las tablas relacionadas con pólizas
- Verifica datos existentes
- Verifica políticas RLS y permisos
- Muestra estadísticas de pólizas
- Verifica integridad referencial

## 🚨 Posibles Causas del Problema

### **1. Columna Faltante**
- La columna `auto_renewal` no existía en la tabla `policies`
- El componente intentaba insertar datos en una columna inexistente

### **2. Datos Faltantes**
- No hay tipos de cobertura en la base de datos
- No hay vehículos registrados
- No hay clientes registrados

### **3. Problemas de Consulta**
- Consulta incorrecta en el componente
- Políticas RLS bloqueando las consultas
- Permisos insuficientes en las tablas

## 🔧 Soluciones por Tipo de Problema

### **Si el problema es de columna faltante:**
```bash
# Ejecutar script de actualización
psql -f scripts/add-auto-renewal-column.sql
```

### **Si el problema es de datos faltantes:**
```bash
# Insertar coberturas
psql -f scripts/insert-coverage-types.sql

# Insertar vehículos de prueba
psql -f scripts/insert-test-vehicles-for-quote.sql
```

### **Si el problema es de políticas RLS:**
```bash
# Deshabilitar RLS temporalmente para testing
psql -f scripts/disable-rls-temporarily.sql
```

## 🎯 Resultado Esperado

Después de aplicar la solución:

1. ✅ **Sin errores**: No más `Could not find the 'auto_renewal' column`
2. ✅ **Póliza creada**: El botón "Crear Póliza" funciona correctamente
3. ✅ **Datos guardados**: La póliza se guarda en la base de datos
4. ✅ **Coberturas asociadas**: Se crean las coberturas de la póliza
5. ✅ **Experiencia fluida**: Proceso completo sin interrupciones

## 📊 Mejoras Implementadas

### **Esquema de Base de Datos:**
- ✅ **Columna auto_renewal**: Agregada a la tabla `policies`
- ✅ **Valor por defecto**: `false` para registros existentes
- ✅ **Tipo correcto**: BOOLEAN para valores true/false

### **Componente PolicyForm:**
- ✅ **Consulta corregida**: Removida condición `is_active` inexistente
- ✅ **Debug info**: Información de depuración en desarrollo
- ✅ **Mejor manejo de errores**: Logs detallados y mensajes específicos
- ✅ **Validación de datos**: Verifica que se carguen las coberturas

### **Scripts de Diagnóstico:**
- ✅ **Verificación completa**: Estructura, datos, permisos
- ✅ **Diagnóstico específico**: Problemas con creación de pólizas
- ✅ **Estadísticas**: Información detallada del estado

## 🔍 Verificación de la Solución

### **1. Verificar en DevTools:**
- Console: Sin errores de JavaScript
- Network: Solicitud de creación de póliza completada
- Elements: Página de resultado renderizada

### **2. Verificar Funcionalidad:**
- Formulario se envía correctamente
- Póliza se crea y guarda
- Coberturas se asocian correctamente
- Navegación funciona correctamente

### **3. Verificar Base de Datos:**
- Tabla `policies` tiene la columna `auto_renewal`
- Póliza se inserta correctamente
- Coberturas se asocian en `policy_coverages`
- Políticas RLS no bloquean

## 🚀 Próximos Pasos

### **1. Probar Funcionalidad Completa:**
- Llenar formulario con datos válidos
- Seleccionar cliente, vehículo y coberturas
- Crear póliza
- Verificar resultado

### **2. Probar Casos Edge:**
- Sin coberturas seleccionadas
- Sin vehículos registrados
- Datos inválidos
- Errores de red

### **3. Optimizar Experiencia:**
- Mejorar mensajes de error
- Agregar validaciones adicionales
- Optimizar rendimiento

---

**Estado:** ✅ Solucionado
**Archivos modificados:** `scripts/database.sql`, `components/policies/policy-form.tsx`
**Scripts creados:** 2 scripts de actualización y diagnóstico
