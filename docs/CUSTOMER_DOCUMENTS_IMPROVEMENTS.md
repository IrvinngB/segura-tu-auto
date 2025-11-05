# 📄 Sistema de Documentos del Cliente - Mejoras Implementadas

## 🎯 Cambios Realizados

### 1. **Selector de Tipo de Documento**

Se agregó un `Select` que permite a los usuarios (customers, agents, adjusters, admins) elegir el tipo exacto de documento antes de subirlo.

#### Tipos de Documentos Disponibles:
- 📄 **Licencia de Conducir** (`license`)
- 🪪 **Identificación Oficial** (`id`)
- 🏠 **Comprobante de Domicilio** (`proof_of_address`)
- 🧾 **Factura del Vehículo** (`invoice`)
- 👮 **Reporte Policial** (`police_report`)
- 📸 **Fotografías del Siniestro** (`photos`)
- 📎 **Otro Documento** (`other`)

#### Comportamiento:
- **Por defecto**: Selecciona "Otro Documento"
- **Después de subir**: Se resetea automáticamente a "Otro Documento"
- **Validación**: El tipo seleccionado se guarda en la base de datos con el archivo

### 2. **Integración en Vista del Cliente**

Los clientes ahora pueden **ver y subir documentos** directamente desde la vista de detalles de su reclamación.

#### Nueva Pestaña "Documentos":
```
Detalles | Documentos | Evidencia | Comunicación | Estado
           ↑ NUEVA
```

#### Funcionalidades para Clientes:
- ✅ Ver todos sus documentos subidos
- ✅ Subir nuevos documentos (con selector de tipo)
- ✅ Descargar documentos
- ✅ Ver estado de cada documento (Pendiente/Aprobado/Rechazado)
- ✅ Eliminar documentos en estado "Pendiente"

### 3. **Interfaz Mejorada**

#### Antes:
```
[Título]                    [Botón Subir]
```

#### Ahora:
```
[Título]

[Tipo de Documento ▼]       [Botón Subir]
```

#### Diseño Responsive:
- **Desktop**: Selector y botón en una fila
- **Mobile**: Se apilan verticalmente (flex-wrap)

### 4. **Dark Mode**

Todo el selector y UI tienen soporte completo para modo oscuro:
- `dark:bg-gray-800` - Fondo del selector
- `dark:border-gray-700` - Bordes
- `dark:text-gray-300` - Texto de labels

---

## 📁 Archivos Modificados

### 1. `components/claims/claim-customer-documents.tsx`

**Cambios principales:**
```typescript
// ✅ Nuevo import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ✅ Nuevo estado
const [selectedDocumentType, setSelectedDocumentType] = useState<ClaimCustomerDocument['document_type']>('other');

// ✅ Eliminada detección automática
// const documentType = detectDocumentType(file.name); ❌
const documentType = selectedDocumentType; // ✅

// ✅ Reset después de subir
setSelectedDocumentType('other');
```

**Nueva UI:**
```tsx
<div className="flex gap-3 items-end">
  {/* Selector de tipo */}
  <div className="flex-1">
    <label>Tipo de Documento</label>
    <Select value={selectedDocumentType} onValueChange={...}>
      <SelectItem value="license">📄 Licencia de Conducir</SelectItem>
      {/* ... más opciones */}
    </Select>
  </div>
  
  {/* Botón de subir */}
  <Button>Subir Documento</Button>
</div>
```

### 2. `app/customer/claims/[id]/page.tsx`

**Cambios principales:**
```typescript
// ✅ Nuevo import
import { ClaimCustomerDocuments } from '@/components/claims/claim-customer-documents';

// ✅ Nueva pestaña en TabsList
<TabsTrigger value="documents">Documentos</TabsTrigger>

// ✅ Nuevo TabsContent
<TabsContent value="documents">
  <ClaimCustomerDocuments
    claimId={claim.id}
    customerId={customerId}
    currentUserRole="customer"
  />
</TabsContent>
```

**Orden de pestañas:**
1. Detalles
2. **Documentos** ← NUEVA
3. Evidencia
4. Comunicación
5. Estado

---

## 🔄 Flujo de Trabajo

### Para Clientes:

1. **Acceder a Reclamación**
   - Ir a "Mis Reclamaciones"
   - Click en una reclamación

2. **Subir Documento**
   - Click en pestaña "Documentos"
   - Seleccionar tipo de documento en el dropdown
   - Click "Subir Documento"
   - Elegir archivo (PDF, JPG, PNG, max 10MB)
   - ✅ Documento queda en estado "Pendiente"

3. **Gestionar Documentos**
   - Ver documentos aprobados/rechazados
   - Descargar documentos
   - Eliminar solo los pendientes

### Para Staff (Agents/Adjusters/Admins):

1. **Ver Documentos del Cliente**
   - En la vista de reclamación (cualquier rol)
   - Pestaña "Documentos"

2. **Subir en Nombre del Cliente**
   - Seleccionar tipo de documento
   - Subir archivo
   - Se guarda con el customer_id de la reclamación

3. **Aprobar/Rechazar**
   - Click en ✓ (Aprobar)
   - Click en ✗ (Rechazar con nota opcional)

---

## 🎨 Características de UI/UX

### Iconos en Selector:
Cada tipo de documento tiene un icono representativo:
- 📄 Licencia
- 🪪 ID
- 🏠 Domicilio
- 🧾 Factura
- 👮 Reporte Policial
- 📸 Fotos
- 📎 Otro

### Estados Visuales:
- **Pendiente**: Badge amarillo con reloj ⏰
- **Aprobado**: Badge verde con check ✓
- **Rechazado**: Badge rojo con alerta ⚠️

### Validaciones:
- Tamaño máximo: 10MB
- Tipos permitidos: PDF, JPG, PNG
- Permisos por rol verificados

---

## 🔒 Seguridad

### Permisos de Subida:
```typescript
['customer', 'agent', 'adjuster', 'admin']
```

### RLS Policies:
- ✅ Clientes solo ven sus documentos
- ✅ Staff ve todos los documentos
- ✅ Solo pendientes pueden eliminarse por clientes
- ✅ Solo staff puede aprobar/rechazar

---

## 🧪 Pruebas Recomendadas

1. **Como Cliente:**
   - [ ] Subir licencia de conducir
   - [ ] Subir fotos del siniestro
   - [ ] Intentar eliminar documento aprobado (debería fallar)
   - [ ] Eliminar documento pendiente
   - [ ] Ver documentos en dark mode

2. **Como Adjuster:**
   - [ ] Subir documento en nombre del cliente
   - [ ] Aprobar documento del cliente
   - [ ] Rechazar documento con nota
   - [ ] Verificar que el selector funciona

3. **Validaciones:**
   - [ ] Intentar subir archivo >10MB (debería rechazar)
   - [ ] Intentar subir .docx (debería rechazar)
   - [ ] Subir sin seleccionar tipo (debería usar "Otro")

---

## 📝 Notas Técnicas

### Estado del Selector:
- Valor por defecto: `'other'`
- Se resetea después de cada subida exitosa
- Sincronizado con el estado del componente

### Detección Automática Eliminada:
Se eliminó la función `detectDocumentType()` porque ahora el usuario elige manualmente el tipo correcto.

### Compatibilidad:
- ✅ Next.js 14+ App Router
- ✅ React Server Components
- ✅ Supabase Storage
- ✅ shadcn/ui Select component
- ✅ Dark mode completo

---

## 🚀 Próximos Pasos

Después de que el SQL esté ejecutado (`SETUP_COMPLETE_CLAIM_DOCUMENTS.sql`):

1. Login como cliente
2. Ir a una reclamación existente
3. Probar la pestaña "Documentos"
4. Subir un documento de prueba con el selector
5. Verificar que aparezca en la lista
6. Login como adjuster y aprobar el documento

---

**✅ Sistema listo para pruebas después de ejecutar el SQL en Supabase**
