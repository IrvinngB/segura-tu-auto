# Instrucciones de Integración - Sistema de Notificaciones de Documentos

## 📋 **Resumen del Sistema Implementado**

Se ha creado un sistema completo de notificaciones que permite:

1. **Agentes** solicitan documentos adicionales a clientes
2. **Clientes** reciben notificaciones en tiempo real
3. **Modal de éxito** confirma al agente que la solicitud fue enviada
4. **Seguimiento** del estado de lectura de las notificaciones

---

## 🗄️ **Estructura de la Base de Datos**

**Ejecuta este SQL en Supabase:**

```sql
-- Ejecutar el contenido del archivo: sql/document_requests_table.sql
```

---

## 🔧 **Integración en Páginas del Cliente**

### 1. En el layout principal del cliente:

```tsx
// En app/customer/layout.tsx o donde tengas el header del cliente
import { DocumentRequestNotification } from '@/components/notifications/document-request-notification';

// Dentro del componente:
<DocumentRequestNotification customerId={customer.id} />;
```

### 2. En páginas específicas del cliente:

```tsx
// En app/customer/claims/page.tsx o similar
import { DocumentRequestNotification } from '@/components/notifications/document-request-notification';

export default function CustomerClaimsPage() {
  // ... tu código existente

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1>Mis Reclamaciones</h1>
        {/* Botón de notificaciones */}
        <DocumentRequestNotification customerId={customer.id} />
      </div>
      {/* Resto del contenido */}
    </div>
  );
}
```

---

## ✨ **Funcionalidades Implementadas**

### ✅ **Para Agentes:**

- Modal mejorado para solicitar documentos
- Modal de confirmación cuando se envía la solicitud
- Actualización automática del estado de la reclamación
- Lista visual de documentos solicitados

### ✅ **Para Clientes:**

- Notificaciones en tiempo real (usando Supabase Realtime)
- Badge con contador de notificaciones no leídas
- Modal detallado mostrando documentos solicitados
- Instrucciones adicionales del agente
- Navegación directa a la reclamación
- Marcado automático como "leído"

### ✅ **Características Técnicas:**

- **Tiempo real**: Las notificaciones aparecen instantáneamente
- **Seguridad**: RLS implementado (clientes solo ven sus notificaciones)
- **Performance**: Índices optimizados en la base de datos
- **UX**: Modales intuitivos y responsive
- **Persistencia**: Las notificaciones se guardan en BD

---

## 🚀 **Cómo Probar**

1. **Como Agente:**
   - Ve a una reclamación
   - Haz clic en "Solicitar Más Documentos"
   - Selecciona documentos y agrega notas
   - Verás el modal de éxito

2. **Como Cliente:**
   - Inicia sesión como cliente
   - Verás el botón "Notificaciones" con badge rojo
   - Haz clic para ver los documentos solicitados
   - Navega a la reclamación desde la notificación

---

## 📁 **Archivos Creados/Modificados:**

```
hooks/use-document-request-notifications.ts     # Hook para notificaciones
components/notifications/document-request-notification.tsx  # Componente principal
components/modals/document-request-success-modal.tsx      # Modal de éxito
components/claims/document-request-modal.tsx              # Modal mejorado (modificado)
sql/document_requests_table.sql                          # SQL para la tabla
```

---

## 🎯 **Próximos Pasos:**

1. **Ejecutar el SQL** en Supabase para crear la tabla
2. **Integrar el componente** en las páginas del cliente
3. **Probar el flujo completo** desde agente a cliente
4. **Personalizar estilos** si es necesario

¡El sistema está listo para usar! 🎉
