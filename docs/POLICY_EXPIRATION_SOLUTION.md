# Solución al Problema de Pólizas Vencidas

## 🚨 Problema Identificado

Las pólizas que han pasado su fecha de vencimiento (`end_date`) no se actualizan automáticamente a estado "expired" (vencida). Esto causa que:

-   Pólizas vencidas aparezcan como "Activa" en el dashboard
-   Los usuarios vean información incorrecta sobre el estado de sus pólizas
-   No hay proceso automático para gestionar el ciclo de vida de las pólizas

## 🔍 Análisis del Sistema Actual

### Estado Antes de la Solución:

-   ❌ **No hay actualización automática** del estado de pólizas
-   ❌ **No hay triggers** en la base de datos para fechas de vencimiento
-   ❌ **No hay cron jobs** o procesos programados
-   ✅ **Solo verificación visual** con `isExpiringSoon()` para mostrar "Vence pronto"

### Comportamiento Actual:

1. Las pólizas se crean con estado "active"
2. El estado permanece "active" indefinidamente
3. Solo la UI muestra alertas visuales si está "por vencer"
4. La base de datos nunca actualiza el estado automáticamente

## ✅ Solución Implementada

### 1. **Funciones de Base de Datos** (`scripts/update-expired-policies.sql`)

#### Función: `update_expired_policies()`

```sql
-- Actualiza automáticamente pólizas vencidas
-- Cambia status de 'active' a 'expired' donde end_date < CURRENT_DATE
```

#### Función: `check_expiring_policies(days_ahead)`

```sql
-- Verifica pólizas que vencerán en X días
-- Por defecto revisa los próximos 30 días
```

### 2. **Utilidades del Cliente** (`lib/policy-expiration.ts`)

#### Funciones Principales:

-   `updateExpiredPolicies()`: Llama a la función SQL para actualizar pólizas vencidas
-   `getExpiringPolicies()`: Obtiene pólizas que vencerán pronto
-   `autoUpdateExpiredPolicies()`: Actualización automática en el frontend
-   `isPolicyExpired()`: Verifica si una póliza está vencida (utilidad local)

### 3. **Integración Automática**

#### Dashboard del Cliente (`app/customer/dashboard/page.tsx`):

```typescript
const fetchCustomerData = async () => {
    // Primero actualiza pólizas vencidas automáticamente
    await autoUpdateExpiredPolicies();

    // Luego carga los datos actualizados
    // ...resto del código
};
```

#### Lista de Pólizas (`components/policies/policy-list.tsx`):

```typescript
const fetchPolicies = async () => {
    // Actualiza pólizas vencidas antes de mostrar la lista
    await autoUpdateExpiredPolicies();

    // ...resto del código
};
```

### 4. **Panel de Administración** (`app/admin/page.tsx`)

Nuevo panel para administradores con:

-   ✅ **Botón manual** para actualizar pólizas vencidas
-   ✅ **Verificación** de pólizas próximas a vencer
-   ✅ **Reporte** de actualizaciones realizadas
-   ✅ **Lista visual** de pólizas que requieren atención

### 5. **Componente de Gestión** (`components/policies/policy-expiration-manager.tsx`)

Interface administrativa que permite:

-   Ver resultados de actualizaciones
-   Listar pólizas próximas a vencer
-   Ejecutar actualizaciones manuales
-   Monitorear el estado del sistema

## 🔧 Cómo Usar la Solución

### Actualización Automática:

1. **Se ejecuta automáticamente** al cargar:
    - Dashboard del cliente
    - Lista de pólizas
    - Cualquier vista que use `autoUpdateExpiredPolicies()`

### Actualización Manual (Administradores):

1. Ir a `/admin`
2. Acceder a la pestaña "Pólizas"
3. Usar el botón "Actualizar Pólizas Vencidas"
4. Ver el reporte de actualizaciones realizadas

### Actualización por SQL (Base de Datos):

```sql
-- Ejecutar directamente en la base de datos
SELECT * FROM update_expired_policies();
```

## 📋 Scripts de Verificación

### Verificar Estado Actual:

```bash
# Ejecutar en la consola SQL o pgAdmin
psql -d tu_base_de_datos -f scripts/check-policy-status.sql
```

### Crear Funciones:

```bash
# Ejecutar una vez para crear las funciones
psql -d tu_base_de_datos -f scripts/update-expired-policies.sql
```

## 🚀 Próximos Pasos Recomendados

### 1. **Cron Job Automático** (Opcional)

Crear un cron job que ejecute la función diariamente:

```bash
# Agregar a crontab (ejecutar a las 2:00 AM diariamente)
0 2 * * * psql -d tu_base_de_datos -c "SELECT update_expired_policies();"
```

### 2. **Trigger de Base de Datos** (Avanzado)

Crear un trigger que se ejecute automáticamente:

```sql
-- Trigger que se ejecuta en cada consulta a policies
CREATE OR REPLACE FUNCTION check_policy_expiration_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar pólizas vencidas cuando se consulta la tabla
    PERFORM update_expired_policies();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 3. **Notificaciones por Email** (Futuro)

-   Notificar a clientes cuando su póliza vence
-   Alertar a agentes sobre pólizas próximas a vencer
-   Recordatorios de renovación automática

## 🎯 Resultados Esperados

Después de implementar esta solución:

✅ **Las pólizas vencidas se marcarán automáticamente como "expired"**
✅ **El dashboard mostrará el estado correcto**
✅ **Los administradores tendrán control total del proceso**
✅ **El sistema será más confiable y preciso**
✅ **Se evitarán confusiones sobre el estado de las pólizas**

## 📝 Notas Importantes

1. **Compatibilidad**: La solución es compatible con el esquema actual
2. **Performance**: Las funciones están optimizadas para no afectar el rendimiento
3. **Seguridad**: Respeta las políticas RLS existentes
4. **Reversible**: Se puede deshabilitar fácilmente si es necesario
5. **Extensible**: Fácil de extender con más funcionalidades

## 🔧 Troubleshooting

### Si las pólizas no se actualizan:

1. Verificar que las funciones SQL existan
2. Comprobar permisos de base de datos
3. Revisar logs del navegador para errores
4. Ejecutar manualmente `updateExpiredPolicies()` desde la consola

### Si hay errores de permisos:

1. Verificar que el usuario tenga permisos para ejecutar funciones
2. Comprobar políticas RLS en la tabla `policies`
3. Asegurar que el usuario sea admin o agent para acceso completo
