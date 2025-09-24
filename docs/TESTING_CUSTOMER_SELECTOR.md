# Test del Selector de Clientes para Agentes

## 🧪 Pasos para Probar la Funcionalidad

### 1. Preparación de Datos

```bash
# Ejecutar el script de datos de prueba en Supabase
# Conectar a tu base de datos y ejecutar:
# scripts/create-test-customers.sql
```

### 2. Acceso como Agente

1. Ir a http://localhost:3002
2. Hacer login como **agente** (rol: agent)
3. Navegar a `/claims`
4. Hacer clic en "Nueva Reclamación"

### 3. Pruebas a Realizar

#### ✅ Test 1: Selector de Clientes Visible

-   **Esperado**: Ver el campo "Cliente \*" en la parte superior del formulario
-   **Comportamiento**: Solo visible para agentes, no para customers

#### ✅ Test 2: Carga de Clientes

-   **Esperado**: Al abrir el dropdown, ver lista de clientes con:
    -   Nombre completo
    -   Email
    -   Icono de usuario
-   **Estado de carga**: Mostrar "Cargando clientes..." si es necesario

#### ✅ Test 3: Selección de Cliente

-   **Acción**: Seleccionar un cliente
-   **Esperado**:
    -   Confirmación visual del cliente seleccionado
    -   Activación automática del selector de pólizas
    -   Reset de cualquier póliza previamente seleccionada

#### ✅ Test 4: Carga de Pólizas

-   **Esperado**: Después de seleccionar cliente, ver:
    -   "Cargando pólizas..." (si hay delay)
    -   Lista de pólizas activas del cliente
    -   Información del vehículo en cada póliza

#### ✅ Test 5: Cliente sin Pólizas

-   **Acción**: Seleccionar cliente sin pólizas activas
-   **Esperado**: Mensaje "No hay pólizas activas para este cliente"

#### ✅ Test 6: Cambio de Cliente

-   **Acción**: Cambiar de cliente después de haber seleccionado uno
-   **Esperado**:
    -   Pólizas se actualizan automáticamente
    -   Selección de póliza se resetea
    -   Nueva información del cliente seleccionado

#### ✅ Test 7: Validación de Formulario

-   **Acción**: Intentar enviar sin seleccionar cliente
-   **Esperado**: Error "Debe seleccionar un cliente"
-   **Acción**: Intentar enviar sin seleccionar póliza
-   **Esperado**: Error "Debe seleccionar una póliza"

#### ✅ Test 8: Envío Exitoso

-   **Acción**: Completar formulario con cliente y póliza seleccionados
-   **Esperado**:
    -   Reclamación creada correctamente
    -   Usar `selectedCustomer` en lugar de `customerId`
    -   Mensaje de éxito mostrado

### 4. Comparación con Customer

#### Test como Customer

1. Login como customer
2. Ir a `/customer/claims/new`
3. **Esperado**:
    - NO ver selector de clientes
    - Solo ver selector de pólizas (propias)
    - Funcionamiento normal sin cambios

### 5. Estados de Error a Probar

#### No hay clientes

-   **Escenario**: Base de datos sin clientes
-   **Esperado**: "No hay clientes disponibles"

#### Error de conexión

-   **Escenario**: Simular error de red
-   **Esperado**: "Error cargando clientes"

#### Sin pólizas

-   **Escenario**: Cliente sin pólizas
-   **Esperado**: "No hay pólizas activas para este cliente"

## 📊 Checklist de Verificación

-   [ ] Selector visible solo para agentes
-   [ ] Lista de clientes se carga correctamente
-   [ ] Información del cliente se muestra completa
-   [ ] Pólizas se cargan al seleccionar cliente
-   [ ] Estados de carga funcionan
-   [ ] Validaciones funcionan correctamente
-   [ ] Envío de reclamación funciona
-   [ ] Customer flow no afectado
-   [ ] Mensajes de error apropiados
-   [ ] UI responsive y accesible

## 🐛 Problemas Conocidos a Verificar

1. **Performance**: Con muchos clientes, podría ser lento
2. **Memory**: Lista de clientes se carga completa en memoria
3. **Permisos**: Verificar que agentes solo vean clientes permitidos
4. **Cache**: Verificar que datos se actualicen correctamente

## 🔧 Debug Tips

### Console Logs Útiles

```javascript
// En el navegador, verificar:
console.log("Customers loaded:", customers);
console.log("Selected customer:", selectedCustomer);
console.log("Policies for customer:", policies);
```

### Verificar en Supabase

```sql
-- Verificar clientes creados
SELECT u.email, u.first_name, u.last_name, c.id
FROM users u
JOIN customers c ON u.id = c.user_id
LIMIT 10;

-- Verificar pólizas activas
SELECT p.policy_number, c.id as customer_id, p.status
FROM policies p
JOIN customers c ON p.customer_id = c.id
WHERE p.status = 'active'
LIMIT 10;
```

---

**🎯 Objetivo**: Verificar que el selector funcione perfectamente para agentes sin afectar el flujo de customers.
