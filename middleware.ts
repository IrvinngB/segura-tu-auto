import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Middleware simplificado para evitar conflictos con localStorage
  // Solo redirigir a login si no hay usuario y no está en páginas públicas
  const { pathname } = request.nextUrl
  
  // Páginas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register', '/auth', '/forgot-password']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Si es una página pública, permitir acceso
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Para otras páginas, permitir acceso y dejar que el AuthProvider maneje la autenticación
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
