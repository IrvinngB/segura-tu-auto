# 🐛 Guía para Resolver el Error de Solicitud de Documentos

## 📋 Problema Reportado

- **Error:** Ocurre cuando se hace clic en "Solicitar Más Documentos"
- **Contexto:** Sistema de reclamaciones con roles de agente y evaluador
- **Estado:** El botón debería cambiar el estado de la reclamación a `pending_documentation`

## 🔧 Soluciones Implementadas

### 1. Modal Mejorado de Solicitud de Documentos

- **Archivo:** `components/claims/document-request-modal.tsx`
- **Mejoras:**
  - ✅ Selección específica de tipos de documentos
  - ✅ Manejo de errores detallado con logs en consola
  - ✅ Validación de parámetros de entrada
  - ✅ Registro automático de comunicaciones
  - ✅ Feedback visual al usuario

### 2. Reemplazo de Botones Simples

- **Archivo:** `app/claims/[id]/page.tsx`
- **Cambios:**
  - ❌ Removidos botones simples que causaban errores
  - ✅ Implementado modal interactivo
  - ✅ Corregidos tipos de TypeScript
  - ✅ Manejo consistente de parámetros de ruta

### 3. Página de Pruebas

- **Archivo:** `app/test-document-request/page.tsx`
- **Funciones:**
  - 🧪 Prueba directa de actualización de estado
  - 🎯 Verificación de existencia de reclamaciones
  - 📊 Logs detallados en consola
  - 🔍 Diagnóstico de errores específicos

## 🚀 Cómo Probar las Correcciones

### Paso 1: Acceso a Herramientas de Prueba

```
http://localhost:3000/test-document-request
```

### Paso 2: Obtener ID de Reclamación

1. Ve a cualquier reclamación existente
2. Copia el ID de la URL (ej: `/claims/12345678-1234-1234-1234-123456789012`)
3. Usa solo la parte del UUID

### Paso 3: Prueba Directa

1. Pega el ID en el campo correspondiente
2. Haz clic en "🔧 Prueba Directa"
3. Revisa el resultado y los logs en consola

### Paso 4: Prueba del Modal

1. Haz clic en "🎯 Preparar Modal"
2. Aparecerá el botón del modal mejorado
3. Haz clic en "📄 Probar Modal de Solicitud de Documentos"
4. Selecciona documentos y agrega notas
5. Haz clic en "Solicitar Documentos"

## 📊 Script de Diagnóstico SQL

- **Archivo:** `scripts/diagnose-document-request-error.sql`
- **Uso:** Ejecutar en Supabase SQL Editor para verificar:
  - ✅ Estados válidos en constraints
  - ✅ Estructura de tablas
  - ✅ Permisos RLS
  - ✅ Foreign keys

## 🔍 Logs de Depuración

### En la Consola del Navegador (F12)

```
🔄 Solicitando documentos para reclamación: [ID]
📄 Documentos solicitados: [array]
📝 Notas: [texto]
✅ Estado de reclamación actualizado a pending_documentation
✅ Comunicación registrada
```

### Errores Comunes y Soluciones

```
❌ Error actualizando reclamación: [mensaje]
   → Verificar permisos de usuario
   → Confirmar que el ID existe
   → Revisar constraints de base de datos

⚠️ Error creando comunicación: [mensaje]
   → No crítico - el estado principal se actualiza
   → Verificar tabla communications
```

## 🎯 Resultado Esperado

### Antes (Problemático)

- ❌ Error al hacer clic en botón simple
- ❌ Sin feedback específico al usuario
- ❌ Sin registro de qué documentos se solicitan

### Después (Solucionado)

- ✅ Modal interactivo con selección de documentos
- ✅ Manejo robusto de errores con logs detallados
- ✅ Registro automático de comunicaciones
- ✅ Feedback claro al usuario sobre el resultado
- ✅ Estados de reclamación actualizados correctamente

## 🔄 Próximos Pasos

1. **Probar en desarrollo** usando `/test-document-request`
2. **Verificar logs** en consola del navegador
3. **Confirmar actualización** de estados en base de datos
4. **Validar notificaciones** al cliente (opcional)
5. **Remover página de pruebas** cuando todo funcione correctamente

## 📞 Si Persisten los Errores

1. Revisar permisos RLS en Supabase
2. Verificar autenticación de usuario
3. Confirmar que el usuario tiene rol de `agent` o `adjuster`
4. Ejecutar script de diagnóstico SQL
5. Revisar logs del servidor en Supabase Dashboard
