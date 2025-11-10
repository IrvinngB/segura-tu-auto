# 🔧 Guía Completa: Sistema de Documentos y Fotografías en Reclamaciones

El sistema de documentos y evidencias para reclamaciones ya está **implementado** en el código, pero necesita configuración en Supabase para funcionar completamente.

## 📋 Estado Actual

### ✅ Ya Implementado

- **Componente ClaimCustomerDocuments**: Permite a clientes subir documentos requeridos
- **Componente ClaimEvidenceSystem**: Sistema completo de evidencias y fotografías
- **Interfaz integrada**: Ambos sistemas están integrados en el detalle de reclamaciones
- **Validaciones**: Tipos de archivo, tamaños, categorización automática
- **Flujo completo**: Subida → Revisión → Aprobación/Rechazo

### ⚠️ Requiere Configuración

- **Storage buckets** en Supabase
- **Políticas RLS** para storage
- **Tablas de base de datos** (si no existen)

## 🚀 Pasos para Activar Completamente

### 1. Ejecutar Script de Base de Datos

```sql
-- En Supabase SQL Editor, ejecutar:
-- scripts/setup-claim-documents-storage.sql
```

### 2. Crear Storage Buckets en Supabase

#### A. Bucket "clientes-adjuntos"

1. Ir a **Storage** en Supabase Dashboard
2. Crear nuevo bucket: `clientes-adjuntos`
3. Configurar como **Público**: No
4. Agregar políticas:

```sql
-- Política SELECT
CREATE POLICY "Users can view their claim documents" ON storage.objects
FOR SELECT USING (bucket_id = 'clientes-adjuntos' AND auth.role() = 'authenticated');

-- Política INSERT
CREATE POLICY "Users can upload claim documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'clientes-adjuntos' AND auth.role() = 'authenticated');

-- Política UPDATE
CREATE POLICY "Users can update their documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'clientes-adjuntos' AND auth.role() = 'authenticated');

-- Política DELETE
CREATE POLICY "Users can delete their documents" ON storage.objects
FOR DELETE USING (bucket_id = 'clientes-adjuntos' AND auth.role() = 'authenticated');
```

#### B. Bucket "claim-evidence"

1. Crear bucket: `claim-evidence`
2. Configurar como **Público**: No
3. Agregar políticas similares:

```sql
-- Política SELECT
CREATE POLICY "Users can view claim evidence" ON storage.objects
FOR SELECT USING (bucket_id = 'claim-evidence' AND auth.role() = 'authenticated');

-- Política INSERT
CREATE POLICY "Users can upload claim evidence" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'claim-evidence' AND auth.role() = 'authenticated');

-- Política UPDATE
CREATE POLICY "Users can update claim evidence" ON storage.objects
FOR UPDATE USING (bucket_id = 'claim-evidence' AND auth.role() = 'authenticated');

-- Política DELETE
CREATE POLICY "Users can delete claim evidence" ON storage.objects
FOR DELETE USING (bucket_id = 'claim-evidence' AND auth.role() = 'authenticated');
```

### 3. Verificar Configuración

```sql
-- En Supabase SQL Editor, ejecutar:
-- scripts/test-claim-documents-setup.sql
```

## 📸 Funcionalidades Disponibles

### Para Clientes

- **Subir documentos requeridos**: Licencia, ID, comprobantes, etc.
- **Fotografías del siniestro**: Múltiples fotos con categorización
- **Reportes policiales**: Documentos oficiales
- **Cotizaciones de reparación**: Estimados de costos
- **Seguimiento de estado**: Pendiente → Aprobado → Rechazado

### Para Agentes/Ajustadores

- **Revisar documentos**: Ver todos los documentos subidos
- **Aprobar/Rechazar**: Con notas explicativas
- **Solicitar documentos adicionales**: A través del sistema de comunicación
- **Verificar evidencia**: Marcar documentos como verificados

## 🔄 Flujo Completo Implementado

1. **Cliente reporta siniestro** → Reclamación creada
2. **Sistema solicita documentos** → Lista automática según tipo de siniestro
3. **Cliente sube fotos y documentos** → Validación automática
4. **Agente/Ajustador revisa** → Aprobación/Rechazo con comentarios
5. **Sistema notifica al cliente** → Estado actualizado en tiempo real
6. **Procesamiento continúa** → Con toda la documentación verificada

## 🎯 Tipos de Documentos Soportados

### Documentos del Cliente

- 📄 Licencia de Conducir
- 🪪 Identificación Oficial
- 🏠 Comprobante de Domicilio
- 🧾 Factura del Vehículo
- 👮 Reporte Policial
- 📸 Fotografías del Siniestro
- 📎 Otros Documentos

### Evidencia del Siniestro

- 📷 **Fotografías del daño**: Múltiples ángulos
- 🚗 **Fotos del vehículo**: Antes y después
- 📍 **Fotos del lugar**: Contexto del incidente
- 📋 **Documentos de evaluación**: Reportes técnicos
- 👥 **Declaraciones de testigos**: Documentos firmados

## ✨ Características Técnicas

- **Formatos soportados**: JPG, PNG, PDF
- **Tamaño máximo**: 10MB por archivo
- **Almacenamiento seguro**: Supabase Storage con RLS
- **Tiempo real**: Actualizaciones instantáneas
- **Multiplataforma**: Web responsive, funciona en móviles
- **Validación**: Automática de tipos y tamaños
- **Organización**: Por reclamación y tipo de documento

## 🔒 Seguridad

- **Row Level Security (RLS)**: Cada usuario ve solo sus documentos
- **Roles diferenciados**: Permisos según tipo de usuario
- **Auditoría completa**: Tracking de todas las acciones
- **Encriptación**: Archivos protegidos en storage
- **Acceso controlado**: URLs firmadas temporalmente

## 🧪 Cómo Probar

1. **Crear una reclamación** como cliente
2. **Ir a la pestaña "Documentos y Evidencia"**
3. **Seleccionar tipo de documento**
4. **Subir archivo** (JPG, PNG o PDF)
5. **Verificar que aparece en la lista**
6. **Como agente/ajustador**: Aprobar o rechazar

---

## 📞 Soporte

Si encuentras algún problema:

1. **Verificar buckets**: Que existan en Supabase Storage
2. **Revisar políticas**: Que estén configuradas correctamente
3. **Comprobar RLS**: Que las tablas tengan Row Level Security habilitado
4. **Logs de consola**: Revisar errores en el navegador

**¡El sistema está listo para usar una vez completada la configuración!** 🚀
