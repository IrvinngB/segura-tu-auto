# GitHub Copilot Instructions - SeguraTuAuto

## 🎯 Proyecto
Sistema de gestión de seguros vehiculares con Next.js 14+, TypeScript, Supabase y shadcn/ui.

---

## 🔴 REGLAS CRÍTICAS (SIEMPRE APLICAR)

### TypeScript
- ✅ Modo estricto, tipos explícitos, NUNCA `any`
- ✅ Crear interfaces para props/datos: `interface ComponentProps { ... }`
- ⛔ Evitar `any`, usar `unknown` si es necesario

### Arquitectura Next.js 14
- ✅ **Preferir Server Components por defecto**
- ✅ Usar `'use client'` SOLO si necesitas: `useState`, `useEffect`, `onClick`, eventos
- ✅ Server Actions para mutaciones cuando sea posible

### Supabase
- ✅ SIEMPRE verificar autenticación en API routes
- ✅ Usar tipos generados: `Database['public']['Tables']['policies']['Row']`
- ✅ Implementar RLS policies, nunca confiar solo en frontend

### Validación
- ✅ Validar en cliente Y servidor con Zod
- ✅ Crear schemas reutilizables en `/lib/validations/`

```typescript
// lib/validations/policy-schema.ts
export const policySchema = z.object({
  vehicleId: z.string().uuid(),
  policyType: z.enum(['basic', 'limited', 'comprehensive']),
  startDate: z.date(),
});
export type PolicyFormData = z.infer<typeof policySchema>;
```

### Seguridad
- ⛔ NUNCA exponer datos sensibles al cliente
- ✅ Sanitizar todos los inputs de usuario
- ✅ Verificar permisos por rol antes de operaciones críticas

---

## 📐 CONVENCIONES DE CÓDIGO

### Nomenclatura
```typescript
// Archivos
ComponentName.tsx       // Componentes
useCustomHook.ts       // Hooks
utils.ts               // Utilidades
route.ts               // API routes

// Variables
const policyData = {}; // camelCase
const MAX_SIZE = 100;  // UPPER_SNAKE_CASE (constantes)

// Base de datos
policies               // tablas: snake_case plural
created_at            // columnas: snake_case
```

### Estructura de Archivos
```
/app
  /api/[resource]/route.ts    # API routes
  /[role]/[page]/page.tsx     # Páginas por rol
/components
  /ui/*                        # shadcn/ui base
  /[feature]/*                 # Por funcionalidad
/lib
  /validations/*               # Schemas Zod
  /utils/*                     # Helpers
/hooks                         # Custom hooks
```

---

## 🎨 PATRONES DE CÓDIGO

### Server Components (Preferido)
```typescript
// app/policies/page.tsx
import { createServerClient } from '@/lib/supabase/server';

export default async function PoliciesPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('policies')
    .select('*, vehicles(*), customers(*)')
    .eq('status', 'active');
    
  return <PoliciesList policies={data} />;
}
```

### Client Components (Solo cuando sea necesario)
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function ClaimForm() {
  const form = useForm({
    resolver: zodResolver(claimSchema),
  });
  
  const onSubmit = async (data: FormData) => {
    // Lógica
  };
  
  return <Form {...form}>{/* Fields */}</Form>;
}
```

### API Routes Template
```typescript
// app/api/claims/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: request.cookies });
    
    // 1. Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate
    const body = await request.json();
    const validated = schema.parse(body);

    // 3. Business logic
    const { data, error } = await supabase.from('claims').insert(validated).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Custom Hooks Pattern
```typescript
// hooks/useClaim.ts
export function useClaim(claimId?: string) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!claimId) return;
    
    const fetchClaim = async () => {
      setLoading(true);
      try {
        const data = await getClaimById(claimId);
        setClaim(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClaim();
  }, [claimId]);

  return { claim, loading };
}
```

---

## 🔒 SEGURIDAD Y ROLES

### Roles del Sistema
- `customer`: Ver sus pólizas/reclamos
- `agent`: Gestionar cotizaciones y pólizas
- `adjuster`: Gestionar reclamos
- `admin`: Acceso completo

### Verificar Roles
```typescript
// En API routes
const userRole = await getUserRole(session.user.id);
if (!['admin', 'agent'].includes(userRole)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 🎨 UI CON SHADCN/UI

### Usar Componentes Base
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{/* content */}</Card>)}
</div>
```

---

## 📊 QUERIES SUPABASE

### Queries Eficientes
```typescript
// ✅ Con joins y filtros
const { data, error } = await supabase
  .from('policies')
  .select(`
    *,
    customers:customer_id (first_name, last_name, email),
    vehicles:vehicle_id (make, model, year)
  `)
  .eq('status', 'active')
  .gte('end_date', new Date().toISOString())
  .order('created_at', { ascending: false })
  .limit(50);

if (error) throw error;
```

### Transacciones Complejas
```typescript
// Usar RPC para lógica compleja
const { data } = await supabase.rpc('approve_claim', {
  claim_id: claimId,
  approved_amount: amount,
});
```

---

## ⚡ PERFORMANCE

- ✅ Server Components por defecto (sin JS al cliente)
- ✅ Suspense boundaries para loading states
- ✅ Lazy loading: `const Component = dynamic(() => import('./Heavy'))`
- ✅ Paginación para listas grandes
- ✅ `next/image` para optimizar imágenes

```typescript
<Suspense fallback={<Skeleton />}>
  <DataList />
</Suspense>
```

---

## 🐛 MANEJO DE ERRORES

```typescript
// ✅ CORRECTO - Específico y útil
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof ValidationError) {
    return { success: false, error: 'Invalid data' };
  }
  if (error instanceof AuthError) {
    return { success: false, error: 'Auth failed' };
  }
  console.error('Unexpected:', error);
  return { success: false, error: 'Unexpected error' };
}

// ⛔ INCORRECTO
try {
  await riskyOperation();
} catch (e) {
  console.log(e); // No hacer esto
}
```

---

## 📝 LÓGICA DE NEGOCIO ESPECÍFICA

### Pólizas
- Validar que vehículo no tenga póliza activa
- Auto-calcular fecha expiración (1 año)
- Generar número único de póliza
- Crear coberturas según plan

### Reclamaciones
- Verificar póliza activa antes de crear claim
- Workflow: `pending` → `under_review` → `approved/rejected`
- Asociar evidencias (max 10MB, tipos: jpg, png, pdf)
- Notificar cambios de estado

### Evidencias
- Storage de Supabase para archivos
- Validar tipos permitidos: `['image/jpeg', 'image/png', 'application/pdf']`
- Límite de tamaño: 10MB por archivo
- Generar thumbnails para imágenes

---

## 🎯 PARA GITHUB COPILOT

### Al Generar Código
1. Usar TypeScript estricto, tipos explícitos
2. Validar con Zod en API routes
3. Preferir Server Components
4. Nombres descriptivos en inglés
5. Funciones pequeñas (max 30 líneas)
6. Incluir JSDoc para funciones públicas complejas

### Al Crear Componentes
- Definir interface para props
- Usar shadcn/ui components
- Implementar loading/error states
- Responsive design con Tailwind

### Al Crear API Routes
- Siempre verificar autenticación
- Validar con Zod
- Manejo de errores específico
- Retornar status codes apropiados

---

## ✅ CHECKLIST ANTES DE COMMIT

- [ ] Sin warnings de TypeScript
- [ ] Validaciones Zod implementadas
- [ ] Manejo de errores robusto
- [ ] Sin `console.log` en producción
- [ ] Componentes siguen convenciones
- [ ] RLS policies verificadas

---

**Stack**: Next.js 14+ App Router | TypeScript | Supabase | shadcn/ui | Zod | Tailwind CSS