import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/auth')
  const isProtectedPage = path.startsWith('/dashboard') || path.startsWith('/organization') || path.startsWith('/assets') || path.startsWith('/risk')
  const isResetFlow = path === '/auth/callback' || path === '/auth/reset-password'

  const hasSession = request.cookies.getAll().some(cookie => 
    cookie.name.includes('supabase-auth-token') || cookie.name.includes('sb-')
  )

  if (hasSession && isAuthPage && !isResetFlow) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!hasSession && isProtectedPage) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}