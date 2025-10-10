# Fix: API Auth Session Missing Error

## Problema

Las APIs `/api/quotes`, `/api/claims`, y `/api/policies` estaban retornando error 401 con el mensaje:
```
AuthSessionMissingError: Auth session missing!
```

Esto ocurría **SOLO** cuando se llamaban estas APIs, a pesar de que el usuario ya estaba autenticado correctamente en la aplicación.

## Causas Raíz (2 problemas encontrados)

### 1. Configuración Incorrecta en API Routes

El problema estaba en cómo se estaba creando el cliente de Supabase en los API routes:

#### ❌ Código Incorrecto (antes)
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const cookieStore = cookies(); // ❌ Sin await en Next.js 15+
const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
            get(name: string) {  // ❌ Solo get(), faltan getAll() y setAll()
                return cookieStore.get(name)?.value;
            },
        },
    }
);
```

**Problemas:**
1. **Faltaba `await` en `cookies()`** - En Next.js 15+, `cookies()` retorna una promesa
2. **Solo implementaba `get()`** - Faltaban los métodos `getAll()` y `setAll()` necesarios para el manejo de sesiones de Supabase
3. **Inconsistente con el middleware** - El middleware sí usaba la configuración completa

#### ✅ Código Correcto (después)
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
```

### 2. Middleware NO Estaba Manejando las Sesiones de Supabase

El middleware original estaba simplificado y **NO estaba refrescando ni manejando las cookies de sesión**:

#### ❌ Middleware Incorrecto (antes)
```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicPaths = ["/login", "/register", "/auth", "/forgot-password"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // ❌ NO maneja cookies de Supabase
  return NextResponse.next()
}
```

#### ✅ Middleware Correcto (después)
```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => 
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  // ✅ Refresca la sesión - MUY IMPORTANTE para API routes
  await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const publicPaths = ["/login", "/register", "/auth", "/forgot-password", "/auth-code-error"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublicPath || pathname === "/") {
    return supabaseResponse
  }

  // ✅ Retorna la respuesta con cookies actualizadas
  return supabaseResponse
}
```

La función `createClient()` en `lib/supabase/server.ts` ya tiene la configuración correcta:
```typescript
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          } catch {
            // Can be ignored if you have middleware refreshing sessions
          }
        },
      },
    }
  )
}
```

## Archivos Modificados

### API Routes
1. ✅ `app/api/quotes/route.ts` - GET y POST endpoints
2. ✅ `app/api/quotes/[id]/route.ts` - PATCH endpoint
3. ✅ `app/api/claims/route.ts` - GET y POST endpoints
4. ✅ `app/api/claims/[id]/route.ts` - GET y PATCH endpoints
5. ✅ `app/api/policies/route.ts` - GET y POST endpoints

### Middleware
6. ✅ `middleware.ts` - Configuración completa de Supabase con manejo de cookies

## Por Qué Funcionaba el Resto de la App

- Las páginas como `/customer/vehicles` usaban `createClient()` del lado del cliente directamente, no API routes
- Las páginas y componentes de Next.js que usaban `createClient()` correctamente funcionaban
- Solo los API routes tenían la configuración incompleta
- El middleware anterior no estaba refrescando las sesiones, causando que las cookies expiraran

## Métodos de Cookies Necesarios

Para que Supabase maneje correctamente las sesiones en Next.js, se necesitan **3 métodos**:

1. **`getAll()`** - Lee todas las cookies de la sesión
2. **`setAll()`** - Escribe/actualiza cookies de la sesión  
3. **`get()`** (opcional) - Lee una cookie específica

Sin `getAll()` y `setAll()`, Supabase no puede:
- Leer las cookies de autenticación correctamente
- Actualizar/refrescar los tokens de sesión
- Mantener la sesión sincronizada entre cliente y servidor

## Pasos para Probar la Solución

**IMPORTANTE**: Después de aplicar estos cambios, debes:

1. **Cerrar sesión** completamente en el navegador
2. **Limpiar cookies** (opcional pero recomendado) - Las cookies antiguas fueron creadas con el middleware incorrecto
3. **Volver a iniciar sesión**
4. **Probar las rutas de quotes** - Deberían funcionar correctamente ahora

### ¿Por qué cerrar sesión?

Las cookies de sesión existentes fueron creadas con el middleware anterior (que no tenía la configuración correcta de Supabase). Al iniciar una nueva sesión, las cookies se crearán correctamente con el middleware actualizado que incluye `getAll()` y `setAll()`.

## Solución a Futuro

### Para API Routes
**Siempre usar `createClient()` de `lib/supabase/server.ts` en API routes**, nunca crear el cliente manualmente.

```typescript
// ✅ CORRECTO
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// ❌ INCORRECTO
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
// ... crear manualmente
```

### Para Middleware
El middleware **DEBE** incluir:
1. Configuración completa de cookies con `getAll()` y `setAll()`
2. Llamada a `supabase.auth.getUser()` para refrescar la sesión
3. Retornar la respuesta de Supabase con las cookies actualizadas

## Debugging

Si sigues teniendo problemas:

1. Verifica que las cookies de Supabase estén presentes:
   ```typescript
   console.log("🍪 Cookies:", request.cookies.getAll());
   ```

2. Verifica que el middleware se esté ejecutando:
   ```typescript
   console.log("🔧 Middleware executed for:", request.nextUrl.pathname);
   ```

3. Verifica la sesión en el API route:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   console.log("📝 Session:", session);
   ```

## Fecha
9 de Octubre, 2025
