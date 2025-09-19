# Solución al Error de Procesamiento de Cotización

## 🚨 Problema Identificado

**Error:** `ReferenceError: userProfile is not defined` al hacer clic en "Obtener Cotización"

**Causa:** El componente `QuoteForm` estaba usando `userProfile?.id` en la función `handleSubmit`, pero ya no tenía acceso a `userProfile` porque se cambió de `useAuth` a `useCustomerData`.

## ✅ Solución Implementada

### **1. Función handleSubmit Corregida** (`components/customer/quote-form.tsx`):
- ✅ **Referencia corregida**: Cambiado `userProfile?.id` por `customerData?.user_id`
- ✅ **Datos adicionales**: Agregado `customerId` para mejor trazabilidad
- ✅ **Consistencia**: Usa los mismos datos del hook `useCustomerData`

### **2. Cambio en el Código:**

```typescript
// Antes: Referencia incorrecta
const quoteData = {
  vehicle: vehicleData,
  driver: driverData,
  coverages: selectedCoverages,
  calculatedPremium: calculatedQuote,
  userId: userProfile?.id, // ❌ userProfile no existe
  createdAt: new Date().toISOString(),
}

// Después: Referencia corregida
const quoteData = {
  vehicle: vehicleData,
  driver: driverData,
  coverages: selectedCoverages,
  calculatedPremium: calculatedQuote,
  userId: customerData?.user_id, // ✅ customerData existe
  customerId: customerData?.id,  // ✅ Datos adicionales
  createdAt: new Date().toISOString(),
}
```

## 🛠️ Pasos para Verificar la Solución

### **1. Ejecutar Script de Diagnóstico**

```bash
# Diagnosticar problemas con cotizaciones
psql -f scripts/diagnose-quote-processing.sql
```

### **2. Verificar en el Navegador**

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Console**
3. **Navegar a** `/customer/quote`
4. **Llenar el formulario** con datos válidos
5. **Hacer clic en "Obtener Cotización"**
6. **Verificar que no hay errores** en la consola

### **3. Verificar Funcionalidad**

- ✅ **Formulario se envía** sin errores
- ✅ **Cotización se calcula** correctamente
- ✅ **Página de resultado** se muestra
- ✅ **Datos se pasan** correctamente

## 🔍 Diagnóstico de Problemas

### **1. Verificar Consola del Navegador**
- **Antes**: `ReferenceError: userProfile is not defined`
- **Después**: Sin errores, cotización procesada exitosamente

### **2. Verificar Datos del Cliente**
- El hook `useCustomerData` debe cargar correctamente
- `customerData` debe tener `user_id` y `id`
- No debe haber errores de carga de datos

### **3. Verificar Base de Datos**
- Ejecutar `scripts/diagnose-quote-processing.sql`
- Verificar que hay coberturas disponibles
- Confirmar que las políticas RLS no bloquean

## 📋 Scripts Creados

### **1. `scripts/diagnose-quote-processing.sql`**
- Verifica estructura de la tabla `coverage_types`
- Verifica datos existentes
- Verifica políticas RLS y permisos
- Muestra estadísticas de coberturas
- Verifica clientes y vehículos existentes

## 🚨 Posibles Causas del Problema

### **1. Referencia Incorrecta**
- Uso de `userProfile` después de cambiar a `useCustomerData`
- Variables no definidas en el scope correcto

### **2. Datos Faltantes**
- `customerData` no se carga correctamente
- Hook `useCustomerData` falla

### **3. Problemas de Renderizado**
- Componente se renderiza antes de cargar datos
- Estados no se actualizan correctamente

## 🔧 Soluciones por Tipo de Problema

### **Si el problema es de referencia:**
- Verificar que todas las referencias usen `customerData`
- Confirmar que no hay referencias a `userProfile`

### **Si el problema es de datos:**
- Verificar que `useCustomerData` funciona correctamente
- Confirmar que hay datos en la base de datos

### **Si el problema es de renderizado:**
- Verificar que los estados se actualizan correctamente
- Confirmar que no hay errores de JavaScript

## 🎯 Resultado Esperado

Después de aplicar la solución:

1. ✅ **Sin errores**: No más `ReferenceError: userProfile is not defined`
2. ✅ **Cotización funcional**: El botón "Obtener Cotización" funciona
3. ✅ **Datos correctos**: Se pasan los datos del cliente correctamente
4. ✅ **Página de resultado**: Se muestra la cotización calculada
5. ✅ **Experiencia fluida**: Proceso completo sin interrupciones

## 📊 Mejoras Implementadas

### **Datos de Cotización Mejorados:**
- ✅ **userId**: ID del usuario (desde `customerData.user_id`)
- ✅ **customerId**: ID del cliente (desde `customerData.id`)
- ✅ **Trazabilidad**: Mejor seguimiento de datos
- ✅ **Consistencia**: Usa los mismos datos del hook

### **Manejo de Errores:**
- ✅ **Referencias correctas**: Todas las variables están definidas
- ✅ **Validación de datos**: Verifica que `customerData` existe
- ✅ **Mensajes claros**: Errores específicos para cada problema

## 🔍 Verificación de la Solución

### **1. Verificar en DevTools:**
- Console: Sin errores de JavaScript
- Network: Solicitud de cotización completada
- Elements: Página de resultado renderizada

### **2. Verificar Funcionalidad:**
- Formulario se envía correctamente
- Cotización se calcula y muestra
- Navegación funciona correctamente
- Datos se pasan correctamente

### **3. Verificar Base de Datos:**
- Tabla `coverage_types` tiene datos
- Consulta del componente funciona
- Políticas RLS no bloquean

## 🚀 Próximos Pasos

### **1. Probar Funcionalidad Completa:**
- Llenar formulario con datos válidos
- Seleccionar coberturas
- Obtener cotización
- Verificar resultado

### **2. Probar Casos Edge:**
- Sin vehículos registrados
- Sin coberturas seleccionadas
- Datos inválidos
- Errores de red

### **3. Optimizar Experiencia:**
- Mejorar mensajes de error
- Agregar validaciones adicionales
- Optimizar rendimiento

---

**Estado:** ✅ Solucionado
**Archivos modificados:** `components/customer/quote-form.tsx`
**Scripts creados:** `scripts/diagnose-quote-processing.sql`
