import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has('accessToken');

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Redirect to login if trying to access protected route while not authenticated
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if trying to access login/register while authenticated
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
