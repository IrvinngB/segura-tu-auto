# Separación de Funciones por Rol de Usuario

## 🎯 **Roles y Responsabilidades Definidas**

### 👨‍💼 **AGENTE (Agent)**

**Responsabilidad:** Gestión administrativa y documentación

#### ✅ **Funciones Permitidas:**

- **Revisión Documental Inicial**
  - Revisar documentos enviados por el cliente
  - Verificar completitud de la documentación
  - Solicitar documentos faltantes

- **Gestión de Estados Administrativos**
  - `submitted` → `under_review` (Iniciar Revisión Documental)
  - `under_review` → `investigating` (Asignar a Evaluador)
  - `under_review` → `pending_documentation` (Solicitar Más Documentos)
  - `pending_documentation` → `under_review` (Continuar Revisión)

- **Gestión de Pagos**
  - `approved` → `processing_payment` (Iniciar Proceso de Pago)
  - `processing_payment` → `paid` (Confirmar Pago Realizado)
  - `paid` → `closed` (Cerrar Reclamación)

- **Gestión de Rechazos Administrativos**
  - Denegar por falta de documentación
  - Reabrir reclamaciones denegadas para revisión
  - Cerrar definitivamente reclamaciones denegadas

#### ❌ **Funciones NO Permitidas:**

- Realizar evaluaciones de daños
- Aprobar montos de reclamaciones
- Decidir sobre investigaciones técnicas
- Acceso directo a estados de investigación

---

### 🔍 **AJUSTADOR/EVALUADOR (Adjuster)**

**Responsabilidad:** Evaluación técnica y decisiones profesionales

#### ✅ **Funciones Permitidas:**

- **Evaluación Técnica de Daños**
  - Realizar evaluaciones de daños in-situ o por documentos
  - Crear reportes de evaluación con fotografías
  - Determinar causas y responsabilidades

- **Decisiones de Investigación**
  - `investigating` → `waiting_approval` (Enviar a Aprobación)
  - `investigating` → `approved` (Aprobar Directamente)
  - `investigating` → `denied` (Denegar por Evaluación)
  - `investigating` → `under_review` (Devolver a Agente)

- **Aprobaciones con Monto**
  - `waiting_approval` → `approved` (Aprobar con Monto)
  - `waiting_approval` → `denied` (Denegar Reclamación)
  - `waiting_approval` → `investigating` (Continuar Investigación)

- **Revisión de Evaluaciones**
  - `approved` → `investigating` (Revisar Evaluación)

#### ❌ **Funciones NO Permitidas:**

- Gestión de documentación inicial
- Procesamiento de pagos
- Cierre de reclamaciones
- Gestión de estados administrativos

---

### 👨‍💻 **ADMINISTRADOR (Admin)**

**Responsabilidad:** Control total del sistema y supervisión

#### ✅ **Funciones Permitidas:**

- **Todas las funciones de Agente y Ajustador**
- **Gestión Avanzada de Estados**
  - Saltar estados cuando sea necesario
  - Asignar directamente a evaluadores
  - Reabrir reclamaciones cerradas

- **Supervisión y Control**
  - Acceso a todos los estados y transiciones
  - Capacidad de revertir decisiones
  - Control total sobre el flujo de reclamaciones

- **Estados Especiales**
  - `closed` → `under_review` (Reabrir Reclamación)
  - Acceso a todas las funciones sin restricciones

---

## 🔄 **Flujo de Estados por Rol**

### **Flujo Típico de Agente:**

```
submitted → under_review → investigating (asigna) → [Ajustador toma control]
→ approved → processing_payment → paid → closed
```

### **Flujo Típico de Ajustador:**

```
investigating → [evaluación] → waiting_approval → approved
O
investigating → [evaluación] → denied
```

### **Flujo de Administrador:**

```
Acceso completo a todos los estados y transiciones
Puede intervenir en cualquier punto del proceso
```

## 🚨 **Casos de Escalamiento**

### **Cuándo un Agente debe escalar:**

- Documentación compleja que requiere evaluación técnica
- Reclamaciones de alto valor
- Casos con lesiones involucradas
- Disputa sobre responsabilidades

### **Cuándo un Ajustador debe escalar:**

- Aprobaciones fuera de su límite de autoridad
- Casos con implicaciones legales
- Conflictos con evaluaciones externas

### **Cuándo interviene el Administrador:**

- Reclamaciones problemáticas
- Revisión de decisiones contestadas
- Casos que requieren reapertura
- Supervisión de métricas y rendimiento

## 📊 **Métricas por Rol**

### **Agente:**

- Tiempo de procesamiento documental
- Porcentaje de casos con documentación completa
- Eficiencia en gestión de pagos

### **Ajustador:**

- Tiempo de evaluación por caso
- Precisión en estimaciones de daños
- Porcentaje de aprobaciones vs denegaciones

### **Administrador:**

- Casos que requieren intervención
- Tiempo total del proceso por tipo de reclamación
- Satisfacción del cliente por rol

## 🔐 **Beneficios de la Separación**

1. **Especialización:** Cada rol se enfoca en su área de expertise
2. **Eficiencia:** Reduce cuellos de botella y duplicación de trabajo
3. **Calidad:** Mejor evaluación técnica y gestión administrativa
4. **Auditoría:** Trazabilidad clara de responsabilidades
5. **Escalamiento:** Proceso claro de cuando escalar casos
6. **Seguridad:** Separación de funciones para prevenir fraudes

---

**¡Ahora cada rol tiene funciones específicas y no se traslapan responsabilidades!** 🎉
