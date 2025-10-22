# Funcionalidad de Renovación de Pólizas - SeguraTuAuto

## 🚀 Funcionalidad Implementada

Se ha implementado un sistema completo de renovación de pólizas que incluye:

### ✅ Componentes Creados

1. **PolicyRenewal** (`components/policies/policy-renewal.tsx`)
   - Modal completo para proceso de renovación
   - Flujo paso a paso: Revisión → Confirmación → Procesamiento → Éxito
   - Cálculo automático de nueva prima (incremento 5% anual)
   - Generación de nuevo número de póliza
   - Copia de coberturas de la póliza anterior

2. **RenewalNotificationsPanel** (`components/policies/renewal-notifications-panel.tsx`)
   - Panel de notificaciones para el dashboard del cliente
   - Estadísticas rápidas de pólizas (activas, por vencer, vencidas, renovables)
   - Categorización de notificaciones por urgencia
   - Botones de acción para renovar o recordar después

3. **Hook usePolicyRenewalNotifications** (`hooks/use-policy-renewal-notifications.ts`)
   - Gestión de estado para notificaciones de renovación
   - Clasificación automática de pólizas según fechas
   - Actualización automática cada 5 minutos
   - Estadísticas de renovación

### 🔧 Modificaciones Realizadas

1. **Dashboard del Cliente** (`app/customer/dashboard/page.tsx`)
   - Integración del panel de notificaciones de renovación
   - Gestión del customerId para el panel

2. **Lista de Pólizas** (`components/policies/policy-list.tsx`)
   - Botón de renovación para pólizas vencidas
   - Modal de renovación integrado
   - Indicadores visuales mejorados

### 📋 Scripts de Prueba

1. **SQL Script** (`scripts/insert-expired-policy.sql`)
   - Script completo para insertar póliza vencida en base de datos
   - Incluye usuario, cliente, vehículo, póliza y coberturas de prueba

2. **Browser Script** (`scripts/insert-expired-policy-browser.js`)
   - Script para ejecutar en la consola del navegador
   - Inserta póliza vencida para el usuario logueado

## 🧪 Cómo Probar la Funcionalidad

### Paso 1: Ejecutar el Servidor
```bash
npm run dev
```
El servidor estará disponible en http://localhost:3001

### Paso 2: Autenticarse en el Sistema
1. Navegar a http://localhost:3001/login
2. Iniciar sesión con credenciales de cliente

### Paso 3: Insertar Póliza Vencida de Prueba

**Opción A - Script en Navegador (Recomendado):**
1. Abrir las herramientas de desarrollador (F12)
2. Ir a la pestaña "Console"
3. Copiar y pegar el contenido del archivo `scripts/insert-expired-policy-browser.js`
4. Presionar Enter para ejecutar
5. El script creará automáticamente una póliza vencida para el usuario logueado

**Opción B - Script SQL (Requiere acceso directo a BD):**
1. Ejecutar el archivo `scripts/insert-expired-policy.sql` en la base de datos
2. Esto creará un usuario de prueba con email `cliente.test@example.com`

### Paso 4: Verificar la Funcionalidad

1. **Dashboard del Cliente:**
   - Recargar la página del dashboard
   - Verificar que aparezca el panel de "Notificaciones de Renovación"
   - Debe mostrar estadísticas y notificación de póliza vencida

2. **Proceso de Renovación:**
   - Hacer clic en "Renovar Ahora" en la notificación
   - Seguir el flujo completo del modal de renovación:
     - **Paso 1:** Revisar detalles de póliza vencida vs nueva
     - **Paso 2:** Confirmar términos y condiciones
     - **Paso 3:** Procesamiento automático
     - **Paso 4:** Confirmación de éxito

3. **Lista de Pólizas:**
   - Ir a la sección de pólizas
   - Verificar botón de renovación (ícono ↻) para pólizas vencidas
   - Probar el flujo de renovación desde allí también

## 📊 Características del Sistema

### Tipos de Notificaciones
- **🔴 Vencidas:** Pólizas vencidas (hasta 90 días de gracia)
- **🟡 Por Vencer:** Pólizas que vencen en 30 días o menos
- **🔵 Renovables:** Pólizas que pueden renovarse anticipadamente (60 días antes)

### Proceso de Renovación
1. **Validación:** Verificar que la póliza sea renovable
2. **Cálculo:** Nueva prima con incremento del 5% anual
3. **Generación:** Nuevo número de póliza (formato: `ORIGINAL-R2025`)
4. **Migración:** Copia de todas las coberturas de la póliza anterior
5. **Actualización:** Cambio de estado de póliza anterior a "expired"
6. **Comunicación:** Registro automático de comunicación al cliente

### Características Técnicas
- **Tiempo Real:** Actualizaciones automáticas cada 5 minutos
- **Responsive:** Diseño adaptable a móviles y escritorio
- **Accesibilidad:** Componentes con ARIA labels y navegación por teclado
- **Performance:** Consultas optimizadas y cache de datos
- **UX:** Flujo intuitivo con feedback visual inmediato

## 🎯 Datos de Prueba Creados

Al ejecutar el script de prueba se crea:

- **Usuario:** cliente.test@example.com (si usa script SQL)
- **Vehículo:** Toyota Corolla 2019, placa ABC-123
- **Póliza Vencida:** 
  - Tipo: Amplia
  - Prima: $850,000 - $980,000 COP
  - Vencimiento: Hace 15-20 días
  - Estado: Expired
- **Coberturas:** Responsabilidad Civil, Daños Propios, Robo Total, Asistencia Vial

## 🔄 Flujo de Renovación Completo

```
Póliza Vencida
     ↓
Notificación en Dashboard
     ↓
Usuario hace clic "Renovar"
     ↓
Modal de Renovación
     ↓
Revisión de Términos
     ↓
Confirmación
     ↓
Procesamiento Automático
     ↓
Nueva Póliza Activa
     ↓
Notificación de Éxito
```

## 🛠️ Estructura de Archivos

```
├── components/
│   └── policies/
│       ├── policy-renewal.tsx (Modal de renovación)
│       ├── renewal-notifications-panel.tsx (Panel de notificaciones)
│       └── policy-list.tsx (Lista con botón de renovación)
├── hooks/
│   └── use-policy-renewal-notifications.ts (Hook para notificaciones)
├── app/
│   └── customer/
│       └── dashboard/
│           └── page.tsx (Dashboard con panel integrado)
└── scripts/
    ├── insert-expired-policy.sql (Script SQL)
    └── insert-expired-policy-browser.js (Script navegador)
```

## 💡 Próximas Mejoras

- [ ] Integración con pasarela de pagos real
- [ ] Notificaciones por email automáticas
- [ ] Historial de renovaciones
- [ ] Descuentos por renovación anticipada
- [ ] Renovación automática configurable
- [ ] Recordatorios programados