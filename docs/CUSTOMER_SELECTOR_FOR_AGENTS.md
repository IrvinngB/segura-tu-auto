# Selector de Clientes para Agentes - Nueva Funcionalidad

## 📋 Descripción

Se ha implementado un selector de clientes en el formulario de nueva reclamación para que los **agentes** puedan:

1. **Seleccionar un cliente** de una lista desplegable
2. **Ver las pólizas activas** del cliente seleccionado
3. **Procesar reclamaciones** en nombre de cualquier cliente

## 🚀 Funcionalidades Implementadas

### ✅ Selector de Clientes

-   **Visible solo para agentes** (cuando no hay `customerId`)
-   **Lista todos los clientes** con nombre completo y email
-   **Búsqueda y filtrado** a través del componente Select
-   **Icono visual** (Users) para mejor UX

### ✅ Carga Dinámica de Pólizas

-   Las **pólizas se cargan automáticamente** al seleccionar un cliente
-   **Reset de selección de póliza** al cambiar de cliente
-   **Estados de carga** visuales para mejor feedback
-   **Validación** de pólizas activas únicamente

### ✅ Validación y Estados

-   **Validación en cascada**: Cliente → Póliza → Formulario
-   **Mensajes informativos** según el estado
-   **Estados de carga** para clientes y pólizas
-   **Feedback visual** del cliente seleccionado

## 🎯 Flujo de Usuario (Agente)

1. **Abrir formulario** de nueva reclamación
2. **Seleccionar cliente** del dropdown
3. **Esperar carga** de pólizas automática
4. **Seleccionar póliza** del cliente
5. **Completar formulario** normalmente
6. **Enviar reclamación**

## 🔧 Componentes Modificados

### `components/claims/claim-form.tsx`

-   ✅ Agregado estado `customers` y `selectedCustomer`
-   ✅ Nueva función `fetchCustomers()`
-   ✅ Lógica condicional para mostrar selector
-   ✅ Estados de carga para mejor UX
-   ✅ Validación actualizada para usar `selectedCustomer`

### Estados Agregados

```typescript
const [customers, setCustomers] = useState<Customer[]>([]);
const [selectedCustomer, setSelectedCustomer] = useState(customerId || "");
const [loadingCustomers, setLoadingCustomers] = useState(false);
const [loadingPolicies, setLoadingPolicies] = useState(false);
```

## 🎨 Mejoras de UI/UX

### Placeholders Inteligentes

-   "Seleccionar cliente" (inicial)
-   "Cargando clientes..." (durante carga)
-   "Primero seleccione un cliente" (sin cliente)
-   "Cargando pólizas..." (cargando)
-   "No hay pólizas activas para este cliente" (sin pólizas)

### Información del Cliente

-   **Nombre completo** como título principal
-   **Email** como información secundaria
-   **Icono Users** para identificación visual
-   **Confirmación** del cliente seleccionado

## 🧪 Testing

### Datos de Prueba

Ejecutar `scripts/create-test-customers.sql` para crear:

-   Juan Pérez (cliente1@test.com)
-   María González (cliente2@test.com)
-   Carlos López (cliente3@test.com)

### Casos de Prueba

1. **Agente sin clientes**: Verificar mensaje apropiado
2. **Selección de cliente**: Verificar carga de pólizas
3. **Cliente sin pólizas**: Verificar mensaje informativo
4. **Cambio de cliente**: Verificar reset de póliza
5. **Submit exitoso**: Verificar creación correcta

## 🚨 Validaciones

### Antes del Submit

-   ✅ Cliente seleccionado (obligatorio para agentes)
-   ✅ Póliza seleccionada
-   ✅ Datos del formulario completos

### Mensajes de Error

-   "Debe seleccionar un cliente"
-   "Debe seleccionar una póliza"
-   "Error cargando clientes"
-   "Error cargando pólizas"

## 🔒 Permisos y Roles

### Clientes (`customerId` presente)

-   ✅ **No ven** el selector de clientes
-   ✅ **Solo ven** sus propias pólizas
-   ✅ **Flujo normal** sin cambios

### Agentes (`customerId` ausente)

-   ✅ **Ven** el selector de clientes
-   ✅ **Pueden seleccionar** cualquier cliente
-   ✅ **Ven todas** las pólizas del cliente seleccionado

## 📍 URLs de Testing

-   **Agentes**: `/claims` (después de login como agente)
-   **Clientes**: `/customer/claims/new` (después de login como customer)

## 🎯 Próximas Mejoras Posibles

-   [ ] **Búsqueda avanzada** de clientes por nombre/email
-   [ ] **Filtros** por estado de cliente
-   [ ] **Información adicional** del cliente en tooltip
-   [ ] **Historial reciente** de clientes utilizados
-   [ ] **Validación de permisos** específicos por cliente

---

**✅ Estado**: Implementación completa y funcional
**🚀 Servidor**: http://localhost:3002
**📅 Fecha**: Septiembre 2025
