import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Only redirect to login if not on public pages
  const { pathname } = request.nextUrl

  // Public pages that don't require authentication
  const publicPaths = ["/login", "/register", "/auth", "/forgot-password", "/auth-code-error"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // This avoids server/client conflicts with localStorage
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
