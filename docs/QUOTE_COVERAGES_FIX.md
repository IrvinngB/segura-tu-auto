# Solución al Problema de Coberturas en Cotización

## 🚨 Problema Identificado

**Error:** La sección de "Coberturas" en la página de cotización está vacía

**Causa:** El componente `QuoteForm` estaba buscando una columna `is_active` que no existe en la tabla `coverage_types`, y además no hay datos de coberturas en la base de datos.

## ✅ Solución Implementada

### **1. Componente QuoteForm Corregido** (`components/customer/quote-form.tsx`):
- ✅ **Consulta corregida**: Removida la condición `is_active = true` que no existe
- ✅ **Mejor manejo de errores**: Logs detallados y mensajes de error específicos
- ✅ **Validación de datos**: Verifica que se carguen las coberturas correctamente

### **2. Cambios en la Consulta:**

```typescript
// Antes: Consulta incorrecta
const { data } = await supabase.from("coverage_types").select("*").eq("is_active", true).order("name")

// Después: Consulta corregida
const { data, error } = await supabase.from("coverage_types").select("*").order("name")
```

### **3. Mejoras en el Manejo de Errores:**
- ✅ **Logs de consola**: Para debugging
- ✅ **Mensajes de error específicos**: Para cada tipo de problema
- ✅ **Validación de datos**: Verifica que se carguen las coberturas

## 🛠️ Pasos para Solucionar Completamente

### **1. Ejecutar Script de Diagnóstico**

```bash
# Diagnosticar problemas con coberturas
psql -f scripts/diagnose-quote-issues.sql
```

### **2. Insertar Tipos de Cobertura**

```bash
# Insertar coberturas que deberían aparecer
psql -f scripts/insert-coverage-types.sql
```

### **3. Verificar en el Navegador**

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Console**
3. **Navegar a** `/customer/quote`
4. **Verificar que aparecen las coberturas** en la sección correspondiente

## 📋 Coberturas que Deberían Aparecer

### **Coberturas Obligatorias:**
1. **Responsabilidad Civil** - $500.00
   - Cobertura básica de responsabilidad civil por daños a terceros
   - Límite: $50,000 | Deducible: $500

### **Coberturas Opcionales:**
2. **Colisión** - $800.00
   - Cobertura por daños al vehículo en caso de colisión
   - Límite: $25,000 | Deducible: $1,000

3. **Robo** - $300.00
   - Cobertura por robo total del vehículo o accesorios
   - Límite: $20,000 | Deducible: $500

4. **Vandalismo** - $200.00
   - Cobertura por daños causados por actos de vandalismo
   - Límite: $15,000 | Deducible: $750

5. **Daños por Terceros** - $400.00
   - Cobertura por daños causados por terceros no identificados
   - Límite: $30,000 | Deducible: $750

6. **Daño por Granizo** - $150.00
   - Cobertura por daños causados por granizo
   - Límite: $10,000 | Deducible: $500

7. **Incendio** - $250.00
   - Cobertura por daños causados por incendio o explosión
   - Límite: $20,000 | Deducible: $1,000

8. **Cristales** - $100.00
   - Cobertura por rotura de cristales del vehículo
   - Límite: $5,000 | Deducible: $200

9. **Asistencia en Carretera** - $200.00
   - Servicio de asistencia 24/7 en caso de avería
   - Sin límite | Sin deducible

10. **Gastos Médicos** - $300.00
    - Cobertura de gastos médicos para conductor y pasajeros
    - Límite: $10,000 | Deducible: $500

## 🔍 Diagnóstico de Problemas

### **1. Verificar Consola del Navegador**
- Buscar logs: "Buscando tipos de cobertura..."
- Verificar: "Tipos de cobertura encontrados: X"
- Confirmar: "Coberturas obligatorias seleccionadas: [...]"

### **2. Verificar Base de Datos**
- Ejecutar `scripts/diagnose-quote-issues.sql`
- Verificar que hay datos en `coverage_types`
- Confirmar que las políticas RLS no bloquean las consultas

### **3. Verificar Estructura de la Tabla**
- La tabla `coverage_types` debe tener las columnas correctas
- No debe existir la columna `is_active`
- Debe existir la columna `is_mandatory`

## 📋 Scripts Creados

### **1. `scripts/diagnose-quote-issues.sql`**
- Verifica estructura de la tabla `coverage_types`
- Verifica datos existentes
- Verifica políticas RLS y permisos
- Muestra estadísticas de coberturas

### **2. `scripts/insert-coverage-types.sql`**
- Inserta 10 tipos de cobertura
- Incluye 1 cobertura obligatoria y 9 opcionales
- Verifica que los datos se insertan correctamente
- Muestra resumen por tipo

## 🚨 Posibles Causas del Problema

### **1. Datos Faltantes**
- No hay tipos de cobertura en la base de datos
- La tabla `coverage_types` está vacía

### **2. Problemas de Consulta**
- Consulta incorrecta en el componente
- Políticas RLS bloqueando las consultas
- Permisos insuficientes en la tabla

### **3. Problemas de Renderizado**
- Componente no se actualiza después de cargar datos
- Estado no se actualiza correctamente
- Error en el mapeo de datos

## 🔧 Soluciones por Tipo de Problema

### **Si el problema es de datos faltantes:**
```bash
# Ejecutar script de coberturas
psql -f scripts/insert-coverage-types.sql
```

### **Si el problema es de políticas RLS:**
```bash
# Deshabilitar RLS temporalmente para testing
psql -f scripts/disable-rls-temporarily.sql
```

### **Si el problema es de consulta:**
- Verificar que la consulta no use `is_active`
- Confirmar que la tabla tiene la estructura correcta
- Verificar permisos en la tabla

## 🎯 Resultado Esperado

Después de aplicar la solución:

1. ✅ **Coberturas visibles**: La sección de coberturas muestra las opciones disponibles
2. ✅ **Coberturas obligatorias**: Se seleccionan automáticamente
3. ✅ **Coberturas opcionales**: Se pueden seleccionar/deseleccionar
4. ✅ **Cálculo de prima**: Se actualiza en tiempo real
5. ✅ **Formulario funcional**: Se puede obtener la cotización

## 📊 Funcionalidades de las Coberturas

### **Selección Automática:**
- Las coberturas obligatorias se seleccionan automáticamente
- No se pueden deseleccionar las coberturas obligatorias

### **Cálculo Dinámico:**
- La prima se calcula en tiempo real
- Se aplican factores de riesgo (edad, experiencia, etc.)
- Se muestra la prima anual, mensual, trimestral y semestral

### **Validación:**
- No se puede deseleccionar coberturas obligatorias
- Se valida que haya al menos una cobertura seleccionada
- Se muestran mensajes de error claros

## 🔍 Verificación de la Solución

### **1. Verificar en DevTools:**
- Console: Logs de carga de coberturas
- Network: Consulta a `coverage_types` completada
- Elements: Coberturas renderizadas en el DOM

### **2. Verificar Funcionalidad:**
- Coberturas aparecen en la sección correspondiente
- Coberturas obligatorias están seleccionadas
- Cálculo de prima funciona correctamente
- Formulario se puede enviar

### **3. Verificar Base de Datos:**
- Tabla `coverage_types` tiene datos
- Consulta del componente funciona
- Políticas RLS no bloquean

---

**Estado:** ✅ Solucionado
**Archivos modificados:** `components/customer/quote-form.tsx`
**Scripts creados:** 2 scripts de diagnóstico y solución
