# Sistema de Cotizaciones con Aprobación de Agentes

## Resumen de Cambios Implementados

Se ha implementado un nuevo flujo de trabajo donde los clientes ya no pueden crear pólizas directamente. En su lugar, deben crear cotizaciones que requieren la aprobación de un agente antes de convertirse en pólizas.

## Nuevos Componentes y Funcionalidades

### 1. Base de Datos

-   **Nueva tabla `quotes`**: Almacena las cotizaciones de los clientes
-   **Campos principales**:
    -   `quote_number`: Número único de cotización
    -   `status`: `pending`, `approved`, `rejected`, `converted`
    -   `customer_id`, `vehicle_id`: Referencias al cliente y vehículo
    -   `agent_id`: Agente que revisó la cotización
    -   `selected_coverages`, `driver_data`, `vehicle_data`: Datos de la cotización
    -   `agent_notes`, `rejected_reason`: Notas del agente
    -   `expires_at`: Fecha de expiración (30 días por defecto)

### 2. API Endpoints

-   **`/api/quotes`** (GET/POST): Crear y listar cotizaciones
-   **`/api/quotes/[id]`** (PATCH): Aprobar/rechazar cotizaciones

### 3. Componentes de UI

#### Para Clientes:

-   **`QuoteList`**: Muestra las cotizaciones del cliente con su estado
-   **Página `/customer/quotes`**: Lista de cotizaciones del cliente
-   **Modificación del `QuoteForm`**: Ahora crea cotizaciones en lugar de redirigir a crear pólizas
-   **Página `/customer/policies/new`**: Bloqueada para clientes, redirige al flujo de cotizaciones

#### Para Agentes:

-   **`AgentQuoteManagement`**: Interfaz para gestionar cotizaciones
-   **Página `/quotes`**: Panel de gestión de cotizaciones para agentes
-   Funciones para aprobar/rechazar cotizaciones con notas

### 4. Flujo de Trabajo

1. **Cliente crea cotización**:

    - Selecciona vehículo registrado
    - Elige plan de cobertura
    - Sistema calcula prima
    - Se guarda como cotización `pending`

2. **Agente revisa cotización**:

    - Ve lista de cotizaciones pendientes
    - Puede ver detalles completos
    - Puede aprobar o rechazar con notas

3. **Aprobación**:

    - Si se aprueba: Se crea automáticamente la póliza
    - Status cambia a `converted`
    - Cliente puede ver su nueva póliza

4. **Rechazo**:
    - Status cambia a `rejected`
    - Se incluye motivo del rechazo
    - Cliente puede crear nueva cotización

### 5. Navegación Actualizada

-   **Para clientes**: "Mis Cotizaciones" y "Nueva Cotización"
-   **Para agentes**: "Cotizaciones" en el menú de gestión
-   **Agrupación**: Las cotizaciones aparecen en la sección principal del menú

### 6. Permisos y Seguridad

-   Row Level Security (RLS) implementado
-   Clientes solo ven sus propias cotizaciones
-   Solo agentes y admins pueden aprobar/rechazar
-   Validaciones en API para roles correctos

## Estados de Cotización

-   **`pending`**: Esperando revisión del agente
-   **`approved`**: Aprobada pero no convertida aún
-   **`rejected`**: Rechazada por el agente
-   **`converted`**: Convertida exitosamente a póliza

## Beneficios del Nuevo Sistema

1. **Control de calidad**: Los agentes revisan cada solicitud
2. **Mejor experiencia**: Proceso guiado y profesional
3. **Reducción de errores**: Validación experta antes de crear pólizas
4. **Trazabilidad**: Historial completo de cotizaciones y decisiones
5. **Flexibilidad**: Posibilidad de negociar términos antes de la creación

## Archivos Modificados/Creados

### Nuevos archivos:

-   `scripts/add-quotes-table.sql`
-   `app/api/quotes/route.ts`
-   `app/api/quotes/[id]/route.ts`
-   `components/customer/quote-list.tsx`
-   `components/quotes/agent-quote-management.tsx`
-   `app/customer/quotes/page.tsx`
-   `app/quotes/page.tsx`

### Archivos modificados:

-   `lib/types/database.ts` (agregado tipo Quote)
-   `components/customer/quote-form.tsx` (ahora crea cotizaciones)
-   `app/customer/policies/new/page.tsx` (bloqueada para clientes)
-   `components/navigation/role-based-sidebar.tsx` (navegación actualizada)

## Próximos Pasos Sugeridos

1. **Notificaciones**: Implementar sistema de notificaciones para informar a clientes sobre el estado de sus cotizaciones
2. **Dashboard mejorado**: Agregar métricas de cotizaciones pendientes para agentes
3. **Negociación**: Permitir que agentes modifiquen términos antes de aprobar
4. **Automatización**: Reglas automáticas de aprobación para casos simples
5. **Integración**: Conectar con sistema de pagos al aprobar cotizaciones
