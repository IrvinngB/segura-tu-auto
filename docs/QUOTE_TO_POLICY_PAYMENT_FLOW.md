# Flujo de Cotización a Póliza y Pagos

## Implementación del Flujo Completo de Aseguradora

### Fecha
9 de Octubre, 2025

## Descripción General

Se implementó el flujo completo desde que un cliente solicita una cotización hasta que puede pagar sus primas de póliza activa, todo integrado con la base de datos real.

## Flujo Implementado

### 1. **Cliente Solicita Cotización**
- **Página:** `/customer/quote`
- **Acción:** El cliente completa el formulario con:
  - Información del vehículo
  - Tipo de póliza (Básica, Limitada, Amplia)
  - Coberturas adicionales
  - Frecuencia de pago
  - Fechas de inicio y fin

### 2. **Cotización Creada en BD**
- **Tabla:** `quotes`
- **Estado inicial:** `pending`
- **Datos guardados:**
  - `customer_id`, `vehicle_id`
  - `policy_type`, `premium_amount`
  - `selected_coverages` (JSON)
  - `risk_assessment` (JSON)
  - `payment_frequency`

### 3. **Agente Revisa y Aprueba**
- **Página:** `/agent/quotes` o `/admin/dashboard`
- **API:** `PATCH /api/quotes/[id]`
- **Acción:** El agente puede:
  - ✅ **Aprobar** la cotización
  - ❌ **Rechazar** la cotización

### 4. **Creación Automática de Póliza (al aprobar)**
- **API:** `PATCH /api/quotes/[id]` con `action: "approve"`
- **Proceso:**
  1. Genera número único de póliza: `POL-{timestamp}-{random}`
  2. Crea registro en tabla `policies` con:
     - `status: "active"`
     - `policy_number`, `customer_id`, `vehicle_id`, `agent_id`
     - `policy_type`, `premium_amount`, `payment_frequency`
     - `start_date`, `end_date`, `auto_renewal`
     - `total_coverage_limit` (calculado de coberturas)
     - `risk_assessment`
  3. Crea registros en `policy_coverages` si hay coberturas seleccionadas
  4. Actualiza cotización a `status: "converted"`

### 5. **Póliza Aparece en "Mis Pólizas"**
- **Página:** `/customer/payments` → Tab "Mis Pólizas"
- **Datos mostrados:**
  - Número de póliza
  - Tipo de póliza
  - Vehículo asociado
  - Prima anual y mensual
  - Próxima fecha de pago
  - Cobertura total
  - Estado (Activa/Inactiva)

### 6. **Cliente Puede Pagar la Prima**
- **Componente:** `CustomerPaymentModal`
- **Flujo de pago:**
  1. Cliente selecciona póliza y presiona "Pagar Prima"
  2. Se abre modal con:
     - Monto a pagar
     - Métodos de pago guardados (desde `payment_methods` table)
     - Opción de agregar nuevo método
  3. Cliente confirma pago
  4. Se simula procesamiento (3 segundos, 95% éxito)
  5. Se guarda registro en tabla `payments`:
     - `policy_id`, `customer_id`
     - `payment_type: "premium"`
     - `amount`, `payment_method`
     - `payment_status: "completed"`
     - `payment_date`, `reference_number`
  6. Si guardó nuevo método, se crea en `payment_methods`

### 7. **Pago Aparece en Historial**
- **Página:** `/customer/payments` → Tab "Historial"
- **Datos mostrados:**
  - Fecha de pago
  - Número de póliza
  - Tipo de pago
  - Método de pago
  - Monto
  - Estado
  - Acciones (Descargar recibo, Ver detalles)

## Archivos Modificados/Creados

### API Routes
1. ✅ **`app/api/quotes/[id]/route.ts`**
   - Actualizado para calcular `total_coverage_limit`
   - Crear póliza con todos los campos necesarios
   - Incluir `payment_frequency` con valor por defecto

2. ✅ **`app/api/payment-methods/route.ts`** (NUEVO)
   - `GET`: Obtener métodos de pago del cliente
   - `POST`: Guardar nuevo método de pago

### Componentes
3. ✅ **`components/customer/customer-payment-modal.tsx`**
   - Cargar métodos de pago desde BD
   - Guardar nuevos métodos de pago
   - Procesar pagos y guardar en BD
   - Auto-seleccionar método primario

### Páginas
4. ✅ **`app/customer/payments/page.tsx`**
   - Tab "Mis Pólizas" con datos reales
   - Calcular dinámicamente:
     - Número de pólizas activas
     - Prima mensual total
     - Cobertura total
   - Botón "Pagar Prima" funcional

## Estructura de Datos

### Tabla `quotes`
```sql
- id (uuid)
- quote_number (varchar)
- customer_id (uuid)
- vehicle_id (uuid)
- policy_type (varchar)
- status (varchar) -- pending, converted, rejected
- premium_amount (numeric)
- selected_coverages (jsonb)
- payment_frequency (varchar)
- risk_assessment (jsonb)
```

### Tabla `policies`
```sql
- id (uuid)
- policy_number (varchar)
- customer_id (uuid)
- vehicle_id (uuid)
- agent_id (uuid)
- policy_type (varchar)
- status (varchar) -- active, suspended, cancelled, expired
- start_date (date)
- end_date (date)
- premium_amount (numeric)
- total_coverage_limit (numeric)
- payment_frequency (varchar)
- auto_renewal (boolean)
```

### Tabla `payments`
```sql
- id (uuid)
- policy_id (uuid)
- customer_id (uuid)
- payment_type (varchar) -- premium, claim, refund, fee
- amount (numeric)
- payment_method (varchar)
- payment_status (varchar) -- completed, pending, failed
- payment_date (timestamp)
- reference_number (varchar)
- transaction_id (varchar)
```

### Tabla `payment_methods`
```sql
- id (uuid)
- customer_id (uuid)
- type (varchar) -- credit_card, debit_card, bank_account
- name (varchar)
- last_four (varchar)
- expiry_date (varchar)
- is_primary (boolean)
- is_active (boolean)
```

## Características Implementadas

### ✅ Datos Reales de la Base de Datos
- Todas las pólizas, pagos y métodos de pago vienen de la BD
- No hay datos hardcodeados
- Cálculos dinámicos en tiempo real

### ✅ Cálculos Automáticos
- **Total Coverage Limit:** Suma de límites de todas las coberturas seleccionadas
- **Prima Mensual:** `premium_amount / 12`
- **Próximo Pago:** Basado en `end_date` y `auto_renewal`

### ✅ Flujo Completo
1. Cotización → Aprobación → Póliza Activa → Pago → Historial

### ✅ Métodos de Pago
- Cargar métodos guardados
- Agregar nuevos métodos
- Marcar como primario
- Usar en pagos futuros

### ✅ Validaciones
- Validación de tarjetas (algoritmo de Luhn)
- Validación de fechas de expiración
- Validación de CVV
- Validación de campos requeridos

## Próximas Mejoras Sugeridas

1. **Recordatorios de Pago:**
   - Notificaciones automáticas antes del vencimiento
   - Email/SMS de recordatorio

2. **Autopago:**
   - Configurar débito automático
   - Cargar automáticamente con método primario

3. **Pagos Parciales:**
   - Permitir pagos en cuotas
   - Planes de pago personalizados

4. **Recibos y Comprobantes:**
   - Generar PDF de recibos
   - Enviar por email automáticamente

5. **Dashboard de Pagos:**
   - Gráficos de historial de pagos
   - Proyecciones de gastos anuales

6. **Integración con Pasarelas de Pago Reales:**
   - Stripe, PayPal, etc.
   - Procesamiento real de tarjetas

## Testing

Para probar el flujo completo:

1. **Login como Cliente**
2. **Crear cotización** en `/customer/quote`
3. **Esperar aprobación** o login como agente
4. **Como Agente:** Aprobar cotización en `/agent/quotes`
5. **Como Cliente:** Ver póliza en `/customer/payments` → Tab "Mis Pólizas"
6. **Pagar prima** usando el botón "Pagar Prima"
7. **Ver historial** en Tab "Historial"

## Notas Técnicas

- Todos los endpoints usan autenticación de Supabase
- Los pagos se simulan (3 seg, 95% éxito)
- Las transacciones generan IDs únicos
- Los métodos de pago se encriptan en producción (recomendado)
- Las pólizas se crean con `status: "active"` por defecto

## Seguridad

⚠️ **Importante en Producción:**
- Nunca guardar CVV completo
- Encriptar números de tarjeta completos
- Usar tokens de pasarelas de pago
- Implementar 2FA para pagos grandes
- Auditar todas las transacciones
- Limitar intentos de pago fallidos

