# 🗺️ Implementación de Campos de Ubicación

## Resumen de Cambios

Se han agregado campos de ubicación al sistema de registro de clientes para mejorar la evaluación de riesgos y el cálculo de primas basado en la zona geográfica.

## ✨ Nuevas Características

### 1. **Campos de Ubicación en Registro**

-   **Dirección completa**: Campo opcional para dirección detallada
-   **Ciudad**: Campo requerido para determinar la zona
-   **Estado**: Selector con estados mexicanos predefinidos
-   **Código Postal**: Campo para mayor precisión geográfica
-   **Colonia/Barrio**: Campo adicional para localización específica

### 2. **Sistema de Zonas de Riesgo**

-   **4 niveles de riesgo**: Bajo, Medio, Alto, Muy Alto
-   **Asignación automática**: Basada en ciudad, estado y código postal
-   **Multiplicadores de prima**: Desde -15% hasta +50%
-   **Base de datos predefinida**: Con ciudades y estados de México

### 3. **Motor de Evaluación Mejorado**

-   **Factor de ubicación**: 15% de peso en evaluación total
-   **Integración automática**: Se actualiza automáticamente con los datos
-   **Retrocompatibilidad**: Mantiene soporte para zonas legacy

## 🏗️ Estructura de Base de Datos

### Tabla `customers` (actualizada)

```sql
- address (TEXT) - Dirección completa
- postal_code (VARCHAR(10)) - Código postal
- neighborhood (VARCHAR(100)) - Colonia/Barrio
- risk_zone (VARCHAR(20)) - Zona de riesgo (auto-calculada)
```

### Nueva tabla `risk_zones`

```sql
- zone_name - Nombre de la zona (low, medium, high, very_high)
- risk_multiplier - Factor multiplicador para primas
- description - Descripción de la zona
- states[] - Array de estados pertenecientes a la zona
- cities[] - Array de ciudades pertenecientes a la zona
- postal_codes[] - Array de códigos postales específicos
```

## 🔧 Funciones Automáticas

### `get_risk_zone_by_location()`

-   Determina automáticamente la zona de riesgo
-   Prioridad: Código postal → Ciudad → Estado
-   Valor por defecto: 'medium'

### `update_customer_risk_zone()` (Trigger)

-   Se ejecuta automáticamente en INSERT/UPDATE
-   Actualiza el campo risk_zone basado en ubicación
-   Mantiene updated_at actualizado

## 📊 Zonas de Riesgo Predefinidas

| Zona         | Multiplicador | Estados Ejemplo                   | Descripción                      |
| ------------ | ------------- | --------------------------------- | -------------------------------- |
| **Bajo**     | 0.85x (-15%)  | Yucatán, Campeche, Aguascalientes | Baja densidad, poca criminalidad |
| **Medio**    | 1.00x (0%)    | Puebla, Querétaro, Guanajuato     | Riesgo moderado, baseline        |
| **Alto**     | 1.25x (+25%)  | CDMX, Edo. México, Jalisco        | Alta densidad, más siniestros    |
| **Muy Alto** | 1.50x (+50%)  | Guerrero, Michoacán, Sinaloa      | Condiciones adversas             |

## 🎨 Componentes UI

### `RiskZoneIndicator`

-   Card completa con información de zona
-   Muestra ubicación, descripción e impacto
-   Colores diferenciados por nivel de riesgo

### `RiskZoneBadge`

-   Badge simple para mostrar solo el nivel
-   Ideal para tablas y listados
-   Iconos diferenciados (TrendingUp/Down)

## 🚀 Instalación

### 1. Ejecutar Migración

```bash
# Hacer ejecutable el script
chmod +x scripts/migrate-location-fields.sh

# Ejecutar migración
./scripts/migrate-location-fields.sh
```

### 2. Variables de Entorno

Asegurar que `DATABASE_URL` esté configurada correctamente.

## 🧪 Pruebas

### Registro de Cliente

1. Acceder a `/register`
2. Seleccionar rol "Cliente"
3. Completar información de ubicación
4. Verificar asignación automática de zona de riesgo

### Evaluación de Riesgo

1. Acceder a `/risk-assessment`
2. Usar la nueva zona en el cálculo
3. Verificar impacto en prima final

## 📈 Impacto en Negocio

### ✅ Beneficios

-   **Primas más justas**: Basadas en riesgo geográfico real
-   **Mejor segmentación**: Clientes por zona de riesgo
-   **Cumplimiento regulatorio**: Factores reconocidos por la industria
-   **Competitividad**: Primas más atractivas en zonas seguras

### 📊 Métricas Esperadas

-   **Reducción de siniestros**: Mejor selección de riesgos
-   **Aumento de conversión**: Primas más competitivas en zonas seguras
-   **Mejor rentabilidad**: Primas ajustadas al riesgo real

## 🔮 Próximos Desarrollos

1. **API de geolocalización**: Autocompletado de direcciones
2. **Mapa de calor**: Visualización de zonas de riesgo
3. **Análisis histórico**: Ajustes basados en datos reales
4. **Integración con INEGI**: Datos oficiales de criminalidad y accidentalidad

## 📝 Notas Técnicas

-   **Retrocompatibilidad**: Clientes existentes obtienen zona 'medium'
-   **Performance**: Índices agregados para consultas rápidas
-   **Seguridad**: RLS habilitado en tabla risk_zones
-   **Escalabilidad**: Estructura preparada para más países/regiones

---

_Implementación completada el ${new Date().toLocaleDateString('es-ES')}_
