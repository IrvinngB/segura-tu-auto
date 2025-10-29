# Sistema de Reclamaciones Mejorado

Este documento describe las mejoras implementadas en el sistema de procesamiento de reclamaciones.

## 🚀 Nuevas Funcionalidades

### 1. Flujo de Estados Expandido

El sistema ahora incluye 10 estados diferentes para un seguimiento más detallado:

- **submitted** - Reclamación enviada inicialmente
- **under_review** - En proceso de revisión inicial
- **pending_documentation** - Esperando documentación adicional
- **waiting_approval** - Esperando aprobación de supervisor
- **investigating** - En proceso de investigación detallada
- **approved** - Aprobada para procesamiento
- **processing_payment** - Procesando el pago
- **denied** - Reclamación denegada
- **paid** - Pago realizado
- **closed** - Reclamación cerrada

### 2. Historial de Estados

- Seguimiento completo de todos los cambios de estado
- Registro automático con usuario y timestamp
- Razones opcionales para cada cambio
- Auditoría completa del flujo de la reclamación

### 3. Sistema de Comunicaciones

- Notas internas del equipo
- Registro de comunicaciones externas (email, teléfono, SMS)
- Historial completo de interacciones
- Estados de entrega y lectura

### 4. Sistema de Notificaciones

- Alertas para reclamaciones que requieren atención
- Categorización por urgencia (urgent, overdue, warning)
- Reglas basadas en tiempo en cada estado
- Integración con la navegación principal

### 5. Alertas Inteligentes

- **Urgentes**: Más de 7 días en cualquier estado
- **Vencidas**: Más de 5 días en estados críticos
- **Advertencia**: Más de 3 días en estados de espera

## 📋 Componentes Nuevos

### ClaimStatusHistory

- `components/claims/claim-status-history.tsx`
- Muestra el historial completo de cambios de estado
- Timeline visual con usuarios y timestamps

### ClaimCommunications

- `components/claims/claim-communications.tsx`
- Gestión de comunicaciones y notas internas
- Formulario para agregar nuevas comunicaciones

### ClaimAlerts

- `components/claims/claim-alerts.tsx`
- Sistema de alertas por tiempo en estado
- Categorización por prioridad

### Hooks de Notificaciones

- `hooks/use-claim-notifications.ts`
- Lógica para detectar y gestionar notificaciones
- Integración con el sidebar principal

## 🔧 Cambios en la Base de Datos

### Nueva Tabla: claim_status_history

```sql
CREATE TABLE claim_status_history (
    id uuid PRIMARY KEY,
    claim_id uuid REFERENCES claims(id),
    previous_status varchar NOT NULL,
    new_status varchar NOT NULL,
    changed_by uuid REFERENCES users(id),
    change_reason text,
    created_at timestamp DEFAULT now()
);
```

### Trigger Automático

Se creó un trigger que registra automáticamente todos los cambios de estado:

```sql
CREATE TRIGGER trigger_log_claim_status_change
    AFTER UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION log_claim_status_change();
```

### Tabla communications Actualizada

Se agregó el tipo 'internal' para notas internas del equipo.

## 🎨 Mejoras de UI/UX

### Interfaz de Procesamiento

- Selector mejorado con ancho fijo (w-64)
- Estados organizados por flujo lógico
- Botones de acción contextuales por estado

### Badges de Estado

Se agregaron nuevos estilos CSS para los estados adicionales:

```css
.badge-pending-documentation {
  /* Amarillo */
}
.badge-waiting-approval {
  /* Azul */
}
.badge-processing-payment {
  /* Púrpura */
}
```

### Layout Consistente

- Uso del patrón ProtectedRoute en todas las páginas
- Espaciado consistente entre sidebar y contenido principal
- Eliminación de botones duplicados

## 📊 Sistema de Permisos

### Por Rol de Usuario

- **Admin**: Acceso completo, puede reabrir reclamaciones cerradas
- **Adjuster**: Puede procesar y cambiar estados, acceso a investigación
- **Agent**: Puede revisar y cambiar estados básicos
- **Customer**: Solo lectura de sus propias reclamaciones

### Acciones Permitidas por Estado

Cada estado tiene acciones específicas disponibles según el rol del usuario.

## 🔍 Notificaciones y Alertas

### Integración con Sidebar

- Badge de notificaciones en el menú principal
- Contador de reclamaciones que requieren atención
- Enlaces directos a reclamaciones problemáticas

### Reglas de Tiempo

- Configurables por estado
- Escalamiento automático por tiempo transcurrido
- Priorización inteligente

## 📱 Tabs de Navegación

El detalle de reclamación ahora incluye 6 tabs principales:

1. **Detalles** - Información básica de la reclamación
2. **Procesamiento** - Herramientas para cambiar estados (solo roles autorizados)
3. **Evaluaciones** - Evaluaciones de daños y fotos
4. **Documentos** - Archivos adjuntos y documentación
5. **Comunicaciones** - Historial de comunicaciones y notas
6. **Historial** - Timeline completo de cambios de estado

## 🚀 Cómo Usar el Sistema

### Para Agentes

1. Revisar alertas en el dashboard principal
2. Acceder a reclamaciones prioritarias desde las notificaciones
3. Usar el tab de "Procesamiento" para cambiar estados
4. Agregar notas internas en "Comunicaciones"
5. Revisar el historial completo en "Historial"

### Para Ajustadores

1. Procesar reclamaciones en investigación
2. Agregar evaluaciones detalladas
3. Aprobar o denegar basado en investigación
4. Mantener comunicación clara con notas internas

### Para Administradores

1. Supervisar el flujo completo del sistema
2. Reabrir reclamaciones cerradas cuando sea necesario
3. Revisar métricas y tiempos de procesamiento
4. Gestionar escalamientos y casos complejos

## 🔧 Configuración Requerida

### Base de Datos

Ejecutar el script de migración:

```bash
psql -f scripts/update-claims-system.sql
```

### Dependencias

Asegurar que estén instaladas todas las dependencias necesarias:

- date-fns para manejo de fechas
- lucide-react para iconos
- Componentes UI actualizados

## 📈 Métricas y Seguimiento

El nuevo sistema permite rastrear:

- Tiempo promedio por estado
- Reclamaciones problemáticas
- Eficiencia del equipo
- Comunicaciones por caso
- Historial completo de auditoría

## 🔐 Seguridad

- Row Level Security (RLS) habilitado
- Políticas específicas por rol
- Auditoría completa de cambios
- Trigger automático para logging
- Validación de permisos en cada acción

## 📝 Próximos Pasos

1. Implementar métricas y reportes
2. Agregar notificaciones por email
3. Crear dashboard de analytics
4. Implementar flujos de aprobación automática
5. Agregar plantillas de comunicación

---

**¡El sistema de reclamaciones está ahora completamente funcional con todas las características solicitadas!**
